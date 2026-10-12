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
  const { user, loading: authLoading } = useAuth();
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

  const buyNow = async () => {
    if (authLoading || busy || !inStock) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
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
      <Link href={href} className="cpc-img" prefetch={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc || placeholder}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgSrc(placeholder)}
        />
      </Link>

      {!compact && product.legacySku && <div className="cpc-sku">{product.legacySku}</div>}

      <Link href={href} className="cpc-name" prefetch={false}>
        {product.name}
      </Link>

      <div className="cpc-price">
        {hasMsrp && <s>{money(product.msrp as number)}</s>}
        <span>{money(product.price)}</span>
        {hasMsrp && <em> (save {savingsPct}%)</em>}
      </div>

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