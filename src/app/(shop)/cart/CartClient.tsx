'use client';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cartEvents } from '@/hooks/useCart';
import ClassicSidebar from '@/components/ui/ClassicSidebar';
import type { NavCategory } from '@/lib/getNavCategories';

interface CartItem {
  product: { _id: string; name: string; images: string[]; price: number; stock: number };
  quantity: number;
  price: number;
}

interface Totals {
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
}

// ─── Classic styles ───────────────────────────────────────────────────────────
const CART_CSS = `
  .ct-root { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #6b6b6b; background: #fff; min-height: 60vh; }
  .ct-root *, .ct-root *::before, .ct-root *::after { box-sizing: border-box; }
  .ct-layout {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 12px;
    padding: 6px 24px 40px;
    align-items: start;
  }
  .ct-main { min-width: 0; padding-top: 4px; }
  .ct-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .ct-title { font-size: 15px; font-weight: bold; color: #4f72a8; margin: 2px 0 8px; }
  .ct-count { color: #8a8a8a; }
  .ct-rule { border: 0; border-top: 2px solid #555; margin: 0 0 14px; }

  .ct-panel { border: 1px solid #a9b3cf; border-top-right-radius: 8px; background: #e8ebf3; margin-bottom: 16px; }
  .ct-panel-head {
    background: #a9b3cf; color: #fff; font-weight: bold; font-size: 11px;
    padding: 3px 10px; border-top-right-radius: 7px; margin: 0;
  }
  .ct-panel-body { padding: 10px; }

  .ct-table { width: 100%; border-collapse: collapse; background: #fff; }
  .ct-table th {
    background: #dfe2ea; color: #1c4874; font-weight: bold; text-align: left;
    padding: 5px 8px; border: 1px solid #c9cfdf; white-space: nowrap;
  }
  .ct-table td { padding: 8px; border: 1px solid #c9cfdf; vertical-align: middle; color: #333; }
  .ct-table .ct-num { text-align: right; white-space: nowrap; }
  .ct-table .ct-center { text-align: center; }
  .ct-row-busy { opacity: .55; }

  .ct-prod { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .ct-img {
    width: 60px; height: 60px; flex-shrink: 0; border: 1px solid #c9cfdf; background: #fff;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .ct-img img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .ct-img-none { font-size: 9px; color: #aaa; text-align: center; }
  .ct-name { font-weight: bold; color: #1c4874; line-height: 1.4; }
  .ct-each { color: #8a8a8a; margin-top: 2px; }

  .ct-qty { display: inline-flex; align-items: stretch; }
  .ct-qty button {
    width: 20px; height: 20px; padding: 0; border: 1px solid #2b547e; background: #c6cfe6;
    color: #1c4874; font: inherit; font-weight: bold; font-size: 12px; line-height: 1; cursor: pointer;
  }
  .ct-qty button:hover:not(:disabled) { background: #b5c0de; }
  .ct-qty button:disabled { opacity: .35; cursor: default; }
  .ct-qty span {
    min-width: 30px; height: 20px; display: inline-flex; align-items: center; justify-content: center;
    border-top: 1px solid #333; border-bottom: 1px solid #333; background: #fff; color: #000;
  }
  .ct-remove {
    background: none; border: 0; padding: 0; font: inherit; font-size: 10.5px;
    color: #c8102e; text-decoration: underline; cursor: pointer;
  }
  .ct-remove:disabled { opacity: .4; cursor: default; }

  .ct-bottom { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; align-items: start; }
  .ct-totals { width: 100%; border-collapse: collapse; background: #fff; }
  .ct-totals th, .ct-totals td { padding: 5px 10px; border: 1px solid #c9cfdf; }
  .ct-totals th { text-align: left; font-weight: normal; color: #555; background: #f4f5f9; }
  .ct-totals td { text-align: right; color: #333; font-weight: bold; white-space: nowrap; }
  .ct-totals .ct-muted { font-weight: normal; font-style: italic; color: #8a8a8a; }
  .ct-totals tr.ct-grand th, .ct-totals tr.ct-grand td { font-weight: bold; color: #000; font-size: 12px; background: #dfe2ea; }

  .ct-btn {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 22px; padding: 3px 14px;
    background: #c6cfe6; border: 1px solid #2b547e; color: #1c4874;
    font: inherit; font-size: 11px; font-weight: bold; text-decoration: none; cursor: pointer;
  }
  .ct-btn:hover { background: #b5c0de; }
  .ct-btn.is-red { background: #c8102e; border-color: #8f0a20; color: #fff; }
  .ct-btn.is-red:hover { background: #a90d27; }
  .ct-checkout { margin-top: 10px; display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
  .ct-checkout .ct-btn { min-height: 28px; font-size: 12px; }
  .ct-note { text-align: center; font-size: 10px; color: #8a8a8a; }
  .ct-continue { padding-top: 2px; }

  .ct-msg { padding: 14px 10px; text-align: center; line-height: 1.7; }
  .ct-error { color: #b00000; margin-bottom: 8px; }

  .ct-sk { background: #e3e6ee; animation: ctPulse 1.2s ease-in-out infinite; }
  @keyframes ctPulse { 50% { opacity: .5; } }

  @media (max-width: 900px) {
    .ct-layout { grid-template-columns: 1fr; padding: 8px 14px 32px; }
    .ct-main { order: 1; }
    .ct-layout > aside { order: 2; }
  }
  @media (max-width: 700px) {
    .ct-bottom { grid-template-columns: 1fr; }
    .ct-continue { order: 2; text-align: center; }
  }
  @media (max-width: 560px) {
    .ct-table thead { display: none; }
    .ct-table, .ct-table tbody, .ct-table tr, .ct-table td { display: block; width: 100%; }
    .ct-table tr { border: 1px solid #c9cfdf; margin-bottom: 8px; padding: 8px; }
    .ct-table td { border: 0; padding: 3px 0; }
    .ct-table .ct-num, .ct-table .ct-center { text-align: left; }
    .ct-table td[data-label]::before { content: attr(data-label) ": "; color: #8a8a8a; }
    .ct-qty button { width: 30px; height: 30px; }
    .ct-qty span { height: 30px; }
  }
`;

// ─── Frame (sidebar + content) ────────────────────────────────────────────────
function CartFrame({
  navCategories,
  children,
}: {
  navCategories: NavCategory[];
  children: React.ReactNode;
}) {
  return (
    <div className="ct-root">
      <style>{CART_CSS}</style>
      <div className="ct-layout">
        <ClassicSidebar categories={navCategories} />
        <div className="ct-main">{children}</div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CartSkeleton() {
  return (
    <>
      <div className="ct-sk" style={{ height: 16, width: 160, margin: '4px 0 10px' }} />
      <hr className="ct-rule" />
      <div className="ct-panel">
        <div className="ct-panel-head">Shopping Cart</div>
        <div className="ct-panel-body">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: '1px solid #c9cfdf', padding: 8, marginBottom: 6 }}>
              <div className="ct-sk" style={{ width: 60, height: 60 }} />
              <div style={{ flex: 1 }}>
                <div className="ct-sk" style={{ height: 10, width: '60%', marginBottom: 6 }} />
                <div className="ct-sk" style={{ height: 10, width: '25%' }} />
              </div>
              <div className="ct-sk" style={{ height: 20, width: 70 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <>
      <h1 className="ct-title">Shopping Cart</h1>
      <hr className="ct-rule" />
      <section className="ct-panel">
        <h2 className="ct-panel-head">What&apos;s in My Cart?</h2>
        <div className="ct-panel-body">
          <div className="ct-msg">
            <p>Your Shopping Cart is empty!</p>
            <p style={{ marginBottom: 10 }}>Discover our collection of fine diamonds &amp; gemstones.</p>
            <Link href="/products" className="ct-btn">Browse Collection</Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Cart row ─────────────────────────────────────────────────────────────────
function CartRow({
  item,
  onUpdate,
  onRemove,
  updating,
}: {
  item: CartItem;
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  updating: string | null;
}) {
  const isUpdating = updating === item.product._id;

  return (
    <tr className={isUpdating ? 'ct-row-busy' : undefined}>
      <td>
        <div className="ct-prod">
          <div className="ct-img">
            {item.product?.images?.[0] ? (
              <img src={item.product.images[0]} alt={item.product.name} />
            ) : (
              <span className="ct-img-none">No image</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="ct-name">{item.product.name}</div>
            <div className="ct-each">${item.price.toLocaleString()} each</div>
          </div>
        </div>
      </td>
      <td className="ct-center" data-label="Qty">
        <div className="ct-qty">
          <button
            type="button"
            onClick={() => onUpdate(item.product._id, item.quantity - 1)}
            disabled={isUpdating || item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span>{item.quantity}</span>
          <button
            type="button"
            onClick={() => onUpdate(item.product._id, item.quantity + 1)}
            disabled={isUpdating || item.quantity >= item.product.stock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </td>
      <td className="ct-num" data-label="Total">
        <strong>${(item.price * item.quantity).toLocaleString()}</strong>
      </td>
      <td className="ct-center">
        <button
          type="button"
          className="ct-remove"
          onClick={() => onRemove(item.product._id)}
          disabled={isUpdating}
          title="Remove"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CartPage({
  navCategories = [],
}: {
  // Display-only: category tree for the classic left sidebar.
  navCategories?: NavCategory[];
}) {
  const { apiFetch } = useApi();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/cart');
  }, [authLoading, user, router]);

  const fetchCart = async () => {
    try {
      const data = await apiFetch('/api/cart');
      const rawItems: CartItem[] = data.data.cart?.items || [];
      // Defensive filter: the backend already strips items whose product
      // was deleted, but guard here too in case of stale/cached responses.
      setItems(rawItems.filter((item) => !!item.product));
      setTotals(data.data.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchCart();
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateQty = async (productId: string, quantity: number) => {
    setUpdating(productId);
    try {
      await apiFetch('/api/cart', {
        method: 'PUT',
        body: JSON.stringify({ productId, quantity }),
      });
      await fetchCart();
      cartEvents.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const remove = async (productId: string) => {
    setUpdating(productId);
    try {
      await apiFetch(`/api/cart?productId=${productId}`, { method: 'DELETE' });
      await fetchCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <CartFrame navCategories={navCategories}>
        <CartSkeleton />
      </CartFrame>
    );
  }
  if (!user) return null;
  if (error) {
    return (
      <CartFrame navCategories={navCategories}>
        <h1 className="ct-title">Shopping Cart</h1>
        <hr className="ct-rule" />
        <section className="ct-panel">
          <h2 className="ct-panel-head">What&apos;s in My Cart?</h2>
          <div className="ct-panel-body">
            <div className="ct-msg">
              <p className="ct-error">{error}</p>
              <button type="button" onClick={fetchCart} className="ct-btn">
                Try Again
              </button>
            </div>
          </div>
        </section>
      </CartFrame>
    );
  }
  if (items.length === 0) {
    return (
      <CartFrame navCategories={navCategories}>
        <EmptyCart />
      </CartFrame>
    );
  }

  return (
    <CartFrame navCategories={navCategories}>
      <div className="ct-title-row">
        <h1 className="ct-title">Shopping Cart</h1>
        <span className="ct-count">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      <hr className="ct-rule" />

      <section className="ct-panel">
        <h2 className="ct-panel-head">What&apos;s in My Cart?</h2>
        <div className="ct-panel-body">
          <table className="ct-table">
            <thead>
              <tr>
                <th>Products</th>
                <th className="ct-center" style={{ width: 110 }}>Qty.</th>
                <th className="ct-num" style={{ width: 100 }}>Total</th>
                <th className="ct-center" style={{ width: 80 }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <CartRow
                  key={item.product._id}
                  item={item}
                  onUpdate={updateQty}
                  onRemove={remove}
                  updating={updating}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ct-bottom">
        <div className="ct-continue">
          <Link href="/products" className="ct-btn">
            Continue Shopping
          </Link>
        </div>

        {totals && (
          <section className="ct-panel" style={{ marginBottom: 0 }}>
            <h2 className="ct-panel-head">Order Summary</h2>
            <div className="ct-panel-body">
              <table className="ct-totals">
                <tbody>
                  <tr>
                    <th>Sub-Total:</th>
                    <td>${totals.subtotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Tax:</th>
                    <td>${totals.tax.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th>Shipping:</th>
                    <td className="ct-muted">Calculated at checkout</td>
                  </tr>
                  <tr className="ct-grand">
                    <th>Total:</th>
                    <td>${(totals.subtotal + totals.tax).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="ct-checkout">
                <Link href="/checkout" className="ct-btn is-red">
                  Proceed to Checkout
                </Link>
                <p className="ct-note">🔒 Secure checkout | Free returns</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </CartFrame>
  );
}