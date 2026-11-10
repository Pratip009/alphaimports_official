// Server-side "what counts as a match" for free-text product search, plus the
// relevance ranking that orders those matches. Shared by:
//   - the full results page  (/products?search=…  → productFilter.service.ts)
//   - the header autocomplete (/api/products/search)
//   - the dropship seller catalog (via buildProductSearchOr)
// so every search box on the site agrees on what a query means.
//
// How a query is read — "1 Carat Princess Cut Moissanite":
//   1. Size specs are pulled out first: carat ("1 carat", "1/2 ct",
//      "1.5ct"), grams ("5g"), millimetres ("6.5mm") and WxH ("7x5mm").
//   2. The remaining words split into
//        required words — every one must appear (at the start of a word)
//                         in the name, SKU, brand, model, stone or grade
//                         fields: "princess", "moissanite"
//        soft words     — filler like "cut"/"stone"/lone numbers; they only
//                         affect ranking, so "Princess Moissanite" without
//                         the word "Cut" still matches.
//   3. When the query has required words, the size spec ranks results
//      (closest size first) instead of filtering them, so the customer sees
//      the 1 ct stone first and the 1.28 / 2 / 3 ct alternatives under it.
//      When the query is ONLY a spec ("1 carat", "6.5mm"), the spec filters.
//
// What changed vs. the previous version, and why it was inaccurate:
//   - "1 carat" was OR'd onto the text match, so a "1 carat princess
//     moissanite" search returned every 1 ct product in the catalogue.
//   - Words were matched anywhere inside any field, including long
//     descriptions ("cut" matched "cutlery", "ruby" matched a description
//     that merely mentions rubies). Description is now only a fallback
//     when the strict search finds nothing.
//   - There was no ranking, so Mongo returned matches in arbitrary order.

import {
  extractCarat,
  extractWeight,
  extractMm,
  extractDimensions,
  buildDimensionRegex,
  escapeRegex,
  CARAT_MATCH_TOLERANCE,
  weightTolerance,
  mmTolerance,
  type DimensionQuery,
} from "@/lib/search";

/** Fields a required word may match. `legacySku`/`watchModel` = "model number". */
export const SEARCHABLE_FIELDS = [
  "name",
  "legacySku",
  "watchBrand",
  "watchModel",
  "gemstoneName",
  "shapeRaw",
  "cutType",
  "shape",
  "color",
  "clarity",
  "certification",
] as const;

/** Only consulted when the strict search returns nothing. */
export const FALLBACK_FIELDS = ["description", "approxWeight"] as const;

/** Longest query we'll compile into regexes — protects the DB from pathological input. */
export const MAX_SEARCH_QUERY_LENGTH = 120;

/** Dropped entirely. */
const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "of", "with", "for", "in", "on", "&", "-", "+"]);
/** Kept for ranking only — common descriptive filler that names don't always include. */
const SOFT_WORDS = new Set(["cut", "shape", "shaped", "stone", "stones", "loose", "piece", "pcs", "pc", "lot"]);

const CARAT_SPEC = /(?:(?:\d+[\s-]+)?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*(?:carats?|cts?|tcw)\b/gi;
const DIM_SPEC = /\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?(?:\s*mm)?\b/gi;
const MM_SPEC = /\d+(?:\.\d+)?\s*mm\b/gi;
const GRAM_SPEC = /\d+(?:\.\d+)?\s*(?:gms?|grams?|g)\b/gi;

export interface ParsedSearch {
  raw: string;
  /** Lower-cased, whitespace-collapsed query, used for phrase bonuses. */
  phrase: string;
  /** Lower-cased query with size specs removed. */
  textPhrase: string;
  required: string[];
  soft: string[];
  carat: number | null;
  gram: number | null;
  mm: number | null;
  dims: DimensionQuery | null;
}

export function parseSearchQuery(rawQuery: string): ParsedSearch | null {
  const raw = (rawQuery ?? "").trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
  if (!raw) return null;
  const phrase = raw.toLowerCase().replace(/\s+/g, " ");

  // A bare number is a carat weight ("1", "0.35") unless it looks like a
  // model number ("090513", "126334") — then it's searched as text.
  const looksLikeSku = /^0\d|^\d{4,}$/.test(raw) || (/^\d+(?:\.\d+)?$/.test(raw) && Number(raw) > 100);
  const carat = looksLikeSku ? null : extractCarat(raw);
  const gram = extractWeight(raw);
  const dims = extractDimensions(raw);
  const mm = dims ? null : extractMm(raw);

  // Strip specs out before splitting into words, so "carat"/"mm"/"g" and the
  // spec's numbers don't become required words.
  let rest = phrase;
  if (carat !== null) rest = rest.replace(CARAT_SPEC, " ");
  if (dims) rest = rest.replace(DIM_SPEC, " ");
  if (mm !== null) rest = rest.replace(MM_SPEC, " ");
  if (gram !== null) rest = rest.replace(GRAM_SPEC, " ");

  const words = rest
    .split(/[\s,;:()"'+|]+/)
    .map((w) => w.replace(/^[^a-z0-9#]+|[^a-z0-9]+$/gi, ""))
    .filter((w) => w && !STOP_WORDS.has(w));

  const required: string[] = [];
  const soft: string[] = [];
  // A bare number query ("1", "0.35") is a carat spec — extractCarat already
  // captured it — so don't also require it as text.
  const bareNumber = !looksLikeSku && /^\d+(?:\.\d+)?$/.test(phrase);
  for (const w of words) {
    if (bareNumber) break;
    if (looksLikeSku) required.push(w);
    else if (SOFT_WORDS.has(w) || /^\d+(?:\.\d+)?$/.test(w)) soft.push(w);
    else required.push(w);
  }
  // "cut" on its own (all soft) — nothing would be required, so require them.
  if (required.length === 0 && carat === null && gram === null && mm === null && !dims) {
    required.push(...soft.filter((w) => !/^\d+(?:\.\d+)?$/.test(w)));
    if (required.length === 0) required.push(...soft);
    soft.length = 0;
  }

  return {
    raw,
    phrase,
    textPhrase: rest.replace(/\s+/g, " ").trim(),
    required: dedupe(required).slice(0, 8),
    soft: dedupe(soft).slice(0, 8),
    carat,
    gram,
    mm,
    dims,
  };
}

function dedupe(a: string[]) {
  return Array.from(new Set(a));
}

/** Plural-tolerant stem: "diamonds" → "diamond", "rubies" → "rub" (prefix still hits "ruby"). */
function stem(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3);
  if (w.length > 3 && w.endsWith("es") && /(ch|sh|x|ss)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/**
 * Regex for one query word:
 *  - words with digits ("ms0905", "14k", "vs1") match anywhere, so partial
 *    SKUs and grades still work;
 *  - 1–2 letter words must be a whole word ("d" color, "si" clarity);
 *  - everything else must START a word: "moiss" → "Moissanite", but "ring"
 *    no longer matches "Earrings".
 */
export function wordRegex(word: string): RegExp {
  const w = word.toLowerCase();
  if (/\d/.test(w)) return new RegExp(escapeRegex(w), "i");
  if (w.length <= 2) return new RegExp(`(?:^|[^a-z0-9])${escapeRegex(w)}(?:$|[^a-z0-9])`, "i");
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegex(stem(w))}`, "i");
}

function caratTextRegex(carat: number): RegExp {
  const forms = new Set<string>([String(carat), carat.toFixed(2)]);
  if (Number.isInteger(carat)) forms.add(`${carat}.0`);
  // Jewelry names often write fractions: "1/2 ct", "1 1/4 carat", "3/4 tcw".
  const whole = Math.floor(carat);
  const frac = carat - whole;
  for (const den of [2, 3, 4, 5, 8, 10, 16]) {
    const num = Math.round(frac * den);
    if (num > 0 && num < den && Math.abs(num / den - frac) < 0.005) {
      forms.add(whole ? `${whole} ${num}/${den}` : `${num}/${den}`);
      if (whole) forms.add(`${whole}-${num}/${den}`);
      break;
    }
  }
  const alts = Array.from(forms).map(escapeRegex).join("|");
  // Not preceded by a digit/point ("21 carat") or by "1 " / "1-" (the "1/2"
  // inside "1 1/2 ct"). Fixed-length lookbehinds work in both JS and MongoDB.
  return new RegExp(`(?<![\\d./])(?<!\\d[\\s-])(?:${alts})\\s*-?\\s*(?:ct|cts|carat|carats|tcw)\\b`, "i");
}

function specClauses(p: ParsedSearch): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  if (p.carat !== null) {
    const range = { $gte: p.carat - CARAT_MATCH_TOLERANCE, $lte: p.carat + CARAT_MATCH_TOLERANCE };
    out.push({
      $or: [{ caratWeight: range }, { size: range }, { name: caratTextRegex(p.carat) }],
    });
  }
  if (p.gram !== null) {
    const tol = weightTolerance(p.gram);
    out.push({ weight: { $gte: p.gram - tol, $lte: p.gram + tol } });
  }
  if (p.mm !== null) {
    const tol = mmTolerance(p.mm);
    const rx = new RegExp(`(?:^|[^\\d.])${escapeRegex(String(p.mm))}\\s*mm`, "i");
    out.push({
      $or: [{ size: { $gte: p.mm - tol, $lte: p.mm + tol } }, { name: rx }, { dimensions: rx }],
    });
  }
  if (p.dims) {
    const rx = buildDimensionRegex(p.dims);
    out.push({ $or: [{ dimensions: rx }, { name: rx }] });
  }
  return out;
}

export interface SearchFilterOptions {
  /** Also let words match description/approxWeight. Use as a fallback when the strict search finds nothing. */
  includeDescription?: boolean;
}

/**
 * Mongo filter for a free-text query, or null for an empty query.
 * AND it onto your own filter:  { isActive: true, $and: [searchFilter] }
 */
export function buildProductSearchFilter(
  rawQuery: string,
  opts: SearchFilterOptions = {},
): Record<string, unknown> | null {
  const p = parseSearchQuery(rawQuery);
  if (!p) return null;

  const fields: readonly string[] = opts.includeDescription
    ? [...SEARCHABLE_FIELDS, ...FALLBACK_FIELDS]
    : SEARCHABLE_FIELDS;

  const wordClauses = p.required.map((w) => {
    const rx = wordRegex(w);
    return { $or: fields.map((f) => ({ [f]: rx })) };
  });

  // Words present → words filter, specs rank. Only a spec → spec filters.
  const and = wordClauses.length > 0 ? wordClauses : specClauses(p);

  // An exact SKU / model number always matches, whatever else the query says.
  const exact = new RegExp(`^${escapeRegex(p.raw)}$`, "i");
  const exactSku = { $or: [{ legacySku: exact }, { watchModel: exact }] };

  if (and.length === 0) return exactSku;
  return { $or: [{ $and: and }, exactSku] };
}

/**
 * Back-compat wrapper for callers that do `$or: buildProductSearchOr(q)`
 * (the dropship catalog). An $or of one clause is that clause.
 */
export function buildProductSearchOr(
  rawQuery: string,
  opts: SearchFilterOptions = {},
): Record<string, unknown>[] | null {
  const f = buildProductSearchFilter(rawQuery, opts);
  return f ? [f] : null;
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

/** Fields scoreSearchMatch reads — select at least these when ranking. */
export const RANK_FIELDS =
  "_id name legacySku watchBrand watchModel gemstoneName shapeRaw cutType shape color clarity certification size caratWeight weight dimensions price createdAt";

export interface RankableProduct {
  _id?: unknown;
  name?: string;
  legacySku?: string;
  watchBrand?: string;
  watchModel?: string;
  gemstoneName?: string;
  shapeRaw?: string;
  cutType?: string;
  shape?: string[];
  color?: string[];
  clarity?: string[];
  certification?: string[];
  size?: number;
  caratWeight?: number;
  weight?: number;
  dimensions?: string;
  price?: number;
}

const NAME_CARAT = /(?:^|[^\d.])(?:(\d+)[\s-]+)?(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?\s*-?\s*(?:ct|cts|carat|carats|tcw)\b/i;

/** Best guess at a product's carat weight: explicit field, then the name, then `size`. */
export function productCarat(p: RankableProduct): number | null {
  if (typeof p.caratWeight === "number" && p.caratWeight > 0) return p.caratWeight;
  const m = p.name?.match(NAME_CARAT);
  if (m) {
    if (m[3]) return (m[1] ? Number(m[1]) : 0) + Number(m[2]) / Number(m[3]);
    return Number(m[2]);
  }
  if (typeof p.size === "number" && p.size > 0) return p.size;
  return null;
}

function normalize(s: string | undefined): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Higher = more relevant. Pure function so it's cheap to unit-test. */
export function scoreSearchMatch(prod: RankableProduct, p: ParsedSearch): number {
  const name = normalize(prod.name);
  let score = 0;

  // Exact model number / SKU beats everything.
  if (prod.legacySku && normalize(prod.legacySku) === p.phrase) score += 1000;
  if (prod.watchModel && normalize(prod.watchModel) === p.phrase) score += 900;

  // Whole-query phrase in the name.
  if (name === p.phrase) score += 300;
  else if (name.startsWith(p.phrase)) score += 200;
  else if (name.includes(p.phrase)) score += 150;
  else if (p.textPhrase && p.textPhrase !== p.phrase && name.includes(p.textPhrase)) score += 60;

  // Per-word: matching in the name counts more than in other fields.
  const others = [prod.legacySku, prod.watchBrand, prod.watchModel, prod.gemstoneName, prod.shapeRaw, prod.cutType,
    ...(prod.shape ?? []), ...(prod.color ?? []), ...(prod.clarity ?? []), ...(prod.certification ?? [])]
    .filter(Boolean).join(" | ");
  let lastIdx = -1;
  let inOrder = true;
  for (const w of p.required) {
    const rx = wordRegex(w);
    const m = rx.exec(name);
    if (m) {
      score += 20;
      if (m.index < lastIdx) inOrder = false;
      lastIdx = m.index;
      // Whole-word hit ("ruby", not just "rub…") scores a little more.
      if (new RegExp(`(?:^|[^a-z0-9])${escapeRegex(w)}(?:$|[^a-z0-9])`, "i").test(name)) score += 4;
    } else {
      inOrder = false;
      if (rx.test(others)) score += 6;
    }
  }
  if (p.required.length > 1 && inOrder) score += 25;
  for (const w of p.soft) if (wordRegex(w).test(name)) score += 8;

  // Size specs: exact match first, then nearest.
  if (p.carat !== null) {
    const c = productCarat(prod);
    if (c !== null) {
      const diff = Math.abs(c - p.carat);
      score += diff <= CARAT_MATCH_TOLERANCE ? 120 : Math.max(0, 60 - diff * 15);
    }
  }
  if (p.mm !== null) {
    const rx = new RegExp(`(?:^|[^\\d.])${escapeRegex(String(p.mm))}\\s*mm`, "i");
    if (rx.test(name) || (prod.dimensions && rx.test(prod.dimensions))) score += 110;
    else if (typeof prod.size === "number") {
      const diff = Math.abs(prod.size - p.mm);
      score += diff <= mmTolerance(p.mm) ? 100 : Math.max(0, 50 - diff * 10);
    }
  }
  if (p.dims) {
    const rx = buildDimensionRegex(p.dims);
    if ((prod.dimensions && rx.test(prod.dimensions)) || rx.test(name)) score += 110;
  }
  if (p.gram !== null && typeof prod.weight === "number") {
    const diff = Math.abs(prod.weight - p.gram);
    const tol = weightTolerance(p.gram);
    score += diff <= tol ? 100 : Math.max(0, 50 - (diff / tol) * 10);
  }

  return score;
}

/**
 * Sort matches best-first. Ties: nearer size, then smaller size, then
 * cheaper, then name — so equally relevant stones list 1 ct, 2 ct, 3 ct…
 */
export function rankSearchResults<T extends RankableProduct>(products: T[], p: ParsedSearch): T[] {
  const target = p.carat;
  const scored = products.map((prod) => {
    const c = productCarat(prod);
    return {
      prod,
      score: scoreSearchMatch(prod, p),
      dist: target !== null && c !== null ? Math.abs(c - target) : Number.POSITIVE_INFINITY,
      carat: c ?? Number.POSITIVE_INFINITY,
    };
  });
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.dist - b.dist ||
      a.carat - b.carat ||
      (a.prod.price ?? Infinity) - (b.prod.price ?? Infinity) ||
      (a.prod.name ?? "").localeCompare(b.prod.name ?? ""),
  );
  return scored.map((s) => s.prod);
}
