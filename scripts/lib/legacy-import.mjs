/**
 * Pure transform for the old Alpha Imports (osCommerce) export.
 *
 * Reads the CSV export and turns it into:
 *   - one account per unique customer email   (→ `users` collection)
 *   - one read-only history record per order  (→ `legacyorders` collection)
 *   - a report of everything that needed a judgement call
 *
 * No database access here, so the whole transform can be run and checked
 * with `--dry-run` before anything is written.
 *
 * Passwords are deliberately NOT carried over: the old site stored them as
 * salted MD5, which is no longer considered safe. Every migrated account is
 * flagged `needsPasswordSetup` and the customer sets a new password through
 * an emailed link.
 */
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import csv from 'csv-parser';

// ─── Order status ids → customer-friendly labels ─────────────────────────────
// The old site's `orders_status` lookup table was not part of the export, so
// these were inferred from the status-history comments and tracking data
// (e.g. 95% of status-4 orders carry a tracking number; status-102/105
// comments are Google Checkout "DELIVERED"/"CANCELLED" notices). The raw id
// is stored on every order too, so if any label is wrong, fix it here and
// re-run the import — nothing is lost.
export const LEGACY_ORDER_STATUS = {
  0: 'Payment not completed',
  1: 'Pending',
  2: 'Processing',
  3: 'Completed',
  4: 'Shipped',
  5: 'On hold',
  6: 'Cancelled',
  7: 'Awaiting payment',
  99999: 'Shipped',
  100000: 'Awaiting payment',
  100002: 'Refunded',
  100003: 'Closed',
  102: 'Shipped',
  103: 'Closed',
  105: 'Cancelled',
  // Only ever seen in status *history*, never as an order's final status:
  100004: 'Payment received', // PayPal payment confirmation (first entry on most orders)
  100: 'Order received',      // Google Checkout: new order + fraud check
  101: 'Payment received',    // Google Checkout: card charged
};
// Unknown ids in a history line get a neutral label rather than a guess.
export const legacyHistoryLabel = (id) => LEGACY_ORDER_STATUS[id] ?? 'Status updated';
export const legacyStatusLabel = (id) => LEGACY_ORDER_STATUS[id] ?? 'Closed';

// ─── US states (for turning "Washington" into "WA" so checkout matches) ──────
const US_STATES = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'puerto rico': 'PR', guam: 'GU', 'virgin islands': 'VI', 'american samoa': 'AS',
  'armed forces americas': 'AA', 'armed forces europe': 'AE', 'armed forces pacific': 'AP',
  'armed forces africa': 'AE', 'armed forces canada': 'AE', 'armed forces middle east': 'AE',
};
const US_CODES = new Set(Object.values(US_STATES));

function normalizeUsState(state) {
  const s = clean(state);
  if (!s) return '';
  if (US_CODES.has(s.toUpperCase())) return s.toUpperCase();
  return US_STATES[s.toLowerCase().replace(/\./g, '')] ?? s;
}

// ─── Small helpers ───────────────────────────────────────────────────────────
export function clean(v) {
  if (v === undefined || v === null) return '';
  return String(v).replace(/\s+/g, ' ').trim();
}
const num = (v) => {
  const n = Number(clean(v));
  return Number.isFinite(n) ? n : 0;
};
const int = (v) => {
  const n = parseInt(clean(v), 10);
  return Number.isFinite(n) ? n : 0;
};
const money = (v) => Math.round(num(v) * 100) / 100;
const lc = (v) => clean(v).toLowerCase();
const stripHtml = (v) => clean(String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'));

/**
 * Old-site status comments are a mix of messages to the customer and
 * machine/staff logs. Anything that looks sensitive never reaches customers:
 * passwords and login credentials (Google Checkout used to put these in
 * comments), card checks (CVV/AVS/expiry), payment-processor logs, and
 * anything shaped like a real card number. Staff still see those notes,
 * with passwords removed and card numbers masked.
 */
const SENSITIVE = new RegExp(
  [
    'pass ?word', 'passwd', '\\bpwd\\b', '\\bpass\\s*:', 'credentials', 'buyer.s user',
    'transaction id', 'payment status:', 'payment type:', 'google checkout order no',
    'risk information', 'partial cc', '\\b(avs|cvn|cvv|cvc|csc)', 'security code', 'charge amount', 'new state:',
    '^time: \\d{4}-\\d{2}-\\d{2}t',
    '\\bexp[a-z.]*\\b.{0,12}\\d{1,2}\\s*/\\s*\\d{2}', '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    // Any comment that talks about a payment card is staff-only, even when
    // the number in it is mistyped and fails the card checksum.
    'credit card', 'debit card', 'card ?(number|no\\b|#)', '\\bvisa\\b', 'master ?card', '\\bamex\\b',
    'american express', 'discover card',
  ].join('|'),
  'im'
);

/** Luhn checksum: true for numbers that could be real payment cards. */
function luhn(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = +digits[digits.length - 1 - i];
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}
// Digits with any spacing/dashes between groups, e.g. "4269      3200   6042".
const CARDISH = /\b(?:\d[\s\u00a0-]{0,8}){12,18}\d\b/g;
const isCardNumber = (m) => {
  const d = m.replace(/\D/g, '');
  return d.length >= 13 && d.length <= 19 && luhn(d);
};
const hasCardNumber = (text) => (text.match(CARDISH) || []).some(isCardNumber);

const CARD_TALK = /credit card|debit card|card ?(number|no\b|#)|\bvisa\b|master ?card|\bamex\b|american express|discover card|\b(cvv|cvc|csc)/i;

/** For staff notes: hide passwords and SSN-like values, mask card numbers. */
export function redactSensitive(text) {
  // When a note is about a card, mask every long number in it and any short
  // code after "cod/code/CVV", even if the number fails the checksum.
  const aboutCard = CARD_TALK.test(text);
  if (aboutCard) {
    text = text
      // Whole digit runs of 12+ digits, however long (a ZIP code typed right
      // before the card number must not push half the card out of the mask).
      .replace(/\d(?:[\s\u00a0-]{0,8}\d){11,}/g, (m) => `•••• ${m.replace(/\D/g, '').slice(-4)}`)
      .replace(/\b(cod|code|cvv2?|cvc2?|csc)(\s*[:#.]?\s*)\d{3,4}\b/gi, '$1$2[removed]');
  }
  return text
    .replace(/\b(pass(?:word|wd)?|pwd)\b(\s*[:=]\s*)(\S+)/gi, '$1$2[removed]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[removed]')
    .replace(/\b(cvv2?|cvc2?|csc|security code)(\s*[:#]?\s*)\d{3,4}\b/gi, '$1$2[removed]')
    .replace(CARDISH, (m) => (isCardNumber(m) ? `•••• ${m.replace(/\D/g, '').slice(-4)}` : m));
}

export function customerVisibleComment(row) {
  if (clean(row.customer_notified) !== '1') return '';
  const text = String(row.comments || '').replace(/\r\n?/g, '\n').trim();
  if (!text || SENSITIVE.test(text) || hasCardNumber(text)) return '';
  return text.slice(0, 2000);
}

/** Everything the customer doesn't see, for admins only, with secrets redacted. */
export function internalComment(row) {
  const text = String(row.comments || '').replace(/\r\n?/g, '\n').trim();
  if (!text || customerVisibleComment(row)) return '';
  return redactSensitive(text).slice(0, 4000);
}
// The old site often stored the town in both "suburb" and "city". Keep the
// suburb only when it adds something, so labels don't read "Auburn, Auburn".
const line2Of = (suburb, city) => (lc(suburb) && lc(suburb) !== lc(city) ? clean(suburb) : '');
const isUS = (country) => /^(united states|usa|us|u\.s\.a\.?)$/i.test(clean(country));
const normCountry = (c) => (isUS(c) ? 'United States' : clean(c));

/**
 * The old server stored local (New York) wall-clock times without a zone.
 * Convert them to a real instant so "ordered on" shows the right day.
 */
export function parseLegacyDate(v) {
  const s = clean(v);
  if (!s || s.startsWith('0000')) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const [, y, mo, d, h = '12', mi = '00', se = '00'] = m;
  const asUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi, +se);
  // Offset of New York at that moment, e.g. -240 or -300 minutes.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(asUtc));
  const get = (t) => +parts.find((p) => p.type === t).value;
  const nyAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  const offset = nyAsUtc - asUtc;
  return new Date(asUtc - offset);
}

function titleName(first, last) {
  return clean(`${clean(first)} ${clean(last)}`).slice(0, 100);
}

export function readCsv(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(file)
      .pipe(csv({ mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim() }))
      .on('data', (r) => rows.push(r))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

export async function loadLegacyData(dir) {
  const need = ['customers.csv', 'addresses.csv', 'orders.csv', 'order_products.csv', 'order_totals.csv', 'order_status_history.csv'];
  for (const f of need) {
    if (!existsSync(join(dir, f))) throw new Error(`Missing ${f} in ${dir}`);
  }
  const optional = (f) => (existsSync(join(dir, f)) ? readCsv(join(dir, f)) : Promise.resolve([]));
  const [customers, addresses, orders, products, totals, history, attributes] = await Promise.all([
    readCsv(join(dir, 'customers.csv')),
    readCsv(join(dir, 'addresses.csv')),
    readCsv(join(dir, 'orders.csv')),
    readCsv(join(dir, 'order_products.csv')),
    readCsv(join(dir, 'order_totals.csv')),
    readCsv(join(dir, 'order_status_history.csv')),
    optional('order_attributes.csv'),
  ]);
  return { customers, addresses, orders, products, totals, history, attributes };
}

// ─── Address-book id → name lookups, learned from the data ───────────────────
// addresses.csv stores country and state as numeric ids, but the lookup
// tables weren't exported. orders.csv stores the same places as text. Where
// a customer's saved address has the same street as one of their orders, we
// learn "country id 223 = United States" etc. Only confident matches are
// used; anything else falls back to the customer's own order history.
function learnLookups(addresses, orders) {
  const ordersByCustomer = new Map();
  for (const o of orders) {
    const k = clean(o.customers_id);
    if (!ordersByCustomer.has(k)) ordersByCustomer.set(k, []);
    ordersByCustomer.get(k).push(o);
  }
  const countryVotes = new Map();
  const zoneVotes = new Map();
  const vote = (map, key, val) => {
    if (!key || !val) return;
    if (!map.has(key)) map.set(key, new Map());
    const m = map.get(key);
    m.set(val, (m.get(val) || 0) + 1);
  };
  for (const a of addresses) {
    const street = lc(a.entry_street_address);
    if (!street) continue;
    for (const o of ordersByCustomer.get(clean(a.customers_id)) || []) {
      if (lc(o.delivery_street_address) !== street) continue;
      vote(countryVotes, clean(a.entry_country_id), normCountry(o.delivery_country));
      if (clean(a.entry_zone_id) !== '0') {
        const st = isUS(o.delivery_country) ? normalizeUsState(o.delivery_state) : clean(o.delivery_state);
        vote(zoneVotes, `${clean(a.entry_country_id)}:${clean(a.entry_zone_id)}`, st);
      }
    }
  }
  const pick = (votes, minShare, minCount) => {
    const out = new Map();
    for (const [k, m] of votes) {
      const total = [...m.values()].reduce((x, y) => x + y, 0);
      const [best, n] = [...m.entries()].sort((x, y) => y[1] - x[1])[0];
      if (n / total >= minShare && n >= minCount) out.set(k, best);
    }
    return out;
  };
  return {
    countries: pick(countryVotes, 0.9, 1),
    zones: pick(zoneVotes, 0.9, 3),
    ordersByCustomer,
  };
}

// ─── Main transform ──────────────────────────────────────────────────────────
export function buildMigration(data) {
  const { customers, addresses, orders, products, totals, history, attributes } = data;
  const report = {
    generatedAt: new Date().toISOString(),
    input: {
      customers: customers.length,
      addresses: addresses.length,
      orders: orders.length,
      orderProducts: products.length,
      orderTotals: totals.length,
      statusHistory: history.length,
      orderAttributes: attributes.length,
    },
    accounts: 0,
    duplicateEmailGroups: [],
    invalidEmails: [],
    accountsWithoutAddress: [],
    accountsAddressFromOrders: 0,
    unmappedCountryIds: {},
    orders: 0,
    ordersLinkedById: 0,
    ordersLinkedByEmail: 0,
    ordersWithoutAccount: [],
    ordersWithoutItems: [],
    ordersWithTotalMismatch: [],
    statusCounts: {},
    unknownStatusIds: {},
    orphanRows: { addresses: 0, products: 0, totals: 0, history: 0 },
  };

  const lookups = learnLookups(addresses, orders);
  const orderIds = new Set(orders.map((o) => clean(o.orders_id)));

  // ── Customers: group by email (case-insensitive) ──────────────────────────
  const latestOrderDate = new Map(); // customers_id → Date
  const firstOrderDate = new Map();
  const orderCount = new Map();
  for (const o of orders) {
    const id = clean(o.customers_id);
    const d = parseLegacyDate(o.date_purchased);
    orderCount.set(id, (orderCount.get(id) || 0) + 1);
    if (d && (!latestOrderDate.get(id) || d > latestOrderDate.get(id))) latestOrderDate.set(id, d);
    if (d && (!firstOrderDate.get(id) || d < firstOrderDate.get(id))) firstOrderDate.set(id, d);
  }

  const emailRx = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const groups = new Map(); // email → [customer rows]
  for (const c of customers) {
    const email = lc(c.customers_email_address);
    if (!emailRx.test(email)) {
      report.invalidEmails.push({ legacyCustomerId: int(c.customers_id), email: clean(c.customers_email_address) });
      continue;
    }
    if (!groups.has(email)) groups.set(email, []);
    groups.get(email).push(c);
  }

  const addressesByCustomer = new Map();
  const customerIds = new Set(customers.map((c) => clean(c.customers_id)));
  for (const a of addresses) {
    const k = clean(a.customers_id);
    if (!customerIds.has(k)) {
      report.orphanRows.addresses++;
      continue;
    }
    if (!addressesByCustomer.has(k)) addressesByCustomer.set(k, []);
    addressesByCustomer.get(k).push(a);
  }

  const toLegacyAddress = (a, defaultId) => {
    const countryId = clean(a.entry_country_id);
    let country = lookups.countries.get(countryId) || '';
    if (!country) {
      // Fall back to the country on this customer's latest order.
      const os = lookups.ordersByCustomer.get(clean(a.customers_id)) || [];
      const latest = os
        .map((o) => ({ o, d: parseLegacyDate(o.date_purchased) }))
        .sort((x, y) => (y.d?.getTime() || 0) - (x.d?.getTime() || 0))[0];
      country = latest ? normCountry(latest.o.delivery_country) : '';
      if (!country) report.unmappedCountryIds[countryId] = (report.unmappedCountryIds[countryId] || 0) + 1;
    }
    let state = clean(a.entry_state) || lookups.zones.get(`${countryId}:${clean(a.entry_zone_id)}`) || '';
    if (isUS(country)) state = normalizeUsState(state);
    return {
      legacyAddressId: int(a.address_book_id),
      isDefault: clean(a.address_book_id) === defaultId,
      name: titleName(a.entry_firstname, a.entry_lastname),
      company: clean(a.entry_company),
      line1: clean(a.entry_street_address),
      line2: line2Of(a.entry_suburb, a.entry_city),
      city: clean(a.entry_city),
      state,
      postalCode: clean(a.entry_postcode),
      country,
    };
  };

  const accounts = [];
  const legacyIdToEmail = new Map();

  for (const [email, rows] of groups) {
    // Primary record = the one with the most recent order, else the newest id.
    rows.sort((x, y) => {
      const dx = latestOrderDate.get(clean(x.customers_id))?.getTime() || 0;
      const dy = latestOrderDate.get(clean(y.customers_id))?.getTime() || 0;
      return dy - dx || int(y.customers_id) - int(x.customers_id);
    });
    const primary = rows[0];
    const ids = rows.map((r) => int(r.customers_id));
    ids.forEach((id) => legacyIdToEmail.set(String(id), email));
    if (rows.length > 1) {
      report.duplicateEmailGroups.push({ email, keptLegacyCustomerId: ids[0], mergedLegacyCustomerIds: ids.slice(1) });
    }

    const allAddresses = rows.flatMap((r) =>
      (addressesByCustomer.get(clean(r.customers_id)) || []).map((a) =>
        toLegacyAddress(a, clean(r === primary ? primary.customers_default_address_id : ''))
      )
    );
    // Dedupe identical addresses (same street + postcode).
    const seen = new Set();
    const uniqueAddresses = allAddresses
      .sort((x, y) => Number(y.isDefault) - Number(x.isDefault))
      .filter((a) => {
        const k = `${a.line1.toLowerCase()}|${a.postalCode.toLowerCase()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

    // Main shipping address: the default address-book entry, or the first.
    let main = uniqueAddresses.find((a) => a.isDefault) || uniqueAddresses[0] || null;
    let addressSource = main ? 'address_book' : 'none';

    // Prefer the exact text from the customer's latest order to that same
    // street (city/state/postcode spelled as they were actually shipped).
    const theirOrders = rows
      .flatMap((r) => lookups.ordersByCustomer.get(clean(r.customers_id)) || [])
      .map((o) => ({ o, d: parseLegacyDate(o.date_purchased) }))
      .sort((x, y) => (y.d?.getTime() || 0) - (x.d?.getTime() || 0));
    const fromOrder = (o) => {
      const country = normCountry(o.delivery_country);
      return {
        name: clean(o.delivery_name),
        line1: clean(o.delivery_street_address),
        line2: line2Of(o.delivery_suburb, o.delivery_city),
        city: clean(o.delivery_city),
        state: isUS(country) ? normalizeUsState(o.delivery_state) : clean(o.delivery_state),
        postalCode: clean(o.delivery_postcode),
        country,
      };
    };
    if (main) {
      const match = theirOrders.find(({ o }) => lc(o.delivery_street_address) === main.line1.toLowerCase());
      if (match) main = { ...main, ...fromOrder(match.o), name: main.name || clean(match.o.delivery_name) };
    } else if (theirOrders.length) {
      main = fromOrder(theirOrders[0].o);
      addressSource = 'latest_order';
      report.accountsAddressFromOrders++;
    }
    if (!main) report.accountsWithoutAddress.push({ legacyCustomerId: ids[0], email });

    const phone =
      clean(primary.customers_telephone) ||
      rows.map((r) => clean(r.customers_telephone)).find(Boolean) ||
      clean(theirOrders[0]?.o.customers_telephone);

    let name = titleName(primary.customers_firstname, primary.customers_lastname);
    if (!name && main) name = main.name;
    if (!name && theirOrders[0]) name = clean(theirOrders[0].o.customers_name).slice(0, 100);
    if (!name) name = email.split('@')[0].slice(0, 100);

    const firstDates = rows.map((r) => firstOrderDate.get(clean(r.customers_id))).filter(Boolean);
    const customerSince = firstDates.length ? new Date(Math.min(...firstDates.map((d) => d.getTime()))) : null;

    accounts.push({
      legacyCustomerId: ids[0],
      email,
      name,
      // The account's `phone` field is capped at 20 chars; the full value is kept in legacy.phone.
      phone: phone.slice(0, 20),
      address: main
        ? {
            line1: main.line1.slice(0, 200),
            line2: (main.line2 || '').slice(0, 200),
            city: main.city.slice(0, 100),
            state: (main.state || '').slice(0, 100),
            postalCode: main.postalCode.slice(0, 20),
            country: main.country.slice(0, 100),
          }
        : null,
      addressSource,
      customerSince,
      orderCount: rows.reduce((n, r) => n + (orderCount.get(clean(r.customers_id)) || 0), 0),
      lastOrderAt: theirOrders[0]?.d || null,
      legacy: {
        phone,
        newsletter: rows.some((r) => clean(r.customers_newsletter) === '1'),
        purchasedWithoutAccount: clean(primary.purchased_without_account) === '1',
        status: int(primary.customers_status),
        shoppingPoints: money(primary.customers_shopping_points),
        orderCount: rows.reduce((n, r) => n + (orderCount.get(clean(r.customers_id)) || 0), 0),
        // Used to send the upgrade announcement to the most recent customers first.
        lastOrderAt: theirOrders[0]?.d || null,
        addresses: uniqueAddresses,
        mergedLegacyCustomerIds: ids.slice(1),
      },
    });
  }
  report.accounts = accounts.length;

  // ── Orders ────────────────────────────────────────────────────────────────
  const by = (rows, key) => {
    const m = new Map();
    for (const r of rows) {
      const k = clean(r[key]);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return m;
  };
  const productsByOrder = by(products, 'orders_id');
  const totalsByOrder = by(totals, 'orders_id');
  const historyByOrder = by(history, 'orders_id');
  const attrsByOrderProduct = by(attributes, 'orders_products_id');
  for (const k of totalsByOrder.keys()) if (!orderIds.has(k)) report.orphanRows.totals += totalsByOrder.get(k).length;
  for (const k of productsByOrder.keys()) if (!orderIds.has(k)) report.orphanRows.products += productsByOrder.get(k).length;
  for (const k of historyByOrder.keys()) if (!orderIds.has(k)) report.orphanRows.history += historyByOrder.get(k).length;

  const addr = (o, p) => {
    const country = normCountry(o[`${p}_country`]);
    return {
      name: clean(o[`${p}_name`]),
      company: clean(o[`${p}_company`]),
      line1: clean(o[`${p}_street_address`]),
      line2: line2Of(o[`${p}_suburb`], o[`${p}_city`]),
      city: clean(o[`${p}_city`]),
      state: isUS(country) ? normalizeUsState(o[`${p}_state`]) : clean(o[`${p}_state`]),
      postalCode: clean(o[`${p}_postcode`]),
      country,
    };
  };

  const legacyOrders = [];
  for (const o of orders) {
    const oid = clean(o.orders_id);
    const cid = clean(o.customers_id);
    let accountEmail = legacyIdToEmail.get(cid) || null;
    if (accountEmail) report.ordersLinkedById++;
    else {
      const e = lc(o.customers_email_address);
      if (groups.has(e)) {
        accountEmail = e;
        report.ordersLinkedByEmail++;
      } else {
        report.ordersWithoutAccount.push({ legacyOrderId: int(oid), legacyCustomerId: int(cid), email: e });
      }
    }

    const items = (productsByOrder.get(oid) || []).map((p) => ({
      legacyProductId: int(p.products_id),
      model: clean(p.products_model),
      name: stripHtml(p.products_name),
      // Kept at the old site's 4-decimal precision (e.g. 8.4375); rounded only for display.
      price: Math.round(num(p.final_price) * 10000) / 10000,
      quantity: int(p.products_quantity),
      options: (attrsByOrderProduct.get(clean(p.orders_products_id)) || []).map((a) => ({
        name: clean(a.products_options),
        value: clean(a.products_options_values),
      })),
    }));
    if (!items.length) report.ordersWithoutItems.push(int(oid));

    const t = (totalsByOrder.get(oid) || [])
      .sort((a, b) => int(a.sort_order) - int(b.sort_order))
      .map((r) => ({ code: clean(r.class), title: stripHtml(r.title).replace(/:$/, ''), value: money(r.value) }));
    const totalOf = (code) => t.filter((x) => x.code === code).reduce((s, x) => s + x.value, 0);
    const subtotal = money(totalOf('ot_subtotal'));
    const total = money(totalOf('ot_total'));
    const itemsSum = money(items.reduce((s, i) => s + i.price * i.quantity, 0));
    if (items.length && Math.abs(itemsSum - subtotal) > 0.05) {
      report.ordersWithTotalMismatch.push({ legacyOrderId: int(oid), itemsSum, subtotal });
    }

    const statusId = int(o.orders_status);
    if (!(statusId in LEGACY_ORDER_STATUS)) report.unknownStatusIds[statusId] = (report.unknownStatusIds[statusId] || 0) + 1;
    const status = legacyStatusLabel(statusId);
    report.statusCounts[status] = (report.statusCounts[status] || 0) + 1;

    const statusHistory = (historyByOrder.get(oid) || [])
      .map((h) => ({
        date: parseLegacyDate(h.date_added),
        statusId: int(h.orders_status_id),
        status: legacyHistoryLabel(int(h.orders_status_id)),
        // Only what the customer was actually told on the old site.
        comment: customerVisibleComment(h),
        // Everything else (payment logs, staff notes) — admin pages only.
        internalNote: internalComment(h),
      }))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

    const tracking = [
      ['UPS', o.ups_track_num],
      ['USPS', o.usps_track_num],
      ['FedEx', o.fedex_track_num],
      ['FedEx Freight', o.fedex_freight_track_num],
      ['DHL', o.dhl_track_num],
    ]
      .flatMap(([carrier, v]) =>
        clean(v)
          .split(/[\s,;]+/)
          .filter((x) => x.length >= 6)
          .map((number) => ({ carrier, number }))
      );

    legacyOrders.push({
      legacyOrderId: int(oid),
      legacyCustomerId: int(cid),
      accountEmail, // resolved to a user _id by the writer
      email: lc(o.customers_email_address),
      customerName: clean(o.customers_name),
      phone: clean(o.customers_telephone),
      delivery: addr(o, 'delivery'),
      billing: addr(o, 'billing'),
      paymentMethod: clean(o.payment_method),
      customerComment: redactSensitive(String(o.comments || '').replace(/\r\n?/g, '\n').trim()).slice(0, 4000),
      items,
      totals: t,
      subtotal,
      shipping: money(totalOf('ot_shipping')),
      total,
      currency: clean(o.currency) || 'USD',
      statusId,
      status,
      statusHistory,
      tracking,
      purchasedAt: parseLegacyDate(o.date_purchased),
      lastModifiedAt: parseLegacyDate(o.last_modified),
    });
  }
  report.orders = legacyOrders.length;

  return { accounts, orders: legacyOrders, report };
}
