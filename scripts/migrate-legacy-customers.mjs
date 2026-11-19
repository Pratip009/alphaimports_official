/**
 * Migrate customers + order history from the old Alpha Imports site.
 *
 *   node scripts/migrate-legacy-customers.mjs --dir ./legacy-export --dry-run
 *   node scripts/migrate-legacy-customers.mjs --dir ./legacy-export
 *
 * --dir      Folder holding customers.csv, addresses.csv, orders.csv,
 *            order_products.csv, order_totals.csv, order_status_history.csv
 *            and (optionally) order_attributes.csv.
 * --dry-run  Transform and write the report only. Touches no database.
 * --report   Where to write the report (default ./migration-report).
 *
 * Safe to run more than once:
 *   - Accounts are matched by old customer id, then by email. A customer who
 *     already signed up on the new site keeps their password and details;
 *     only empty fields are filled in and their old order history is linked.
 *   - Name, address and phone of a migrated account are only written the
 *     first time, so anything the customer edits later is never overwritten.
 *   - Old orders are upserted by old order id.
 *
 * Old passwords are NOT imported (salted MD5 — not safe). Migrated accounts
 * get `needsPasswordSetup: true`; the customer sets a password via email.
 */
import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { loadLegacyData, buildMigration } from './lib/legacy-import.mjs';

const envLocal = resolve(process.cwd(), '.env.local');
if (existsSync(envLocal)) config({ path: envLocal });
else config();

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const DIR = resolve(opt('dir', './legacy-export'));
const REPORT_DIR = resolve(opt('report', './migration-report'));
const DRY_RUN = flag('dry-run');

function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function writeReport(report, extra = {}) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const full = { ...report, ...extra };
  writeFileSync(join(REPORT_DIR, 'report.json'), JSON.stringify(full, null, 2));
  writeFileSync(join(REPORT_DIR, 'duplicate-emails.csv'), toCsv(report.duplicateEmailGroups.map((g) => ({ ...g, mergedLegacyCustomerIds: g.mergedLegacyCustomerIds.join(' ') }))));
  writeFileSync(join(REPORT_DIR, 'accounts-without-address.csv'), toCsv(report.accountsWithoutAddress));
  writeFileSync(join(REPORT_DIR, 'orders-without-account.csv'), toCsv(report.ordersWithoutAccount));
  writeFileSync(join(REPORT_DIR, 'orders-total-mismatch.csv'), toCsv(report.ordersWithTotalMismatch));
}

function summary(report, extra = {}) {
  const lines = [
    '',
    '──────── Legacy migration summary ────────',
    `Customer rows in export:     ${report.input.customers}`,
    `Accounts to create/link:     ${report.accounts}`,
    `  duplicate emails merged:   ${report.duplicateEmailGroups.length} emails (${report.duplicateEmailGroups.reduce((n, g) => n + g.mergedLegacyCustomerIds.length, 0)} extra rows)`,
    `  invalid emails skipped:    ${report.invalidEmails.length}`,
    `  address from order instead:${String(report.accountsAddressFromOrders).padStart(5)}`,
    `  no address at all:         ${report.accountsWithoutAddress.length}`,
    `Orders in export:            ${report.input.orders}`,
    `  linked by customer id:     ${report.ordersLinkedById}`,
    `  linked by email:           ${report.ordersLinkedByEmail}`,
    `  no matching account:       ${report.ordersWithoutAccount.length} (kept, visible to admins)`,
    `  orders with no items:      ${report.ordersWithoutItems.length}`,
    `Orphan rows ignored:         ${JSON.stringify(report.orphanRows)}`,
    `Order status labels:         ${JSON.stringify(report.statusCounts)}`,
  ];
  if (Object.keys(report.unknownStatusIds).length) lines.push(`UNKNOWN status ids:          ${JSON.stringify(report.unknownStatusIds)}`);
  for (const [k, v] of Object.entries(extra)) lines.push(`${k.padEnd(29)}${typeof v === 'object' ? JSON.stringify(v) : v}`);
  lines.push(`Report written to:           ${REPORT_DIR}`, '');
  console.log(lines.join('\n'));
}

async function main() {
  console.log(`Reading export from ${DIR} …`);
  const data = await loadLegacyData(DIR);
  const { accounts, orders, report } = buildMigration(data);

  if (DRY_RUN) {
    writeReport(report, { mode: 'dry-run' });
    summary(report, { Mode: 'DRY RUN — nothing written' });
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (.env.local).');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  console.log(`Connected to "${db.databaseName}". Writing …`);
  const users = db.collection('users');
  const legacyOrders = db.collection('legacyorders');

  await users.createIndex(
    { legacyCustomerId: 1 },
    { unique: true, partialFilterExpression: { legacyCustomerId: { $type: 'number' } }, name: 'legacyCustomerId_unique' }
  );
  await legacyOrders.createIndex({ legacyOrderId: 1 }, { unique: true });
  await legacyOrders.createIndex({ user: 1, purchasedAt: -1 });
  await legacyOrders.createIndex({ email: 1 });
  await legacyOrders.createIndex({ purchasedAt: -1 });
  await legacyOrders.createIndex({ legacyCustomerId: 1 });

  const stats = { created: 0, linkedToExisting: 0, alreadyMigrated: 0, conflicts: [] };
  const emailToUserId = new Map();
  const now = new Date();
  const ci = { locale: 'en', strength: 2 };

  // Load existing accounts once (email + legacy id) instead of querying per customer.
  const existing = await users
    .find({}, { projection: { _id: 1, email: 1, phone: 1, address: 1, legacyCustomerId: 1 } })
    .toArray();
  const byLegacyId = new Map();
  const byEmail = new Map();
  for (const u of existing) {
    if (typeof u.legacyCustomerId === 'number') byLegacyId.set(u.legacyCustomerId, u);
    if (u.email) byEmail.set(String(u.email).toLowerCase(), u);
  }
  console.log(`  ${existing.length} accounts already in the database`);

  const updates = [];
  const inserts = [];
  for (const a of accounts) {
    const legacy = { ...a.legacy, importedAt: now };

    const migrated = byLegacyId.get(a.legacyCustomerId);
    if (migrated) {
      updates.push({ updateOne: { filter: { _id: migrated._id }, update: { $set: { legacy, updatedAt: now } } } });
      emailToUserId.set(a.email, migrated._id);
      stats.alreadyMigrated++;
      continue;
    }

    const signedUp = byEmail.get(a.email);
    if (signedUp) {
      if (typeof signedUp.legacyCustomerId === 'number' && signedUp.legacyCustomerId !== a.legacyCustomerId) {
        stats.conflicts.push({ email: a.email, legacyCustomerId: a.legacyCustomerId, existingLegacyId: signedUp.legacyCustomerId });
        emailToUserId.set(a.email, signedUp._id);
        continue;
      }
      // Customer already registered on the new site: link, fill blanks only.
      // Their password and sign-in methods are left exactly as they are.
      const $set = { legacyCustomerId: a.legacyCustomerId, legacy, updatedAt: now };
      if (!signedUp.phone && a.phone) $set.phone = a.phone;
      if ((!signedUp.address || !signedUp.address.line1) && a.address) $set.address = a.address;
      updates.push({ updateOne: { filter: { _id: signedUp._id }, update: { $set } } });
      emailToUserId.set(a.email, signedUp._id);
      stats.linkedToExisting++;
      continue;
    }

    const _id = new ObjectId();
    inserts.push({
      _id,
      name: a.name,
      email: a.email,
      role: 'user',
      authProviders: [],
      needsPasswordSetup: true,
      // The old site never verified addresses; the password-setup email does.
      emailVerified: false,
      phone: a.phone,
      avatarUrl: '',
      address: a.address || { line1: '', line2: '', city: '', state: '', postalCode: '', country: '' },
      memoStatus: 'none',
      memoCreditLimit: 0,
      legacyCustomerId: a.legacyCustomerId,
      legacy,
      createdAt: a.customerSince || now,
      updatedAt: now,
    });
    emailToUserId.set(a.email, _id);
  }

  for (let s = 0; s < updates.length; s += 1000) {
    await users.bulkWrite(updates.slice(s, s + 1000), { ordered: false });
  }
  for (let s = 0; s < inserts.length; s += 1000) {
    const batch = inserts.slice(s, s + 1000);
    try {
      const r = await users.insertMany(batch, { ordered: false });
      stats.created += r.insertedCount;
    } catch (err) {
      // A duplicate key here means someone signed up with that email while
      // the import was running. Link those instead of failing the batch.
      stats.created += err?.result?.insertedCount ?? err?.insertedCount ?? 0;
      const failed = (err?.writeErrors || []).filter((e) => e.code === 11000);
      if (!failed.length) throw err;
      for (const we of failed) {
        const doc = batch[we.index];
        const again = await users.findOne({ email: doc.email }, { collation: ci, projection: { _id: 1 } });
        if (!again) throw err;
        await users.updateOne({ _id: again._id }, { $set: { legacyCustomerId: doc.legacyCustomerId, legacy: doc.legacy, updatedAt: now } });
        emailToUserId.set(doc.email, again._id);
        stats.linkedToExisting++;
      }
    }
    console.log(`  accounts ${Math.min(s + 1000, inserts.length)}/${inserts.length} new`);
  }

  console.log('  writing order history …');
  const orderStats = { upserted: 0, linked: 0, unlinked: 0 };
  const BATCH = 1000;
  for (let s = 0; s < orders.length; s += BATCH) {
    const ops = orders.slice(s, s + BATCH).map((o) => {
      const { accountEmail, ...rest } = o;
      const user = accountEmail ? emailToUserId.get(accountEmail) || null : null;
      if (user) orderStats.linked++;
      else orderStats.unlinked++;
      return {
        updateOne: {
          filter: { legacyOrderId: o.legacyOrderId },
          update: { $set: { ...rest, user, importedAt: now } },
          upsert: true,
        },
      };
    });
    const r = await legacyOrders.bulkWrite(ops, { ordered: false });
    orderStats.upserted += r.upsertedCount + r.modifiedCount;
    console.log(`  orders ${Math.min(s + BATCH, orders.length)}/${orders.length}`);
  }

  await client.close();
  writeReport(report, { mode: 'write', accountStats: stats, orderStats });
  summary(report, {
    'Accounts created:': stats.created,
    'Linked to existing signup:': stats.linkedToExisting,
    'Already migrated (updated):': stats.alreadyMigrated,
    'Email conflicts:': stats.conflicts.length,
    'Orders linked to account:': orderStats.linked,
    'Orders without account:': orderStats.unlinked,
  });
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
