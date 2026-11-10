"use client";
/**
 * Old-alphaimports.com "Products meeting the search criteria" table:
 *   [image] | Model | Product Name | Price | Buy Now
 * Buy Now behaves exactly like the classic product tile: adds one to the
 * cart and goes to /cart (or /login when signed out).
 */
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { optimizedImageUrl } from "@/lib/image-url";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { cartEvents } from "@/hooks/useCart";
import { WATCH_PLACEHOLDER, DIAMOND_PLACEHOLDER } from "@/components/products/ProductCard";

export interface SearchRowProduct {
  _id: string;
  slug?: string;
  name: string;
  price: number;
  msrp?: number;
  stock: number;
  images?: string[];
  legacySku?: string;
  watchModel?: string;
  productKind?: string;
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ClassicSearchResults({ products }: { products: SearchRowProduct[] }) {
  return (
    <table className="csr">
      <thead>
        <tr>
          <th className="csr-img-h" aria-label="Image" />
          <th>Model</th>
          <th>Product Name</th>
          <th className="csr-num">Price</th>
          <th className="csr-buy-h">Buy Now</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <SearchRow key={p._id} product={p} />
        ))}
      </tbody>
    </table>
  );
}

function SearchRow({ product }: { product: SearchRowProduct }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { apiFetch } = useApi();
  const placeholder = product.productKind === "watch" ? WATCH_PLACEHOLDER : DIAMOND_PLACEHOLDER;
  const [imgSrc, setImgSrc] = useState(
    product.images?.[0] ? optimizedImageUrl(product.images[0], { width: 120 }) : "",
  );
  const [busy, setBusy] = useState(false);

  const href = `/products/${product.slug ?? product._id}`;
  const inStock = product.stock > 0;
  const hasMsrp = typeof product.msrp === "number" && product.msrp > product.price;
  const model = product.legacySku || product.watchModel || "";

  const buyNow = async () => {
    if (authLoading || busy || !inStock) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      cartEvents.refresh();
      router.push("/cart");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add to cart");
      setBusy(false);
    }
  };

  return (
    <tr className={inStock ? undefined : "is-out"}>
      <td className="csr-img">
        <Link href={href} prefetch={false} tabIndex={-1} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc || placeholder}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImgSrc(placeholder)}
          />
        </Link>
      </td>
      <td className="csr-model" data-label="Model">
        {model}
      </td>
      <td className="csr-name" data-label="Product Name">
        <Link href={href} prefetch={false}>
          {product.name}
        </Link>
      </td>
      <td className="csr-num" data-label="Price">
        {hasMsrp && <s>{money(product.msrp as number)}</s>}
        {money(product.price)}
      </td>
      <td className="csr-buy">
        <button type="button" onClick={buyNow} disabled={!inStock || busy}>
          {busy ? "Adding..." : inStock ? "Buy Now" : "Sold Out"}
        </button>
      </td>
    </tr>
  );
}
