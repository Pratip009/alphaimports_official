"use client";
/**
 * Admin shell in the classic alphaimports.com storefront style:
 *   logo masthead · navy gradient bar · grey breadcrumb bar
 *   left sidebar with small-caps gradient section headers · content
 *
 * ADMIN_CSS below also normalises every admin screen (fonts, corner radii,
 * headings, form controls, tables) so pages built with ad-hoc Tailwind
 * classes still read as one consistent classic-style console.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { href: string; label: string; exact?: boolean };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/upload", label: "Bulk Upload" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/hero-slides", label: "Hero Slides" },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/coupons", label: "Coupons" },
      { href: "/admin/memos", label: "Memos" },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/contacts", label: "Contacts" },
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/memo-eligibility", label: "Memo Applications" },
    ],
  },
  {
    title: "Dropship",
    items: [
      { href: "/admin/dropship-applications", label: "Applications" },
      { href: "/admin/dropship-orders", label: "Dropship Orders" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/blogs", label: "Blog" },
      { href: "/admin/newsletter", label: "Newsletter" },
    ],
  },
];

/** Quick links in the navy bar — the screens used every day. */
const BAR_LINKS: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Customers" },
  { href: "/admin/analytics", label: "Analytics" },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/** "Admin » Orders » Order details" — sub-pages get a readable last crumb. */
function crumbsFor(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin" }];
  if (pathname === "/admin") return [{ label: "Admin", href: "/admin" }, { label: "Dashboard" }];
  const item = [...ALL_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => !i.exact && (pathname === i.href || pathname.startsWith(i.href + "/")));
  if (!item) return [...crumbs, { label: "Page" }];
  if (pathname === item.href) return [...crumbs, { label: item.label }];
  const rest = pathname.slice(item.href.length + 1);
  const tail = rest === "new" ? "New" : "Details";
  return [...crumbs, { label: item.label, href: item.href }, { label: tail }];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    );
  }, []);

  const crumbs = crumbsFor(pathname);

  const onLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="adm">
      <style>{ADMIN_CSS}</style>

      {/* ── Masthead ── */}
      <header className="adm-mast">
        <Link href="/admin" className="adm-logo" aria-label="Alpha Imports admin home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Alphaimports.com" width={230} height={54} />
        </Link>
        <div className="adm-tagline">
          <strong>Admin Console</strong>
          <span>{today}</span>
        </div>
        <div className="adm-who">
          {user && (
            <div>
              Signed in as <b>{user.name || user.email}</b>
            </div>
          )}
          <div className="adm-who-links">
            <Link href="/" target="_blank" rel="noopener">
              View storefront
            </Link>
            <span className="adm-sep">|</span>
            <button type="button" onClick={onLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ── Navy bar ── */}
      <nav className="adm-bar" aria-label="Admin quick links">
        <button
          type="button"
          className="adm-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="adm-side"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "✕ Close" : "☰ Menu"}
        </button>
        <div className="adm-bar-links">
          {BAR_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(pathname, l) ? "is-active" : undefined}
              aria-current={isActive(pathname, l) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Breadcrumb bar ── */}
      <div className="adm-crumbbar">
        <div className="adm-crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="adm-chev">»</span>}
              {c.href && i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </div>
        <div className="adm-crumb-right">
          <Link href="/admin/orders">Orders</Link>
          <span className="adm-sep">|</span>
          <Link href="/admin/products">Products</Link>
          <span className="adm-sep">|</span>
          <Link href="/" target="_blank" rel="noopener">
            Storefront
          </Link>
        </div>
      </div>

      <div className="adm-body">
        {/* ── Sidebar ── */}
        <aside id="adm-side" className={`adm-side${menuOpen ? " is-open" : ""}`}>
          {NAV.map((group) => (
            <section key={group.title} className="adm-group">
              <h2 className="adm-group-head">{group.title}</h2>
              <ul>
                {group.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={active ? "is-active" : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <div className="adm-side-foot">
            <Link href="/" target="_blank" rel="noopener">
              View storefront
            </Link>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="adm-main">{children}</main>
      </div>

      <footer className="adm-foot">Alphaimports.com · Admin Console · Serving customers since 1988</footer>
    </div>
  );
}

const ADMIN_CSS = `
  .adm {
    --adm-navy: #000040; --adm-blue: #1c4874; --adm-blue-dk: #154273; --adm-blue-lt: #2f5681;
    --adm-bar: #dfe2ea; --adm-cat: #c9cedc; --adm-side: #eeeeee; --adm-line: #c6cbd6;
    --adm-lav: #a6aec5; --adm-title: #7d88aa; --adm-link: #003366; --adm-grey: #7f7f7f;
    min-height: 100vh; display: flex; flex-direction: column; background: #fff; color: #222;
    font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 12px;
  }
  /* One typeface everywhere, like the storefront (code stays monospace). */
  .adm *:not(code):not(pre):not(kbd):not(samp) { font-family: Verdana, Geneva, Tahoma, sans-serif !important; }
  .adm code, .adm pre, .adm kbd { font-family: Consolas, "Courier New", monospace !important; }
  .adm a { text-decoration: none; }

  /* Masthead */
  .adm-mast {
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px;
    padding: 10px 24px 8px; background: #fff;
  }
  .adm-logo img { width: 230px; height: auto; display: block; }
  .adm-tagline { text-align: center; color: var(--adm-navy); line-height: 1.5; }
  .adm-tagline strong { display: block; font-size: 16px; letter-spacing: .3px; }
  .adm-tagline span { font-size: 11px; color: var(--adm-grey); }
  .adm-who { text-align: right; font-size: 11px; color: #555; line-height: 1.7; }
  .adm-who b { color: #000; }
  .adm-who-links a, .adm-who-links button {
    color: #555; background: none; border: 0; padding: 0; cursor: pointer; font-size: 11px;
  }
  .adm-who-links a:hover, .adm-who-links button:hover { color: var(--adm-link); text-decoration: underline; }
  .adm-sep { padding: 0 5px; color: #999; }

  /* Navy bar */
  .adm-bar {
    display: flex; align-items: stretch; min-height: 34px;
    background: linear-gradient(to bottom, #164472 0px, #0d3b6c 3px, #2b547e 100%);
    border-top: 1px solid #164472;
  }
  .adm-bar-links { display: flex; flex: 1; justify-content: space-evenly; flex-wrap: wrap; }
  .adm-bar-links a {
    display: flex; align-items: center; padding: 0 14px; color: #fff; font-weight: bold; font-size: 13px; white-space: nowrap;
  }
  .adm-bar-links a:hover, .adm-bar-links a.is-active { background: rgba(255,255,255,.14); text-decoration: underline; }
  .adm-bar a:focus-visible, .adm-menu-btn:focus-visible { outline: 2px solid #fff; outline-offset: -3px; }
  .adm-menu-btn { display: none; }

  /* Breadcrumb bar */
  .adm-crumbbar {
    display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
    background: var(--adm-bar); padding: 2px 24px; font-size: 11px; font-weight: bold; min-height: 20px;
  }
  .adm-crumbs a, .adm-crumb-right a { color: #000; }
  .adm-crumbs a:hover, .adm-crumb-right a:hover { text-decoration: underline; }
  .adm-crumbs > span:last-child > span { color: #333; font-weight: normal; }
  .adm-chev { padding: 0 6px; color: #666; font-weight: normal; }
  .adm-crumb-right .adm-sep { color: #000; }

  /* Body */
  .adm-body {
    flex: 1; display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 18px;
    padding: 8px 24px 30px; align-items: start;
  }
  .adm-side { position: sticky; top: 8px; border: 1px solid var(--adm-line); background: var(--adm-side); }
  .adm-group-head {
    margin: 0; padding: 3px 14px 4px; color: #fff; font-size: 12px !important; font-weight: bold; line-height: 14px;
    font-variant: small-caps; letter-spacing: .3px;
    background: linear-gradient(to bottom, #154273, #2f5681);
  }
  .adm-group ul { list-style: none; margin: 0; padding: 4px 0 8px; }
  .adm-group li a {
    display: block; padding: 3px 10px 3px 16px; color: #555; font-size: 11px; line-height: 14px;
    border-left: 3px solid transparent;
  }
  .adm-group li a::before { content: "\\00BB"; color: #aaa; margin-right: 6px; }
  .adm-group li a:hover { color: var(--adm-link); text-decoration: underline; }
  .adm-group li a.is-active {
    color: #000; font-weight: bold; background: var(--adm-cat); border-left-color: var(--adm-blue);
  }
  .adm-group li a:focus-visible { outline: 2px solid var(--adm-blue); outline-offset: -2px; }
  .adm-side-foot { padding: 6px 10px 8px; border-top: 1px solid var(--adm-line); font-size: 10px; }
  .adm-side-foot a { color: var(--adm-link); text-decoration: underline; }
  .adm-foot {
    padding: 8px 24px; background: var(--adm-bar); color: #555; font-size: 10px; text-align: center;
    border-top: 1px solid var(--adm-line);
  }

  /* ── Normalise every admin screen to the classic look ─────────────────── */
  .adm-main { min-width: 0; padding-top: 4px; }
  .adm-main h1 {
    font-size: 20px !important; font-weight: bold !important; color: var(--adm-title) !important;
    letter-spacing: 0 !important; line-height: 1.25 !important;
  }
  .adm-main h2 { letter-spacing: 0 !important; }
  .adm-main .rounded-3xl, .adm-main .rounded-2xl, .adm-main .rounded-xl { border-radius: 3px !important; }
  .adm-main .rounded-lg, .adm-main .rounded-md { border-radius: 2px !important; }
  .adm-main [class*="rounded-["] { border-radius: 3px !important; }
  .adm-main [class*="shadow-[0_"] { box-shadow: 0 1px 2px rgba(0,0,0,.08) !important; }
  .adm-main .tracking-widest, .adm-main [class*="tracking-[0.1"], .adm-main [class*="tracking-[0.2"] { letter-spacing: .04em !important; }
  .adm-main [class*="hover:-translate-y"]:hover { transform: none !important; }

  /* Form controls: square, grey border, navy focus */
  .adm-main input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
  .adm-main select, .adm-main textarea { border-radius: 0 !important; }
  .adm-main :where(input, select, textarea):focus-visible { outline: 2px solid var(--adm-blue); outline-offset: 0; }
  .adm-main :where(button):focus-visible, .adm-main :where(a):focus-visible { outline: 2px solid var(--adm-blue); outline-offset: 1px; }

  /* Tables without their own styling get the storefront table look. */
  .adm-main :where(table) { border-collapse: collapse; }
  .adm-main :where(thead) { background: linear-gradient(to bottom, #b7c0da 0, #ccd3e6 100%); }
  .adm-main :where(th) { color: #000; }

  /* Analytics screen (its base styles live in global.css) */
  .adm .analytics-header h1 { font-size: 20px; color: var(--adm-title); }
  .adm .analytics-header p, .adm .analytics-card-header p, .adm .analytics-kpi-title { color: var(--adm-grey); }
  .adm .analytics-actions select { border: 1px solid #333; border-radius: 0; height: 22px; font-size: 11px; }
  .adm .refresh-button, .adm .analytics-error button {
    background: #ccd6e3; color: #333; border: 1px solid #7f8aa8; border-radius: 0; font-size: 11px;
  }
  .adm .refresh-button:hover, .adm .analytics-error button:hover { background: #b8c5d8; color: #000; }
  .adm .analytics-kpi-card, .adm .analytics-card { border: 1px solid var(--adm-lav); border-radius: 0; box-shadow: none; }
  .adm .analytics-kpi-value { color: var(--adm-blue); font-size: 24px; }
  .adm .analytics-card-header h2 { font-size: 13px; color: var(--adm-blue); }
  .adm .page-rank { border-radius: 0; background: var(--adm-bar); color: #333; }
  .adm .page-info strong { color: #222; font-size: 12px; }
  .adm .page-views { color: var(--adm-blue); }

  @media (max-width: 900px) {
    .adm-mast { grid-template-columns: 1fr auto; padding: 10px 12px 8px; }
    .adm-logo img { width: 180px; }
    .adm-tagline { display: none; }
    .adm-bar { flex-wrap: wrap; }
    .adm-menu-btn {
      display: block; background: rgba(255,255,255,.12); color: #fff; border: 0; cursor: pointer;
      font: bold 13px Verdana, sans-serif; padding: 0 14px; min-height: 40px;
    }
    .adm-bar-links { justify-content: flex-start; overflow-x: auto; flex-wrap: nowrap; }
    .adm-bar-links a { min-height: 40px; }
    .adm-crumbbar { padding: 4px 12px; }
    .adm-crumb-right { display: none; }
    .adm-body { grid-template-columns: minmax(0, 1fr); padding: 8px 12px 24px; }
    .adm-side { display: none; position: static; }
    .adm-side.is-open { display: block; }
    .adm-group li a { font-size: 13px; line-height: 20px; padding: 6px 12px 6px 16px; }
  }
`;
