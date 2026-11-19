"use client";
import { useEffect, useState } from "react";

/**
 * "Orders from our previous website" — read-only history imported from the
 * old Alpha Imports site. Shown under the customer's new orders.
 */

interface LegacyItem {
  name: string;
  model?: string;
  price: number;
  quantity: number;
  options?: { name: string; value: string }[];
}
interface LegacyOrder {
  legacyOrderId: number;
  purchasedAt: string | null;
  status: string;
  items: LegacyItem[];
  totals: { code: string; title: string; value: number }[];
  total: number;
  paymentMethod?: string;
  delivery?: { name: string; line1: string; line2?: string; city: string; state?: string; postalCode: string; country: string };
  tracking?: { carrier: string; number: string }[];
  statusHistory?: { date: string | null; status: string; comment?: string }[];
  customerComment?: string;
}

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

const TRACK_URL: Record<string, (n: string) => string> = {
  UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  "FedEx Freight": (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHL: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(n)}`,
};

const PAGE = 10;

export default function LegacyOrders() {
  const [orders, setOrders] = useState<LegacyOrder[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    fetch("/api/orders/legacy", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setOrders(d.data || []))
      .catch(() => setOrders([]));
  }, []);

  if (!orders || orders.length === 0) return null;
  const spent = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="lo">
      <div className="or-title-row" style={{ marginTop: 22 }}>
        <h2 className="or-title" style={{ fontSize: 15 }}>Orders from our previous website</h2>
        <span className="or-sub">
          {orders.length} order{orders.length !== 1 ? "s" : ""} | {usd(spent)}
        </span>
      </div>
      <hr className="or-rule" />
      <p className="lo-note">
        Your purchase history from the old Alpha Imports website, kept for your records. Questions about one of these
        orders? Contact us and mention the order number.
      </p>

      {orders.slice(0, shown).map((o) => {
        const isOpen = open === o.legacyOrderId;
        const lines = o.totals.filter((t) => t.code !== "ot_total");
        const notes = (o.statusHistory || []).filter((h) => h.comment);
        return (
          <section key={o.legacyOrderId} className="or-panel">
            <h3 className="or-panel-head">
              Order Number: #{o.legacyOrderId}
              <span>{day(o.purchasedAt)}</span>
            </h3>
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
                    <td data-label="Order Date">{day(o.purchasedAt)}</td>
                    <td data-label="Status"><span className="lo-status">{o.status}</span></td>
                    <td data-label="Products">
                      {o.items.reduce((n, i) => n + i.quantity, 0)} item{o.items.reduce((n, i) => n + i.quantity, 0) !== 1 ? "s" : ""}
                    </td>
                    <td className="or-num" data-label="Order Cost"><span className="or-total">{usd(o.total)}</span></td>
                  </tr>
                </tbody>
              </table>

              <div className="or-actions">
                <button onClick={() => setOpen(isOpen ? null : o.legacyOrderId)} className="or-btn" aria-expanded={isOpen}>
                  {isOpen ? "Hide details ▲" : "View order details ▼"}
                </button>
              </div>

              {isOpen && (
                <div className="or-details">
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
                          {o.items.map((i, k) => (
                            <tr key={k}>
                              <td>
                                {i.name}
                                {i.model ? <span className="lo-muted"> ({i.model})</span> : null}
                                {i.options?.map((op, j) => (
                                  <div key={j} className="lo-muted">{op.name}: {op.value}</div>
                                ))}
                              </td>
                              <td>{i.quantity}</td>
                              <td className="or-num">{usd(i.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <table className="or-table or-sum" style={{ marginTop: 8 }}>
                        <tbody>
                          {lines.map((t, k) => (
                            <tr key={k}>
                              <th>{t.title}:</th>
                              <td className="or-num">{t.value < 0 ? `-${usd(-t.value)}` : usd(t.value)}</td>
                            </tr>
                          ))}
                          <tr className="or-grand">
                            <th>Total:</th>
                            <td className="or-num">{usd(o.total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="or-side">
                    {o.delivery?.line1 && (
                      <div className="or-box">
                        <div className="or-box-head">Delivery Address</div>
                        <div className="or-box-body">
                          <p><strong>{o.delivery.name}</strong></p>
                          <p>{o.delivery.line1}</p>
                          {o.delivery.line2 && o.delivery.line2.toLowerCase() !== (o.delivery.city || "").toLowerCase() && (
                            <p>{o.delivery.line2}</p>
                          )}
                          <p>{[o.delivery.city, o.delivery.state, o.delivery.postalCode].filter(Boolean).join(", ")}</p>
                          <p>{o.delivery.country}</p>
                        </div>
                      </div>
                    )}
                    {o.paymentMethod && (
                      <div className="or-box">
                        <div className="or-box-head">Payment Method</div>
                        <div className="or-box-body"><strong>{o.paymentMethod}</strong></div>
                      </div>
                    )}
                    {!!o.tracking?.length && (
                      <div className="or-box">
                        <div className="or-box-head">Tracking</div>
                        <div className="or-box-body">
                          {o.tracking.map((t, k) => (
                            <p key={k}>
                              {t.carrier}:{" "}
                              {TRACK_URL[t.carrier] ? (
                                <a href={TRACK_URL[t.carrier](t.number)} target="_blank" rel="noopener noreferrer" className="or-link">
                                  {t.number}
                                </a>
                              ) : (
                                t.number
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {(notes.length > 0 || o.customerComment) && (
                      <div className="or-box">
                        <div className="or-box-head">Notes</div>
                        <div className="or-box-body">
                          {o.customerComment && <p className="lo-pre"><strong>Your note:</strong> {o.customerComment}</p>}
                          {notes.map((h, k) => (
                            <p key={k} className="lo-pre">
                              <span className="lo-muted">{day(h.date)}:</span> {h.comment}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {shown < orders.length && (
        <div className="or-actions" style={{ justifyContent: "center", marginBottom: 20 }}>
          <button className="or-btn" onClick={() => setShown((n) => n + PAGE * 2)}>
            Show more previous orders ({orders.length - shown} more)
          </button>
        </div>
      )}
      <style>{`
        .lo-note { line-height: 1.6; margin: 0 0 12px; color: #555; }
        .lo-status { display: inline-block; padding: 1px 6px; border: 1px solid #a9b3cf; background: #f3f5fa; color: #1c4874; }
        .lo-muted { color: #7a7a7a; font-size: 10px; }
        .lo-pre { white-space: pre-line; }
        .lo .or-sum { width: 100%; table-layout: fixed; }
        .lo .or-sum th { white-space: normal; overflow-wrap: anywhere; }
        .lo .or-sum td { width: 90px; }
      `}</style>
    </div>
  );
}
