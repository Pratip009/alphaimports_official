'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { wishlistEvents } from '@/hooks/useWishlist';
import { cartEvents } from '@/hooks/useCart';
import { optimizedImageUrl } from '@/lib/image-url';
import ClassicSidebar from '@/components/ui/ClassicSidebar';
import type { NavCategory } from '@/lib/getNavCategories';

interface WishlistProduct {
  _id: string;
  slug?: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
}

interface WishlistItem {
  product: WishlistProduct | null;
  addedAt: string;
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dateAdded = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

// ─── Classic styles (same vocabulary as the classic Shopping Cart page) ──────
const WISHLIST_CSS = `
  .wl-root { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #6b6b6b; background: #fff; min-height: 60vh; }
  .wl-root *, .wl-root *::before, .wl-root *::after { box-sizing: border-box; }
  .wl-root a { text-decoration: none; }
  .wl-layout {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 12px;
    padding: 6px 24px 40px;
    align-items: start;
  }
  .wl-main { min-width: 0; padding-top: 4px; }
  .wl-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .wl-title { font-size: 15px; font-weight: bold; color: #4f72a8; margin: 2px 0 8px; }
  .wl-count { color: #8a8a8a; }
  .wl-rule { border: 0; border-top: 2px solid #555; margin: 0 0 14px; }

  .wl-panel { border: 1px solid #a9b3cf; border-top-right-radius: 8px; background: #e8ebf3; margin-bottom: 16px; }
  .wl-panel-head {
    background: #a9b3cf; color: #fff; font-weight: bold; font-size: 11px;
    padding: 3px 10px; border-top-right-radius: 7px; margin: 0;
  }
  .wl-panel-body { padding: 10px; }

  .wl-table { width: 100%; border-collapse: collapse; background: #fff; }
  .wl-table th {
    background: #dfe2ea; color: #1c4874; font-weight: bold; text-align: left;
    padding: 5px 8px; border: 1px solid #c9cfdf; white-space: nowrap;
  }
  .wl-table td { padding: 8px; border: 1px solid #c9cfdf; vertical-align: middle; color: #333; }
  .wl-table .wl-num { text-align: right; white-space: nowrap; }
  .wl-table .wl-center { text-align: center; }
  .wl-row-busy { opacity: .55; }

  .wl-prod { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .wl-img {
    width: 60px; height: 60px; flex-shrink: 0; border: 1px solid #c9cfdf; background: #fff;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .wl-img img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .wl-img-none { font-size: 9px; color: #aaa; text-align: center; }
  .wl-name { font-weight: bold; color: #1c4874; line-height: 1.4; }
  .wl-name:hover { text-decoration: underline; }
  .wl-added { color: #8a8a8a; margin-top: 2px; }

  .wl-stock { font-weight: bold; white-space: nowrap; }
  .wl-stock.in { color: #227722; }
  .wl-stock.low { color: #c75000; }
  .wl-stock.out { color: #990000; }

  .wl-actions { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .wl-btn {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 22px; padding: 3px 14px;
    background: #c6cfe6; border: 1px solid #2b547e; color: #1c4874;
    font: inherit; font-size: 11px; font-weight: bold; text-decoration: none; cursor: pointer;
    white-space: nowrap;
  }
  .wl-btn:hover:not(:disabled) { background: #b5c0de; }
  .wl-btn:disabled { opacity: .45; cursor: default; }
  .wl-remove {
    background: none; border: 0; padding: 0; font: inherit; font-size: 10.5px;
    color: #c8102e; text-decoration: underline; cursor: pointer;
  }
  .wl-remove:disabled { opacity: .4; cursor: default; }

  .wl-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
  .wl-flash { margin: 0 0 10px; padding: 6px 10px; border: 1px solid #9fc59f; background: #eef7ee; color: #227722; }
  .wl-flash a { color: #1c4874; text-decoration: underline; }

  .wl-msg { padding: 14px 10px; text-align: center; line-height: 1.7; }
  .wl-error { color: #b00000; margin-bottom: 8px; }

  .wl-sk { background: #e3e6ee; animation: wlPulse 1.2s ease-in-out infinite; }
  @keyframes wlPulse { 50% { opacity: .5; } }

  @media (max-width: 900px) {
    .wl-layout { grid-template-columns: 1fr; padding: 8px 14px 32px; }
    .wl-main { order: 1; }
    .wl-layout > aside { order: 2; }
  }
  @media (max-width: 560px) {
    .wl-table thead { display: none; }
    .wl-table, .wl-table tbody, .wl-table tr, .wl-table td { display: block; width: 100%; }
    .wl-table tr { border: 1px solid #c9cfdf; margin-bottom: 8px; padding: 8px; }
    .wl-table td { border: 0; padding: 3px 0; }
    .wl-table .wl-num, .wl-table .wl-center { text-align: left; }
    .wl-table td[data-label]::before { content: attr(data-label) ": "; color: #8a8a8a; }
    .wl-actions { flex-direction: row; justify-content: flex-start; gap: 14px; margin-top: 4px; }
    .wl-btn { min-height: 30px; }
  }
`;

// ─── Frame (sidebar + content) ────────────────────────────────────────────────
function WishlistFrame({
  navCategories,
  children,
}: {
  navCategories: NavCategory[];
  children: React.ReactNode;
}) {
  return (
    <div className="wl-root">
      <style>{WISHLIST_CSS}</style>
      <div className="wl-layout">
        <ClassicSidebar categories={navCategories} />
        <div className="wl-main">{children}</div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function WishlistSkeleton() {
  return (
    <>
      <div className="wl-sk" style={{ height: 16, width: 140, margin: '4px 0 10px' }} />
      <hr className="wl-rule" />
      <div className="wl-panel">
        <div className="wl-panel-head">My Wish List</div>
        <div className="wl-panel-body">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: '1px solid #c9cfdf', padding: 8, marginBottom: 6 }}
            >
              <div className="wl-sk" style={{ width: 60, height: 60 }} />
              <div style={{ flex: 1 }}>
                <div className="wl-sk" style={{ height: 10, width: '60%', marginBottom: 6 }} />
                <div className="wl-sk" style={{ height: 10, width: '25%' }} />
              </div>
              <div className="wl-sk" style={{ height: 20, width: 90 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyWishlist() {
  return (
    <>
      <h1 className="wl-title">My Wish List</h1>
      <hr className="wl-rule" />
      <section className="wl-panel">
        <h2 className="wl-panel-head">What&apos;s in My Wish List?</h2>
        <div className="wl-panel-body">
          <div className="wl-msg">
            <p>Your Wish List is empty!</p>
            <p style={{ marginBottom: 10 }}>
              Click &quot;♡ Wishlist&quot; on any product to save it here for later.
            </p>
            <Link href="/products" className="wl-btn">Browse Collection</Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Wishlist row ─────────────────────────────────────────────────────────────
function WishlistRow({
  item,
  busy,
  onMove,
  onRemove,
}: {
  item: WishlistItem & { product: WishlistProduct };
  busy: boolean;
  onMove: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { product } = item;
  const href = `/products/${product.slug ?? product._id}`;
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 3;
  const added = dateAdded(item.addedAt);

  return (
    <tr className={busy ? 'wl-row-busy' : undefined}>
      <td>
        <div className="wl-prod">
          <Link href={href} className="wl-img" prefetch={false}>
            {product.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={optimizedImageUrl(product.images[0], { width: 140 })} alt={product.name} />
            ) : (
              <span className="wl-img-none">No image</span>
            )}
          </Link>
          <div style={{ minWidth: 0 }}>
            <Link href={href} className="wl-name" prefetch={false}>
              {product.name}
            </Link>
            {added && <div className="wl-added">Added {added}</div>}
          </div>
        </div>
      </td>
      <td className="wl-num" data-label="Price">
        <strong>{money(product.price)}</strong>
      </td>
      <td className="wl-center" data-label="Availability">
        <span className={`wl-stock ${!inStock ? 'out' : lowStock ? 'low' : 'in'}`}>
          {!inStock ? 'Sold Out' : lowStock ? `Only ${product.stock} left` : 'In Stock'}
        </span>
      </td>
      <td className="wl-center">
        <div className="wl-actions">
          <button
            type="button"
            className="wl-btn"
            onClick={() => onMove(product._id)}
            disabled={busy || !inStock}
          >
            {busy ? 'Please wait...' : inStock ? 'Move to Cart' : 'Sold Out'}
          </button>
          <button
            type="button"
            className="wl-remove"
            onClick={() => onRemove(product._id)}
            disabled={busy}
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WishlistClient({
  navCategories = [],
}: {
  // Display-only: category tree for the classic left sidebar.
  navCategories?: NavCategory[];
}) {
  const { apiFetch } = useApi();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [movedName, setMovedName] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/wishlist');
  }, [authLoading, user, router]);

  const fetchWishlist = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch('/api/wishlist');
      setItems(data.data.wishlist?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wish list');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!authLoading && user) fetchWishlist();
  }, [authLoading, user, fetchWishlist]);

  useEffect(() => {
    const handler = () => {
      if (user) fetchWishlist();
    };
    window.addEventListener('wishlist:refresh', handler);
    return () => window.removeEventListener('wishlist:refresh', handler);
  }, [user, fetchWishlist]);

  const remove = async (productId: string) => {
    setBusyId(productId);
    setActionError(null);
    setMovedName(null);
    try {
      await apiFetch(`/api/wishlist?productId=${productId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.product?._id !== productId));
      wishlistEvents.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setBusyId(null);
    }
  };

  const moveToCart = async (productId: string) => {
    const name = items.find((i) => i.product?._id === productId)?.product?.name ?? 'Item';
    setBusyId(productId);
    setActionError(null);
    setMovedName(null);
    try {
      await apiFetch('/api/wishlist/move-to-cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      setItems((prev) => prev.filter((i) => i.product?._id !== productId));
      setMovedName(name);
      wishlistEvents.refresh();
      cartEvents.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to move item to cart');
    } finally {
      setBusyId(null);
    }
  };

  // Guard against items whose product was deleted.
  const rows = items.filter(
    (i): i is WishlistItem & { product: WishlistProduct } => !!i.product,
  );

  if (authLoading || (loading && user)) {
    return (
      <WishlistFrame navCategories={navCategories}>
        <WishlistSkeleton />
      </WishlistFrame>
    );
  }
  if (!user) return null;
  if (error) {
    return (
      <WishlistFrame navCategories={navCategories}>
        <h1 className="wl-title">My Wish List</h1>
        <hr className="wl-rule" />
        <section className="wl-panel">
          <h2 className="wl-panel-head">What&apos;s in My Wish List?</h2>
          <div className="wl-panel-body">
            <div className="wl-msg">
              <p className="wl-error">{error}</p>
              <button type="button" onClick={fetchWishlist} className="wl-btn">
                Try Again
              </button>
            </div>
          </div>
        </section>
      </WishlistFrame>
    );
  }
  if (rows.length === 0) {
    return (
      <WishlistFrame navCategories={navCategories}>
        {movedName && (
          <p className="wl-flash" role="status">
            {movedName} was moved to your <Link href="/cart">Shopping Cart</Link>.
          </p>
        )}
        <EmptyWishlist />
      </WishlistFrame>
    );
  }

  return (
    <WishlistFrame navCategories={navCategories}>
      <div className="wl-title-row">
        <h1 className="wl-title">My Wish List</h1>
        <span className="wl-count">
          {rows.length} {rows.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      <hr className="wl-rule" />

      {movedName && (
        <p className="wl-flash" role="status">
          {movedName} was moved to your <Link href="/cart">Shopping Cart</Link>.
        </p>
      )}
      {actionError && (
        <p className="wl-flash" role="alert" style={{ borderColor: '#d9a0a0', background: '#fbeeee', color: '#b00000' }}>
          {actionError}
        </p>
      )}

      <section className="wl-panel">
        <h2 className="wl-panel-head">What&apos;s in My Wish List?</h2>
        <div className="wl-panel-body">
          <table className="wl-table">
            <thead>
              <tr>
                <th>Products</th>
                <th className="wl-num" style={{ width: 100 }}>Price</th>
                <th className="wl-center" style={{ width: 110 }}>Availability</th>
                <th className="wl-center" style={{ width: 130 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <WishlistRow
                  key={item.product._id}
                  item={item}
                  busy={busyId === item.product._id}
                  onMove={moveToCart}
                  onRemove={remove}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="wl-footer">
        <Link href="/products" className="wl-btn">Continue Shopping</Link>
      </div>
    </WishlistFrame>
  );
}