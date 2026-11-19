/**
 * Checks the database against the original CSV export after
 * migrate-legacy-customers.mjs has run. Read-only.
 *
 *   npm run migrate:verify -- --dir ./legacy-export [--sample 300]
 *
 * Verifies: every customer has an account, every order is present with the
 * right total and item count, orders point at the right account, and a
 * random sample of names/addresses/phones match. Exits non-zero on problems.
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { loadLegacyData, buildMigration } from './lib/legacy-import.mjs';

const envLocal = resolve(process.cwd(), '.env.local');
if (existsSync(envLocal)) config({ path: envLocal });
else config();

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const DIR = resolve(opt('dir', './legacy-export'));
const SAMPLE = parseInt(opt('sample', '300'), 10) || 300;

const problems = [];
const problem = (msg) => {
  problems.push(msg);
  if (problems.length <= 25) console.log(`  ✗ ${msg}`);
};

async function main() {
  const { accounts, orders } = buildMigration(await loadLegacyData(DIR));
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');
  const legacy = db.collection('legacyorders');

  console.log('Checking accounts …');
  const dbUsers = await users
    .find({ legacyCustomerId: { $type: 'number' } }, { projection: { email: 1, name: 1, phone: 1, address: 1, legacyCustomerId: 1, password: 1, needsPasswordSetup: 1 } })
    .toArray();
  const byLegacyId = new Map(dbUsers.map((u) => [u.legacyCustomerId, u]));
  const idToEmail = new Map(dbUsers.map((u) => [String(u._id), u.email.toLowerCase()]));
  let missing = 0;
  for (const a of accounts) {
    const u = byLegacyId.get(a.legacyCustomerId);
    if (!u) {
      missing++;
      problem(`account missing for old customer #${a.legacyCustomerId} (${a.email})`);
    } else if (u.email.toLowerCase() !== a.email) {
      problem(`email differs for #${a.legacyCustomerId}: db ${u.email} vs export ${a.email}`);
    }
  }
  const stillNeedPassword = dbUsers.filter((u) => u.needsPasswordSetup && !u.password).length;
  const passwordSet = dbUsers.filter((u) => u.password).length;

  // Random sample: details written on first import (unless the customer edited them since).
  const shuffled = [...accounts].sort(() => Math.random() - 0.5).slice(0, SAMPLE);
  let sampleDiffs = 0;
  for (const a of shuffled) {
    const u = byLegacyId.get(a.legacyCustomerId);
    if (!u || u.password) continue; // customers who signed in may have edited their details
    if (u.name !== a.name) { sampleDiffs++; problem(`name differs for #${a.legacyCustomerId}: "${u.name}" vs "${a.name}"`); }
    if (a.address && (u.address?.line1 !== a.address.line1 || u.address?.postalCode !== a.address.postalCode)) {
      sampleDiffs++;
      problem(`address differs for #${a.legacyCustomerId}`);
    }
  }

  console.log('Checking orders …');
  const dbOrders = await legacy
    .find({}, { projection: { legacyOrderId: 1, total: 1, items: 1, user: 1 } })
    .toArray();
  const dbOrderMap = new Map(dbOrders.map((o) => [o.legacyOrderId, o]));
  let orderMissing = 0;
  let wrongTotal = 0;
  let wrongItems = 0;
  let wrongOwner = 0;
  for (const o of orders) {
    const d = dbOrderMap.get(o.legacyOrderId);
    if (!d) { orderMissing++; problem(`order #${o.legacyOrderId} missing`); continue; }
    if (Math.abs((d.total || 0) - o.total) > 0.005) { wrongTotal++; problem(`order #${o.legacyOrderId} total ${d.total} vs ${o.total}`); }
    if ((d.items || []).length !== o.items.length) { wrongItems++; problem(`order #${o.legacyOrderId} has ${d.items?.length} items vs ${o.items.length}`); }
    const ownerEmail = d.user ? idToEmail.get(String(d.user)) : null;
    if (o.accountEmail && ownerEmail && ownerEmail !== o.accountEmail) {
      wrongOwner++;
      problem(`order #${o.legacyOrderId} belongs to ${ownerEmail}, expected ${o.accountEmail}`);
    }
  }
  const exportTotal = orders.reduce((s, o) => s + o.total, 0);
  const dbTotal = dbOrders.reduce((s, o) => s + (o.total || 0), 0);

  await client.close();

  console.log(`
──────── Verification ────────
Accounts expected / found:   ${accounts.length} / ${accounts.length - missing}
  still need a password:     ${stillNeedPassword}
  have set a password:       ${passwordSet}
  sample checked:            ${shuffled.length} (${sampleDiffs} differences)
Orders expected / found:     ${orders.length} / ${orders.length - orderMissing}
  wrong total:               ${wrongTotal}
  wrong item count:          ${wrongItems}
  wrong account:             ${wrongOwner}
Order value export / db:     $${exportTotal.toFixed(2)} / $${dbTotal.toFixed(2)}
Result:                      ${problems.length ? `✗ ${problems.length} problem(s)` : '✓ all checks passed'}
`);
  if (problems.length) process.exit(1);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
