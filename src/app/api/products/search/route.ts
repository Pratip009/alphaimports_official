import { NextRequest, NextResponse } from "next/server";
// ⚠️ Adjust these two imports to match your actual project paths/names —
// e.g. if your connection helper is `@/lib/mongodb` or `connectDB`, swap it in.
import db from "@/lib/db";
import Product from "@/models/Product";
// Registers the Category/Subcategory/SubSubcategory schemas with Mongoose.
// Not used directly here, but .populate("category"/"subcategory"/
// "subSubcategory") below needs each ref model already registered in this
// process — otherwise Mongoose throws "MissingSchemaError: Schema hasn't
// been registered for model 'Category'" the first time this route bundle
// runs without something else having imported them first.
import "@/models/Category";
import "@/models/Subcategory";
import "@/models/SubSubcategory";
import {
  buildProductSearchFilter,
  parseSearchQuery,
  rankSearchResults,
  type RankableProduct,
} from "@/lib/productSearchQuery";

export const dynamic = "force-dynamic";

// Matching + ranking rules live in src/lib/productSearchQuery.ts so this
// dropdown, the full results page (/products?search=) and the dropship
// catalog all agree on what a query means.

const SELECT =
  "name slug price images image category subcategory subSubcategory productKind watchBrand watchModel gemstoneName legacySku description size caratWeight weight dimensions approxWeight shape color clarity certification shapeRaw cutType createdAt";

/** Matches pulled before ranking. Ranking happens in memory, so this bounds the work. */
const RANK_POOL = 400;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 30) || 30, 200);

  if (!q) return NextResponse.json({ data: [] });
  const parsed = parseSearchQuery(q);
  if (!parsed) return NextResponse.json({ data: [] });

  await db();

  const find = async (includeDescription: boolean) => {
    const filter = buildProductSearchFilter(q, { includeDescription });
    if (!filter) return [];
    return Product.find({ isActive: { $ne: false }, $and: [filter] })
      .select(SELECT)
      .sort({ createdAt: -1 })
      .limit(RANK_POOL)
      .lean();
  };

  // Strict first; only widen to descriptions when nothing matched.
  let pool = await find(false);
  if (pool.length === 0) pool = await find(true);

  const top = rankSearchResults(pool as unknown as RankableProduct[], parsed).slice(0, limit) as unknown as typeof pool;
  const ids = top.map((p) => (p as { _id: unknown })._id);

  // Populate taxonomy names for just the rows we return.
  const populated = await Product.find({ _id: { $in: ids } })
    .select(SELECT)
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .populate("subSubcategory", "name slug")
    .lean();
  const byId = new Map(populated.map((p) => [String((p as { _id: unknown })._id), p]));
  const data = ids.map((id) => byId.get(String(id))).filter(Boolean);

  return NextResponse.json({ data });
}
