"use client";
/**
 * Classic Alpha Imports left sidebar, shared by the home page, the
 * testimonials page and the product listing: Categories (from the DB),
 * latest Testimonial, Information links, and Additional Information promos.
 *
 * Also exports useClassicCategories(), so the home page's centre column can
 * reuse the same cached category data instead of fetching it twice.
 */
import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClassicPromos from "./ClassicPromos";
import { useLatestTestimonial, truncate } from "./useLatestTestimonial";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface ISubcategory {
  _id: string;
  name: string;
  slug: string;
  category: { _id: string; name: string; slug: string };
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  hasChildren?: boolean;
}

// ─── Config (edit here) ───────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Advanced Diamond Search", href: "/products/diamonds" },
  { label: "Advanced Precious gem Search", href: "/products/gemstones" },
];

const EXTRA_SIDEBAR_LINKS = [
  { label: "Alpha Collector's Gallery", href: "/alpha-bargains" },
  { label: "Vouchers", href: "/join-alpha-club" },
  { label: "Certificates", href: "/certificates-appraisal" },
];

const INFO_LINKS: { label: string; href: string; rss?: boolean }[] = [
  { label: "Help", href: "/help-center" },
  { label: "F.A.Q.", href: "/faq" },
  { label: "International Orders", href: "/shipping-policy" },
  { label: "Payment", href: "/terms-and-conditions" },
  { label: "Company Information", href: "/about" },
  { label: "Customer Support", href: "/customer-service" },
  { label: "Gift Voucher FAQ", href: "/faq" },
  { label: "Track a Return", href: "/where-is-my-order" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Catalog RSS", href: "/e-catalog", rss: true },
  { label: "All Products", href: "/products" },
  { label: "All Products by category", href: "/find-products" },
  { label: "All Products by occasion", href: "/find-products" },
  { label: "Our Blog", href: "/blogs" },
  { label: "Our Pictures", href: "/e-catalog" },
  { label: "Product Reviews", href: "/testimonials" },
  { label: "Contact Us", href: "/contact" },
];

const SIDEBAR_SUB_LIMIT = 4;
const TESTIMONIAL_PREVIEW_CHARS = 55;

// ─── Shared helpers / caches ──────────────────────────────────────────────────
export function subcategoryHref(catSlug: string, sub: ISubcategory) {
  return sub.hasChildren
    ? `/category/${catSlug}/${sub.slug}`
    : `/products?category=${catSlug}&subcategory=${sub.slug}`;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const isFresh = (t: number) => Date.now() - t < CACHE_TTL_MS;

let _catsCache: { categories: ICategory[]; subcategories: ISubcategory[]; fetchedAt: number } | null = null;
let _catsPromise: Promise<void> | null = null;

function loadCategories(): Promise<void> {
  if (_catsPromise) return _catsPromise;
  _catsPromise = fetch("/api/categories?withSubcategories=true")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((json) => {
      const enriched: Array<ICategory & { subcategories: ISubcategory[] }> = json.data ?? [];
      const active = enriched.filter((c) => c.isActive);
      _catsCache = {
        categories: active.map(({ subcategories: _, ...cat }) => cat as ICategory),
        subcategories: active.flatMap((c) => (c.subcategories ?? []).filter((s) => s.isActive)),
        fetchedAt: Date.now(),
      };
    })
    .finally(() => {
      _catsPromise = null;
    });
  return _catsPromise;
}

/** Cached categories + subcategories (5-minute cache, background revalidate). */
export function useClassicCategories() {
  const [categories, setCategories] = useState<ICategory[]>(() => _catsCache?.categories ?? []);
  const [subcategories, setSubcategories] = useState<ISubcategory[]>(() => _catsCache?.subcategories ?? []);
  const [loading, setLoading] = useState(() => !_catsCache);
  const [error, setError] = useState("");

  useEffect(() => {
    if (_catsCache && isFresh(_catsCache.fetchedAt)) return;
    let cancelled = false;
    loadCategories()
      .then(() => {
        if (cancelled || !_catsCache) return;
        setCategories(_catsCache.categories);
        setSubcategories(_catsCache.subcategories);
      })
      .catch(() => !cancelled && setError("Failed to load categories."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const subsByCat = useMemo(() => {
    const map: Record<string, ISubcategory[]> = {};
    for (const s of subcategories) (map[s.category._id.toString()] ??= []).push(s);
    return map;
  }, [subcategories]);

  return { categories, subcategories, subsByCat, loading, error };
}

// ─── Sidebar category group ───────────────────────────────────────────────────
function SidebarGroup({
  category,
  subcategories,
  onPrefetch,
  onNavigate,
  isActive = false,
  activeSubSlug,
}: {
  category: ICategory;
  subcategories: ISubcategory[];
  onPrefetch: (href: string) => void;
  onNavigate: (href: string) => void;
  /** The category currently being browsed: its full list is shown expanded. */
  isActive?: boolean;
  activeSubSlug?: string;
}) {
  const [showAll, setShowAll] = useState(isActive);
  const visible = showAll ? subcategories : subcategories.slice(0, SIDEBAR_SUB_LIMIT);
  const catHref = `/category/${category.slug}`;

  return (
    <div>
      <Link
        href={catHref}
        className={`csb-group-head${isActive ? " is-active" : ""}`}
        aria-current={isActive && !activeSubSlug ? "page" : undefined}
        prefetch={false}
        onMouseEnter={() => onPrefetch(catHref)}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(catHref);
        }}
      >
        {category.name}
      </Link>
      {subcategories.length > 0 && (
        <ul className="csb-group-subs">
          {visible.map((sub) => {
            const href = subcategoryHref(category.slug, sub);
            return (
              <li key={sub._id}>
                <Link
                  href={href}
                  prefetch={false}
                  className={sub.slug === activeSubSlug ? "is-active" : undefined}
                  aria-current={sub.slug === activeSubSlug ? "page" : undefined}
                  onMouseEnter={() => onPrefetch(href)}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(href);
                  }}
                >
                  {sub.name}
                </Link>
              </li>
            );
          })}
          {subcategories.length > SIDEBAR_SUB_LIMIT && (
            <li className="csb-more">
              <button type="button" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
                {showAll ? "Less..." : "More..."}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function ClassicSidebar({
  activeCategorySlug,
  activeSubSlug,
}: {
  /** Category being browsed (e.g. on the product listing): shown expanded. */
  activeCategorySlug?: string;
  /** Subcategory being browsed: shown in bold. */
  activeSubSlug?: string;
} = {}) {
  const router = useRouter();
  const { categories, subsByCat, loading, error } = useClassicCategories();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const testimonial = useLatestTestimonial();

  const prefetch = (href: string) => router.prefetch(href);
  const navigate = (href: string) => {
    setMobileOpen(false);
    startTransition(() => router.push(href));
  };

  const extraLinks = EXTRA_SIDEBAR_LINKS.filter(
    (l) => !categories.some((c) => c.name.toLowerCase() === l.label.toLowerCase()),
  );

  const preview = testimonial ? truncate(testimonial.comment, TESTIMONIAL_PREVIEW_CHARS) : "";
  const testimonialHref = testimonial ? `/testimonials#t-${testimonial._id}` : "/testimonials";

  return (
    <>
      <style>{`
        .csb {
          --csb-bar1: #154273; --csb-bar2: #2f5681; --csb-cat: #c9cedc; --csb-side: #eeeeee;
          font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 11px; color: #000;
          display: flex; flex-direction: column; gap: 14px; min-width: 0;
        }
        .csb a { text-decoration: none; }
        .csb ul { list-style: none; margin: 0; padding: 0; }
        .csb-head {
          background: linear-gradient(to bottom, var(--csb-bar1), var(--csb-bar2));
          color: #fff; font-weight: bold; font-variant: small-caps; letter-spacing: .3px;
          font-size: 12px; padding: 2px 16px 3px; line-height: 14px;
        }
        .csb-cats { background: var(--csb-side); }
        .csb-quick { padding: 2px 0 4px; }
        .csb-quick a, .csb-group-subs a {
          display: block; padding: 0 0 0 14px; color: #958b82; font-size: 10px; line-height: 10px;
        }
        .csb-quick a:hover, .csb-group-subs a:hover { color: #003366; text-decoration: underline; }
        .csb-group-head {
          display: block; background: var(--csb-cat); color: #000; font-weight: bold;
          padding: 5px 8px; font-size: 11px; margin-top: 1px;
        }
        .csb-group-head:hover { text-decoration: underline; }
        .csb-group-subs a.is-active { color: #000; font-weight: bold; }
        .csb-group-subs { padding: 4px 0 !important; }
        .csb-more { text-align: right; padding-right: 26px; }
        .csb-more button {
          background: none; border: 0; cursor: pointer; padding: 0;
          font: bold 10px Verdana, Geneva, sans-serif; color: #7f7f7f;
        }
        .csb-more button:hover { color: #003366; text-decoration: underline; }
        .csb-skel { height: 22px; margin: 6px 8px; background: #dde1ea; }
        .csb-err { color: #b91c1c; padding: 6px 8px; }

        .csb-testi-body { padding: 6px 8px 8px; font-size: 10px; line-height: 13px; }
        .csb-testi-body a { display: block; color: #003366; }
        .csb-testi-body a:hover { text-decoration: underline; }
        .csb-testi-quote { color: #555 !important; font-style: italic; margin-bottom: 4px; }
        .csb-testi-more { text-align: right; margin-bottom: 8px; }
        .csb-testi-all { font-weight: bold; }

        .csb-info ul { padding: 4px 0 !important; }
        .csb-info a {
          display: inline-flex; align-items: center; gap: 4px;
          color: #a48390; font-size: 10px; line-height: 12.5px;
        }
        .csb-info a:hover { color: #003366; text-decoration: underline; }
        .csb-rss {
          display: inline-block; background: #ff6600; color: #fff; font-weight: bold;
          font-size: 9px; line-height: 11px; padding: 0 4px; border: 1px solid #cc5200;
        }

        .csb-mob-toggle { display: none; }
        @media (max-width: 760px) {
          .csb-mob-toggle {
            display: flex; justify-content: space-between; align-items: center; width: 100%;
            background: linear-gradient(to bottom, var(--csb-bar1), var(--csb-bar2)); color: #fff;
            border: 0; padding: 8px 12px; font: bold 12px Verdana, sans-serif; cursor: pointer;
          }
          .csb-cats-body { display: none; }
          .csb-cats-body.open { display: block; }
          .csb-cats .csb-head { display: none; }
          .csb-info, .csb-testi { display: none; }
          .csb-quick a, .csb-group-subs a { font-size: 13px; line-height: 24px; }
          .csb-group-head { font-size: 13px; padding: 8px; }
        }

        .csb-loading {
          position: fixed; inset: 0; z-index: 999; display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.45);
        }
        .csb-spinner {
          width: 38px; height: 38px; border-radius: 50%;
          border: 3px solid rgba(0,51,102,.15); border-top-color: #003366;
          animation: csbSpin .7s linear infinite;
        }
        @keyframes csbSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="csb">
        {/* Categories */}
        <nav className="csb-cats" aria-label="Categories">
          <button
            type="button"
            className="csb-mob-toggle"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span>Categories</span>
            <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
          </button>
          <div className="csb-head">Categories</div>
          <div className={`csb-cats-body${mobileOpen ? " open" : ""}`}>
            <div className="csb-quick">
              {QUICK_LINKS.map((l) => (
                <Link key={l.label} href={l.href} prefetch={false}>
                  {l.label}
                </Link>
              ))}
            </div>

            {error && <p className="csb-err">{error}</p>}

            {loading
              ? [1, 2, 3, 4, 5].map((i) => <div key={i} className="csb-skel" />)
              : categories.map((cat) => (
                  <SidebarGroup
                    key={cat._id}
                    category={cat}
                    subcategories={subsByCat[cat._id] ?? []}
                    onPrefetch={prefetch}
                    onNavigate={navigate}
                    isActive={cat.slug === activeCategorySlug}
                    activeSubSlug={cat.slug === activeCategorySlug ? activeSubSlug : undefined}
                  />
                ))}

            {extraLinks.map((l) => (
              <Link key={l.label} href={l.href} className="csb-group-head" prefetch={false}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Testimonials */}
        <section className="csb-testi" aria-label="Testimonials">
          <div className="csb-head">Testimonials</div>
          <div className="csb-testi-body">
            {testimonial && (
              <>
                <Link href={testimonialHref} className="csb-testi-quote" prefetch={false}>
                  {preview}
                </Link>
                <Link href={testimonialHref} className="csb-testi-more" prefetch={false}>
                  Read more...
                </Link>
              </>
            )}
            <Link href="/testimonials" className="csb-testi-all">
              View all testimonials...
            </Link>
          </div>
        </section>

        {/* Information */}
        <nav className="csb-info" aria-label="Information">
          <div className="csb-head">Information</div>
          <ul>
            {INFO_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} prefetch={false}>
                  {l.label}
                  {l.rss && <span className="csb-rss">RSS</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Additional Information (promo banners + badges) */}
        <ClassicPromos />
      </div>

      {isPending && (
        <div className="csb-loading" role="status" aria-live="polite">
          <div className="csb-spinner" />
        </div>
      )}
    </>
  );
}