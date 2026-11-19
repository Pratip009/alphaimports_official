# Moving customers from the old Alpha Imports website

This covers moving customer accounts and order history from the old
(osCommerce) website, the "set your new password" flow, guest checkout, and
the website-upgrade announcement email.

## What customers experience

| Situation | What happens |
|---|---|
| Old customer signs in with their old password | Sees: *"Welcome back to Alpha Imports! We have upgraded our website. For your security, please set a new password to access your account."* and a one-click **Email Me My Password Link** button. |
| Customer opens the emailed link | Chooses a password (8+ characters) and is **signed in immediately**. Their name, address and old orders are already there. |
| Link expired or already used | The page explains it and sends a fresh link in one click. |
| Forgot password (any customer) | "Password forgotten?" on the sign-in page → same one-click link. `/forgot-password` redirects there. |
| Visitor who isn't signed in clicks "Add to Cart" | Item is added. No login. A guest session is created behind the scenes. |
| Guest at checkout | Enters an email for the order confirmation. Otherwise identical checkout. |
| Guest after paying | Optional: "Email me a link to create a password", which turns their details into an account. |
| Guest who later signs in or signs up | Their cart and guest orders move into their account. |
| Anyone stuck | "Need help signing in?" box (phone, email, contact form pre-set to "Account / Sign-in Help") on the sign-in and set-password pages. |
| Signed-in old customer | Checkout is pre-filled with their saved address. "My Orders" shows **Orders from our previous website**. |

Old passwords are **not** copied. The old site stored them as salted MD5,
which is not safe to keep.

## Before you start

1. Put the CSV export in a folder called `legacy-export/` in the project root:
   `customers.csv`, `addresses.csv`, `orders.csv`, `order_products.csv`,
   `order_totals.csv`, `order_status_history.csv`, `order_attributes.csv`.
   This folder is git-ignored. **Never commit it**: it contains customer data.
2. Set these in `.env.local` (local) and in Vercel (production). See
   `env.local.example`:
   - `RESEND_API_KEY`, and `EMAIL_FROM` on your **verified** sending domain
     (not `@resend.dev`). Without a verified domain, emails only reach the
     Resend account owner.
   - `SUPPORT_EMAIL` and `NEXT_PUBLIC_SUPPORT_EMAIL`
   - `NEXT_PUBLIC_SITE_URL=https://www.alphaimports.com`, which is used in the emailed links
   - `CRON_SECRET`, used by the new guest-cleanup job (`vercel.json`)
3. **Take a backup of the production database** before importing.
4. The announcement script needs **Node 22.6+** (`node --version`).

## Step 1: Rehearse on a staging copy

```bash
# Point MONGODB_URI at a COPY of the production database
npm run migrate:legacy -- --dir ./legacy-export --dry-run   # report only, writes nothing
npm run migrate:legacy -- --dir ./legacy-export             # import
npm run migrate:verify -- --dir ./legacy-export             # must say "✓ all checks passed"
```

Expected numbers for the current export:

| | |
|---|---|
| Accounts | 21,492 (21,512 rows; 15 emails appeared more than once and were merged) |
| Old orders | 35,184 (34,994 linked to an account; 190 have no matching customer) |
| Order value | $10,114,141.03 |

The report folder `migration-report/` lists merged duplicates, accounts with
no address, and unlinked orders. Like `legacy-export/`, it's git-ignored.

**Re-running is safe.** Nobody is duplicated. Customers who already signed up
on the new site keep their password and details. Only blank fields are filled
in and their old orders are linked.

## Step 2: Test with a few accounts

Run on staging, then repeat the key checks once on production.

Send real emails only to accounts you control (e.g. `pratipkayal1@gmail.com`
is in the old data) or to staff/friendly customers who have agreed:

```bash
npm run announce -- --test-to you@example.com,colleague@example.com
```

Checklist:

- [ ] Sign in with an old customer's email and any password → welcome-back message appears.
- [ ] Click **Email Me My Password Link** → email arrives (check spam too) and looks right on phone and desktop.
- [ ] Open the link → set password → signed in automatically.
- [ ] Open the same link again → "already used" message.
- [ ] My Orders → old orders shown under "Orders from our previous website", with correct items and totals.
- [ ] Checkout → saved address is pre-filled.
- [ ] Sign out → sign in with the new password works.
- [ ] Private/incognito window: add to cart without signing in → check out as guest with a real email → order confirmation email arrives at that email.
- [ ] In the admin panel, that guest order shows the customer's real email.
- [ ] As that guest: "Email me a link to create a password" → link works → order now under the new account.
- [ ] Contact form via "contact form" in the help box → topic pre-set to "Account / Sign-in Help".

## Step 3: Go live

1. Deploy this branch.
2. Back up production, then run `migrate:legacy` and `migrate:verify` against production.
3. Do the first three checklist items on production with your own account.

## Step 4: Send the announcement in waves

Sending 21,000 emails at once to an old list (some addresses date from 2006)
would cause many bounces and push the domain into spam folders. Go most
recent customers first:

```bash
npm run announce -- --dry-run --limit 500       # see who's next
npm run announce -- --limit 500                 # wave 1: most recent customers
# check bounces/complaints in the Resend dashboard, then:
npm run announce -- --limit 2000 --since 2015
npm run announce -- --limit 5000
```

- Each customer is emailed once. Re-running skips anyone already sent to.
  Stopping halfway is safe.
- Customers who already set a password are never emailed.
- The 85 accounts that were disabled on the old site are skipped unless you add `--include-disabled`.
- Check your Resend plan's daily sending limit and stay under it.
- Each personal link lasts 21 days. After that, customers just use "Sign In" and get a fresh link.

## Things to know

- **Order status names on old orders are inferred.** The old site's
  `orders_status` table wasn't in the export, so labels were worked out from
  the data (e.g. status 4 = "Shipped": 95% have tracking numbers). The raw id
  is kept. If you can export that table, correct `LEGACY_ORDER_STATUS` in
  `scripts/lib/legacy-import.mjs` and re-run the import.
- **What customers see on old orders:** status history comments only where the
  old site notified the customer. Payment-processor logs (transaction IDs,
  card checks) are hidden.
- **Countries and states** on saved addresses were matched from each
  customer's own orders, because the lookup tables weren't exported. 120
  addresses with no orders have no country; checkout asks for it.
- **Guest sessions** with no orders are deleted after 30 days by
  `/api/cron/cleanup-guests` (daily, needs `CRON_SECRET`).
- **Email fix:** a quoting bug in `src/lib/email-templates.ts` was stripping
  colours and sizes from every email the site sends (order confirmations,
  codes, welcome). It's fixed in this change.

## Where things are

| | |
|---|---|
| Import / verify / announce | `scripts/migrate-legacy-customers.mjs`, `scripts/verify-legacy-migration.mjs`, `scripts/send-upgrade-announcement.mjs`, `scripts/lib/legacy-import.mjs` |
| Set-password links | `src/services/passwordSetup.service.ts`, `src/models/PasswordSetupToken.ts`, `src/app/api/auth/password-setup/`, `src/app/(auth)/set-password/` |
| Guest checkout | `src/services/guest.service.ts`, `src/app/api/auth/guest/`, `ensureCartSession` in `src/hooks/useAuth.tsx` |
| Old orders | `src/models/LegacyOrder.ts`, `src/app/api/orders/legacy/`, `src/app/(shop)/orders/LegacyOrders.tsx` |
| Help box | `src/components/auth/LoginHelp.tsx` |
