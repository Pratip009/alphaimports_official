import { connectDB } from "@/lib/db";
import { listProducts, listProductsWithCategoryFilters, getProductFacets } from "@/services/product.service";
import { ProductFilterParams } from "@/services/productFilter.service";
import { parseCategoryFilterSelectionFromObject } from "@/services/categoryFilter.service";
import FilterBar from "@/components/filters/FilterBar";
import ClassicSidebar from "@/components/classic/ClassicSidebar";
import ClassicProductCard from "@/components/classic/listing/ClassicProductCard";
import ClassicFilterPanel from "@/components/classic/listing/ClassicFilterPanel";
import ClassicResultsBar from "@/components/classic/listing/ClassicResultsBar";
import ShareButton from "@/components/classic/listing/ShareButton";
import { ProductCardStyles } from "@/components/products/ProductCard";
import { getNavCategories } from "@/lib/getNavCategories";
import { sanitizeHtml, looksLikeHtml } from "@/lib/sanitizeHtml";
import CategoryModel from "@/models/Category";
import SubcategoryModel from "@/models/Subcategory";
import { Suspense } from "react";
import type { Metadata } from "next";

type ProductType = "watch" | "diamond" | "gemstone";
interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

// Watch-specific filter params — if any of these are present the page is in watch mode
const WATCH_FILTER_PARAMS = [
  "watchBrand","watchMovement","watchGender","watchStyle",
  "watchStrapType","watchCaseMaterial","watchDialColor",
  "watchFeatures","watchCaseSize",
  // Also catch the attribute param names used by SearchBar chips
  "brand","movement","strapType","caseMaterial","dialColor",
  "feature","style","gender","caseSize",
] as const;

/**
 * Determine whether the current page should show the Watch, Diamond, or
 * Gemstone view. Trusts the real productKind on the first matched product,
 * falling back to URL signals when there are no results.
 */
function resolveProductType(
  sp: Record<string, string>,
  firstProduct: Record<string, unknown> | undefined,
): ProductType {
  const kind = firstProduct?.productKind as string | undefined;
  if (kind === "watch")    return "watch";
  if (kind === "gemstone") return "gemstone";
  if (kind === "diamond")  return "diamond";

  if (sp.category === "watches") return "watch";
  if (WATCH_FILTER_PARAMS.some((k) => sp[k])) return "watch";

  return "diamond";
}
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";

// Core taxonomy params get indexed; everything else is noindex,follow.
const CORE_PARAMS = ["category", "subcategory", "subSubcategory"] as const;

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const sp = await searchParams;

  const isWatch =
    sp.category === "watches" ||
    (!sp.category && WATCH_FILTER_PARAMS.some((k) => sp[k]));
  const isAlternative = /alternative|moissanite|simulat|\bcz\b/i.test(sp.category || "");
  const isJewelry = /jewel/i.test(sp.category || "");
  const isGemstone = /gem|precious|special/i.test(sp.category || "");

  const label = isWatch
    ? "Timepieces"
    : isAlternative
      ? "Diamond Alternatives"
      : isJewelry
        ? "Jewelry"
        : isGemstone
          ? "Gemstones"
          : "Diamonds";

  const filterBits = [sp.shape, sp.subcategory, sp.subSubcategory, sp.q ?? sp.search].filter(Boolean);
  const title = filterBits.length
    ? `${filterBits.join(" ")} ${label} | Alpha Gemstone`
    : `${label} | Alpha Gemstone`;

  const description = isWatch
    ? "Shop luxury timepieces at Alpha Gemstone — exceptional horological craftsmanship."
    : isAlternative
      ? "Shop moissanite, cubic zirconia, simulated and lab-created stones at Alpha Gemstone."
      : isJewelry
        ? "Shop fine jewelry at Alpha Gemstone."
        : isGemstone
          ? "Shop natural gemstones at Alpha Gemstone."
          : "Shop diamonds at Alpha Gemstone, with lab reports on applicable stones.";

  const coreQuery = new URLSearchParams();
  for (const key of CORE_PARAMS) {
    if (sp[key]) coreQuery.set(key, sp[key]);
  }
  const coreQueryString = coreQuery.toString();
  const canonical = coreQueryString
    ? `${SITE_URL}/products?${coreQueryString}`
    : `${SITE_URL}/products`;

  const hasNonCoreParams = Object.keys(sp).some(
    (key) => !(CORE_PARAMS as readonly string[]).includes(key) && sp[key],
  );

  return {
    title,
    description,
    alternates: { canonical },
    robots: hasNonCoreParams
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Alpha Gemstone",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Fields the classic card + its Quick View modal read. Picking them keeps the
// RSC payload small and turns ObjectIds / Dates into plain JSON.
const CARD_FIELDS = [
  "_id", "slug", "name", "price", "msrp", "description", "legacySku", "images", "stock",
  "shape", "size", "color", "clarity", "certification", "gemstoneName", "productKind",
  "shapeRaw", "colorRaw", "clarityRaw", "gradeRaw",
  "watchBrand", "watchModel", "watchMovement", "watchGender", "watchStyle",
  "watchCaseMaterial", "watchDialColor", "watchStrapType", "watchCaseSize", "watchFeatures",
  "legacyAttributes", "cutType", "luster", "hardness", "treatment", "origin",
  "caratWeight", "dimensions", "approxWeight", "numberOfStones", "weight",
  "manufacturerId", "minOrder", "makeAnOffer", "category", "subcategory",
] as const;

function serializeProduct(p: Record<string, unknown>) {
  const picked: Record<string, unknown> = {};
  for (const k of CARD_FIELDS) if (p[k] !== undefined) picked[k] = p[k];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return JSON.parse(JSON.stringify(picked)) as any;
}

function prettySlug(slug?: string) {
  return (slug || "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Names, description and sibling subcategories for the current listing. */
async function getListingInfo(categorySlug?: string, subSlug?: string) {
  const nav = await getNavCategories();
  const cat = nav.find((c) => c.slug === categorySlug);
  const sub = cat?.subcategories.find((s) => s.slug === subSlug);

  let description = "";
  try {
    if (sub && !sub._id.startsWith("virtual-")) {
      const doc = (await SubcategoryModel.findById(sub._id).select("description").lean()) as
        | { description?: string }
        | null;
      description = doc?.description ?? "";
    }
    if (!description && cat) {
      const doc = (await CategoryModel.findById(cat._id).select("description").lean()) as
        | { description?: string }
        | null;
      description = doc?.description ?? "";
    }
  } catch {
    /* description is optional */
  }

  return {
    categoryName: cat?.name ?? prettySlug(categorySlug),
    subName: sub?.name ?? (subSlug ? prettySlug(subSlug) : ""),
    description,
    siblings: (cat?.subcategories ?? []).map((s) => ({
      name: s.name,
      slug: s.slug,
      href: s.hasChildren
        ? `/category/${cat!.slug}/${s.slug}`
        : `/products?category=${cat!.slug}&subcategory=${s.slug}`,
    })),
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  await connectDB();

  const sp = await searchParams;

  const params: ProductFilterParams = {
    category:           sp.category,
    subcategory:        sp.subcategory,
    subSubcategory:     sp.subSubcategory,
    shape:              sp.shape,
    color:              sp.color,
    clarity:            sp.clarity,
    certification:      sp.certification,
    priceMin:           sp.priceMin,
    priceMax:           sp.priceMax,
    sizeMin:            sp.sizeMin,
    sizeMax:            sp.sizeMax,
    size:               sp.size,
    approxWeight:       sp.approxWeight,
    numberOfStones:     sp.numberOfStones,
    watchGender:        sp.watchGender   ?? sp.gender,
    watchBrand:         sp.watchBrand    ?? sp.brand,
    watchMovement:      sp.watchMovement ?? sp.movement,
    watchStrapType:     sp.watchStrapType  ?? sp.strapType,
    watchCaseMaterial:  sp.watchCaseMaterial ?? sp.caseMaterial,
    watchDialColor:     sp.watchDialColor  ?? sp.dialColor,
    watchFeatures:      sp.watchFeatures  ?? sp.feature,
    watchStyle:         sp.watchStyle     ?? sp.style,
    watchCaseSize:      sp.watchCaseSize  ?? sp.caseSize,
    inStock:            sp.inStock,
    q:                  sp.q ?? sp.search,   // support both ?q= and ?search=
    sortBy:             sp.sortBy as ProductFilterParams["sortBy"],
    page:               sp.page || 1,
    limit:              24,
  };

  const categorySelection = parseCategoryFilterSelectionFromObject(sp);

  // Product list, page info and the "New Products" strip run in parallel.
  const [{ products, total, page, limit, categoryFilters }, info, newest] = await Promise.all([
    listProductsWithCategoryFilters(params, categorySelection),
    getListingInfo(sp.category, sp.subcategory),
    listProducts({
      category: sp.category,
      subcategory: sp.subcategory,
      subSubcategory: sp.subSubcategory,
      sortBy: "newest",
      page: 1,
      limit: 3,
    }).catch(() => ({ products: [] as Record<string, unknown>[] })),
  ]);

  const totalPages = Math.ceil(total / limit);
  const productType = resolveProductType(sp, products[0] as Record<string, unknown> | undefined);

  const query = sp.q ?? sp.search;
  const firstProduct = products[0] as Record<string, unknown> | undefined;
  const subSubName = (firstProduct?.subSubcategory as { name?: string } | undefined)?.name;
  const fallbackTitle =
    productType === "watch" ? "Timepieces" : productType === "gemstone" ? "Gemstones" : "Diamonds";
  const title =
    (sp.subSubcategory && subSubName) ||
    info.subName ||
    (sp.category ? info.categoryName : "") ||
    (query ? `Search results for "${query}"` : fallbackTitle);

  const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "America/New_York" }).format(new Date());
  const newProducts = (newest.products as Record<string, unknown>[]).map(serializeProduct);

  return (
    <>
      <style>{CLASSIC_LISTING_CSS}</style>
      {/* Styles for the Quick View modal the classic cards open. */}
      <ProductCardStyles />

      <div className="cl">
        <ClassicSidebar activeCategorySlug={sp.category} activeSubSlug={sp.subcategory} />

        <main className="cl-main">
          <h1 className="cl-title-sm">{title}</h1>

          {info.description ? (
            looksLikeHtml(info.description) ? (
              // Admin-written rich text (e.g. pasted from Word), cleaned server-side.
              <div
                className="cl-desc cl-desc-html"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(info.description) }}
              />
            ) : (
              <div className="cl-desc">
                {info.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )
          ) : null}

          <div className="cl-headbar">
            <ShareButton title={title} />
            <span className="cl-title-lg">{title}</span>
          </div>

          {/* Watches keep their faceted filter bar (brand, movement, ...). */}
          {productType === "watch" && (
            <div className="cl-watch-filters">
              <Suspense fallback={<div className="cl-skel" />}>
                <FacetedFilterBar params={params} productType={productType} />
              </Suspense>
            </div>
          )}

          <ClassicFilterPanel
            groups={categoryFilters}
            subcategories={info.siblings}
            activeSubSlug={sp.subcategory}
            currentSort={sp.sortBy}
          />

          <ActiveFilterChips searchParams={sp} />

          <section className="cl-results" aria-label="Products">
            <ClassicResultsBar page={page} totalPages={totalPages} total={total} limit={limit} searchParams={sp} />

            {products.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="cl-grid">
                {products.map((p: Record<string, unknown>) => {
                  const product = serializeProduct(p);
                  return <ClassicProductCard key={product._id} product={product} productType={productType} />;
                })}
              </div>
            )}

            {products.length > 0 && (
              <ClassicResultsBar page={page} totalPages={totalPages} total={total} limit={limit} searchParams={sp} />
            )}
          </section>

          {newProducts.length > 0 && (
            <section className="cl-new" aria-label={`New products for ${month}`}>
              <h2 className="cl-new-head">New Products For {month}</h2>
              <div className="cl-grid cl-grid-new">
                {newProducts.map((p) => (
                  <ClassicProductCard key={p._id} product={p} productType={productType} compact />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

// ─── Faceted filter bar (watches only) ────────────────────────────────────────
async function FacetedFilterBar({
  params,
  productType,
}: {
  params: ProductFilterParams;
  productType: ProductType;
}) {
  const facets = await getProductFacets(params, productType);
  return <FilterBar productType={productType} facets={facets} />;
}

// ─── Active filter chips ──────────────────────────────────────────────────────
function ActiveFilterChips({ searchParams }: { searchParams: Record<string, string> }) {
  const chipKeys = [
    "shape","color","clarity","size","approxWeight","numberOfStones",
    "watchBrand","brand",
    "watchMovement","movement",
    "watchGender","gender",
    "watchStyle","style",
    "watchStrapType","strapType",
    "watchCaseMaterial","caseMaterial",
    "watchDialColor","dialColor",
    "watchFeatures","feature",
    "watchCaseSize","caseSize",
    "inStock",
  ];

  const seen = new Set<string>();
  const chips: string[] = [];

  chipKeys.forEach((key) => {
    const val = searchParams[key];
    if (!val) return;
    val.split(",").filter(Boolean).forEach((v) => {
      if (seen.has(v.toLowerCase())) return;
      seen.add(v.toLowerCase());
      chips.push(key === "inStock" ? "In Stock" : v);
    });
  });

  // CSV category filters: filter[SHAPE]=Marquise,Pear
  Object.entries(searchParams).forEach(([key, val]) => {
    const m = key.match(/^filter\[(.+)\]$/);
    if (!m || !val) return;
    chips.push(`${m[1]}: ${val.split(",").join(", ")}`);
  });

  if (searchParams.priceMin || searchParams.priceMax) {
    const min = searchParams.priceMin ? `$${Number(searchParams.priceMin).toLocaleString()}` : "";
    const max = searchParams.priceMax ? `$${Number(searchParams.priceMax).toLocaleString()}` : "";
    chips.push(min && max ? `${min} – ${max}` : min || `Under ${max}`);
  }

  if (searchParams.sizeMin || searchParams.sizeMax) {
    chips.push(
      [searchParams.sizeMin && `${searchParams.sizeMin}ct`, searchParams.sizeMax && `${searchParams.sizeMax}ct`]
        .filter(Boolean)
        .join(" – "),
    );
  }

  if (chips.length === 0) return null;

  return (
    <p className="cl-chips">
      <b>Filtered by:</b> {chips.join(" · ")}
    </p>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="cl-empty">
      <p><b>No products found.</b></p>
      <p>Try a different choice in the filters above, or click <b>Reset Search</b>.</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CLASSIC_LISTING_CSS = `
  .cl {
    font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 11px; color: #000; background: #fff;
    display: grid; grid-template-columns: 175px minmax(0, 1fr); gap: 14px;
    padding: 6px 24px 30px; align-items: start;
  }
  .cl a { text-decoration: none; }
  .cl-main { min-width: 0; }
  .cl-title-sm { font-size: 11px; font-weight: bold; color: #7f7f7f; margin: 4px 0 12px; }
    .cl-desc { color: #878790; font-size: 11px; line-height: 16px; margin-bottom: 18px; max-width: none; width: 100%; }
  .cl-desc p { margin: 0 0 10px; }
    .cl-desc b, .cl-desc strong { color: #000; }
  /* Rich-text descriptions keep their own inline colours/sizes (old-site copy
     uses grey text with navy keywords); just normalise the spacing. */
  .cl-desc-html p { margin: 0 0 12px; }
  .cl-desc-html p:last-child { margin-bottom: 0; }
  .cl-desc-html a { color: #000066; text-decoration: underline; }
  .cl-desc-html ul, .cl-desc-html ol { margin: 0 0 12px 20px; }

  .cl-headbar {
    display: flex; justify-content: flex-end; align-items: center; gap: 8px;
    border-top: 2px solid #bbb; padding-top: 4px; margin-bottom: 2px;
  }
  .cl-title-lg { color: #a6aec5; font: bold 15px Verdana, Geneva, sans-serif; }
  .csh {
    display: inline-flex; align-items: center; gap: 4px; background: #fff; cursor: pointer;
    border: 1px solid #999; padding: 0 6px; height: 16px; font: bold 9px Verdana, sans-serif; letter-spacing: 1px; color: #333;
  }
  .csh-plus { background: #f60; color: #fff; width: 10px; height: 10px; line-height: 10px; text-align: center; font-size: 10px; }
  .csh:hover { border-color: #003366; }

  .cl-watch-filters { margin-bottom: 6px; }
  .cl-skel { height: 40px; background: #eef0f5; }

  /* Quick View modal is portaled to <body>, outside .apc, so give it the
     card's colour variables too. */
  .apc-qv-overlay {
    --paper: #ffffff; --paper-soft: #fafaf9; --ink: #1a1a1c; --ink-soft: #4a4a50; --muted: #9a9aa0;
    --line: #ebebea; --line-strong: #d4d4d2; --accent: #b08d4a; --accent-soft: #f7f2e8;
    --oxblood: #9c3b45; --avail: #2d7a52;
  }

  /* Filter panel */
  .cfp { background: #dfe2ea; border: 1px solid #a6aec5; padding: 10px 12px 12px; transition: opacity .15s; }
  .cfp.is-pending { opacity: .6; }
  .cfp-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; padding-top: 6px; }
  .cfp-cat { display: flex; flex-direction: column; gap: 1px; }
  .cfp-cat span { color: #7f7f7f; font-size: 12px; }
  .cfp select {
    font: 11px Verdana, Geneva, sans-serif; color: #000; background: #fff;
    border: 1px solid #333; height: 18px; padding: 0 2px; border-radius: 0;
  }
  .cfp-cat select { width: 210px; }
  .cfp-reset {
    background: #c9cedc; border: 1px solid #7f8aa8; color: #555; cursor: pointer;
    font: 11px Verdana, Geneva, sans-serif; padding: 2px 10px; margin-right: 40px; word-spacing: 4px;
  }
  .cfp-reset:hover:not(:disabled) { color: #000; border-color: #003366; }
  .cfp-reset:disabled { cursor: default; }
  .cfp-groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 180px)); gap: 6px 10px; margin-top: 10px; }
  .cfp-group { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .cfp-group > span { color: #8a8a8a; font-size: 10px; text-transform: uppercase; display: flex; gap: 6px; }
  .cfp-group select { width: 100%; }
  .cfp-clear { background: none; border: 0; padding: 0; cursor: pointer; color: #003366; font-size: 9px; text-transform: none; text-decoration: underline; }
  .cfp-sort { margin: 4px 0 2px; }
  .cfp-sort label { display: inline-flex; align-items: center; gap: 8px; }
  .cfp-sort span { color: #7f7f7f; font: bold 13px Verdana, Geneva, sans-serif; }
  .cfp-sort select { font: 11px Verdana, Geneva, sans-serif; border: 1px solid #333; height: 18px; width: 145px; border-radius: 0; }

  .cl-chips { color: #555; font-size: 10px; margin: 4px 0; }

  /* Results frame */
  .cl-results { border: 1px solid #a6aec5; padding: 6px 6px 8px; }
  .crb { display: flex; justify-content: space-between; align-items: center; gap: 8px 16px; flex-wrap: wrap; padding: 4px 2px 6px; color: #7f7f7f; font-size: 10px; }
  .crb b { color: #333; }
  .crb-pages { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .crb-pages a { color: #0000ee; text-decoration: underline !important; }
  .crb-pages a:hover { color: #003366; }

  .cl-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid #a6aec5; padding: 14px 4px 6px; row-gap: 18px; }
  .cl-empty { border: 1px solid #a6aec5; padding: 30px 12px; text-align: center; color: #7f7f7f; line-height: 18px; }

  /* Product tile */
  .cpc { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 6px; min-width: 0; }
  .cpc-img { display: flex; align-items: center; justify-content: center; width: 100%; max-width: 150px; aspect-ratio: 1; margin-bottom: 4px; }
  .cpc-img img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .cpc.is-out .cpc-img img { opacity: .55; }
  .cpc-sku { color: #888; font-size: 10px; line-height: 13px; }
  .cpc-name { color: #cc6633; font-size: 10px; line-height: 13px; }
  .cpc-name:hover { text-decoration: underline !important; }
  .cpc-price { color: #555; font-size: 10px; line-height: 13px; }
  .cpc-price s { color: #990000; margin-right: 5px; }
  .cpc-price em { color: #990000; font-style: normal; }
  .cpc-stock { font-size: 10px; font-weight: bold; }
  .cpc-stock.low { color: #c75000; }
  .cpc-stock.out { color: #990000; }
  .cpc-buy {
    margin-top: 3px; background: #ccd6e3; border: 1px solid #7f8aa8; color: #333; cursor: pointer;
    font: 10px Verdana, Geneva, sans-serif; padding: 1px 10px; min-width: 64px;
  }
  .cpc-buy:hover:not(:disabled) { background: #b8c5d8; color: #000; }
  .cpc-buy:disabled { opacity: .6; cursor: default; }
  .cpc-actions { display: flex; gap: 5px; margin-top: 3px; font-size: 9px; color: #aaa; }
  .cpc-actions button { background: none; border: 0; padding: 0; cursor: pointer; font: 9px Verdana, Geneva, sans-serif; color: #7f7f7f; }
  .cpc-actions button:hover { color: #003366; text-decoration: underline; }
  .cpc-actions .is-saved { color: #cc3333; }
  .cpc-compact .cpc-name, .cpc-compact .cpc-price { color: #7f7f7f; }

  /* New products */
  .cl-new { margin-top: 30px; border: 1px solid #a6aec5; }
  .cl-new-head {
    margin: 0; padding: 6px 22px 7px; color: #fff; font: bold 11px Verdana, Geneva, sans-serif;
    font-variant: small-caps; letter-spacing: .3px;
    background: linear-gradient(to bottom, #7d90c5 0, #bec9e4 2px, #a9b4d3 100%);
  }
  .cl-grid-new { border: 0; padding: 20px 4px 14px; }

  @media (max-width: 900px) {
    .cl-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 760px) {
    .cl { grid-template-columns: minmax(0, 1fr); padding: 6px 8px 20px; }
    .cl-desc, .crb { font-size: 12px; line-height: 17px; }
    .cfp-cat select { width: 100%; }
    .cfp-reset { margin-right: 0; }
    .cfp select, .cfp-sort select { height: 30px; font-size: 14px; }
    .cfp-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cpc-name, .cpc-price, .cpc-sku { font-size: 12px; line-height: 16px; }
    .cpc-buy { padding: 6px 14px; font-size: 12px; }
    .cpc-actions, .cpc-actions button { font-size: 11px; }
  }
`;