"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import OrderTracking from "@/components/shipping/OrderTracking";
import ClassicSidebar from "@/components/ui/ClassicSidebar";
import type { NavCategory } from "@/lib/getNavCategories";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface Order {
  _id: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  serviceFee?: number;

  tax: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingCarrier?: string | null;
  shippingService?: string | null;
  shippingServiceCode?: string | null;
  shippingRate?: number;
  shippingEstimatedDelivery?: string | null;
  shippingEstimatedDays?: number | null;
  shippingRateId?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  labelId?: string | null;
  labelUrl?: string | null;
  shippedAt?: string | null;
  fedex?: {
    trackingNumber: string;
    serviceType: string;
    estimatedDelivery?: string;
  } | null;
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: { label: "Pending", bg: "#fff8d6", text: "#6b5200", border: "#e0c36a" },
  paid: { label: "Paid", bg: "#eef6ee", text: "#1d5e1d", border: "#1d7a1d" },
  processing: { label: "Processing", bg: "#e8ebf3", text: "#1c4874", border: "#a9b3cf" },
  shipped: { label: "Shipped", bg: "#e8ebf3", text: "#1c4874", border: "#2b547e" },
  delivered: { label: "Delivered", bg: "#eef6ee", text: "#1d5e1d", border: "#1d7a1d" },
  cancelled: { label: "Cancelled", bg: "#fbecec", text: "#b00000", border: "#d9a3a3" },
  refunded: { label: "Refunded", bg: "#f4f5f9", text: "#555555", border: "#b5b5b5" },
};

const STEPS = ["pending", "processing", "shipped", "delivered"] as const;
const STEP_LABELS = ["Placed", "Processing", "Shipped", "Delivered"];

// ─── Classic styles ───────────────────────────────────────────────────────────
const ORDERS_CSS = `
  @keyframes orSpin { to { transform: rotate(360deg); } }
  .or { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #6b6b6b; background: #fff; min-height: 60vh; }
  .or *, .or *::before, .or *::after { box-sizing: border-box; }
  .or p { margin: 0; }
  .or-layout { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 12px; padding: 6px 24px 40px; align-items: start; }
  .or-main { min-width: 0; padding-top: 4px; }
  .or-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .or-title { font-size: 15px; font-weight: bold; color: #4f72a8; margin: 2px 0; }
  .or-sub { color: #8a8a8a; }
  .or-rule { border: 0; border-top: 2px solid #555; margin: 8px 0 12px; }

  .or-stats { display: inline-flex; border: 1px solid #a9b3cf; margin-bottom: 12px; background: #fff; flex-wrap: wrap; }
  .or-stat { padding: 4px 14px; border-left: 1px solid #c9cfdf; }
  .or-stat:first-child { border-left: 0; }
  .or-stat span { color: #8a8a8a; margin-right: 6px; }
  .or-stat strong { color: #000; }

  .or-success { border: 1px solid #1d7a1d; background: #eef6ee; color: #1d5e1d; padding: 6px 10px; margin-bottom: 12px; line-height: 1.6; }
  .or-success strong { color: #1d5e1d; }

  .or-panel { border: 1px solid #a9b3cf; border-top-right-radius: 8px; background: #e8ebf3; margin-bottom: 14px; }
  .or-panel-head {
    background: #a9b3cf; color: #fff; font-weight: bold; font-size: 11px;
    padding: 3px 10px; border-top-right-radius: 7px; margin: 0;
    display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  }
  .or-panel-head span { font-weight: normal; }
  .or-panel-body { padding: 10px; }

  .or-table { width: 100%; border-collapse: collapse; background: #fff; }
  .or-table th, .or-table td { border: 1px solid #c9cfdf; padding: 5px 8px; text-align: left; vertical-align: middle; }
  .or-table th { background: #dfe2ea; color: #1c4874; font-weight: bold; white-space: nowrap; }
  .or-table td { color: #333; }
  .or-table .or-num { text-align: right; white-space: nowrap; }
  .or-id { font-weight: bold; color: #1c4874; letter-spacing: .05em; }
  .or-total { font-weight: bold; font-size: 12px; color: #000; }

  .or-badge { display: inline-block; padding: 1px 6px; border: 1px solid; font-size: 10px; font-weight: bold; margin: 1px 4px 1px 0; white-space: nowrap; }

  .or-track { display: flex; margin-top: 8px; border: 1px solid #a9b3cf; }
  .or-track div { flex: 1; text-align: center; padding: 3px 4px; font-weight: bold; color: #9a9a9a; background: #f4f5f9; border-left: 1px solid #a9b3cf; white-space: nowrap; }
  .or-track div:first-child { border-left: 0; }
  .or-track div.is-done { color: #1d5e1d; background: #eef6ee; }
  .or-track div.is-active { color: #fff; background: linear-gradient(to bottom, #164472 0px, #0d3b6c 3px, #2b547e 100%); }

  .or-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    min-height: 22px; padding: 3px 14px;
    background: #c6cfe6; border: 1px solid #2b547e; color: #1c4874;
    font: inherit; font-size: 11px; font-weight: bold; text-decoration: none; cursor: pointer;
  }
  .or-btn:hover { background: #b5c0de; }
  .or-btn.is-dark { background: #1c4874; color: #fff; border-color: #0d3b6c; }
  .or-btn.is-dark:hover { background: #0d3b6c; }
  .or-actions { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }

  .or-details { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 12px; margin-top: 10px; }
  .or-box { background: #fff; border: 1px solid #c9cfdf; }
  .or-box-head { background: #dfe2ea; color: #1c4874; font-weight: bold; padding: 4px 8px; }
  .or-box-body { padding: 8px; line-height: 1.6; color: #333; }
  .or-box-body strong { color: #000; }
  .or-side { display: flex; flex-direction: column; gap: 12px; }
  .or-link { color: #1c4874; font-weight: bold; }
  .or-sum th { font-weight: normal; color: #555; background: #f4f5f9; }
  .or-sum tr.or-grand th, .or-sum tr.or-grand td { font-weight: bold; color: #000; background: #dfe2ea; font-size: 12px; }

  .or-ship { margin-top: 10px; background: #fff; border: 1px solid #c9cfdf; padding: 6px 8px; }
  .or-ship-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .or-ship-info { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; color: #333; }
  .or-carrier { background: #1c4874; color: #fff; font-weight: bold; padding: 1px 6px; }
  .or-tn { font-family: "Courier New", monospace; color: #000; }
  .or-ship-meta { margin-top: 4px !important; color: #8a8a8a; }
  .or-ship-meta b { color: #333; }
  .or-prep { margin-top: 10px; padding: 5px 8px; border: 1px solid #e0c36a; background: #fff8d6; color: #6b5200; }
  .or-tracking { margin-top: 8px; }

  .or-empty { padding: 14px 10px; text-align: center; line-height: 1.8; }
  .or-loading { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 40px 10px; color: #1c4874; font-weight: bold; }
  .or-spinner { width: 14px; height: 14px; border: 2px solid rgba(28,72,116,.25); border-top-color: #1c4874; border-radius: 50%; animation: orSpin .7s linear infinite; }

  @media (max-width: 900px) {
    .or-layout { grid-template-columns: 1fr; padding: 8px 14px 32px; }
    .or-main { order: 1; }
    .or-layout > aside { order: 2; }
    .or-details { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .or-summary thead { display: none; }
    .or-summary, .or-summary tbody, .or-summary tr, .or-summary td { display: block; width: 100%; }
    .or-summary td { border-top: 0; text-align: left !important; }
    .or-summary tr td:first-child { border-top: 1px solid #c9cfdf; }
    .or-summary td[data-label]::before { content: attr(data-label) ": "; color: #8a8a8a; font-weight: normal; }
    .or-track { font-size: 9.5px; }
  }
`;

// ─── Components ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "#f4f5f9",
    text: "#333333",
    border: "#b5b5b5",
  };
  return (
    <span
      className="or-badge"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

function ProgressTrack({ status }: { status: string }) {
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);
  if (current < 0) return null;

  return (
    <div className="or-track">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step} className={active ? "is-active" : done ? "is-done" : undefined}>
            {done && !active ? "✓ " : ""}
            {STEP_LABELS[i]}
          </div>
        );
      })}
    </div>
  );
}

function ShipmentPanel({ order }: { order: Order }) {
  const [tracking, setTracking] = useState(false);
  const tn = order.trackingNumber ?? order.fedex?.trackingNumber ?? null;
  const carrier = order.shippingCarrier ?? (order.fedex ? "FedEx" : null);

  if (!order.shippingRateId && !tn) {
    if (["paid", "processing"].includes(order.status)) {
      return (
        <p className="or-prep">
          Preparing your shipment — tracking info will appear here once
          dispatched.
        </p>
      );
    }
    return null;
  }

  return (
    <div className="or-ship">
      <div className="or-ship-row">
        <div className="or-ship-info">
          {carrier && <span className="or-carrier">{carrier}</span>}
          {order.shippingService && <span>{order.shippingService}</span>}
          {tn && (
            <span>
              Tracking #: <span className="or-tn">{tn}</span>
            </span>
          )}
        </div>
        <div className="or-actions" style={{ marginTop: 0 }}>
          {order.labelUrl && (
            <a
              href={order.labelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="or-btn"
            >
              Print Label
            </a>
          )}
          {order.labelId && (
            <button
              onClick={() => setTracking((t) => !t)}
              className={`or-btn${tracking ? "" : " is-dark"}`}
            >
              {tracking ? "Close tracking" : "Track package"}
            </button>
          )}
        </div>
      </div>

      {(order.shippingEstimatedDelivery || order.shippedAt) && (
        <p className="or-ship-meta">
          {order.shippingEstimatedDelivery && (
            <>
              Est. delivery: <b>{order.shippingEstimatedDelivery}</b>
            </>
          )}
          {order.shippingEstimatedDelivery && order.shippedAt && " | "}
          {order.shippedAt && (
            <>
              Shipped{" "}
              <b>
                {new Date(order.shippedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </b>
            </>
          )}
        </p>
      )}

      {tracking && order.labelId && tn && (
        <div className="or-tracking">
          <OrderTracking
            labelId={order.labelId}
            trackingNumber={tn}
            trackingUrl={order.trackingUrl ?? undefined}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function OrdersPage({
  navCategories = [],
}: {
  // Display-only: category tree for the classic left sidebar.
  navCategories?: NavCategory[];
}) {
  const { apiFetch } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const success = searchParams.get("success");

  useEffect(() => {
    apiFetch("/api/orders")
      .then((d) => setOrders(d.data || []))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalItems = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="or">
        <style>{ORDERS_CSS}</style>
        <div className="or-layout">
          <ClassicSidebar categories={navCategories} />
          <div className="or-main">
            <h1 className="or-title">My Order History</h1>
            <hr className="or-rule" />
            <div className="or-loading">
              <span className="or-spinner" /> Loading your orders…
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="or">
      <style>{ORDERS_CSS}</style>
      <div className="or-layout">
        <ClassicSidebar categories={navCategories} />

        <div className="or-main">
          {/* ── Page header ──────────────────────────────────────────────────── */}
          <div className="or-title-row">
            <h1 className="or-title">My Order History</h1>
            <span className="or-sub">
              {orders.length === 0
                ? "No purchases yet"
                : `${orders.length} order${orders.length !== 1 ? "s" : ""} | ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            </span>
          </div>
          <hr className="or-rule" />

          {orders.length > 0 && (
            <div className="or-stats">
              {[
                {
                  label: "Total spent:",
                  value: `$${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                },
                { label: "Orders:", value: String(orders.length) },
                { label: "Items:", value: String(totalItems) },
              ].map(({ label, value }) => (
                <div key={label} className="or-stat">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          )}

          {/* ── Success banner ───────────────────────────────────────────────── */}
          {success && (
            <div className="or-success">
              <strong>✓ Payment confirmed.</strong> Your order is placed. A
              tracking number will appear here once your package ships.
            </div>
          )}

          {/* ── Empty state ──────────────────────────────────────────────────── */}
          {orders.length === 0 ? (
            <section className="or-panel">
              <h2 className="or-panel-head">My Orders</h2>
              <div className="or-panel-body">
                <div className="or-empty">
                  <p>You have not yet made any purchases.</p>
                  <p style={{ marginBottom: 10 }}>Your purchases will appear here.</p>
                  <Link href="/products" className="or-btn">
                    Explore Collection
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            /* ── Order list ────────────────────────────────────────────────── */
            orders.map((order) => {
              const isOpen = expanded === order._id;
              const date = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              return (
                <section key={order._id} className="or-panel">
                  <h2 className="or-panel-head">
                    Order Number: #{order._id.slice(-10)}
                    <span>{date}</span>
                  </h2>
                  <div className="or-panel-body">
                    <table className="or-table or-summary">
                      <thead>
                        <tr>
                          <th>Order Date</th>
                          <th>Status</th>
                          <th>Products</th>
                          <th className="or-num">Order Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td data-label="Order Date">{date}</td>
                          <td data-label="Status">
                            <StatusBadge status={order.status} />
                            {order.paymentStatus &&
                              order.paymentStatus !== order.status && (
                                <StatusBadge status={order.paymentStatus} />
                              )}
                          </td>
                          <td data-label="Products">
                            {order.items.length} item
                            {order.items.length !== 1 ? "s" : ""}
                          </td>
                          <td className="or-num" data-label="Order Cost">
                            <span className="or-total">
                              $
                              {order.totalAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Progress track */}
                    <ProgressTrack status={order.status} />

                    {/* ── Expand toggle ────────────────────────────────────── */}
                    <div className="or-actions">
                      <button
                        onClick={() => setExpanded(isOpen ? null : order._id)}
                        className="or-btn"
                        aria-expanded={isOpen}
                      >
                        {isOpen ? "Hide details ▲" : "View order details ▼"}
                      </button>
                    </div>

                    {/* ── Expanded detail ──────────────────────────────────── */}
                    {isOpen && (
                      <div className="or-details">
                        {/* Items */}
                        <div className="or-box">
                          <div className="or-box-head">Items Ordered</div>
                          <div className="or-box-body">
                            <table className="or-table">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th style={{ width: 50 }}>Qty</th>
                                  <th className="or-num" style={{ width: 90 }}>Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, ii) => (
                                  <tr key={ii}>
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td className="or-num">
                                      $
                                      {item.price.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Totals breakdown */}
                            <table className="or-table or-sum" style={{ marginTop: 8 }}>
                              <tbody>
                                {(() => {
                                  
                                  const fee = order.serviceFee ?? 0;
                                  const rawShipping =
                                    order.shippingRate && order.shippingRate > 0
                                      ? order.shippingRate
                                      : Math.max(0, order.shippingCost - fee);
                                  const rows = [
                                    { label: 'Subtotal', value: `$${(order.subtotal ?? order.totalAmount - order.shippingCost - order.tax).toFixed(2)}` },
                                    { label: 'Shipping', value: rawShipping > 0 ? `$${rawShipping.toFixed(2)}` : 'Free' },
                                    ...(fee > 0 ? [{ label: 'Service Fee', value: `$${fee.toFixed(2)}` }] : []),
                                    { label: 'Tax', value: `$${(order.tax ?? 0).toFixed(2)}` },
                                  ];
                                  return rows;
                                })().map(({ label, value }) => (
                                  <tr key={label}>
                                    <th>{label}:</th>
                                    <td className="or-num">{value}</td>
                                  </tr>
                                ))}
                                <tr className="or-grand">
                                  <th>Total:</th>
                                  <td className="or-num">
                                    $
                                    {order.totalAmount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Shipping address + payment */}
                        <div className="or-side">
                          {order.shippingAddress && (
                            <div className="or-box">
                              <div className="or-box-head">Delivery Address</div>
                              <div className="or-box-body">
                                <p>
                                  <strong>{order.shippingAddress.fullName}</strong>
                                </p>
                                <p>{order.shippingAddress.addressLine1}</p>
                                {order.shippingAddress.addressLine2 && (
                                  <p>{order.shippingAddress.addressLine2}</p>
                                )}
                                <p>
                                  {order.shippingAddress.city},{" "}
                                  {order.shippingAddress.state}{" "}
                                  {order.shippingAddress.postalCode}
                                </p>
                                <p>{order.shippingAddress.country}</p>
                              </div>
                            </div>
                          )}

                          <div className="or-box">
                            <div className="or-box-head">Payment Method</div>
                            <div className="or-box-body">
                              <span style={{ textTransform: "capitalize" }}>
                                <strong>{order.paymentMethod}</strong>
                              </span>
                              <span style={{ margin: "0 6px", color: "#b5b5b5" }}>|</span>
                              <span
                                className="or-badge"
                                style={{
                                  textTransform: "capitalize",
                                  background:
                                    order.paymentStatus === "paid"
                                      ? "#eef6ee"
                                      : "#fff8d6",
                                  color:
                                    order.paymentStatus === "paid"
                                      ? "#1d5e1d"
                                      : "#6b5200",
                                  borderColor:
                                    order.paymentStatus === "paid"
                                      ? "#1d7a1d"
                                      : "#e0c36a",
                                }}
                              >
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>

                          {order.trackingUrl && (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="or-link"
                            >
                              View on carrier website »
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Shipment / Tracking panel ────────────────────────── */}
                    <ShipmentPanel order={order} />
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}