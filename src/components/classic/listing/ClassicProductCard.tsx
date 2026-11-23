"use client";
/**
 * Old-alphaimports.com style product tile:
 *   [image]  SKU  name (orange)  price  [Buy Now]
 * Keeps the modern card's features: Quick View modal (with Add to Cart),
 * wishlist toggle, add-to-cart, low-stock / sold-out state and MSRP savings.
 */
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { optimizedImageUrl } from "@/lib/image-url";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { cartEvents } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import {
  QuickViewModal,
  buildKicker,
  buildSubtitle,
  deriveKind,
  isWatch,
  WATCH_PLACEHOLDER,
  DIAMOND_PLACEHOLDER,
  type ProductCardProps,
} from "@/components/products/ProductCard";

type Product = ProductCardProps["product"] & { legacySku?: string };

const firstStr = (v: unknown): string => {
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : "";
  return typeof v === "string" ? v : "";
};
const titleCase = (v: string) => v.replace(/\b\w/g, (c) => c.toUpperCase());

/** Short, comparable facts for a stone: "Round, Green, SI2 clarity". */
function stoneSpecs(p: Record<string, unknown>): string {
  const shape = firstStr(p.shapeRaw) || firstStr(p.shape);
  const color = firstStr(p.colorRaw) || firstStr(p.color);
  const clarity = firstStr(p.clarityRaw) || firstStr(p.clarity);
  return [
    shape && shape.toLowerCase() !== "other" ? titleCase(shape) : "",
    color ? titleCase(color) : "",
    clarity ? `${clarity.toUpperCase()} clarity` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

/** Lab names on the stone's certificate, e.g. "GIA" — empty when uncertified. */
function certLabel(p: Record<string, unknown>): string {
  const raw = Array.isArray(p.certification) ? p.certification : [p.certification];
  return raw
    .filter((c): c is string => typeof c === "string" && c.trim() !== "" && !/^(none|no|n\/a)$/i.test(c.trim()))
    .map((c) => c.toUpperCase())
    .join(" / ");
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ClassicProductCard({
  product,
  productType,
  compact = false,
}: {
  product: Product;
  productType?: ProductCardProps["productType"];
  /** "New products" strip: no SKU / buttons, like the old site. */
  compact?: boolean;
}) {
  const router = useRouter();
  const { user, ensureCartSession, loading: authLoading } = useAuth();
  const { apiFetch } = useApi();
  const { isInWishlist, toggle } = useWishlist();

  const [imgSrc, setImgSrc] = useState(
    product.images?.[0] ? optimizedImageUrl(product.images[0], { width: 300 }) : "",
  );
  const [busy, setBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [quickView, setQuickView] = useState(false);

  const watch = productType ? productType === "watch" : isWatch(product);
  const placeholder = watch ? WATCH_PLACEHOLDER : DIAMOND_PLACEHOLDER;
  const href = `/products/${product.slug ?? product._id}`;
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 3;
  const hasMsrp = typeof product.msrp === "number" && product.msrp > product.price;
  const savingsPct = hasMsrp ? Math.round((((product.msrp as number) - product.price) / (product.msrp as number)) * 100) : 0;
  const saved = isInWishlist(product._id);
  const specs = watch ? "" : stoneSpecs(product as unknown as Record<string, unknown>);
  const cert = watch ? "" : certLabel(product as unknown as Record<string, unknown>);

  const buyNow = async () => {
    if (authLoading || busy || !inStock) return;
    setBusy(true);
    try {
      // No account needed: starts a guest session if not signed in.
      await ensureCartSession();
      await apiFetch("/api/cart", { method: "POST", body: JSON.stringify({ productId: product._id, quantity: 1 }) });
      cartEvents.refresh();
      router.push("/cart");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add to cart");
      setBusy(false);
    }
  };

  const toggleWishlist = async () => {
    if (authLoading || wishBusy) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setWishBusy(true);
    try {
      await toggle(product._id);
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <div className={`cpc${compact ? " cpc-compact" : ""}${inStock ? "" : " is-out"}`}>
      {!compact && cert && <span className="cpc-cert">{cert} certified</span>}
      <Link href={href} className="cpc-img" prefetch={false} tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc || placeholder}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgSrc(placeholder)}
        />
      </Link>

      <Link href={href} className="cpc-name" prefetch={false}>
        {product.name}
      </Link>

      {!compact && specs && <div className="cpc-specs">{specs}</div>}

      <div className="cpc-price">
        {hasMsrp && <s>{money(product.msrp as number)}</s>}
        <span>{money(product.price)}</span>
        {hasMsrp && <em> (save {savingsPct}%)</em>}
      </div>

      {!compact && product.legacySku && <div className="cpc-sku">Item {product.legacySku}</div>}

      {!compact && (
        <>
          {lowStock && <div className="cpc-stock low">Only {product.stock} left</div>}

          <button type="button" className="cpc-buy" onClick={buyNow} disabled={!inStock || busy}>
            {busy ? "Adding..." : inStock ? "Buy Now" : "Sold Out"}
          </button>

          <div className="cpc-actions">
            <button type="button" onClick={() => setQuickView(true)}>
              Quick view
            </button>
            <span aria-hidden="true">|</span>
            <button
              type="button"
              onClick={toggleWishlist}
              disabled={wishBusy}
              aria-pressed={saved}
              className={saved ? "is-saved" : undefined}
            >
              {saved ? "♥ In wishlist" : "♡ Wishlist"}
            </button>
          </div>
        </>
      )}

      {quickView && (
        <QuickViewModal
          product={product}
          watch={watch}
          kind={deriveKind(product, watch)}
          kicker={buildKicker(product, watch)}
          subtitle={buildSubtitle(product, watch)}
          placeholder={placeholder}
          hasMsrpSavings={hasMsrp}
          savingsPct={savingsPct}
          isAvailable={inStock}
          onClose={() => setQuickView(false)}
        />
      )}
    </div>
  );
}