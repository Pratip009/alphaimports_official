"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { optimizedImageUrl } from "@/lib/image-url";
import { WishlistIconButton } from "@/components/wishlist/WishlistButton";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { cartEvents } from "@/hooks/useCart";
import { buildProductSpecs, type ProductKind } from "@/lib/productSpecs";
import { isDiamondAlternative } from "@/lib/diamondAlternatives";

export interface ProductCardProps {
  productType?: "watch" | "diamond" | "gemstone";
  product: {
    _id: string;
    slug?: string;
    name: string;
    price: number;
    // Original / list price shown struck through next to the (lower)
    // selling price. Only rendered when it's actually set and genuinely
    // higher than `price` — mirrors the same check the product detail
    // page uses for its "Market Retail Price" savings line.
    msrp?: number;
    description?: string;
    shape?: string | string[];
    size?: number;
    color?: string | string[];
    clarity?: string | string[];
    certification?: string | string[];
    gemstoneName?: string;
    productKind?: string;
    // Populated { name, slug } on every listing; a bare id elsewhere.
    category?: unknown;
    subcategory?: unknown;
    shapeRaw?: string;
    colorRaw?: string;
    clarityRaw?: string;
    gradeRaw?: string;
    watchBrand?: string;
    watchModel?: string;
    watchMovement?: string;
    watchGender?: string;
    watchStyle?: string;
    watchCaseMaterial?: string;
    watchDialColor?: string;
    watchStrapType?: string;
    watchCaseSize?: string;
    watchFeatures?: string[];
    // Full spec-sheet fields — same ones the product detail page reads via
    // buildProductSpecs() (src/lib/productSpecs.ts). Optional because the
    // lighter-weight grid/wishlist/recently-viewed sources don't always
    // carry every one, but when present the Quick View modal renders the
    // identical rows the full page would show.
    legacyAttributes?: Record<string, string>;
    cutType?: string;
    luster?: string;
    hardness?: string;
    treatment?: string;
    origin?: string;
    caratWeight?: number;
    dimensions?: string;
    approxWeight?: string;
    numberOfStones?: number;
    weight?: number;
    manufacturerId?: string;
    minOrder?: number;
    makeAnOffer?: boolean;
    images: string[];
    stock: number;
  };
}

// ── Data helpers ────────────────────────────────────────────────────────────

function first(val?: string | string[]): string {
  if (!val) return "";
  return Array.isArray(val) ? (val[0] ?? "") : val;
}
function display(val?: string | string[]): string {
  if (!val) return "";
  return Array.isArray(val) ? val.join(", ") : val;
}
function certDisplay(val?: string | string[]): string {
  if (!val) return "";
  const arr = Array.isArray(val) ? val : [val];
  return arr.filter((c) => c !== "none").join(" · ");
}
export function isWatch(p: ProductCardProps["product"]): boolean {
  return !!(
    p.watchBrand ||
    p.watchMovement ||
    p.watchGender ||
    p.watchStyle ||
    p.watchCaseMaterial ||
    p.watchDialColor ||
    p.watchStrapType ||
    p.watchCaseSize
  );
}

// Maps this card's narrower productType/watch-detection onto the
// ProductKind the shared spec-sheet builder (src/lib/productSpecs.ts)
// expects — the same union the full detail page resolves via
// getProductKind().
export function deriveKind(
  product: ProductCardProps["product"],
  watch: boolean,
): ProductKind {
  if (watch) return "watch";
  // Moissanite, CZ and simulated/lab-created stones are never diamonds.
  if (isDiamondAlternative(product.name, product.gemstoneName)) return "gemstone";
  const stored = product.productKind;
  if (stored === "diamond" || stored === "gemstone" || stored === "jewelry" || stored === "watch") return stored;
  if (product.gemstoneName) return "gemstone";
  return "diamond";
}

/** Subcategory name ("Blue Diamonds", "Moissanite"), else category name. */
function categoryBadge(product: ProductCardProps["product"]): string {
  const nameOf = (v: unknown): string =>
    v && typeof v === "object" && typeof (v as { name?: unknown }).name === "string"
      ? (v as { name: string }).name.trim()
      : "";
  return nameOf(product.subcategory) || nameOf(product.category);
}

function cap(s?: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function possessive(g?: string): string {
  if (!g) return "";
  const map: Record<string, string> = {
    Men: "Men's",
    Women: "Women's",
    Unisex: "Unisex",
    Boys: "Boys'",
    Girls: "Girls'",
    Kids: "Kids'",
  };
  return map[g] || g;
}

export const WATCH_PLACEHOLDER =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&fit=crop";
export const DIAMOND_PLACEHOLDER =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80&fit=crop";

const COLOR_HEX: Record<string, string> = {
  black: "#1C1C1E",
  white: "#F5F5F7",
  ivory: "#F2EAD9",
  cream: "#F3E9D2",
  silver: "#C8C9CC",
  gold: "#CBA658",
  "rose gold": "#E0B3A1",
  "two-tone": "#C9B37E",
  champagne: "#E8D6B3",
  blue: "#2F5FA8",
  navy: "#1F3A5F",
  green: "#2F6F4E",
  red: "#A4302F",
  brown: "#6B4A34",
  grey: "#8A8A8F",
  gray: "#8A8A8F",
  gunmetal: "#3A3D42",
  pink: "#D99AA6",
  purple: "#6B4C8A",
  salmon: "#E0917C",
  "mother of pearl": "#E9E6E1",
  bronze: "#8C6B3F",
  orange: "#D97A3D",
  yellow: "#E0C14A",
  ruby: "#A4192F",
  emerald: "#2F6F4E",
  sapphire: "#2B4C8C",
  amethyst: "#6B4C8A",
  topaz: "#D9A441",
  aquamarine: "#7FC7C6",
  peridot: "#A3C150",
  citrine: "#E0A83D",
  tanzanite: "#4A5FA5",
  morganite: "#E3A9A1",
  opal: "#E7E2DE",
  garnet: "#7A2530",
};

function swatchHex(text?: string): string | null {
  if (!text) return null;
  const key = text.trim().toLowerCase();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  const found = Object.keys(COLOR_HEX).find((k) => key.includes(k));
  return found ? COLOR_HEX[found] : null;
}

function lotNumber(id: string): string {
  const clean = (id || "").replace(/[^a-fA-F0-9]/g, "");
  const tail = clean.slice(-4).toUpperCase();
  return tail || "0000";
}

export function buildKicker(
  product: ProductCardProps["product"],
  watch: boolean,
): string {
  if (watch) {
    const parts = [possessive(product.watchGender), product.watchStyle].filter(
      Boolean,
    );
    return `${parts.join(" ")} Watch`.replace(/^\s+/, "");
  }
  const shape = first(product.shape) || product.shapeRaw;
  // Only the product's real gem name — never a default like "Diamond".
  const stone = product.gemstoneName || "";
  // "other" is a catch-all value, not a cut — never print "Other-Cut".
  const shapePart = shape && shape.toLowerCase() !== "other" ? `${cap(shape)}-Cut` : "";
  return [shapePart, stone].filter(Boolean).join(" ");
}

export function buildSubtitle(
  product: ProductCardProps["product"],
  watch: boolean,
): string | undefined {
  if (!watch) return undefined;
  const parts = [product.watchBrand, product.watchModel].filter(Boolean);
  return parts.length ? parts.join(" — ") : undefined;
}

interface Particular {
  label: string;
  value: string;
  swatch?: string | null;
}

function buildParticulars(
  product: ProductCardProps["product"],
  watch: boolean,
): Particular[] {
  const rows: Particular[] = [];
  if (watch) {
    if (product.watchMovement)
      rows.push({ label: "Movement", value: product.watchMovement });
    if (product.watchCaseSize)
      rows.push({ label: "Case Size", value: product.watchCaseSize });
    if (product.watchCaseMaterial)
      rows.push({ label: "Case", value: product.watchCaseMaterial });
    if (product.watchDialColor) {
      rows.push({
        label: "Dial",
        value: product.watchDialColor,
        swatch: swatchHex(product.watchDialColor),
      });
    }
    if (product.watchStrapType)
      rows.push({ label: "Strap", value: product.watchStrapType });
    if (product.watchFeatures && product.watchFeatures.length > 0) {
      const extra =
        product.watchFeatures.length > 2
          ? ` +${product.watchFeatures.length - 2}`
          : "";
      rows.push({
        label: "Features",
        value: product.watchFeatures.slice(0, 2).join(", ") + extra,
      });
    }
    return rows.slice(0, 4);
  }
  const carat = product.size ? `${product.size} ct` : "";
  if (carat) rows.push({ label: "Carat", value: carat });
  const color = display(product.color) || product.colorRaw || "";
  if (color)
    rows.push({
      label: "Color",
      value: color,
      swatch: swatchHex(product.colorRaw || first(product.color)),
    });
  const clarity = display(product.clarity) || product.clarityRaw || "";
  if (clarity) rows.push({ label: "Clarity", value: clarity });
  const certValue =
    certDisplay(product.certification) || product.gradeRaw || "";
  if (certValue)
    rows.push({
      label: certDisplay(product.certification) ? "Certification" : "Grade",
      value: certValue,
    });
  return rows.slice(0, 4);
}

// ── Icons ───────────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 14L14 4M14 4H6M14 4V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 4h2l1.6 10.6a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L20 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10V7a2 2 0 1 1 4 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
      <circle cx="16.5" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Small circular "add to cart" action that lives on the card itself —
// mirrors WishlistIconButton's interaction pattern (stop the card <Link>
// from navigating, redirect to login if signed out, otherwise fire the
// same /api/cart POST) so a shopper never has to open the product page
// just to add one unit.
function QuickAddButton({
  productId,
  inStock,
}: {
  productId: string;
  inStock: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const { apiFetch } = useApi();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (authLoading || busy || !inStock) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      cartEvents.refresh();
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy || !inStock}
      aria-label={inStock ? "Add to cart" : "Out of stock"}
      className={`apc-icon-btn${added ? " is-added" : ""}`}
      title={inStock ? "Add to cart" : "Out of stock"}
    >
      {added ? <CheckIcon /> : <CartIcon />}
    </button>
  );
}

function ProductImage({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: string;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallback)}
      className="apc-photo"
      draggable={false}
    />
  );
}

// ── Quick View ──────────────────────────────────────────────────────────────
// A condensed lot sheet for one product (gallery, name, price, availability,
// grading-report style specs, description, Add to Cart) rendered as a modal
// over whatever page the shopper is browsing. Portaled to <body> so it isn't
// clipped by the card's `overflow: hidden` and never nests inside the card's
// <Link>. All styling lives under the self-contained `.qv-*` namespace with
// its own colour tokens, so it renders the same on every page that mounts
// <ProductCardStyles />.

function QuickViewCart({
  productId,
  stock,
  minOrder,
  onViewCart,
}: {
  productId: string;
  stock: number;
  minOrder?: number;
  onViewCart: () => void;
}) {
  const { user, loading: authLoading } = useAuth();
  const { apiFetch } = useApi();
  const router = useRouter();
  const min = Math.max(1, minOrder ?? 1);
  const max = Math.max(min, stock);
  const [qty, setQty] = useState(min);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (authLoading || busy) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: qty }),
      });
      cartEvents.refresh();
      setAdded(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "This item couldn’t be added. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qv-buy">
      <div className="qv-buy-row">
        <div className="qv-stepper" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => {
              setQty((q) => Math.max(min, q - 1));
              setAdded(false);
            }}
            disabled={qty <= min || busy}
            aria-label="Decrease quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <output aria-live="polite">{qty}</output>
          <button
            type="button"
            onClick={() => {
              setQty((q) => Math.min(max, q + 1));
              setAdded(false);
            }}
            disabled={qty >= max || busy}
            aria-label="Increase quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          className={`qv-add ${added ? "is-added" : ""}`}
          onClick={handleAdd}
          disabled={busy || authLoading}
        >
          {busy ? (
            <>
              <span className="qv-spin" aria-hidden="true" /> Adding
            </>
          ) : added ? (
            <>
              <CheckIcon /> Added to cart
            </>
          ) : (
            "Add to cart"
          )}
        </button>
      </div>

      {qty >= max && max > 1 && !added && (
        <p className="qv-note">That’s all {max} we have in stock.</p>
      )}

      {added && (
        <p className="qv-note qv-note-ok" role="status">
          {qty} {qty === 1 ? "piece is" : "pieces are"} in your cart.{" "}
          <button type="button" className="qv-textbtn" onClick={onViewCart}>
            View cart
          </button>
        </p>
      )}

      {error && (
        <p className="qv-note qv-note-err" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function QuickViewModal({
  product,
  watch: _watch,
  kind,
  kicker,
  subtitle,
  placeholder,
  hasMsrpSavings,
  savingsPct,
  isAvailable,
  onClose,
}: {
  product: ProductCardProps["product"];
  watch: boolean;
  kind: ProductKind;
  kicker: string;
  subtitle?: string;
  placeholder: string;
  hasMsrpSavings: boolean;
  savingsPct: number;
  isAvailable: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Full spec sheet — same rows/labels as the product detail page.
  // "Availability" is dropped since it's shown beside the price.
  const specs = buildProductSpecs(product, kind).filter(
    (row) => row.label !== "Availability",
  );

  const images = (product.images || []).filter(Boolean).slice(0, 6);
  const lowStock = isAvailable && product.stock <= 3;
  const href = `/products/${product.slug ?? product._id}`;

  useEffect(() => {
    setMounted(true);
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Keep keyboard focus inside the dialog.
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    if (mounted) closeRef.current?.focus();
  }, [mounted]);

  if (!mounted) return null;

  const mainSrc = images[active]
    ? optimizedImageUrl(images[active], { width: 900 })
    : placeholder;

  return createPortal(
    <div
      className="qv-overlay"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        ref={panelRef}
        className="qv-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qv-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="qv-close"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close quick view"
        >
          <CloseIcon />
        </button>

        {/* Gallery */}
        <div className="qv-gallery">
          <div className="qv-tray">
            <img
              key={mainSrc}
              src={mainSrc}
              alt={product.name}
              className="qv-main-img"
              draggable={false}
              onError={(e) => {
                if (e.currentTarget.src !== placeholder)
                  e.currentTarget.src = placeholder;
              }}
            />
            {!isAvailable && <span className="qv-soldtag">Sold out</span>}
          </div>

          {images.length > 1 && (
            <div className="qv-thumbs" role="tablist" aria-label="Product photos">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Photo ${i + 1} of ${images.length}`}
                  className={`qv-thumb ${i === active ? "is-active" : ""}`}
                  onClick={() => setActive(i)}
                >
                  <img
                    src={optimizedImageUrl(src, { width: 160 })}
                    alt=""
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="qv-info">
          <div className="qv-head">
            {kicker && <p className="qv-kicker">{kicker}</p>}
            <h3 id="qv-title" className="qv-name">
              {product.name}
            </h3>
            {subtitle && <p className="qv-subtitle">{subtitle}</p>}
          </div>

          <div className="qv-pricebar">
            <div>
              <div className="qv-price">
                ${product.price.toLocaleString()}
                <span className="qv-cur">USD</span>
              </div>
              {hasMsrpSavings && (
                <div className="qv-was">
                  <s>${(product.msrp as number).toLocaleString()}</s>
                  <span>Save {savingsPct}%</span>
                </div>
              )}
            </div>
            <p
              className={`qv-stock ${
                !isAvailable ? "is-out" : lowStock ? "is-low" : ""
              }`}
            >
              {!isAvailable
                ? "Sold out"
                : lowStock
                  ? `Only ${product.stock} left`
                  : `${product.stock} in stock`}
            </p>
          </div>

          {specs.length > 0 && (
            <dl className="qv-specs">
              {specs.map((row, i) => (
                <div className="qv-spec" key={i}>
                  <dt>{row.label}</dt>
                  <dd className={row.highlight ? "is-hl" : undefined}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {product.description && (
            <p className="qv-desc">{product.description}</p>
          )}

          <div className="qv-actions">
            {isAvailable ? (
              <QuickViewCart
                productId={product._id}
                stock={product.stock}
                minOrder={product.minOrder}
                onViewCart={() => {
                  onClose();
                  cartEvents.open();
                }}
              />
            ) : (
              <p className="qv-note">
                This piece has sold and can’t be added to your cart.
              </p>
            )}

            <Link href={href} className="qv-full" onClick={onClose}>
              View full details
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Card + Quick View styles, exported so other card layouts (e.g. the classic
// listing card) can reuse the Quick View modal and still get its styling.
const PRODUCT_CARD_CSS = `
        .apc {
          --paper: #ffffff;
          --paper-soft: #fafaf9;
          --ink: #1a1a1c;
          --ink-soft: #4a4a50;
          --muted: #9a9aa0;
          --line: #ebebea;
          --line-strong: #d4d4d2;
          --accent: #b08d4a;
          --accent-soft: #f7f2e8;
          --oxblood: #9c3b45;
          --avail: #2d7a52;

          display: block;
          text-decoration: none;
          color: inherit;
          font-family: 'Elms Sans', system-ui, sans-serif;
          outline: none;
          width: 100%;
          height: 100%;
        }

        .apc-card {
          position: relative;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          transition: 
            transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.35s ease;
        }

        .apc:hover .apc-card,
        .apc:focus-visible .apc-card {
          transform: translateY(-5px);
          border-color: rgba(176, 141, 74, 0.38);
          box-shadow: 
            0 26px 48px -18px rgba(107, 79, 30, 0.22),
            0 10px 22px -10px rgba(26, 26, 28, 0.08);
        }

        .apc:focus-visible .apc-card {
          box-shadow: 
            0 0 0 2px var(--paper),
            0 0 0 4px var(--accent),
            0 20px 40px -16px rgba(26, 26, 28, 0.12);
        }

        /* ── Header strip ─────────────────────────────────────────────── */
        .apc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px 10px;
          border-bottom: 1px solid var(--line);
        }

        .apc-lot {
          font-family: 'Elms Sans', system-ui, sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: var(--muted);
        }
        .apc-lot span {
          color: #c5c5c8;
          margin-right: 3px;
        }

        .apc-type {
          max-width: 62%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--accent);
          background: var(--accent-soft);
          padding: 4px 9px;
          border-radius: 999px;
        }

        /* ── Image area ───────────────────────────────────────────────── */
        .apc-visual {
          position: relative;
          padding: 16px 20px 14px;
          display: flex;
          justify-content: center;
          background: radial-gradient(ellipse 65% 65% at 50% 45%, rgba(176, 141, 74, 0.07), transparent 72%);
        }

        .apc-frame {
          position: relative;
          width: 100%;
          max-width: 150px;
          aspect-ratio: 1 / 1;
          background: var(--paper-soft);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow:
            inset 0 1px 3px rgba(26, 26, 28, 0.05),
            inset 0 -1px 2px rgba(255, 255, 255, 0.7);
        }

        /* Jeweler's-loupe corner brackets, inset from the tray edge */
        .apc-frame::before {
          content: "";
          position: absolute;
          top: 7px;
          left: 7px;
          right: 7px;
          bottom: 7px;
          background:
            linear-gradient(var(--accent), var(--accent)) top left / 11px 1.5px no-repeat,
            linear-gradient(var(--accent), var(--accent)) top left / 1.5px 11px no-repeat,
            linear-gradient(var(--accent), var(--accent)) top right / 11px 1.5px no-repeat,
            linear-gradient(var(--accent), var(--accent)) top right / 1.5px 11px no-repeat,
            linear-gradient(var(--accent), var(--accent)) bottom left / 11px 1.5px no-repeat,
            linear-gradient(var(--accent), var(--accent)) bottom left / 1.5px 11px no-repeat,
            linear-gradient(var(--accent), var(--accent)) bottom right / 11px 1.5px no-repeat,
            linear-gradient(var(--accent), var(--accent)) bottom right / 1.5px 11px no-repeat;
          opacity: 0.45;
          transition: opacity 0.35s ease;
          pointer-events: none;
          z-index: 1;
        }

        .apc:hover .apc-frame::before,
        .apc:focus-visible .apc-frame::before {
          opacity: 1;
        }

        /* Soft studio-light highlight over the stone */
        .apc-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.55), transparent 45%);
          pointer-events: none;
        }

        .apc-photo {
          position: relative;
          z-index: 1;
          max-width: 76%;
          max-height: 76%;
          object-fit: contain;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .apc:hover .apc-photo,
        .apc:focus-visible .apc-photo {
          transform: scale(1.06);
        }

        .apc-frame.is-out .apc-photo {
          filter: grayscale(0.7);
          opacity: 0.4;
        }

        .apc-frame.is-out::before {
          opacity: 0.2;
        }

        /* Status badges */
        .apc-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 4px 9px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .apc-badge.low {
          color: var(--oxblood);
          border-color: rgba(156, 59, 69, 0.2);
        }

        .apc-badge.sold {
          background: var(--ink);
          color: #fff;
          border-color: transparent;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Vertical stack of circular actions — wishlist, quick view, quick
           add-to-cart — pinned to the top-right corner of the image. */
        .apc-icon-stack {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 3;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .apc-icon-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #eaeaec;
          color: #57575d;
          cursor: pointer;
          transition: color 0.2s, transform 0.15s, border-color 0.2s, background 0.2s;
          backdrop-filter: blur(2px);
          flex-shrink: 0;
        }

        .apc-icon-btn:hover {
          color: var(--accent);
          border-color: rgba(176, 141, 74, 0.4);
        }

        .apc-icon-btn:active {
          transform: scale(0.9);
        }

        .apc-icon-btn:disabled {
          color: #c7c7cc;
          cursor: not-allowed;
        }

        .apc-icon-btn.is-added {
          color: #fff;
          background: var(--avail);
          border-color: var(--avail);
        }

        /* Hover-revealed "Quick view" pill, centered under the stone. */
        .apc-cta {
          position: absolute;
          left: 50%;
          bottom: 12px;
          transform: translate(-50%, 8px);
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--ink);
          background: #fff;
          border: 1px solid var(--line-strong);
          padding: 7px 14px;
          border-radius: 999px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease, transform 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          cursor: pointer;
        }

        .apc:hover .apc-cta,
        .apc:focus-visible .apc-cta {
          opacity: 1;
          transform: translate(-50%, 0);
          pointer-events: auto;
        }

        .apc-cta:hover {
          border-color: rgba(176, 141, 74, 0.5);
          color: var(--accent);
        }

        /* ── Body ─────────────────────────────────────────────────────── */
        .apc-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 4px 18px 18px;
        }

        .apc-kicker {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 3px;
        }

        .apc-name {
          font-family: 'Elms Sans';
          font-weight: 600;
          font-size: 19px;
          line-height: 1.3;
          letter-spacing: -0.015em;
          color: var(--ink);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .apc-subtitle {
          margin-top: 3px;
          font-size: 13px;
          font-weight: 500;
          color: var(--ink-soft);
        }

        /* Specs grid */
        .apc-specs {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--line);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 16px;
        }

        .apc-spec-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 2px;
        }

        .apc-spec-value {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .apc-swatch {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 1px solid rgba(0,0,0,0.12);
        }

        /* Price row */
        .apc-footer {
          margin-top: auto;
          padding-top: 14px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .apc-price-block {
          display: flex;
          flex-direction: column;
        }

        .apc-price-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 2px;
        }

        .apc-price {
          font-family: 'Elms Sans';
          font-weight: 700;
          font-size: 22px;
          letter-spacing: -0.02em;
          color: var(--ink);
          line-height: 1;
        }

        .apc-price span {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          margin-left: 3px;
          vertical-align: super;
        }

        .apc-price-now-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .apc-price-was {
          font-size: 13px;
          font-weight: 600;
          color: var(--oxblood);
          text-decoration: line-through;
          text-decoration-color: var(--oxblood);
          text-decoration-thickness: 1.5px;
        }

        .apc-save-badge {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--oxblood);
          background: #fbeceb;
          padding: 2px 7px;
          border-radius: 999px;
          line-height: 1.5;
        }

        .apc-stock {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--avail);
          white-space: nowrap;
        }

        .apc-stock::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .apc-stock.out {
          color: var(--muted);
        }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .apc-frame { max-width: 135px; }
          .apc-name { font-size: 16.5px; }
          .apc-price { font-size: 20px; }
        }

        @media (max-width: 640px) {
          .apc-card { border-radius: 14px; }

          .apc-header { padding: 10px 14px 0; }
          .apc-visual { padding: 10px 14px 6px; }
          .apc-frame { max-width: 130px; border-radius: 10px; }

          .apc-body { padding: 2px 14px 14px; }
          .apc-kicker { font-size: 9.5px; }
          .apc-name { font-size: 15.5px; }
          .apc-subtitle { font-size: 12px; }

          .apc-specs {
            grid-template-columns: 1fr 1fr;
            gap: 8px 12px;
            margin-top: 12px;
            padding-top: 10px;
          }
          .apc-spec-label { font-size: 9.5px; }
          .apc-spec-value { font-size: 12.5px; }

          .apc-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            padding-top: 12px;
          }
          .apc-price { font-size: 19px; }

          /* Hide hover CTA on touch devices */
          .apc-cta { display: none; }
        }

        @media (max-width: 400px) {
          .apc-specs { grid-template-columns: 1fr; gap: 7px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .apc-card,
          .apc-photo,
          .apc-cta {
            transition: none !important;
          }
          .apc:hover .apc-card,
          .apc:focus-visible .apc-card {
            transform: none !important;
          }
        }

        /* ── Quick View modal ────────────────────────────────────────────
           Portaled to <body>, so every rule is namespaced .qv-* and the
           overlay carries its own tokens (no dependency on .apc). */
        .qv-overlay {
          --qv-paper: #ffffff;
          --qv-tray: #f5f3ee;
          --qv-ink: #1d1c1a;
          --qv-ink-soft: #57534c;
          --qv-muted: #7d776c;
          --qv-line: #e7e2d8;
          --qv-gold: #86662c;
          --qv-gold-line: #c9b48a;
          --qv-avail: #2d7a52;
          --qv-oxblood: #9c3b45;

          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(29, 28, 26, 0.5);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          animation: qv-fade 0.22s ease;
          font-family: 'Elms Sans', system-ui, sans-serif;
          color: var(--qv-ink);
        }

        @keyframes qv-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qv-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes qv-img-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qv-rot { to { transform: rotate(360deg); } }

        .qv-panel {
          position: relative;
          width: 100%;
          max-width: 920px;
          max-height: min(88vh, 720px);
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          background: var(--qv-paper);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 40px 90px -30px rgba(29, 28, 26, 0.45);
          animation: qv-rise 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .qv-close {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 3;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid var(--qv-line);
          background: var(--qv-paper);
          color: var(--qv-ink-soft);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .qv-close:hover { color: var(--qv-ink); border-color: var(--qv-gold-line); }

        .qv-overlay :focus-visible {
          outline: 2px solid var(--qv-gold);
          outline-offset: 2px;
        }

        /* Gallery: the stone sits in a tray framed by loupe corner marks */
        .qv-gallery {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          background: var(--qv-tray);
          min-height: 0;
        }

        .qv-tray {
          position: relative;
          flex: 1;
          min-height: 280px;
          display: grid;
          place-items: center;
          padding: 28px;
        }
        .qv-tray::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border: 1px solid var(--qv-gold-line);
          -webkit-mask:
            linear-gradient(#000 0 0) top left / 22px 22px,
            linear-gradient(#000 0 0) top right / 22px 22px,
            linear-gradient(#000 0 0) bottom left / 22px 22px,
            linear-gradient(#000 0 0) bottom right / 22px 22px;
          -webkit-mask-repeat: no-repeat;
          mask:
            linear-gradient(#000 0 0) top left / 22px 22px,
            linear-gradient(#000 0 0) top right / 22px 22px,
            linear-gradient(#000 0 0) bottom left / 22px 22px,
            linear-gradient(#000 0 0) bottom right / 22px 22px;
          mask-repeat: no-repeat;
        }

        .qv-main-img {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
          mix-blend-mode: multiply;
          animation: qv-img-in 0.25s ease;
          user-select: none;
        }

        .qv-soldtag {
          position: absolute;
          top: 14px;
          left: 14px;
          font-size: 12px;
          font-weight: 600;
          color: var(--qv-paper);
          background: var(--qv-ink);
          padding: 4px 10px;
          border-radius: 3px;
        }

        .qv-thumbs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px;
        }
        .qv-thumbs::-webkit-scrollbar { display: none; }

        .qv-thumb {
          flex: 0 0 56px;
          height: 56px;
          padding: 4px;
          border-radius: 4px;
          border: 1px solid transparent;
          background: var(--qv-paper);
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.15s, border-color 0.15s;
        }
        .qv-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
        }
        .qv-thumb:hover { opacity: 1; }
        .qv-thumb.is-active { opacity: 1; border-color: var(--qv-gold); }

        /* Details column */
        .qv-info {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow-y: auto;
          padding: 32px 32px 0;
          overscroll-behavior: contain;
        }

        .qv-head { padding-right: 36px; }

        .qv-kicker {
          font-size: 13px;
          font-weight: 500;
          color: var(--qv-gold);
          margin: 0 0 6px;
        }

        .qv-name {
          margin: 0;
          font-size: 26px;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--qv-ink);
          text-wrap: balance;
        }

        .qv-subtitle {
          margin: 6px 0 0;
          font-size: 14px;
          color: var(--qv-ink-soft);
        }

        .qv-pricebar {
          margin-top: 20px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .qv-price {
          font-size: 30px;
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .qv-cur {
          margin-left: 6px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0;
          color: var(--qv-muted);
        }

        .qv-was {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .qv-was s {
          color: var(--qv-muted);
          text-decoration-thickness: 1px;
        }
        .qv-was span {
          font-weight: 600;
          color: var(--qv-oxblood);
        }

        .qv-stock {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 600;
          color: var(--qv-avail);
        }
        .qv-stock::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }
        .qv-stock.is-low { color: var(--qv-oxblood); }
        .qv-stock.is-out { color: var(--qv-muted); }

        /* Grading-report spec list: label …… value */
        .qv-specs {
          margin: 24px 0 0;
          padding: 16px 0 0;
          border-top: 1px solid var(--qv-ink);
        }
        .qv-spec {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 5px 0;
          font-size: 13.5px;
        }
        .qv-spec dt {
          flex-shrink: 0;
          color: var(--qv-ink-soft);
        }
        .qv-spec::after {
          content: "";
          order: 1;
          flex: 1;
          min-width: 16px;
          border-bottom: 1px dotted var(--qv-gold-line);
          transform: translateY(-4px);
        }
        .qv-spec dd {
          order: 2;
          margin: 0;
          max-width: 60%;
          font-weight: 600;
          text-align: right;
          color: var(--qv-ink);
          font-variant-numeric: tabular-nums;
        }
        .qv-spec dd.is-hl { color: var(--qv-avail); }

        .qv-desc {
          margin: 20px 0 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--qv-ink-soft);
          max-width: 60ch;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Actions stick to the bottom of the details column */
        .qv-actions {
          position: sticky;
          bottom: 0;
          margin-top: auto;
          padding: 20px 0 24px;
          background: linear-gradient(to bottom, rgba(255,255,255,0), var(--qv-paper) 16px);
        }

        .qv-buy-row {
          display: flex;
          gap: 10px;
        }

        .qv-stepper {
          display: flex;
          align-items: center;
          border: 1px solid var(--qv-line);
          border-radius: 4px;
          height: 48px;
        }
        .qv-stepper button {
          width: 40px;
          height: 100%;
          display: grid;
          place-items: center;
          background: none;
          border: 0;
          color: var(--qv-ink);
          cursor: pointer;
        }
        .qv-stepper button:disabled { color: #c9c4ba; cursor: not-allowed; }
        .qv-stepper output {
          min-width: 28px;
          text-align: center;
          font-size: 15px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .qv-add {
          flex: 1;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 4px;
          background: var(--qv-ink);
          color: #fff;
          font: inherit;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s;
        }
        .qv-add:hover:not(:disabled) { background: #3a3833; }
        .qv-add:disabled { cursor: progress; opacity: 0.85; }
        .qv-add.is-added { background: var(--qv-avail); }

        .qv-spin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          animation: qv-rot 0.7s linear infinite;
        }

        .qv-note {
          margin: 10px 0 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--qv-ink-soft);
        }
        .qv-note-ok { color: var(--qv-ink); }
        .qv-note-err { color: var(--qv-oxblood); }

        .qv-textbtn {
          background: none;
          border: 0;
          padding: 0;
          font: inherit;
          font-weight: 600;
          color: var(--qv-gold);
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }

        .qv-full {
          display: inline-block;
          margin-top: 14px;
          font-size: 14px;
          font-weight: 600;
          color: var(--qv-ink);
          text-decoration: underline;
          text-decoration-color: var(--qv-gold-line);
          text-underline-offset: 4px;
          transition: text-decoration-color 0.15s;
        }
        .qv-full:hover { text-decoration-color: var(--qv-gold); }

        @media (max-width: 760px) {
          .qv-overlay { padding: 0; align-items: flex-end; }
          .qv-panel {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr);
            max-height: 94vh;
            border-radius: 12px 12px 0 0;
          }
          .qv-gallery { padding: 14px; gap: 10px; }
          .qv-tray { min-height: 200px; padding: 16px; }
          .qv-main-img { max-height: 230px; }
          .qv-info { padding: 22px 20px 0; }
          .qv-name { font-size: 22px; }
          .qv-price { font-size: 26px; }
          .qv-actions { padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px)); }
        }

        @media (prefers-reduced-motion: reduce) {
          .qv-overlay, .qv-panel, .qv-main-img { animation: none; }
          .qv-spin { animation-duration: 1.6s; }
        }
      `;

export function ProductCardStyles() {
  return <style>{PRODUCT_CARD_CSS}</style>;
}

export default function ProductCard({
  product,
  productType,
}: ProductCardProps) {
  const watch = productType ? productType === "watch" : isWatch(product);
  const isAvailable = product.stock > 0;
  const lowStock = isAvailable && product.stock <= 3;
  const placeholder = watch ? WATCH_PLACEHOLDER : DIAMOND_PLACEHOLDER;

  const kicker = buildKicker(product, watch);
  const subtitle = buildSubtitle(product, watch);
  const badge = categoryBadge(product);
  const particulars = buildParticulars(product, watch);
  const lot = lotNumber(product._id);

  // Same "only show a comparison when it's real" rule as the product-detail
  // page: an original price only renders (struck through) when msrp is set
  // and genuinely higher than the selling price.
  const hasMsrpSavings =
    typeof product.msrp === "number" && product.msrp > product.price;
  const savingsPct = hasMsrpSavings
    ? Math.round(
        (((product.msrp as number) - product.price) /
          (product.msrp as number)) *
          100,
      )
    : 0;

  const [quickViewOpen, setQuickViewOpen] = useState(false);

  return (
    <>
      <ProductCardStyles />

      <Link href={`/products/${product.slug ?? product._id}`} className="apc">
        <article className="apc-card">
          {/* Header */}
          <div className="apc-header">
            <div className="apc-lot">
              <span>LOT</span>
              {lot}
            </div>
            {badge && (
              <div className="apc-type" title={badge}>
                {badge}
              </div>
            )}
          </div>

          {/* Image */}
          <div className="apc-visual">
            <div className={`apc-frame ${isAvailable ? "" : "is-out"}`}>
              {product.images[0] ? (
                <ProductImage
                  src={optimizedImageUrl(product.images[0], {
                    width: 420,
                  })}
                  alt={product.name}
                  fallback={placeholder}
                />
              ) : (
                <img
                  src={placeholder}
                  alt={product.name}
                  className="apc-photo"
                />
              )}

              {lowStock && (
                <div className="apc-badge low">Only {product.stock} left</div>
              )}
              {!isAvailable && <div className="apc-badge sold">Sold Out</div>}

              <div className="apc-icon-stack">
                <WishlistIconButton productId={product._id} size="sm" />
                <button
                  className="apc-icon-btn"
                  aria-label="Quick view"
                  title="Quick view"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuickViewOpen(true);
                  }}
                >
                  <EyeIcon />
                </button>
                <QuickAddButton productId={product._id} inStock={isAvailable} />
              </div>

              {isAvailable && (
                <button
                  className="apc-cta"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuickViewOpen(true);
                  }}
                >
                  Quick view <ArrowIcon />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="apc-body">
            <div className="apc-kicker">{kicker}</div>
            <h3 className="apc-name">{product.name}</h3>
            {subtitle && <div className="apc-subtitle">{subtitle}</div>}

            {particulars.length > 0 && (
              <div className="apc-specs">
                {particulars.map((row, i) => (
                  <div key={i}>
                    <div className="apc-spec-label">{row.label}</div>
                    <div className="apc-spec-value">
                      {row.swatch && (
                        <span
                          className="apc-swatch"
                          style={{ background: row.swatch }}
                        />
                      )}
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="apc-footer">
              <div className="apc-price-block">
                <span className="apc-price-label">Price</span>
                <div className="apc-price-now-row">
                  <div className="apc-price">
                    ${product.price.toLocaleString()}
                    <span>USD</span>
                  </div>
                  {hasMsrpSavings && (
                    <>
                      <span className="apc-price-was">
                        ${(product.msrp as number).toLocaleString()}
                      </span>
                      <span className="apc-save-badge">-{savingsPct}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`apc-stock ${isAvailable ? "" : "out"}`}>
                {isAvailable ? `${product.stock} available` : "Sold out"}
              </div>
            </div>
          </div>
        </article>
      </Link>

      {quickViewOpen && (
        <QuickViewModal
          product={product}
          watch={watch}
          kind={deriveKind(product, watch)}
          kicker={kicker}
          subtitle={subtitle}
          placeholder={placeholder}
          hasMsrpSavings={hasMsrpSavings}
          savingsPct={savingsPct}
          isAvailable={isAvailable}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </>
  );
}