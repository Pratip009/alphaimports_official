"use client";
/**
 * Old-site buy box:
 *   Minimum Quantity: 1
 *   Quantity: [ 1 ]
 *   [Add To Cart] [Reviews]
 *   [Add To Wishlists] [Make An Offer | Compare]
 * Same behaviour as before: POST /api/cart (login redirect when signed out),
 * wishlist toggle, compare modal, min/max order and qty blocks respected.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { cartEvents } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import CompareLaunchButton from "@/components/compare/CompareLaunchButton";

type CompareProduct = Parameters<typeof CompareLaunchButton>[0]["product"];

export default function ClassicBuyBox({
  productId,
  productName,
  productUrl,
  stock,
  minOrder,
  maxOrder,
  qtyBlocks,
  makeAnOffer,
  compareProduct,
  offerEmail = "info@alphaimports.com",
}: {
  productId: string;
  productName: string;
  productUrl: string;
  stock: number;
  minOrder?: number;
  maxOrder?: number;
  qtyBlocks?: number;
  makeAnOffer?: boolean;
  compareProduct: CompareProduct;
  offerEmail?: string;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { apiFetch } = useApi();
  const { isInWishlist, toggle } = useWishlist();

  const step = qtyBlocks && qtyBlocks > 1 ? qtyBlocks : 1;
  const min = Math.max(1, minOrder || 1);
  const max = Math.max(min, Math.min(maxOrder || Infinity, stock || Infinity));
  const inStock = stock > 0;

  const [qty, setQty] = useState(min);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const saved = isInWishlist(productId);

  const clampQty = (n: number) => {
    if (!Number.isFinite(n)) return min;
    let v = Math.max(min, Math.min(max, Math.round(n)));
    if (step > 1) v = Math.max(min, Math.round(v / step) * step);
    return v;
  };

  const requireLogin = () => {
    if (authLoading) return true;
    if (!user) {
      router.push("/login");
      return true;
    }
    return false;
  };

  const addToCart = async () => {
    if (!inStock || busy || requireLogin()) return;
    setBusy(true);
    try {
      await apiFetch("/api/cart", { method: "POST", body: JSON.stringify({ productId, quantity: clampQty(qty) }) });
      cartEvents.refresh();
      setAdded(true);
      setTimeout(() => setAdded(false), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setBusy(false);
    }
  };

  const toggleWishlist = async () => {
    if (wishBusy || requireLogin()) return;
    setWishBusy(true);
    try {
      await toggle(productId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update wishlist");
    } finally {
      setWishBusy(false);
    }
  };

  const offerHref = `mailto:${offerEmail}?subject=${encodeURIComponent(`Offer: ${productName}`)}&body=${encodeURIComponent(
    `Hello Alpha Imports,\n\nI would like to make an offer on:\n${productName}\n${productUrl}\n\nMy offer (USD): \nQuantity: ${qty}\n\nName:\nPhone:\n`,
  )}`;

  return (
    <div className="pdc-buy">
      {min > 1 && (
        <div className="pdc-minqty">
          Minimum Quantity: <span>{min}</span>
        </div>
      )}
      {step > 1 && (
        <div className="pdc-minqty">
          Sold in multiples of: <span>{step}</span>
        </div>
      )}

      <label className="pdc-qty">
        Quantity:
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={Number.isFinite(max) ? max : undefined}
          step={step}
          value={qty}
          disabled={!inStock}
          onChange={(e) => setQty(Number(e.target.value))}
          onBlur={() => setQty((q) => clampQty(q))}
        />
      </label>

      <div className="pdc-btnbox">
        <button type="button" onClick={addToCart} disabled={!inStock || busy}>
          {!inStock ? "Out of Stock" : busy ? "Adding..." : added ? "✓ Added" : "Add To Cart"}
        </button>
        <a href="#reviews">Reviews</a>
        <button type="button" onClick={toggleWishlist} disabled={wishBusy} aria-pressed={saved}>
          {saved ? "In Your Wishlist" : "Add To Wishlists"}
        </button>
        {makeAnOffer ? (
          <a href={offerHref} className="pdc-offer">
            Make An Offer
          </a>
        ) : (
          <CompareLaunchButton className="pdc-compare" product={compareProduct} />
        )}
        {makeAnOffer && <CompareLaunchButton className="pdc-compare pdc-wide" product={compareProduct} />}
      </div>

      {added && (
        <p className="pdc-added" role="status">
          Added to your cart. <Link href="/cart">View cart</Link> · <Link href="/checkout">Checkout</Link>
        </p>
      )}
    </div>
  );
}