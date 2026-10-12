"use client";
/**
 * Classic Alpha Imports header.
 *
 * Visual layout follows the original alphaimports.com header (logo, tagline +
 * phone, SKU/Text search, utility links, grey info links, blue category bar,
 * grey breadcrumb / account bar). All behaviour is carried over from the
 * Alpha Gemstone navbar: DB-driven categories + subcategories, auth/profile,
 * cart sidebar + count, wishlist, admin link, dropship link, analytics
 * tracking, --navbar-height for sticky filter bars, and the mobile menu.
 */
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, FormEvent } from "react";
import { useCart } from "@/hooks/useCart";
import CartSidebar from "./CartSidebar";
import { useWishlist } from "@/hooks/useWishlist";
import { trackCTA, trackEvent } from "@/lib/analytics";

// ── Types ────────────────────────────────────────────────────────────────────

interface NavSubcategory {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isActive?: boolean;
  hasChildren?: boolean;
}

interface NavCategory {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  sortOrder?: number;
  subcategories: NavSubcategory[];
}

// ── Link config (edit targets here) ──────────────────────────────────────────

const PHONE_DISPLAY = "1-914-310-1480";
const PHONE_HREF = "tel:+19143101480";

type HeaderLink = { label: string; href: string; track?: string };

const UTILITY_LINKS: HeaderLink[] = [
  { label: "Customer Support", href: "/customer-service" },
  { label: "Learning Center", href: "/learning-center" },
  { label: "Blog", href: "/blogs" },
  { label: "Talk to CEO", href: "/contact" },
  { label: "Site Map", href: "#site-map" },
];

const INFO_LINKS: HeaderLink[] = [
  { label: "International Orders", href: "/shipping-policy" },
  { label: "Need Help ?", href: "/help-center" },
  { label: "Why Alpha ?", href: "/about" },
  { label: "Shipping", href: "/shipping-policy" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Drop shipment", href: "/drop-shipping", track: "dropship_program" },
  { label: "Selling on eBay", href: "/drop-shipping" },
  { label: "How To Order", href: "/customer-service" },
  { label: "Contact Us", href: "/contact" },
  { label: "F.A.Q.", href: "/faq" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function subcategoryHref(catSlug: string, sub: NavSubcategory) {
  return sub.hasChildren
    ? `/category/${catSlug}/${sub.slug}`
    : `/products?category=${catSlug}&subcategory=${sub.slug}`;
}

function prettySegment(seg: string) {
  return decodeURIComponent(seg)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function useNavCategories(initialCategories: NavCategory[]) {
  const hasInitial = initialCategories.length > 0;
  const [categories, setCategories] = useState<NavCategory[]>(initialCategories);
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (hasInitial) return;
    let cancelled = false;
    fetch("/api/categories?withSubcategories=true")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: NavCategory[] = Array.isArray(data) ? data : (data?.data ?? []);
        const filtered = list
          .filter((c) => c.isActive !== false)
          .map((c) => ({
            ...c,
            subcategories: (c.subcategories ?? []).filter((s) => s.isActive !== false),
          }));
        filtered.sort((a, b) => {
          const sa = a.sortOrder ?? 0;
          const sb = b.sortOrder ?? 0;
          return sa !== sb ? sa - sb : a.name.localeCompare(b.name);
        });
        setCategories(filtered);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { categories, loading };
}

// ── Main Navbar ──────────────────────────────────────────────────────────────

export default function Navbar({
  initialCategories = [],
}: {
  initialCategories?: NavCategory[];
}) {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { categories, loading } = useNavCategories(initialCategories);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMobileCategory, setActiveMobileCategory] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"sku" | "text">("text");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const HOVER_OPEN_DELAY = 150;

  // Sticky filter bars elsewhere read --navbar-height to sit under the nav.
  const updateNavbarHeight = () => {
    if (!navRef.current) return;
    const bottom = Math.max(0, navRef.current.getBoundingClientRect().bottom);
    document.documentElement.style.setProperty("--navbar-height", `${bottom}px`);
  };

  useEffect(() => {
    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    window.addEventListener("scroll", updateNavbarHeight, { passive: true });
    document.fonts?.ready?.then(updateNavbarHeight).catch(() => {});
    let observer: ResizeObserver | null = null;
    if (navRef.current && "ResizeObserver" in window) {
      observer = new ResizeObserver(() => updateNavbarHeight());
      observer.observe(navRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateNavbarHeight);
      window.removeEventListener("scroll", updateNavbarHeight);
      observer?.disconnect();
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const cancelOpen = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
  };
  const scheduleOpen = (slug: string) => {
    cancelClose();
    cancelOpen();
    openTimer.current = setTimeout(() => setOpenDropdown(slug), HOVER_OPEN_DELAY);
  };
  const scheduleClose = () => {
    cancelOpen();
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/");
  };

  const openCart = (where: string) => {
    setMenuOpen(false);
    setCartOpen(true);
    trackCTA("open_cart", where);
  };

  // SKU mode jumps straight to the product when the SKU matches exactly;
  // otherwise (and in Text mode) it lands on the normal search results page.
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    trackCTA("header_search", searchMode);
    setMenuOpen(false);
    const enc = encodeURIComponent(q);

    if (searchMode === "sku") {
      setSearching(true);
      try {
        const res = await fetch(`/api/products/search?q=${enc}&limit=20`);
        const data = await res.json();
        const hit = (data?.data ?? []).find(
          (p: { legacySku?: string }) =>
            p.legacySku && p.legacySku.toLowerCase() === q.toLowerCase(),
        );
        if (hit) {
          router.push(`/products/${hit.slug ?? hit._id}`);
          return;
        }
      } catch {
        /* fall through to the results page */
      } finally {
        setSearching(false);
      }
    }
    router.push(`/products?search=${enc}`);
  };

  // "category" is a route prefix with no page of its own, so it's left out.
  const segments = pathname.split("/").filter((s) => s && s !== "category");

  // Plain render function (not a component) so the input keeps focus while typing.
  const renderSearch = (idPrefix: string) => (
    <form className="ai-search" onSubmit={handleSearch} role="search">
      <label className="ai-radio">
        <input
          type="radio"
          name={`${idPrefix}-mode`}
          checked={searchMode === "sku"}
          onChange={() => setSearchMode("sku")}
        />
        sku
      </label>
      <label className="ai-radio">
        <input
          type="radio"
          name={`${idPrefix}-mode`}
          checked={searchMode === "text"}
          onChange={() => setSearchMode("text")}
        />
        Text
      </label>
      <input
        id={`${idPrefix}-q`}
        className="ai-search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={searchMode === "sku" ? "Search by SKU" : "Search products"}
        placeholder={searchMode === "sku" ? "Item #" : ""}
      />
      <button type="submit" className="ai-go" disabled={searching}>
        GO
      </button>
    </form>
  );

  return (
    <>
      <style>{`
        .ai-wrap {
          --ai-navy: #000040;
          --ai-blue: #1c4874;
          --ai-blue-dk: #0d3b6c;
          --ai-blue-lt: #2b547e;
          --ai-grey: #7f7f7f;
          --ai-bar: #dfe2ea;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
        }
       .ai-container { width: 100%; padding: 0 24px; box-sizing: border-box; }
.ai-nav .ai-container { padding: 0; }

        /* ── Masthead ── */
        .ai-header { background: #fff; }
        .ai-masthead {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: start;
          padding: 18px 0 4px;
          gap: 16px;
        }
        .ai-logo { display: inline-block; line-height: 0; }
        .ai-logo img { width: 257px; height: auto; display: block; }
        .ai-tagline { text-align: center; padding-top: 4px; color: var(--ai-navy); }
        .ai-tagline p { margin: 0; font-weight: bold; font-size: 17px; line-height: 1.25; }
        .ai-tagline a { color: var(--ai-navy); text-decoration: none; font-size: 19px; font-weight: bold; letter-spacing: .5px; }
        .ai-tagline a:hover { text-decoration: underline; }
        .ai-right { justify-self: end; text-align: right; }
        .ai-search { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
        .ai-radio { display: inline-flex; align-items: center; gap: 4px; font-size: 16px; color: #666; cursor: pointer; }
        .ai-radio input { margin: 0; accent-color: #0075ff; }
        .ai-search-input {
          width: 210px; height: 26px; padding: 1px 5px;
          border: 1px solid #7a7a7a; font: 15px Arial, Helvetica, sans-serif;
          margin-left: 4px; border-radius: 0;
        }
        .ai-search-input:focus { outline: 2px solid #0075ff; outline-offset: 0; }
        .ai-go {
          height: 26px; min-width: 44px; padding: 0 8px; margin-left: 4px;
          background: var(--ai-blue); color: #fff; border: 1px solid #0d3b6c;
          font: bold 15px Arial, Helvetica, sans-serif; cursor: pointer;
        }
        .ai-go:hover { background: #2b5a8a; }
        .ai-go:disabled { opacity: .6; cursor: wait; }
        .ai-cart-status { margin-top: 5px; font-size: 12px; color: #666; }
        .ai-cart-status button {
          background: none; border: 0; padding: 0; cursor: pointer;
          font: inherit; color: var(--ai-blue); text-decoration: underline;
        }

        /* ── Link rows ── */
        .ai-util { text-align: right; font-size: 12px; color: #555; padding: 4px 0 2px; }
        .ai-util a { color: #555; text-decoration: none; }
        .ai-util a:hover { text-decoration: underline; color: #000; }
        .ai-sep { padding: 0 4px; color: #888; }
        .ai-info {
          display: flex; flex-wrap: wrap; justify-content: flex-end;
          font-size: 15px; font-weight: bold; color: var(--ai-grey); padding: 2px 0 4px;
        }
        .ai-info a { color: var(--ai-grey); text-decoration: none; padding: 0 10px; border-left: 2px solid #9a9a9a; line-height: 1.1; }
        .ai-info a:first-child { border-left: 0; }
        .ai-info a:hover { color: #000; text-decoration: underline; }

        /* ── Sticky nav: blue category bar + grey account bar ── */
        .ai-nav { position: sticky; top: 0; z-index: 50; background: #fff; transform: translateZ(0); }
        .ai-catbar {
          background: linear-gradient(to bottom, #164472 0px, var(--ai-blue-dk) 3px, var(--ai-blue-lt) 100%);
          border-top: 1px solid #164472;
        }
        .ai-catbar-inner { display: flex; justify-content: space-evenly; align-items: stretch; min-height: 38px; padding: 0 24px; }
        .ai-cat { position: relative; display: flex; }
        .ai-cat-link {
          display: flex; align-items: center; padding: 0 14px;
          color: #fff; font-weight: bold; font-size: 15px; text-decoration: none; white-space: nowrap;
        }
        .ai-cat-link:hover, .ai-cat.open .ai-cat-link, .ai-cat-link:focus-visible {
          background: rgba(255,255,255,.14); text-decoration: underline;
        }
        .ai-cat-link:focus-visible { outline: 2px solid #fff; outline-offset: -3px; }
        .ai-shim { width: 90px; height: 12px; margin: auto 0; background: rgba(255,255,255,.2); }

        .ai-drop {
          display: none; position: absolute; top: 100%; z-index: 60;
          min-width: 260px; max-width: 640px; width: max-content;
          background: #fff; border: 1px solid var(--ai-blue); border-top: 3px solid var(--ai-blue);
          box-shadow: 2px 3px 6px rgba(0,0,0,.25);
        }
        .ai-drop.left { left: 0; }
        .ai-drop.right { right: 0; }
        .ai-cat.open .ai-drop, .ai-cat:focus-within .ai-drop { display: block; }
        .ai-drop-head {
          background: var(--ai-bar); padding: 5px 10px; font-size: 13px; font-weight: bold;
          display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid #c6cbd6;
        }
        .ai-drop-head a { color: var(--ai-blue); }
        .ai-drop-list {
          list-style: none; margin: 0; padding: 6px 4px;
          column-gap: 4px;
        }
        .ai-drop-list li { break-inside: avoid; min-width: 170px; }
        .ai-drop-list a {
          display: block; padding: 4px 8px; font-size: 13px; color: #003366; text-decoration: none;
        }
        .ai-drop-list a::before { content: "\\00BB"; color: #999; margin-right: 6px; }
        .ai-drop-list a:hover, .ai-drop-list a:focus-visible { background: #eef2f8; text-decoration: underline; }

        .ai-acctbar { background: var(--ai-bar); }
        .ai-acctbar-inner {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  min-height: 20px; padding: 1px 24px; font-size: 13px; font-weight: bold;
}
        .ai-crumbs { display: flex; flex-wrap: wrap; align-items: center; min-width: 0; }
        .ai-crumbs a { color: #000; text-decoration: none; }
        .ai-crumbs a:hover { text-decoration: underline; }
        .ai-crumbs .ai-crumb-cur { font-weight: normal; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; }
        .ai-crumbs .ai-chev { padding: 0 5px; color: #666; font-weight: normal; }
        .ai-acct { display: flex; flex-wrap: wrap; justify-content: flex-end; }
        .ai-acct a, .ai-acct button {
          color: #000; text-decoration: none; background: none; border: 0; padding: 0;
          font: bold 13px Arial, Helvetica, sans-serif; cursor: pointer;
        }
        .ai-acct a:hover, .ai-acct button:hover { text-decoration: underline; }
        .ai-acct .ai-sep { color: #000; padding: 0 6px; }
        .ai-acct .ai-admin { color: #8a1c00; }
        .ai-count { font-weight: normal; }

        /* ── Mobile ── */
        .ai-mob-bar, .ai-mob-only { display: none; }
        .ai-hamburger {
          display: inline-flex; flex-direction: column; justify-content: center; gap: 4px;
          width: 38px; height: 34px; padding: 0 8px; background: var(--ai-blue);
          border: 1px solid #0d3b6c; cursor: pointer;
        }
        .ai-hamburger span { display: block; height: 2px; background: #fff; }
        .ai-mob-cart {
          position: relative; height: 34px; padding: 0 10px; background: #fff;
          border: 1px solid #7a7a7a; font: bold 13px Arial, sans-serif; color: var(--ai-blue); cursor: pointer;
        }

        @media (max-width: 1100px) {
          .ai-container { padding: 0 12px; }
.ai-acctbar-inner, .ai-catbar-inner { padding-left: 12px; padding-right: 12px; }
          .ai-cat-link { padding: 0 8px; font-size: 13px; }
          .ai-info { font-size: 13px; }
        }
        @media (max-width: 900px) {
          .ai-masthead { grid-template-columns: 1fr auto; padding-top: 10px; }
          .ai-logo img { width: 200px; }
          .ai-tagline { grid-column: 1 / -1; grid-row: 2; padding: 0; }
          .ai-tagline p { font-size: 14px; }
          .ai-tagline a { font-size: 17px; }
          .ai-right, .ai-util, .ai-info, .ai-catbar, .ai-acct { display: none; }
          .ai-nav .ai-container { padding: 0; }
          .ai-mob-only { display: flex; gap: 6px; align-items: center; justify-self: end; }
          .ai-mob-bar {
            display: block; background: linear-gradient(to bottom, #164472, var(--ai-blue-lt));
            padding: 6px 10px;
          }
          .ai-mob-bar .ai-search { justify-content: flex-start; }
          .ai-mob-bar .ai-radio { color: #fff; font-size: 13px; }
          .ai-mob-bar .ai-search-input { flex: 1; width: auto; min-width: 0; height: 30px; font-size: 16px; }
          .ai-mob-bar .ai-go { height: 30px; background: #fff; color: var(--ai-blue); }
        }

        .ai-overlay {
          position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.45);
        }
        .ai-drawer {
          position: absolute; top: 0; right: 0; bottom: 0; width: min(340px, 88vw);
          background: #fff; overflow-y: auto; font-family: Arial, Helvetica, sans-serif;
          box-shadow: -3px 0 10px rgba(0,0,0,.3);
        }
        .ai-drawer-head {
          display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(to bottom, #164472, var(--ai-blue-lt)); color: #fff;
          padding: 10px 12px; font-weight: bold; font-size: 15px;
        }
        .ai-drawer-head button { background: none; border: 1px solid #fff; color: #fff; font: bold 13px Arial; padding: 3px 8px; cursor: pointer; }
        .ai-drawer h4 {
          margin: 0; padding: 5px 12px; background: var(--ai-bar); font-size: 12px; color: #333;
          border-top: 1px solid #c6cbd6; border-bottom: 1px solid #c6cbd6;
        }
        .ai-drawer-row {
          display: flex; width: 100%; justify-content: space-between; align-items: center;
          padding: 10px 12px; border: 0; border-bottom: 1px solid #e3e3e3; background: #fff;
          font: bold 14px Arial, sans-serif; color: var(--ai-blue); text-decoration: none; text-align: left; cursor: pointer;
        }
        .ai-drawer-row.plain { font-weight: normal; color: #222; }
        .ai-drawer-sub { background: #f5f7fb; }
        .ai-drawer-sub a { display: block; padding: 8px 12px 8px 26px; font-size: 13px; color: #003366; text-decoration: none; border-bottom: 1px solid #e8ebf2; }
        .ai-drawer-sub a.all { font-weight: bold; }
        .ai-drawer-foot { padding: 14px 12px 30px; font-size: 13px; color: #444; line-height: 1.7; }
        .ai-drawer-foot a { color: var(--ai-blue); }

        @media (prefers-reduced-motion: reduce) { .ai-wrap * { transition: none !important; } }
      `}</style>

      <div className="ai-wrap">
        {/* ── Masthead (scrolls away) ── */}
        <header className="ai-header">
          <div className="ai-container">
            <div className="ai-masthead">
              <Link href="/" className="ai-logo" aria-label="Alphaimports.com home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.png"
                  alt="Alphaimports.com — Lowest prices on the planet"
                  width={257}
                  height={48}
                />
              </Link>

              <div className="ai-tagline">
                <p>Serving customers since 1988</p>
                <a href={PHONE_HREF} onClick={() => trackCTA("header_phone", "desktop")}>
                  TEL: {PHONE_DISPLAY}
                </a>
              </div>

              <div className="ai-right">
                {renderSearch("ai-desk")}
                <div className="ai-cart-status">
                  {cartCount > 0 ? (
                    <button type="button" onClick={() => openCart("desktop")}>
                      Cart: {cartCount > 99 ? "99+" : cartCount}{" "}
                      {cartCount === 1 ? "item" : "items"}
                    </button>
                  ) : (
                    "Cart is empty."
                  )}
                </div>
              </div>

              <div className="ai-mob-only">
                {user && (
                  <button
                    type="button"
                    className="ai-mob-cart"
                    onClick={() => openCart("mobile")}
                    aria-label={`Open cart, ${cartCount} items`}
                  >
                    Cart ({cartCount > 99 ? "99+" : cartCount})
                  </button>
                )}
                <button
                  type="button"
                  className="ai-hamburger"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                >
                  <span />
                  <span />
                  <span />
                </button>
              </div>
            </div>

            <nav className="ai-util" aria-label="Support">
              {UTILITY_LINKS.map((l, i) => (
                <span key={l.label}>
                  {i > 0 && <span className="ai-sep">|</span>}
                  <Link href={l.href} prefetch={false}>
                    {l.label}
                  </Link>
                </span>
              ))}
            </nav>

            <nav className="ai-info" aria-label="Information">
              {INFO_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  prefetch={false}
                  onClick={l.track ? () => trackCTA(l.track as string, "desktop") : undefined}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* ── Sticky nav ── */}
        <nav ref={navRef} className="ai-nav" aria-label="Main navigation">
          <div className="ai-mob-bar">
            {renderSearch("ai-mob")}
          </div>

          <div className="ai-container">
            <div className="ai-catbar">
              <div className="ai-catbar-inner">
                {loading &&
                  [0, 1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="ai-shim" />)}

                {!loading &&
                  categories.map((cat, i) => {
                    const hasSubs = (cat.subcategories?.length ?? 0) > 0;
                    const isOpen = openDropdown === cat.slug;
                    const alignRight = i >= Math.ceil(categories.length / 2);
                    return (
                      <div
                        key={cat._id}
                        className={`ai-cat${isOpen ? " open" : ""}`}
                        onMouseEnter={() => hasSubs && scheduleOpen(cat.slug)}
                        onMouseLeave={scheduleClose}
                      >
                        <Link
                          href={`/category/${cat.slug}`}
                          className="ai-cat-link"
                          prefetch={false}
                          aria-haspopup={hasSubs ? "true" : undefined}
                          aria-expanded={hasSubs ? isOpen : undefined}
                          data-track-click={`category_tab_${cat.slug}`}
                          onClick={() => {
                            setOpenDropdown(null);
                            trackEvent("filter_apply", {
                              filterType: "category",
                              filterValue: cat.slug,
                            });
                          }}
                        >
                          {cat.name}
                        </Link>

                        {hasSubs && (
                          <div
                            className={`ai-drop ${alignRight ? "right" : "left"}`}
                            onMouseEnter={cancelClose}
                          >
                            <div className="ai-drop-head">
                              <span>{cat.name}</span>
                              <Link
                                href={`/category/${cat.slug}`}
                                prefetch={false}
                                data-track-cta={`mega_shop_all_${cat.slug}`}
                                onClick={() => {
                                  setOpenDropdown(null);
                                  trackEvent("cta_click", {
                                    ctaId: `mega_shop_all_${cat.slug}`,
                                  });
                                }}
                              >
                                View all
                              </Link>
                            </div>
                            <ul
                              className="ai-drop-list"
                              style={{
                                columnCount:
                                  cat.subcategories.length > 14 ? 3 : cat.subcategories.length > 6 ? 2 : 1,
                              }}
                            >
                              {cat.subcategories.map((sub) => (
                                <li key={sub._id}>
                                  <Link
                                    href={subcategoryHref(cat.slug, sub)}
                                    prefetch={false}
                                    onClick={() => {
                                      setOpenDropdown(null);
                                      trackEvent("filter_apply", {
                                        filterType: "subcategory",
                                        filterValue: sub.slug,
                                        productCategory: cat.slug,
                                      });
                                    }}
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="ai-acctbar">
              <div className="ai-acctbar-inner">
                <div className="ai-crumbs" aria-label="Breadcrumb">
                  <Link href="/">Home</Link>
                  {segments.slice(0, 3).map((seg, i) => {
                    const href =
                      (pathname.startsWith("/category/") ? "/category/" : "/") +
                      segments.slice(0, i + 1).join("/");
                    const last = i === Math.min(segments.length, 3) - 1;
                    return (
                      <span key={href} style={{ display: "inline-flex" }}>
                        <span className="ai-chev">›</span>
                        {last ? (
                          <span className="ai-crumb-cur">{prettySegment(seg)}</span>
                        ) : (
                          <Link href={href} prefetch={false}>
                            {prettySegment(seg)}
                          </Link>
                        )}
                      </span>
                    );
                  })}
                </div>

                <div className="ai-acct">
                  <Link href={user ? "/account" : "/login"}>My Account</Link>
                  <span className="ai-sep">|</span>
                  {user ? (
                    <>
                      <Link href="/orders">Orders</Link>
                      <span className="ai-sep">|</span>
                      <Link href="/wishlist">
                        Wishlist{wishlistCount > 0 && <span className="ai-count"> ({wishlistCount})</span>}
                      </Link>
                      <span className="ai-sep">|</span>
                      <button type="button" onClick={handleLogout}>
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/signup" data-track-click="nav_signup">
                        Register
                      </Link>
                      <span className="ai-sep">|</span>
                      <Link href="/login" data-track-click="nav_login">
                        Log In
                      </Link>
                    </>
                  )}
                  <span className="ai-sep">|</span>
                  <Link href="/cart">
                    Cart Contents{cartCount > 0 && <span className="ai-count"> ({cartCount})</span>}
                  </Link>
                  <span className="ai-sep">|</span>
                  <Link href="/checkout">Checkout</Link>
                  <span className="ai-sep">|</span>
                  {isAdmin && (
                    <>
                      <Link href="/admin" className="ai-admin" data-track-click="nav_admin">
                        Admin
                      </Link>
                      <span className="ai-sep">|</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Mobile drawer ── */}
        {menuOpen && (
          <div className="ai-overlay" onClick={() => setMenuOpen(false)}>
            <div
              className="ai-drawer"
              role="dialog"
              aria-label="Menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ai-drawer-head">
                <span>Alphaimports.com</span>
                <button type="button" onClick={() => setMenuOpen(false)}>
                  Close
                </button>
              </div>

              <h4>Shop</h4>
              {categories.map((cat) => {
                const hasSubs = (cat.subcategories?.length ?? 0) > 0;
                const expanded = activeMobileCategory === cat.slug;
                return (
                  <div key={cat._id}>
                    <button
                      type="button"
                      className="ai-drawer-row"
                      aria-expanded={hasSubs ? expanded : undefined}
                      data-track-click={`mobile_category_${cat.slug}`}
                      onClick={() => {
                        if (!hasSubs) {
                          trackEvent("filter_apply", { filterType: "category", filterValue: cat.slug });
                          router.push(`/category/${cat.slug}`);
                          setMenuOpen(false);
                        } else {
                          setActiveMobileCategory(expanded ? null : cat.slug);
                        }
                      }}
                    >
                      {cat.name}
                      {hasSubs && <span aria-hidden="true">{expanded ? "−" : "+"}</span>}
                    </button>
                    {hasSubs && expanded && (
                      <div className="ai-drawer-sub">
                        <Link href={`/category/${cat.slug}`} className="all" onClick={() => setMenuOpen(false)}>
                          All {cat.name}
                        </Link>
                        {cat.subcategories.map((sub) => (
                          <Link
                            key={sub._id}
                            href={subcategoryHref(cat.slug, sub)}
                            onClick={() => {
                              setMenuOpen(false);
                              trackEvent("filter_apply", {
                                filterType: "subcategory",
                                filterValue: sub.slug,
                                productCategory: cat.slug,
                              });
                            }}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <h4>My Account</h4>
              {user ? (
                <>
                  <Link href="/account" className="ai-drawer-row plain" onClick={() => setMenuOpen(false)}>
                    {user.name || "Account settings"}
                  </Link>
                  <Link href="/orders" className="ai-drawer-row plain" onClick={() => setMenuOpen(false)}>
                    My Orders
                  </Link>
                  <Link href="/wishlist" className="ai-drawer-row plain" onClick={() => setMenuOpen(false)}>
                    Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                  </Link>
                  <Link href="/cart" className="ai-drawer-row plain" onClick={() => setMenuOpen(false)}>
                    Cart Contents{cartCount > 0 ? ` (${cartCount})` : ""}
                  </Link>
                  <Link href="/checkout" className="ai-drawer-row plain" onClick={() => setMenuOpen(false)}>
                    Checkout
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="ai-drawer-row plain" style={{ color: "#8a1c00" }} onClick={() => setMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <button type="button" className="ai-drawer-row plain" onClick={handleLogout}>
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="ai-drawer-row plain" data-track-click="nav_login_mobile" onClick={() => setMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/signup" className="ai-drawer-row plain" data-track-click="nav_signup_mobile" onClick={() => setMenuOpen(false)}>
                    Register
                  </Link>
                </>
              )}

              <h4>Customer Service</h4>
              {[...INFO_LINKS, ...UTILITY_LINKS.filter((u) => !u.href.startsWith("#"))]
                .filter((l, i, arr) => arr.findIndex((x) => x.label === l.label) === i)
                .map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="ai-drawer-row plain"
                    onClick={() => {
                      setMenuOpen(false);
                      if (l.track) trackCTA(l.track, "mobile");
                    }}
                  >
                    {l.label}
                  </Link>
                ))}

              <div className="ai-drawer-foot">
                Serving customers since 1988
                <br />
                <a href={PHONE_HREF}>TEL: {PHONE_DISPLAY}</a>
                <br />
                <a href="mailto:info@alphaimports.com">info@alphaimports.com</a>
              </div>
            </div>
          </div>
        )}
      </div>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}