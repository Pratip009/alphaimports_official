import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { getProductById, getProductBySlug } from "@/services/product.service";
import Product from "@/models/Product";
import Link from "next/link";
import RecordRecentlyViewed from "@/components/products/RecordRecentlyViewed";
import ProductReviews from "@/components/products/ProductReviews";
import ClassicSidebar from "@/components/classic/ClassicSidebar";
import ClassicGallery from "@/components/classic/product/ClassicGallery";
import ClassicBuyBox from "@/components/classic/product/ClassicBuyBox";
import PrintButton from "@/components/classic/product/PrintButton";
import ClassicRecentlyViewed from "@/components/classic/product/ClassicRecentlyViewed";
import { ProductCardStyles } from "@/components/products/ProductCard";
import { sanitizeHtml, looksLikeHtml, htmlToText } from "@/lib/sanitizeHtml";
import type { Metadata } from "next";
import { cache } from "react";
import { optimizedImageUrl } from "@/lib/image-url";
import { getRatingStats } from "@/services/review.service";
import { buildProductSpecs, type Spec } from "@/lib/productSpecs";
import { isAlternativesCategoryName, isDiamondAlternative } from "@/lib/diamondAlternatives";
// ─── Types ────────────────────────────────────────────────────────────────────
type ProductDoc = {
  _id: unknown;
  name: string;
  slug: string;
  price: number;
  productKind?: "diamond" | "gemstone" | "watch" | "jewelry";

  // Diamond / gemstone
  shape?: string | string[];
  shapeRaw?: string;
  size?: number;
  color?: string | string[];
  colorRaw?: string;
  clarity?: string | string[];
  clarityRaw?: string;
  gradeRaw?: string;
  gemstoneName?: string;
  certification?: string | string[];

  // Everything else from the legacy catalog that doesn't map to a fixed
  // enum (cut, luster, hardness, treatment, origin, metal, ring size,
  // carat/size ranges, approx weight, dimensions, etc.)
  legacyAttributes?: Record<string, string>;

  // Typed attribute fields from the schema (preferred over the equivalent
  // free-text legacyAttributes entry when present)
  approxWeight?: string;
  numberOfStones?: number;
  cutType?: string;
  luster?: string;
  hardness?: string;
  treatment?: string;
  origin?: string;
  caratWeight?: number;
  dimensions?: string;

  // Legacy "matched categories" export fields
  weight?: number;
  msrp?: number;
  manufacturerId?: string;
  minOrder?: number;
  maxOrder?: number;
  qtyBlocks?: number;
  makeAnOffer?: boolean;

  // Watch
  watchBrand?: string;
  watchModel?: string;
  watchMovement?: string;
  watchGender?: string;
  watchStyle?: string;
  watchStrapType?: string;
  watchCaseMaterial?: string;
  watchDialColor?: string;
  watchCaseSize?: string;
  watchFeatures?: string[];

  images: string[];
  stock: number;
  legacySku?: string;
  description?: string;
  category?: { name: string; slug?: string };
  subcategory?: { name: string; slug?: string };
};

type RelatedItem = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  img: string;
  shape?: string;
  size?: number;
  color?: string;
  clarity?: string;
  watchBrand?: string;
  watchMovement?: string;
  watchGender?: string;
};

type ProductKind = "watch" | "diamond" | "gemstone" | "jewelry";

// Wrap the resolver with React's cache() so that generateMetadata() and the
// page component — which both need the same product for the same request —
// share one underlying DB lookup instead of resolving twice.
//
// Resolution order: slug first (the canonical, public-facing URL). If that
// misses and the param happens to be a valid Mongo ObjectId, fall back to
// the old id-based lookup — this is what keeps every link/bookmark made
// before products had slugs from turning into a dead 404. The page
// component below is responsible for redirecting those to the canonical
// slug URL once resolved; generateMetadata just needs *a* product to
// describe, so it doesn't redirect itself.
const getCachedProduct = cache(async (param: string) => {
  const bySlug = await getProductBySlug(param);
  if (bySlug) return { product: bySlug, resolvedBy: "slug" as const };

  if (mongoose.Types.ObjectId.isValid(param)) {
    const byId = await getProductById(param);
    if (byId) return { product: byId, resolvedBy: "id" as const };
  }

  return null;
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const resolved = await getCachedProduct(slug);

  if (!resolved) {
    return {
      title: "Product Not Found | Alpha Gemstone",
      robots: { index: false, follow: true },
    };
  }

  // Old id-shaped URLs get redirected to the canonical slug by the page
  // component below, but generateMetadata runs independently of that
  // redirect — make sure crawlers are only ever pointed at the slug URL
  // that will actually keep resolving.
  const p = resolved.product as unknown as ProductDoc;
  const canonical = `${SITE_URL}/products/${p.slug}`;

  const kindLabel =
    p.category?.name ??
    kindTitle(getProductKind(p));

  const plainDesc = p.description ? htmlToText(p.description) : "";
  const description = plainDesc
    ? plainDesc.slice(0, 160)
    : `Shop ${p.name} — ${kindLabel} at Alpha Gemstone. Expertly curated, ` +
      `secure checkout, and expert support on every fine jewelry order.`;

  const title = `${p.name} | ${kindLabel} | Alpha Gemstone`;

  const image = (p.images ?? []).filter(Boolean)[0];
  const keywords = Array.from(
    new Set(
      [
        p.name,
        kindLabel,
        p.category?.name,
        p.subcategory?.name,
        p.gemstoneName,
        "Alpha Gemstone",
      ].filter((v): v is string => !!v),
    ),
  );

  const inStock = (p.stock ?? 0) > 0;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Alpha Gemstone",
      images: image
        ? [{ url: image, width: 1200, height: 1200, alt: p.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    other: {
      "product:price:amount": String(p.price),
      "product:price:currency": "USD",
      "product:availability": inStock ? "in stock" : "out of stock",
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function first(val?: string | string[]): string {
  if (!val) return "";
  return Array.isArray(val) ? (val[0] ?? "") : val;
}
function display(val?: string | string[]): string {
  if (!val) return "";
  return Array.isArray(val) ? val.join(", ") : val;
}
function certDisplay(val?: string | string[]): string {
  if (!val) return "—";
  const arr = Array.isArray(val) ? val : [val];
  const filtered = arr.filter((c) => c && c.toLowerCase() !== "none");
  return filtered.length > 0 ? filtered.join(", ") : "—";
}
function isWatchDoc(p: ProductDoc): boolean {
  return !!(p.watchBrand || p.watchMovement || p.watchGender);
}

// Prefer the stored, explicit classification (productKind — set at import
// time in fileParser.service.ts) over guessing from which fields happen to
// be populated. Falls back to inference only for older records that predate
// the productKind field.
function getProductKind(p: ProductDoc): ProductKind {
  // Moissanite, CZ and simulated/lab-created stones are never presented as
  // diamonds — even if an old record still has productKind "diamond".
  const alternative =
    isDiamondAlternative(p.name, p.gemstoneName) || isAlternativesCategoryName(p.category?.name);
  if (p.productKind) return alternative && p.productKind === "diamond" ? "gemstone" : p.productKind;
  if (isWatchDoc(p)) return "watch";
  const categoryName = (p.category?.name ?? "").toLowerCase();
  if (categoryName.includes("diamond") && !alternative) return "diamond";
  if (p.gemstoneName) return "gemstone";
  return "jewelry";
}

function kindTitle(kind: ProductKind): string {
  if (kind === "jewelry") return "Fine Jewelry";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

// ─── Spec table builder ────────────────────────────────────────────────────
// The actual row-building logic now lives in src/lib/productSpecs.ts,
// shared with the ProductCard Quick View modal so the two can never drift
// apart — see that file's header comment.
function buildSpecs(p: ProductDoc, kind: ProductKind): Spec[] {
  return buildProductSpecs(p, kind);
}

// ─── Related products ─────────────────────────────────────────────────────────
async function getRelatedProducts(
  p: ProductDoc,
  excludeId: string,
  limit = 4,
): Promise<RelatedItem[]> {
  const watch = isWatchDoc(p);
  let docs: any[] = [];

  if (watch) {
    docs = await Product.find({
      watchBrand: p.watchBrand,
      _id: { $ne: excludeId },
      isActive: true,
      stock: { $gt: 0 },
    })
      .limit(limit)
      .lean();

    if (docs.length < limit) {
      const existingIds = docs.map((d) => String(d._id));
      const fallback = await Product.find({
        watchBrand: { $exists: true },
        _id: { $nin: [excludeId, ...existingIds] },
        isActive: true,
        stock: { $gt: 0 },
      })
        .limit(limit - docs.length)
        .lean();
      docs = [...docs, ...fallback];
    }
  } else {
    docs = await Product.find({
      shape: { $regex: new RegExp(first(p.shape), "i") },
      _id: { $ne: excludeId },
      isActive: true,
      stock: { $gt: 0 },
    })
      .limit(limit)
      .lean();

    if (docs.length < limit) {
      const existingIds = docs.map((d) => String(d._id));
      const fallback = await Product.find({
        _id: { $nin: [excludeId, ...existingIds] },
        isActive: true,
        stock: { $gt: 0 },
      })
        .limit(limit - docs.length)
        .lean();
      docs = [...docs, ...fallback];
    }
  }

  return docs.map((r) => ({
    id: String(r._id),
    slug: r.slug as string | undefined,
    name: r.name as string,
    price: r.price as number,
    img: (r.images as string[])?.[0] ?? "",
    shape: first(r.shape as string | string[]),
    size: r.size as number,
    color: first(r.color as string | string[]),
    clarity: first(r.clarity as string | string[]),
    watchBrand: r.watchBrand as string | undefined,
    watchMovement: r.watchMovement as string | undefined,
    watchGender: r.watchGender as string | undefined,
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>; // ✅ Promise in Next.js 15+
}) {
  await connectDB();

  const { slug } = await params; // ✅ unwrap first

  const resolved = await getCachedProduct(slug);
  if (!resolved) notFound();

  // Old links/bookmarks still pointing at the raw Mongo _id: send them to
  // the canonical /products/<slug> URL instead of silently rendering the
  // page at the id-shaped URL (which would mean two different URLs serving
  // the same product — bad for SEO and for anyone re-sharing the link).
  if (resolved.resolvedBy === "id") {
    redirect(`/products/${(resolved.product as unknown as ProductDoc).slug}`);
  }

  const rawObj = resolved.product as unknown as ProductDoc;
  const p: ProductDoc = { ...rawObj, _id: String(rawObj._id) };
  const kind = getProductKind(p);
  const watch = kind === "watch";
  const gemstone = kind === "gemstone";

  const related = await getRelatedProducts(p, String(p._id), 6);

  // Best-effort — a review-aggregation hiccup shouldn't take down the whole
  // product page, it just means the JSON-LD omits aggregateRating.
  const ratingStats = await getRatingStats(String(p._id)).catch(() => null);

  const canonicalUrl = `${SITE_URL}/products/${p.slug}`;
  const kindLabelForLd =
    p.category?.name ??
    kindTitle(getProductKind(p));
  const ldImages = (p.images ?? []).filter(Boolean);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name: p.name,
    description:
      (p.description ? htmlToText(p.description) : "") ||
      `${p.name} — ${kindLabelForLd} at Alpha Gemstone.`,
    image: ldImages.length ? ldImages : undefined,
    sku: p.legacySku || String(p._id),
    category: kindLabelForLd,
    brand: { "@type": "Brand", name: "Alpha Gemstone" },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "USD",
      price: p.price,
      availability:
        (p.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Alpha Gemstone" },
    },
    ...(ratingStats && ratingStats.total > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingStats.average,
            reviewCount: ratingStats.total,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: p.category?.name ?? (watch ? "Watches" : "Diamonds"),
        item: `${SITE_URL}/products`,
      },
      ...(p.subcategory?.name
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: p.subcategory.name,
              item: `${SITE_URL}/products?subcategory=${p.subcategory.slug ?? ""}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: p.subcategory?.name ? 4 : 3,
        name: p.name,
        item: canonicalUrl,
      },
    ],
  };

  // Dynamic, per-kind spec sheet — see buildSpecs() above. Diamonds get
  // diamond fields (polish/cut/color/clarity/depth/...), gemstones get
  // gemstone fields (origin/luster/hardness/grade/...), watches get watch
  // fields, and every row is omitted when the underlying value is empty.
  const specs = buildSpecs(p, kind);

  const certBadge = certDisplay(p.certification);
  const showCertBadge = !watch && certBadge !== "—";

  const heroSubtitle = watch
    ? [p.watchGender, p.watchStyle, p.watchMovement].filter(Boolean).join(" · ")
    : [
        p.colorRaw || display(p.color)
          ? `${p.colorRaw || display(p.color)} Color`
          : "",
        p.clarityRaw || display(p.clarity)
          ? `${p.clarityRaw || display(p.clarity)} Clarity`
          : "",
        p.size ? `${p.size} ct` : "",
      ]
        .filter(Boolean)
        .join(" · ");

  const typeLabel = watch
    ? "Luxury Watch"
    : gemstone
      ? p.gemstoneName || p.category?.name || "Fine Gemstone"
      : kind === "diamond"
        ? "Fine Diamond"
        : p.category?.name || "Fine Jewelry";

  // Market Retail Price / Savings — only shown when msrp is actually set on
  // the product and is genuinely higher than the selling price, so nothing
  // here is a fabricated comparison.
  const hasMsrpSavings =
    typeof p.msrp === "number" && p.msrp > p.price;
  const savingsAmount = hasMsrpSavings ? (p.msrp as number) - p.price : 0;
  const savingsPct = hasMsrpSavings
    ? Math.round((savingsAmount / (p.msrp as number)) * 100)
    : 0;

  const money = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const sku = p.legacySku || String(p._id).slice(-10).toUpperCase();
  const shareUrl = encodeURIComponent(canonicalUrl);
  const shareText = encodeURIComponent(p.name);
  const mailto = (subject: string, body: string) =>
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const tellFriend = `mailto:?subject=${encodeURIComponent(`Take a look at this: ${p.name}`)}&body=${encodeURIComponent(
    `I found this at Alpha Imports and thought you would like it:\n\n${p.name}\n${canonicalUrl}`,
  )}`;
  const descriptionHtml = p.description && looksLikeHtml(p.description) ? sanitizeHtml(p.description) : null;
  const fallbackDesc = `Buy ${typeLabel.toLowerCase()} at wholesale price.${heroSubtitle ? ` ${heroSubtitle}.` : ""}`;
  const rating = ratingStats && ratingStats.total > 0 ? ratingStats : null;

  const compareProduct = {
    _id: String(p._id),
    name: p.name,
    price: p.price,
    productKind: kind,
    shape: p.shape,
    size: p.size,
    color: p.color,
    clarity: p.clarity,
    certification: p.certification,
    gemstoneName: p.gemstoneName,
    watchBrand: p.watchBrand,
    watchModel: p.watchModel,
    watchGender: p.watchGender,
    watchMovement: p.watchMovement,
    watchStrapType: p.watchStrapType,
    watchCaseMaterial: p.watchCaseMaterial,
    watchDialColor: p.watchDialColor,
    watchStyle: p.watchStyle,
    watchCaseSize: p.watchCaseSize,
    watchFeatures: p.watchFeatures,
    images: p.images,
    stock: p.stock,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <RecordRecentlyViewed productId={String(p._id)} inStock={p.stock > 0} />

      <style>{CLASSIC_PRODUCT_CSS}</style>
      {/* Quick View modal styles for the Recently Viewed cards */}
      <ProductCardStyles />

      <div className="pdc">
        <ClassicSidebar activeCategorySlug={p.category?.slug} activeSubSlug={p.subcategory?.slug} />

        <div className="pdc-main">
          <div className="pdc-frame">
            {/* ── Photo column ── */}
            <div className="pdc-col-media">
              <ClassicGallery
                images={p.images ?? []}
                name={p.name}
                certLabel={showCertBadge ? certBadge : undefined}
                soldOut={p.stock <= 0}
              />

              <h2 className="pdc-head">Notification</h2>
              <div className="pdc-panel pdc-notify">
                <div className="pdc-share">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer">
                    <span className="pdc-share-plus" aria-hidden="true">+</span>SHARE
                  </a>
                  <span className="pdc-share-icons">
                    <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">X</a>
                    <a href={`https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareText}`} target="_blank" rel="noopener noreferrer" aria-label="Pin on Pinterest">P</a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">f</a>
                  </span>
                  <span className="pdc-muted">Social bookmarks.</span>
                </div>
                <a
                  className="pdc-notify-row"
                  href={mailto(`Notify me: ${p.name}`, `Please notify me of updates to:\n${p.name} [${sku}]\n${canonicalUrl}\n`)}
                >
                  <span className="pdc-ico" aria-hidden="true">✉</span>
                  <span>
                    Notify me of updates to <b>{p.name}</b>
                  </span>
                </a>
                <a
                  className="pdc-notify-row"
                  href={mailto(`Question: ${p.name}`, `I have a question about:\n${p.name} [${sku}]\n${canonicalUrl}\n\n`)}
                >
                  <span className="pdc-ico" aria-hidden="true">?</span>
                  <span>Ask a question about this product...</span>
                </a>
                <div className="pdc-notify-row">
                  <PrintButton>
                    Printer Friendly Page <span aria-hidden="true">🖶</span>
                  </PrintButton>
                </div>
              </div>

              <h2 className="pdc-head">Learning Center</h2>
              <ul className="pdc-panel pdc-learn">
                {LEARNING_CENTER_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} prefetch={false}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <h2 className="pdc-head">Complimentary with Purchase</h2>
              <ul className="pdc-panel pdc-comp">
                {COMPLIMENTARY.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            {/* ── Info column ── */}
            <div className="pdc-col-info">
              <h1 className="pdc-title">{p.name}</h1>
              <div className="pdc-sku">[{sku}]</div>

              {descriptionHtml ? (
                <div className="pdc-desc" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
              ) : (
                <p className="pdc-desc">{p.description?.trim() || fallbackDesc}</p>
              )}

              <table className="pdc-prices">
                <tbody>
                  {hasMsrpSavings && (
                    <tr>
                      <th>Market Retail Price:</th>
                      <td>{money(p.msrp as number)}</td>
                    </tr>
                  )}
                  <tr className="pdc-alpha">
                    <th>Alpha Price:</th>
                    <td>{money(p.price)}</td>
                  </tr>
                  {hasMsrpSavings && (
                    <tr>
                      <th>Your Savings:</th>
                      <td>
                        {money(savingsAmount)} ({savingsPct}% )
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {p.stock > 0 && p.stock <= 3 && <div className="pdc-stock">Only {p.stock} left in stock</div>}
              {p.stock <= 0 && <div className="pdc-stock out">Currently unavailable</div>}

              <ClassicBuyBox
                productId={String(p._id)}
                productName={p.name}
                productUrl={canonicalUrl}
                stock={p.stock}
                minOrder={p.minOrder}
                maxOrder={p.maxOrder}
                qtyBlocks={p.qtyBlocks}
                makeAnOffer={p.makeAnOffer}
                compareProduct={compareProduct}
                offerEmail={CONTACT_EMAIL}
              />

              <a className="pdc-tell" href={tellFriend}>
                <span aria-hidden="true">✉</span> Tell Your Friend About This Product
              </a>

              <h2 className="pdc-head">Product Details</h2>
              <div className="pdc-panel">
                <table className="pdc-specs">
                  <tbody>
                    {specs.map(({ label, value, highlight }, i) => (
                      <tr key={`${label}-${i}`}>
                        <th>{label.toUpperCase()}:</th>
                        <td className={highlight ? "hl" : undefined}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rating && (
                  <a className="pdc-rating" href="#reviews">
                    Customer Rating:{" "}
                    <span className="pdc-stars" aria-label={`${rating.average} out of 5`}>
                      {"★★★★★".slice(0, Math.round(rating.average))}
                      <span>{"★★★★★".slice(Math.round(rating.average))}</span>
                    </span>{" "}
                    ({rating.total} review{rating.total === 1 ? "" : "s"})
                  </a>
                )}
              </div>

              <h2 className="pdc-head" id="reviews">
                Product Reviews
              </h2>
              <div className="pdc-panel pdc-reviews">
                <ProductReviews productId={String(p._id)} />
              </div>
            </div>

            {/* ── Related items ── */}
            <aside className="pdc-col-related" aria-label="Related items">
              <div className="pdc-related-head">Related Items.</div>
              <div className="pdc-related">
                {related.length === 0 && <p className="pdc-muted">No related products found</p>}
                {related.map((item) => (
                  <Link key={item.id} href={`/products/${item.slug ?? item.id}`} className="pdc-rel" prefetch={false}>
                    <span className="pdc-rel-img">
                      {item.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={optimizedImageUrl(item.img, { width: 200, quality: 85 })}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span aria-hidden="true">◇</span>
                      )}
                    </span>
                    <span className="pdc-rel-name">{item.name}</span>
                    <span className="pdc-rel-price">{money(item.price)}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>

          <ClassicRecentlyViewed excludeId={String(p._id)} />
        </div>
      </div>
    </>
  );
}

// ─── Static content ───────────────────────────────────────────────────────────
const CONTACT_EMAIL = "info@alphaimports.com";

const LEARNING_CENTER_LINKS = [
  { label: "Shipping and returns", href: "/shipping-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "SSL Certificate", href: "/terms-and-conditions" },
  { label: "Customer Support", href: "/customer-service" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Rings Sizes", href: "/learning-center" },
];

const COMPLIMENTARY = ["30-day Returns", "Free Insured Shipping", "Complimentary Gift", "SSL Secured Checkout"];

// ─── Styles ───────────────────────────────────────────────────────────────────
const CLASSIC_PRODUCT_CSS = `
  .pdc {
    --navy: #003366; --frame: #99aece; --soft: #a6aec5; --bar: #dfe2ea;
    --lg-border: #c9cedc; --lg-border-soft: #e3e6ee; --lg-muted: #7f7f7f; --lg-blue-deep: #003366;
    --lg-panel-alt: #eef0f5; --lg-red: #cc0000;
    font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 11px; color: #000; background: #fff;
    display: grid; grid-template-columns: 175px minmax(0, 1fr); gap: 10px; padding: 6px 24px 30px; align-items: start;
  }
  .pdc a { text-decoration: none; }
  .pdc-main { min-width: 0; }
  .pdc-frame {
    border: 1px solid var(--frame); padding: 8px; display: grid; gap: 10px; align-items: start;
    grid-template-columns: minmax(220px, 38%) minmax(0, 1fr) 120px;
  }
  .pdc-muted { color: var(--lg-muted); }

  /* Panel header bars (Notification, Learning Center, Product Details, ...) */
  .pdc-head {
    margin: 14px 0 0; padding: 4px 16px 5px; color: #fff; font: bold 11px Verdana, Geneva, sans-serif;
    font-variant: small-caps; letter-spacing: .3px; display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(to bottom, #7d90c5 0, #bec9e4 2px, #a9b4d3 100%);
  }
  .pdc-head button { background: none; border: 0; color: #fff; cursor: pointer; font: 10px Verdana, sans-serif; font-variant: normal; text-decoration: underline; }
  .pdc-panel { border: 1px solid var(--soft); border-top: 0; margin: 0; padding: 0; list-style: none; }

  /* Gallery */
  .pdc-gallery { text-align: center; }
  .pdc-main-img {
    position: relative; width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
    background: #fff; border: 0; padding: 0; cursor: zoom-in;
  }
  .pdc-main-img:disabled { cursor: default; }
  .pdc-main-img img { width: 88%; height: 88%; object-fit: contain; }
  .pdc-noimg { color: var(--lg-muted); }
  .pdc-cert { position: absolute; top: 6px; left: 6px; background: #dfe2ea; border: 1px solid var(--soft); color: var(--navy); font-weight: bold; font-size: 9px; padding: 2px 6px; }
  .pdc-soldout { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #fff; border: 1px solid #990000; color: #990000; font-weight: bold; padding: 4px 12px; }
  .pdc-thumbs { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin: 8px 0 4px; }
  .pdc-thumbs button { width: 70px; height: 50px; padding: 2px; background: #fff; border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .pdc-thumbs button.is-active { border-color: var(--soft); }
  .pdc-thumbs img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .pdc-enlarge { background: none; border: 0; cursor: pointer; color: #333; font: 10px Verdana, sans-serif; margin: 6px 0 0; }
  .pdc-enlarge span { font-size: 13px; color: #666; }
  .pdc-enlarge:hover { text-decoration: underline; }
  .pdc-zoom { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .pdc-zoom-box { background: #fff; border: 2px solid var(--navy); max-width: min(900px, 96vw); max-height: 94vh; display: flex; flex-direction: column; }
  .pdc-zoom-head { display: flex; justify-content: space-between; gap: 12px; padding: 4px 8px; background: var(--navy); color: #fff; font: bold 11px Verdana, sans-serif; }
  .pdc-zoom-head button { background: none; border: 0; color: #fff; cursor: pointer; font: bold 11px Verdana, sans-serif; }
  .pdc-zoom-box img { max-width: 100%; max-height: calc(94vh - 60px); object-fit: contain; margin: auto; padding: 10px; }
  .pdc-zoom-nav { display: flex; justify-content: space-between; align-items: center; padding: 4px 10px 8px; font-size: 11px; }
  .pdc-zoom-nav button { background: none; border: 0; color: #0000ee; text-decoration: underline; cursor: pointer; font: 11px Verdana, sans-serif; }

  /* Notification panel */
  .pdc-notify { padding: 6px 4px 8px; }
  .pdc-share { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 2px 2px 8px; }
  .pdc-share > a:first-child { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #999; padding: 0 6px; height: 16px; font: bold 9px Verdana, sans-serif; letter-spacing: 1px; color: #333; }
  .pdc-share-plus { background: #f60; color: #fff; width: 10px; height: 10px; line-height: 10px; text-align: center; font-size: 10px; }
  .pdc-share-icons { display: inline-flex; gap: 2px; }
  .pdc-share-icons a { width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; font: bold 10px Arial, sans-serif; color: #fff; background: #3b5998; }
  .pdc-share-icons a:first-child { background: #000; }
  .pdc-share-icons a:nth-child(2) { background: #bd081c; }
  .pdc-notify-row { display: flex; align-items: center; gap: 8px; padding: 5px 2px; color: #555; font-size: 10px; line-height: 13px; }
  a.pdc-notify-row:hover span:last-child { text-decoration: underline; color: var(--navy); }
  .pdc-ico { width: 24px; height: 24px; border-radius: 50%; border: 1px solid #bbb; background: #eee; display: inline-flex; align-items: center; justify-content: center; color: #777; font-size: 12px; flex-shrink: 0; }
  .pdc-linkbtn { background: none; border: 0; padding: 4px 0; cursor: pointer; color: #333; font: 11px Verdana, sans-serif; display: inline-flex; gap: 8px; }
  .pdc-linkbtn:hover { text-decoration: underline; }

  .pdc-learn li a { display: block; padding: 1px 2px; color: #333; font-size: 11px; }
  .pdc-learn li:nth-child(even) a { background: #f0f0f0; }
  .pdc-learn li a:hover { color: var(--navy); text-decoration: underline; }
  .pdc-learn { border: 0; }
  .pdc-comp { border: 0; padding: 10px 0 0 34px; list-style: disc; }
  .pdc-comp li { color: #990000; font-weight: bold; font-size: 10px; line-height: 16px; }

  /* Info column */
  .pdc-title { margin: 0; text-align: center; color: var(--soft); font: bold 16px/19px Verdana, Geneva, sans-serif; }
  .pdc-sku { text-align: center; color: #888; font-size: 10px; margin: 1px 0 14px; }
  .pdc-desc { color: #878790; font-size: 11px; line-height: 16px; margin: 0 0 14px; }
  .pdc-desc p { margin: 0 0 8px; }
  .pdc-prices { width: 100%; border-collapse: collapse; margin-bottom: 26px; }
  .pdc-prices th { text-align: left; font-weight: bold; color: #000; font-size: 11px; padding: 0; }
  .pdc-prices td { text-align: right; font-weight: bold; color: #000; font-size: 11px; padding: 0; }
  .pdc-prices .pdc-alpha th, .pdc-prices .pdc-alpha td { color: var(--lg-red); }
  .pdc-stock { font-size: 10px; font-weight: bold; color: #c75000; margin: 10px 0 0; }
  .pdc-stock.out { color: #990000; }

  .pdc-buy { margin-bottom: 12px; }
  .pdc-minqty { color: var(--lg-muted); font-size: 10px; font-weight: bold; margin-bottom: 8px; }
  .pdc-minqty span { font-weight: normal; }
  .pdc-qty { display: inline-flex; align-items: center; gap: 2px; color: var(--lg-muted); font-size: 10px; margin-bottom: 6px; }
  .pdc-qty input { width: 36px; height: 16px; border: 1px solid #333; font: 11px Verdana, sans-serif; padding: 0 2px; border-radius: 0; }
  .pdc-btnbox {
    display: grid; grid-template-columns: 1fr 1fr; gap: 4px 30px; padding: 6px 16px 8px;
    background: var(--bar); border: 1px solid var(--soft);
  }
  .pdc-btnbox > button, .pdc-btnbox > a, .pdc-btnbox .pdc-compare {
    display: flex; align-items: center; justify-content: center; text-align: center; min-height: 16px;
    background: #ccd6e3; border: 1px solid #7f8aa8; color: #333; cursor: pointer;
    font: 10px Verdana, Geneva, sans-serif; padding: 1px 6px; width: 100%; box-sizing: border-box;
  }
  .pdc-btnbox > button:hover:not(:disabled), .pdc-btnbox > a:hover, .pdc-btnbox .pdc-compare:hover { background: #b8c5d8; color: #000; }
  .pdc-btnbox > button:disabled { opacity: .6; cursor: default; }
  .pdc-btnbox > button[aria-pressed="true"] { color: #cc3333; }
  .pdc-btnbox .pdc-offer { font-family: "Times New Roman", serif; font-size: 11px; }
  .pdc-btnbox .pdc-wide { grid-column: 1 / -1; }
  .pdc-added { font-size: 10px; color: #1a7f1a; margin: 6px 0 0; }
  .pdc-added a { color: #0000ee; text-decoration: underline; }
  .pdc-tell { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 14px 0 6px; color: #000; font-size: 10px; }
  .pdc-tell span { color: #555; font-size: 14px; }
  .pdc-tell:hover { text-decoration: underline; color: var(--navy); }

  .pdc-specs { width: 100%; border-collapse: collapse; margin: 4px 0; }
  .pdc-specs th { text-align: left; font-weight: bold; color: #333; font-size: 10px; padding: 3px 4px; width: 48%; vertical-align: top; }
  .pdc-specs td { color: #777; font-size: 10px; padding: 3px 4px; vertical-align: top; }
  .pdc-specs td.hl { color: #1a7f1a; font-weight: bold; }
  .pdc-rating { display: block; text-align: center; color: #555; font-size: 10px; padding: 8px 4px; }
  .pdc-stars { color: #b30000; font-size: 14px; letter-spacing: 1px; }
  .pdc-stars span { color: #ccc; }

  /* Reviews (ProductReviews component) in the classic palette */
  .pdc-reviews { background: var(--bar); padding: 6px 4px 8px; font-size: 10px; }
  .pdc-reviews .pd-reviews-empty { padding: 4px; font-size: 10px; color: #555; }
  .pdc-reviews .pd-btn-line {
    background: #ccd6e3; border: 1px solid #7f8aa8; color: #333; cursor: pointer;
    font: 10px Verdana, Geneva, sans-serif; padding: 1px 12px; margin: 6px 4px;
  }
  .pdc-reviews .pd-btn-line:hover { background: #b8c5d8; }
  .pdc .pdr-star-btn { background: none; border: none; padding: 2px; cursor: pointer; line-height: 0; }
  .pdc .pdr-stars-row { display: inline-flex; gap: 2px; align-items: center; }
  .pdc .pdr-summary { display: flex; gap: 16px; padding: 8px 4px; flex-wrap: wrap; border-bottom: 1px solid var(--lg-border); }
  .pdc .pdr-summary-score { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 70px; }
  .pdc .pdr-summary-num { font-size: 22px; font-weight: bold; color: var(--navy); }
  .pdc .pdr-summary-count { font-size: 10px; color: var(--lg-muted); }
  .pdc .pdr-summary-bars { flex: 1; min-width: 140px; display: flex; flex-direction: column; gap: 2px; }
  .pdc .pdr-bar-row { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--lg-muted); }
  .pdc .pdr-bar-label { width: 26px; }
  .pdc .pdr-bar-track { flex: 1; height: 6px; background: #fff; border: 1px solid var(--lg-border); }
  .pdc .pdr-bar-fill { display: block; height: 100%; background: var(--navy); }
  .pdc .pdr-bar-count { width: 20px; text-align: right; }
  .pdc .pdr-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 4px; flex-wrap: wrap; }
  .pdc .pdr-sort { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--lg-muted); }
  .pdc .pdr-sort select { font: 10px Verdana, sans-serif; border: 1px solid #333; border-radius: 0; }
  .pdc .pdr-form { border: 1px solid var(--soft); background: #fff; padding: 8px; margin: 4px; display: flex; flex-direction: column; gap: 8px; }
  .pdc .pdr-form-field { display: flex; flex-direction: column; gap: 3px; }
  .pdc .pdr-form-field label { font-size: 10px; font-weight: bold; color: #333; }
  .pdc .pdr-form-field input, .pdc .pdr-form-field textarea { font: 11px Verdana, sans-serif; padding: 3px 5px; border: 1px solid #7a7a7a; border-radius: 0; resize: vertical; }
  .pdc .pdr-form-error { font-size: 10px; color: #b91c1c; }
  .pdc .pdr-form-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .pdc .pdr-cancel-link, .pdc .pdr-delete-link { background: none; border: none; font-size: 10px; color: #555; cursor: pointer; text-decoration: underline; padding: 0; }
  .pdc .pdr-delete-link { color: #b91c1c; }
  .pdc .pdr-list { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--lg-border); margin: 4px; }
  .pdc .pdr-item { padding: 8px; border-bottom: 1px solid var(--lg-border-soft); }
  .pdc .pdr-item:last-child { border-bottom: none; }
  .pdc .pdr-item-head { display: flex; justify-content: space-between; gap: 8px; }
  .pdc .pdr-item-title { font-size: 11px; font-weight: bold; color: #000; margin-top: 2px; }
  .pdc .pdr-item-date { font-size: 9px; color: var(--lg-muted); white-space: nowrap; }
  .pdc .pdr-item-author { font-size: 10px; font-weight: bold; color: var(--navy); margin-top: 3px; display: flex; gap: 6px; align-items: center; }
  .pdc .pdr-verified { font-size: 9px; color: #1a7f1a; border: 1px solid #1a7f1a; padding: 0 4px; }
  .pdc .pdr-item-comment { font-size: 10px; line-height: 14px; color: #555; margin: 4px 0 0; }
  .pdc .pdr-item-actions { display: flex; gap: 8px; margin-top: 6px; }
  .pdc .pdr-like-btn { display: inline-flex; align-items: center; gap: 4px; background: #fff; border: 1px solid #bbb; padding: 1px 8px; font: 10px Verdana, sans-serif; color: #555; cursor: pointer; }
  .pdc .pdr-like-btn.liked { color: #cc3333; border-color: #cc3333; }
  .pdc .pdr-reply { margin: 6px 0 0 12px; padding: 6px 8px; border-left: 3px solid var(--navy); background: var(--bar); }
  .pdc .pdr-reply-head { font-size: 9px; font-weight: bold; color: var(--navy); text-transform: uppercase; }
  .pdc .pdr-reply-text { font-size: 10px; color: #333; margin: 3px 0; }
  .pdc .pdr-reply-date { font-size: 9px; color: var(--lg-muted); }
  .pdc .pdr-admin-reply-box { margin: 6px 0 0 12px; display: flex; flex-direction: column; gap: 4px; max-width: 420px; }
  .pdc .pdr-admin-reply-box textarea { font: 10px Verdana, sans-serif; padding: 4px; border: 1px dashed #999; }
  .pdc .pdr-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 6px 4px 0; font-size: 10px; color: var(--lg-muted); }
  .pdc .pdr-pagination button { background: #ccd6e3; border: 1px solid #7f8aa8; padding: 1px 10px; font: 10px Verdana, sans-serif; cursor: pointer; }
  .pdc .pdr-pagination button:disabled { opacity: .4; cursor: default; }

  /* Related items */
  .pdc-related-head { text-align: right; color: #333; font-size: 10px; padding: 0 2px 2px; }
  .pdc-related { border: 1px solid var(--soft); padding: 6px 4px; display: flex; flex-direction: column; gap: 14px; }
  .pdc-rel { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .pdc-rel-img { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; color: #ccc; }
  .pdc-rel-img img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .pdc-rel-name { color: #555; font-size: 10px; line-height: 13px; }
  .pdc-rel:hover .pdc-rel-name { color: var(--navy); text-decoration: underline; }
  .pdc-rel-price { color: #555; font-size: 10px; }

  /* Recently viewed */
  .pdc-recent { margin-top: 16px; border: 1px solid var(--soft); }
  .pdc-recent .pdc-head { margin: 0; }
  .pdc-recent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px 6px; padding: 12px 6px; }
  .pdc-recent .cpc { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0; }
  .pdc-recent .cpc-img { display: flex; align-items: center; justify-content: center; width: 100%; max-width: 110px; aspect-ratio: 1; margin-bottom: 4px; }
  .pdc-recent .cpc-img img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .pdc-recent .cpc-name, .pdc-recent .cpc-price { color: #7f7f7f; font-size: 10px; line-height: 13px; }
  .pdc-recent .cpc-price s { color: #990000; margin-right: 4px; }
  .pdc-recent .cpc-price em { display: none; }

  @media (max-width: 1100px) {
    .pdc-frame { grid-template-columns: minmax(200px, 42%) minmax(0, 1fr); }
    .pdc-col-related { grid-column: 1 / -1; }
    .pdc-related { flex-direction: row; overflow-x: auto; }
    .pdc-rel { flex: 0 0 120px; }
    .pdc-related-head { text-align: left; }
  }
  @media (max-width: 760px) {
    .pdc { grid-template-columns: minmax(0, 1fr); padding: 6px 8px 20px; }
    .pdc-frame { grid-template-columns: minmax(0, 1fr); padding: 6px; }
    /* Photo first, then price / buy box, then the Notification etc. panels */
    .pdc-col-media { display: contents; }
    .pdc-gallery { order: 1; }
    .pdc-col-info { order: 2; }
    .pdc-col-media > :not(.pdc-gallery) { order: 3; }
    .pdc-col-related { order: 4; }
    .pdc-title { font-size: 18px; line-height: 22px; }
    .pdc-desc, .pdc-specs th, .pdc-specs td, .pdc-prices th, .pdc-prices td { font-size: 13px; line-height: 18px; }
    .pdc-qty input { height: 30px; width: 60px; font-size: 16px; }
    .pdc-btnbox { gap: 8px; padding: 10px; }
    .pdc-btnbox > button, .pdc-btnbox > a, .pdc-btnbox .pdc-compare { min-height: 36px; font-size: 13px; }
  }

  @media print {
    .pdc > :first-child, .pdc-col-related, .pdc-recent, .pdc-notify, .pdc-learn, .pdc-comp,
    .pdc-head:not(:has(+ .pdc-panel table)), .pdc-btnbox, .pdc-tell, .pdc-qty, .pdc-reviews, #reviews,
    header, nav, footer { display: none !important; }
    .pdc { display: block; padding: 0; }
    .pdc-frame { border: 0; grid-template-columns: 45% 1fr; }
  }
`;