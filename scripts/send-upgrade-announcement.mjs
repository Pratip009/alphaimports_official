/**
 * Sends the "We've upgraded our website — set your new password" email to
 * customers moved over from the old website. Each email carries a personal
 * one-click link (valid 21 days, single use).
 *
 * Needs Node 22.6+ (it loads the site's own email template from
 * src/lib/email-templates.ts), so run it with:
 *
 *   npm run announce -- --test-to you@example.com,colleague@example.com
 *   npm run announce -- --dry-run --limit 500
 *   npm run announce -- --limit 500                 # first wave
 *   npm run announce -- --limit 2000 --since 2015   # next wave
 *
 * Options
 *   --test-to a@x.com,b@y.com  Only email these accounts (must be migrated
 *                              accounts in the database). Use for testing.
 *                              Ignores "already sent", so it can be repeated.
 *   --limit N                  Send to at most N customers this run (default 200).
 *   --since YYYY               Only customers whose last order was in or after YYYY.
 *   --include-disabled         Also email accounts that were disabled on the old site.
 *   --dry-run                  Show who would be emailed. Sends nothing, writes nothing.
 *
 * Safe to stop and re-run: each customer is marked as sent
 * (`upgradeAnnouncementSentAt`) right after their batch goes out, and is
 * skipped next time. Customers who already set a password are never emailed.
 * Most recent customers go first.
 */
import { MongoClient } from 'mongodb';
import { Resend } from 'resend';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import crypto from 'crypto';
import { pathToFileURL } from 'url';

const envLocal = resolve(process.cwd(), '.env.local');
if (existsSync(envLocal)) config({ path: envLocal });
else config();

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};

const DRY_RUN = flag('dry-run');
const TEST_TO = (opt('test-to', '') || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const LIMIT = Math.max(1, parseInt(opt('limit', '200'), 10) || 200);
const SINCE = opt('since', '');
const INCLUDE_DISABLED = flag('include-disabled');

const BATCH = 100; // Resend batch API maximum
const PAUSE_MS = 1200; // stay well under Resend's default 2 requests/second
const TTL_MS = 21 * 24 * 60 * 60 * 1000; // keep in sync with LINK_TTL.announcement
const RETENTION_MS = 45 * 24 * 60 * 60 * 1000;
const VALID_FOR = '21 days';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.alphaimports.com').replace(/\/+$/, '');
const FROM = process.env.EMAIL_FROM || '';
const REPLY_TO = process.env.SUPPORT_EMAIL || 'support@alphaimports.com';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadTemplates() {
  try {
    return await import(pathToFileURL(resolve(process.cwd(), 'src/lib/email-templates.ts')).href);
  } catch (err) {
    console.error(
      '\nCould not load src/lib/email-templates.ts. This script needs Node 22.6 or newer.\n' +
        `You are running Node ${process.version}. Either upgrade Node, or run:\n` +
        '  npx tsx scripts/send-upgrade-announcement.mjs ...\n'
    );
    throw err;
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (.env.local).');
  if (!DRY_RUN) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set.');
    if (!FROM || FROM.endsWith('@resend.dev')) {
      throw new Error('Set EMAIL_FROM to an address on your verified sending domain (not @resend.dev).');
    }
  }

  const { upgradeAnnouncementEmailHtml, upgradeAnnouncementEmailText } = await loadTemplates();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');
  const tokens = db.collection('passwordsetuptokens');
  await users.createIndex({ needsPasswordSetup: 1, 'legacy.lastOrderAt': -1 }, { sparse: true });

  const filter = {
    legacyCustomerId: { $type: 'number' },
    needsPasswordSetup: true,
    isGuest: { $ne: true },
  };
  if (TEST_TO.length) {
    filter.email = { $in: TEST_TO };
  } else {
    filter.upgradeAnnouncementSentAt = { $exists: false };
    if (!INCLUDE_DISABLED) filter['legacy.status'] = { $ne: 0 };
    if (SINCE) filter['legacy.lastOrderAt'] = { $gte: new Date(`${SINCE}-01-01T00:00:00Z`) };
  }

  const remaining = await users.countDocuments(filter);
  const recipients = await users
    .find(filter, { projection: { _id: 1, name: 1, email: 1, 'legacy.lastOrderAt': 1 } })
    .sort({ 'legacy.lastOrderAt': -1, _id: 1 })
    .limit(TEST_TO.length ? TEST_TO.length : LIMIT)
    .toArray();

  console.log(`\n${remaining} customer(s) match. This run: ${recipients.length}${DRY_RUN ? ' (DRY RUN)' : ''}.`);
  if (TEST_TO.length) {
    const found = new Set(recipients.map((r) => r.email));
    const missing = TEST_TO.filter((e) => !found.has(e));
    if (missing.length) {
      console.log(`Not found as migrated accounts that still need a password: ${missing.join(', ')}`);
    }
  }
  if (DRY_RUN) {
    for (const r of recipients.slice(0, 20)) {
      const last = r.legacy?.lastOrderAt ? new Date(r.legacy.lastOrderAt).toISOString().slice(0, 10) : '—';
      console.log(`  ${r.email.padEnd(40)} last order ${last}`);
    }
    if (recipients.length > 20) console.log(`  … and ${recipients.length - 20} more`);
    await client.close();
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const now = new Date();
    const tokenDocs = [];
    const emails = batch.map((u) => {
      const raw = crypto.randomBytes(32).toString('base64url');
      tokenDocs.push({
        user: u._id,
        email: u.email.toLowerCase(),
        tokenHash: crypto.createHash('sha256').update(raw).digest('hex'),
        purpose: 'announcement',
        expiresAt: new Date(now.getTime() + TTL_MS),
        usedAt: null,
        deleteAt: new Date(now.getTime() + TTL_MS + RETENTION_MS),
        createdAt: now,
        updatedAt: now,
      });
      const data = { name: u.name, link: `${SITE_URL}/set-password?token=${encodeURIComponent(raw)}`, validFor: VALID_FOR };
      return {
        from: FROM,
        to: u.email,
        replyTo: REPLY_TO,
        subject: 'Alpha Imports has a new website — set your password in one click',
        html: upgradeAnnouncementEmailHtml(data),
        text: upgradeAnnouncementEmailText(data),
        headers: { 'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=Unsubscribe>` },
      };
    });

    // Links only work once their token exists, so save tokens first.
    await tokens.insertMany(tokenDocs);
    const result = await resend.batch.send(emails);
    if (result?.error) {
      console.error(`\nResend rejected batch starting at #${i + 1}:`, result.error);
      console.error(`Stopped. ${sent} sent so far. Fix the problem and re-run — sent customers are skipped.`);
      process.exitCode = 1;
      break;
    }
    await users.updateMany(
      { _id: { $in: batch.map((u) => u._id) } },
      { $set: { upgradeAnnouncementSentAt: new Date() } }
    );
    sent += batch.length;
    console.log(`  sent ${sent}/${recipients.length}`);
    if (i + BATCH < recipients.length) await sleep(PAUSE_MS);
  }

  console.log(`\nDone. ${sent} email(s) sent. ${Math.max(0, remaining - sent)} customer(s) still to go.\n`);
  await client.close();
}

main().catch((err) => {
  console.error('Announcement failed:', err?.message || err);
  process.exit(1);
});
