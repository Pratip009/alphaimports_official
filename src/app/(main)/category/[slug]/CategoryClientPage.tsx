"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NavCategory } from "@/lib/getNavCategories";

interface ISubcategory {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
  // Whether this subcategory has its own child sub-subcategories (e.g.
  // Tanzanite → Oval/Trillion/Calibrated…). When true, clicking the card
  // opens the intermediate sub-subcategory grid instead of going straight
  // to the product listing.
  hasChildren?: boolean;
  category: { _id: string; name: string; slug: string };
}

interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
}

// ─── Strip HTML tags & decode entities ───────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Subcategory Tile (classic catalogue style: square image + caption) ─────
function SubcategoryCard({
  sub,
  onSelect,
}: {
  sub: ISubcategory;
  onSelect: (sub: ISubcategory) => void;
  index: number;
}) {
  const fallback =
    "https://images.pexels.com/photos/1458867/pexels-photo-1458867.jpeg?auto=compress&cs=tinysrgb&w=400";

  return (
    <div
      className="cat-tile"
      role="link"
      tabIndex={0}
      onClick={() => onSelect(sub)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect(sub);
      }}
    >
      <div className="cat-tile-img">
        <img src={sub.imageUrl ?? fallback} alt={sub.name} loading="lazy" />
      </div>
      <span className="cat-tile-name">{sub.name}</span>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export default function CategoryClientPage({
  category,
  subcategories,
  // When rendering the intermediate "sub-subcategory" grid (e.g. Tanzanite
  // → Oval Tanzanite / Trillion Tanzanite / …), `mode` is 'subsubcategory'
  // and `parentSubcategorySlug` carries the subcategory these entries sit
  // under — needed to build the final /products URL. In the normal
  // Category → Subcategory grid, both are omitted.
  mode = "subcategory",
  parentSubcategorySlug,
  // Optional, display-only: the full category tree for the left sidebar.
  // When omitted the sidebar just lists the current page's entries.
  navCategories = [],
}: {
  category: ICategory;
  subcategories: ISubcategory[];
  mode?: "subcategory" | "subsubcategory";
  parentSubcategorySlug?: string;
  navCategories?: NavCategory[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = subcategories.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const cleanDescription = category.description
    ? stripHtml(category.description)
    : null;

  const descParagraphs = cleanDescription
    ? cleanDescription.split(/\n\n+/).filter((p) => p.trim().length > 0)
    : [];

  const collectionNoun = mode === "subsubcategory" ? "Type" : "Collection";
  const collectionNounPlural = mode === "subsubcategory" ? "Types" : "Collections";

  function handleSelectSub(sub: ISubcategory) {
    if (mode === "subsubcategory") {
      // Leaf level — always goes straight to the filtered product listing.
      router.push(
        `/products?category=${sub.category.slug}&subcategory=${parentSubcategorySlug}&subSubcategory=${sub.slug}`
      );
      return;
    }
    if (sub.hasChildren) {
      // e.g. Tanzanite → Oval Tanzanite / Trillion Tanzanite / … — show the
      // intermediate grid instead of jumping straight to products.
      router.push(`/category/${sub.category.slug}/${sub.slug}`);
      return;
    }
    router.push(
      `/products?category=${sub.category.slug}&subcategory=${sub.slug}`
    );
  }

  // Sidebar: every category from the nav tree, with the current one expanded
  // to show this page's entries. Falls back to just the current page.
  const sidebarCategories =
    navCategories.length > 0
      ? navCategories
      : [{ _id: category._id, name: category.name, slug: category.slug, subcategories: [] }];

  const infoLinks: { label: string; href: string }[] = [
    { label: "FAQ", href: "/faq" },
    { label: "Help Center", href: "/help-center" },
    { label: "Customer Service", href: "/customer-service" },
    { label: "Return Policy", href: "/return-policy" },
    { label: "Learning Center", href: "/learning-center" },
    { label: "Expert Advice", href: "/expert-advice" },
    { label: "Quality Score Chart", href: "/quality-score-chart" },
    { label: "Certificates & Appraisal", href: "/certificates-appraisal" },
    { label: "E-Catalog", href: "/e-catalog" },
    { label: "Ask for a Catalog", href: "/ask-for-catalog" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      <style>{`
        .cat-page-root {
          --cp-blue: #1c4874;
          --cp-blue-dk: #0d3b6c;
          --cp-title: #4f72a8;
          --cp-title-soft: #8ea2c6;
          --cp-bar: #c9cfdf;
          --cp-sub-bg: #ededed;
          --cp-text: #7a7a7a;
          --cp-link: #555;
          font-family: Arial, Helvetica, sans-serif;
          background: #fff;
          color: #333;
          width: 100%;
          min-height: 60vh;
        }
        .cat-page-root *, .cat-page-root *::before, .cat-page-root *::after { box-sizing: border-box; }

        .cat-layout {
          display: grid;
          grid-template-columns: 200px minmax(0, 1fr);
          gap: 6px;
          padding: 6px 24px 40px;
          align-items: start;
        }

        /* ── Left sidebar ── */
        .cat-side { font-size: 11px; }
        .cat-side-box { margin-bottom: 14px; }
        .cat-side-head {
          background: linear-gradient(to bottom, #164472 0px, var(--cp-blue-dk) 3px, #2b547e 100%);
          color: #fff;
          font-weight: bold;
          font-size: 11px;
          padding: 4px 8px 4px 10px;
          border-bottom: 2px solid #fff;
        }
        .cat-side-head span { text-decoration: underline; }
        .cat-side-cats { background: var(--cp-bar); list-style: none; margin: 0; padding: 0; }
        .cat-side-cat > a {
          display: block;
          padding: 5px 8px;
          font-weight: bold;
          color: #1b2a4a;
          text-decoration: none;
        }
        .cat-side-cat > a:hover { text-decoration: underline; }
        .cat-side-cat.is-current > a { color: #000; }
        .cat-side-subs {
          list-style: none;
          margin: 0;
          padding: 3px 0 5px;
          background: var(--cp-sub-bg);
        }
        .cat-side-subs button, .cat-side-subs a {
          display: block;
          width: 100%;
          text-align: left;
          background: none;
          border: 0;
          padding: 1px 8px 1px 16px;
          font: inherit;
          font-size: 10.5px;
          line-height: 1.45;
          color: var(--cp-link);
          cursor: pointer;
          text-decoration: none;
        }
        .cat-side-subs button:hover, .cat-side-subs a:hover { color: var(--cp-blue); text-decoration: underline; }
        .cat-side-info { list-style: none; margin: 0; padding: 4px 0 6px; }
        .cat-side-info a {
          display: block;
          padding: 1px 4px;
          font-size: 10.5px;
          line-height: 1.5;
          color: var(--cp-link);
          text-decoration: none;
        }
        .cat-side-info a:hover { color: var(--cp-blue); text-decoration: underline; }

        .cat-promo {
          display: block;
          border: 1px solid #b9c2d6;
          margin: 0 0 8px;
          padding: 10px 8px;
          text-align: center;
          text-decoration: none;
          background: #fff;
          color: #333;
          font-size: 11px;
          line-height: 1.35;
        }
        .cat-promo:hover { border-color: var(--cp-blue); }
        .cat-promo strong { display: block; font-size: 15px; color: #c8102e; margin: 2px 0; }
        .cat-promo em { display: block; font-style: normal; font-weight: bold; color: var(--cp-blue); font-size: 13px; }
        .cat-promo.is-blue { background: var(--cp-blue); color: #fff; border-color: var(--cp-blue-dk); }
        .cat-promo.is-blue strong { color: #ffd84a; }

        /* ── Main column ── */
        .cat-main { padding: 0 4px 0 2px; min-width: 0; }
        .cat-title {
          font-size: 15px;
          font-weight: bold;
          color: var(--cp-title);
          margin: 2px 0 8px;
          line-height: 1.3;
        }
        .cat-desc { color: var(--cp-text); font-size: 11px; line-height: 1.6; }
        .cat-desc p { margin: 0 0 8px; }
        .cat-rule { border: 0; border-top: 2px solid #555; margin: 6px 0 6px; }

        .cat-strip {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .cat-strip-title { font-size: 14px; font-weight: bold; color: var(--cp-title-soft); }
        .cat-search {
          height: 20px;
          width: 170px;
          padding: 1px 5px;
          border: 1px solid #a7a7a7;
          font: inherit;
          font-size: 11px;
          color: #333;
          background: #fff;
          border-radius: 0;
        }
        .cat-search:focus { outline: 1px solid var(--cp-blue); border-color: var(--cp-blue); }
        .cat-count { font-size: 10.5px; color: #999; margin-right: auto; }

        /* Grid of tiles: 5 across on desktop */
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 22px 12px;
          max-width: 900px;
          margin: 0 auto;
        }
        .cat-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          text-align: center;
          outline: none;
        }
        .cat-tile-img {
          width: 100%;
          max-width: 140px;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          overflow: hidden;
        }
        .cat-tile-img img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .cat-tile-name {
          margin-top: 6px;
          font-size: 10.5px;
          color: #888;
          line-height: 1.3;
        }
        .cat-tile:hover .cat-tile-name,
        .cat-tile:focus-visible .cat-tile-name { color: var(--cp-blue); text-decoration: underline; }

        .cat-empty { text-align: center; padding: 40px 0; font-size: 12px; color: #888; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .cat-layout { grid-template-columns: 1fr; padding: 8px 14px 32px; }
          .cat-main { order: 1; }
          .cat-side { order: 2; }
          .cat-promos { display: none; }
        }
        @media (max-width: 1100px) and (min-width: 901px), (max-width: 760px) {
          .cat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @media (max-width: 620px) {
          .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 520px) {
          .cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cat-strip { justify-content: flex-start; }
          .cat-search { width: 100%; }
        }
      `}</style>

      <div className="cat-page-root">
        <div className="cat-layout">
          {/* ── Left sidebar ── */}
          <aside className="cat-side">
            <div className="cat-side-box">
              <div className="cat-side-head"><span>Categories</span></div>
              <ul className="cat-side-cats">
                {sidebarCategories.map((cat) => {
                  const isCurrent = cat.slug === category.slug;
                  return (
                    <li key={cat._id} className={`cat-side-cat${isCurrent ? " is-current" : ""}`}>
                      <Link href={`/category/${cat.slug}`} prefetch={false}>
                        {cat.name}
                      </Link>
                      {isCurrent && subcategories.length > 0 && (
                        <ul className="cat-side-subs">
                          {subcategories.map((sub) => (
                            <li key={sub._id}>
                              <button type="button" onClick={() => handleSelectSub(sub)}>
                                {sub.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="cat-side-box">
              <div className="cat-side-head"><span>Information</span></div>
              <ul className="cat-side-info">
                {infoLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} prefetch={false}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cat-promos">
              <Link href="/join-alpha-club" className="cat-promo is-blue" prefetch={false}>
                Join the
                <strong>Alpha Club</strong>
                Exclusive member pricing
              </Link>
              <Link href="/ask-for-catalog" className="cat-promo" prefetch={false}>
                Request our free
                <em>Alpha Catalog</em>
                delivered to your door
              </Link>
              <Link href="/drop-shipping" className="cat-promo" prefetch={false}>
                Sell without investing a cent with our
                <strong>Dropship Program</strong>
                No restocking fee!
              </Link>
              <Link href="/contact" className="cat-promo" prefetch={false}>
                We accept offers for
                <strong>Volume Purchase</strong>
                Make an offer now
              </Link>
            </div>
          </aside>

          {/* ── Main content ── */}
          <section className="cat-main">
            <h1 className="cat-title">{category.name}</h1>

            {descParagraphs.length > 0 && (
              <div className="cat-desc">
                {descParagraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            <hr className="cat-rule" />

            <div className="cat-strip">
              <span className="cat-count">
                {filtered.length} of {subcategories.length}{" "}
                {subcategories.length === 1
                  ? collectionNoun.toLowerCase()
                  : collectionNounPlural.toLowerCase()}
                {search && ` matching "${search}"`}
              </span>
              <input
                type="text"
                placeholder={`Search in ${category.name}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="cat-search"
                aria-label={`Search in ${category.name}`}
              />
              <span className="cat-strip-title">{category.name}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="cat-empty">
                No {collectionNounPlural.toLowerCase()} found. Try a different search term.
              </div>
            ) : (
              <div className="cat-grid">
                {filtered.map((sub, i) => (
                  <SubcategoryCard
                    key={sub._id}
                    sub={sub}
                    onSelect={handleSelectSub}
                    index={i}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}