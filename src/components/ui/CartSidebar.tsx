"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useApi } from "@/hooks/useApi";
import { optimizedImageUrl } from "@/lib/image-url";
import { cartEvents } from "@/hooks/useCart";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images?: string[];
    price: number;
  };
  quantity: number;
  price: number;
}

interface CartData {
  items: CartItem[];
  totals?: {
    subtotal: number;
    total: number;
    shippingCost?: number;
  };
}

// ── CartSidebar ────────────────────────────────────────────────────────────────
export default function CartSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { apiFetch } = useApi();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Keep the panel/backdrop mounted for the duration of the close
  // animation instead of yanking them out of the DOM instantly.
  const [mounted, setMounted] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PANEL_TRANSITION_MS = 380;

  useEffect(() => {
    if (open) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      setMounted(true);
    } else if (mounted) {
      closeTimeoutRef.current = setTimeout(
        () => setMounted(false),
        PANEL_TRANSITION_MS,
      );
    }
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fetch cart whenever sidebar opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch("/api/cart")
      .then((d) => {
        setCart({
          // Defensive filter: guard against a stale/cached response that
          // still contains an item whose product was deleted.
          items: (d.data.cart.items || []).filter((item: CartItem) => !!item.product),
          totals: d.data.totals,
        });
      })
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [open, apiFetch]);

  // Lock body scroll while the panel is visible
  useEffect(() => {
    document.body.style.overflow = mounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  // Close on Escape, keep Tab focus inside the panel, and hand focus back
  // to whatever opened the cart once it closes.
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 60);
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const els = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (!els.length) return;
        const firstEl = els[0];
        const lastEl = els[els.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    window.addEventListener("keydown", handle);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handle);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  const updateQty = async (
    itemId: string,
    delta: number,
    currentQty: number,
    productId: string,
  ) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return removeItem(itemId, productId);

    // Optimistic update instantly
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item._id === itemId ? { ...item, quantity: newQty } : item,
        ),
      };
    });

    setUpdatingId(itemId);
    try {
      const d = await apiFetch("/api/cart", {
        method: "PUT",
        body: JSON.stringify({ productId, quantity: newQty }),
      });

      // Try all possible response shapes
      const cartData = d.data?.cart ?? d.data ?? d;
      const totals = d.data?.totals ?? d.totals ?? null;
      if (cartData?.items) {
        setCart({ items: cartData.items.filter((item: CartItem) => !!item.product), totals });
      }
      // Keep the navbar badge (useCart) in sync
      cartEvents.refresh();
    } catch {
      // Revert by re-fetching
      apiFetch("/api/cart").then((d) =>
        setCart({
          items: (d.data.cart.items || []).filter((item: CartItem) => !!item.product),
          totals: d.data.totals,
        }),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: string, productId: string) => {
    // Optimistic update instantly
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item._id !== itemId),
      };
    });

    setUpdatingId(itemId);
    try {
      const d = await apiFetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
      const cartData = d.data?.cart ?? d.data ?? d;
      const totals = d.data?.totals ?? d.totals ?? null;
      if (cartData?.items) {
        setCart({ items: cartData.items.filter((item: CartItem) => !!item.product), totals });
      }
    } catch (err) {
      console.error("Failed to remove cart item:", err);
      apiFetch("/api/cart").then((d) =>
        setCart({
          items: (d.data.cart.items || []).filter((item: CartItem) => !!item.product),
          totals: d.data.totals,
        }),
      );
    } finally {
      // Always fire this so the navbar badge never shows a stale count.
      cartEvents.refresh();
      setUpdatingId(null);
    }
  };

  const items = (cart?.items ?? []).filter((item) => !!item.product);
  const pieceCount = items.reduce((n, item) => n + item.quantity, 0);
  // While an optimistic update is in flight the server totals lag behind
  // the edited quantities, so derive the figure from the lines themselves.
  const computedSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const subtotal =
    updatingId || cart?.totals?.subtotal == null
      ? computedSubtotal
      : cart.totals.subtotal;

  const money = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

  return (
    <>
      <style>{CART_CSS}</style>

      {/* Backdrop — stays mounted through the close animation. */}
      {mounted && (
        <div
          ref={overlayRef}
          className="cs-backdrop"
          style={{
            opacity: open ? 1 : 0,
            transition: `opacity ${PANEL_TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
          }}
          onClick={onClose}
        />
      )}

      {mounted && (
        <aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cs-title"
          className="cs-panel"
          style={{
            transform: open ? "translateX(0)" : "translateX(100%)",
            transition: `transform ${PANEL_TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
          }}
        >
          {/* Header */}
          <header className="cs-header">
            <h2 id="cs-title" className="cs-title">
              Your cart
              {!loading && pieceCount > 0 && (
                <span className="cs-count">
                  {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
                </span>
              )}
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close cart"
              className="cs-close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          {/* Body */}
          <div className="cs-body">
            {loading && (
              <div aria-busy="true" aria-label="Loading your cart">
                {[0, 1, 2].map((i) => (
                  <div key={`sk-${i}`} className="cs-line">
                    <div className="cs-shimmer cs-thumb" />
                    <div className="cs-line-main">
                      <div className="cs-shimmer" style={{ height: 14, width: "80%" }} />
                      <div className="cs-shimmer" style={{ height: 12, width: "35%", marginTop: 8 }} />
                      <div className="cs-shimmer" style={{ height: 32, width: 104, marginTop: 14 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="cs-empty">
                <svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path d="M14 8h20l8 10-18 22L6 18l8-10z" stroke="#c9b48a" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M6 18h36M18 8l-4 10 10 22M30 8l4 10-10 22M14 18l10-10 10 10" stroke="#c9b48a" strokeWidth="1" strokeLinejoin="round" opacity="0.7" />
                </svg>
                <p className="cs-empty-title">Your cart is empty</p>
                <p className="cs-empty-text">
                  Pieces you add from the catalog will appear here, ready for checkout.
                </p>
                <Link href="/products" onClick={onClose} className="cs-btn cs-btn-primary cs-empty-cta">
                  Browse the catalog
                </Link>
              </div>
            )}

            {!loading && items.length > 0 && (
              <ul className="cs-list">
                {items.map((item, index) => {
                  const isUpdating = updatingId === item._id;
                  const imgSrc = item.product.images?.[0];
                  return (
                    <li
                      key={item._id ?? `item-${index}`}
                      className={`cs-line ${isUpdating ? "is-updating" : ""}`}
                      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                    >
                      <div className="cs-thumb">
                        {imgSrc ? (
                          <img
                            src={optimizedImageUrl(imgSrc, { width: 200 })}
                            alt=""
                            draggable={false}
                          />
                        ) : (
                          <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                            <path d="M14 8h20l8 10-18 22L6 18l8-10z" stroke="#c9b48a" strokeWidth="2" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      <div className="cs-line-main">
                        <div className="cs-line-top">
                          <p className="cs-name">{item.product.name}</p>
                          <p className="cs-linetotal">{money(item.price * item.quantity)}</p>
                        </div>
                        {item.quantity > 1 && (
                          <p className="cs-unit">{money(item.price)} each</p>
                        )}

                        <div className="cs-line-bottom">
                          <div className="cs-stepper" role="group" aria-label={`Quantity of ${item.product.name}`}>
                            <button
                              type="button"
                              onClick={() => updateQty(item._id, -1, item.quantity, item.product._id)}
                              disabled={isUpdating}
                              aria-label={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                                <path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </button>
                            <span aria-live="polite">
                              {isUpdating ? <span className="cs-spin" aria-label="Updating" /> : item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(item._id, 1, item.quantity, item.product._id)}
                              disabled={isUpdating}
                              aria-label="Increase quantity"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                                <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>

                          <button
                            type="button"
                            className="cs-remove"
                            onClick={() => removeItem(item._id, item.product._id)}
                            disabled={!!updatingId}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {!loading && items.length > 0 && (
            <footer className="cs-footer">
              <dl className="cs-sums">
                <div>
                  <dt>Subtotal</dt>
                  <dd className="cs-subtotal">{money(subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd className="cs-muted">Calculated at checkout</dd>
                </div>
              </dl>

              <Link href="/checkout" onClick={onClose} className="cs-btn cs-btn-primary">
                Check out
              </Link>
              <div className="cs-footer-links">
                <Link href="/cart" onClick={onClose} className="cs-link">
                  View full cart
                </Link>
                <button type="button" onClick={onClose} className="cs-link">
                  Keep browsing
                </button>
              </div>
            </footer>
          )}
        </aside>
      )}
    </>
  );
}

const CART_CSS = `
  .cs-backdrop {
    position: fixed;
    inset: 0;
    z-index: 998;
    background: rgba(29, 28, 26, 0.45);
  }

  .cs-panel {
    --cs-paper: #ffffff;
    --cs-tray: #f5f3ee;
    --cs-ink: #1d1c1a;
    --cs-ink-soft: #57534c;
    --cs-muted: #7d776c;
    --cs-line: #e7e2d8;
    --cs-gold: #86662c;
    --cs-gold-line: #c9b48a;
    --cs-oxblood: #9c3b45;

    position: fixed;
    top: 0;
    right: 0;
    z-index: 999;
    height: 100%;
    height: 100dvh;
    width: min(440px, 100vw);
    display: flex;
    flex-direction: column;
    background: var(--cs-paper);
    color: var(--cs-ink);
    font-family: "Elms Sans", system-ui, sans-serif;
    box-shadow: -24px 0 60px -30px rgba(29, 28, 26, 0.4);
    will-change: transform;
  }

  .cs-panel :focus-visible {
    outline: 2px solid var(--cs-gold);
    outline-offset: 2px;
  }

  /* Header */
  .cs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 0 18px;
    margin: 0 24px;
    border-bottom: 1px solid var(--cs-ink);
    flex-shrink: 0;
  }
  .cs-title {
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .cs-count {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0;
    color: var(--cs-muted);
  }
  .cs-close {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid var(--cs-line);
    background: var(--cs-paper);
    color: var(--cs-ink-soft);
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.15s, border-color 0.15s;
  }
  .cs-close:hover { color: var(--cs-ink); border-color: var(--cs-gold-line); }

  /* Body */
  .cs-body {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 24px;
    -webkit-overflow-scrolling: touch;
  }

  .cs-list { list-style: none; margin: 0; padding: 0; }

  @keyframes cs-line-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
  }

  .cs-line {
    display: flex;
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid var(--cs-line);
    animation: cs-line-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    transition: opacity 0.2s;
  }
  .cs-line:last-child { border-bottom: 0; }
  .cs-line.is-updating { opacity: 0.6; }

  .cs-thumb {
    width: 84px;
    height: 84px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    padding: 8px;
    border-radius: 4px;
    background: var(--cs-tray);
  }
  .cs-thumb img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }

  .cs-line-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .cs-line-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .cs-name {
    margin: 0;
    font-size: 14.5px;
    font-weight: 600;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .cs-linetotal {
    margin: 0;
    font-size: 14.5px;
    font-weight: 600;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .cs-unit {
    margin: 4px 0 0;
    font-size: 12.5px;
    color: var(--cs-muted);
    font-variant-numeric: tabular-nums;
  }

  .cs-line-bottom {
    margin-top: auto;
    padding-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .cs-stepper {
    display: inline-flex;
    align-items: center;
    height: 34px;
    border: 1px solid var(--cs-line);
    border-radius: 4px;
  }
  .cs-stepper button {
    width: 34px;
    height: 100%;
    display: grid;
    place-items: center;
    background: none;
    border: 0;
    color: var(--cs-ink);
    cursor: pointer;
  }
  .cs-stepper button:hover:not(:disabled) { color: var(--cs-gold); }
  .cs-stepper button:disabled { color: #c9c4ba; cursor: not-allowed; }
  .cs-stepper > span {
    min-width: 26px;
    display: grid;
    place-items: center;
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  @keyframes cs-rot { to { transform: rotate(360deg); } }
  .cs-spin {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 2px solid var(--cs-line);
    border-top-color: var(--cs-ink);
    animation: cs-rot 0.7s linear infinite;
  }

  .cs-remove {
    background: none;
    border: 0;
    padding: 4px 0;
    font: inherit;
    font-size: 13px;
    color: var(--cs-muted);
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    cursor: pointer;
    transition: color 0.15s, text-decoration-color 0.15s;
  }
  .cs-remove:hover:not(:disabled) {
    color: var(--cs-oxblood);
    text-decoration-color: currentColor;
  }
  .cs-remove:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Skeleton */
  @keyframes cs-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .cs-shimmer {
    border-radius: 4px;
    background: linear-gradient(90deg, #f3f0ea 25%, #e9e5dc 50%, #f3f0ea 75%);
    background-size: 200% 100%;
    animation: cs-shimmer 1.4s ease infinite;
  }

  /* Empty state */
  .cs-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 72px 16px;
  }
  .cs-empty-title {
    margin: 20px 0 6px;
    font-size: 18px;
    font-weight: 600;
  }
  .cs-empty-text {
    margin: 0;
    max-width: 30ch;
    font-size: 14px;
    line-height: 1.55;
    color: var(--cs-ink-soft);
  }
  .cs-empty-cta { margin-top: 24px; width: auto; padding: 0 28px; }

  /* Footer */
  .cs-footer {
    flex-shrink: 0;
    padding: 18px 24px calc(22px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--cs-line);
    background: var(--cs-paper);
  }
  .cs-sums { margin: 0 0 16px; }
  .cs-sums > div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 3px 0;
    font-size: 14px;
  }
  .cs-sums dt { color: var(--cs-ink-soft); }
  .cs-sums dd { margin: 0; font-variant-numeric: tabular-nums; }
  .cs-subtotal { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
  .cs-muted { color: var(--cs-muted); font-size: 13px; }

  .cs-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 50px;
    border-radius: 4px;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.18s;
  }
  .cs-btn-primary { background: var(--cs-ink); color: #fff; }
  .cs-btn-primary:hover { background: #3a3833; }

  .cs-footer-links {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 14px;
  }
  .cs-link {
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    color: var(--cs-ink);
    text-decoration: underline;
    text-decoration-color: var(--cs-gold-line);
    text-underline-offset: 4px;
    cursor: pointer;
  }
  .cs-link:hover { text-decoration-color: var(--cs-gold); }

  @media (max-width: 480px) {
    .cs-header { margin: 0 18px; }
    .cs-body { padding: 0 18px; }
    .cs-footer { padding-left: 18px; padding-right: 18px; }
    .cs-thumb { width: 72px; height: 72px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cs-panel, .cs-backdrop { transition: none !important; }
    .cs-line { animation: none; }
    .cs-shimmer { animation: none; }
  }
`;