'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Package, MapPin, CreditCard, Truck, MessageSquare, Lock, Archive } from 'lucide-react';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useAuth } from '@/hooks/useAuth';
import { STATUS_COLORS } from '../status';

interface Address {
  name: string; company?: string; line1: string; line2?: string;
  city: string; state?: string; postalCode: string; country: string;
}
interface Detail {
  order: {
    legacyOrderId: number;
    legacyCustomerId: number;
    email: string;
    customerName: string;
    phone?: string;
    delivery?: Address;
    billing?: Address;
    paymentMethod?: string;
    customerComment?: string;
    items: { legacyProductId?: number; model?: string; name: string; price: number; quantity: number; options?: { name: string; value: string }[] }[];
    totals: { code: string; title: string; value: number }[];
    total: number;
    currency: string;
    statusId: number;
    status: string;
    statusHistory: { date: string | null; statusId: number; status: string; comment?: string; internalNote?: string }[];
    tracking: { carrier: string; number: string }[];
    purchasedAt: string | null;
    lastModifiedAt?: string | null;
  };
  account: { _id: string; name: string; email: string } | null;
  otherOrders: { legacyOrderId: number; purchasedAt: string | null; total: number }[];
}

const money = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (iso: string | null | undefined, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      })
    : '—';

const TRACK_URL: Record<string, (n: string) => string> = {
  UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  'FedEx Freight': (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHL: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(n)}`,
};

function Card({ title, icon: Icon, children, className = '' }: { title: string; icon: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-[#c6cbd6] rounded-2xl overflow-hidden ${className}`}>
      <div className="px-5 py-3.5 border-b border-[#c6cbd6] flex items-center gap-2">
        <Icon size={14} strokeWidth={1.8} className="text-[#1c4874]" />
        <h2 className="text-[0.82rem] font-semibold text-[#222222]">{title}</h2>
      </div>
      <div className="p-5 text-[0.78rem] text-[#333333] leading-relaxed">{children}</div>
    </section>
  );
}

function AddressBlock({ a }: { a?: Address }) {
  if (!a || !a.line1) return <p className="text-[#999999]">Not recorded</p>;
  return (
    <div>
      <p className="font-semibold text-[#222222]">{a.name}</p>
      {a.company && <p>{a.company}</p>}
      <p>{a.line1}</p>
      {a.line2 && a.line2.toLowerCase() !== (a.city || '').toLowerCase() && <p>{a.line2}</p>}
      <p>{[a.city, a.state, a.postalCode].filter(Boolean).join(', ')}</p>
      <p>{a.country}</p>
    </div>
  );
}

export default function LegacyOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading: authLoading } = useAuth();
  const authFetch = useAuthFetch();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !user || !orderId) return;
    setData(null);
    setError('');
    authFetch(`/api/admin/legacy-orders/${orderId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message || 'Failed to load');
        setData(j.data);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [authLoading, user, orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = (
    <Link href="/admin/legacy-orders" className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-[#1c4874] hover:underline mb-5">
      <ArrowLeft size={13} strokeWidth={2} /> Old Website Orders
    </Link>
  );

  if (error) {
    return <div>{back}<p className="text-[0.85rem] text-[#9b2c2c]">{error}</p></div>;
  }
  if (!data) {
    return (
      <div>
        {back}
        <div className="h-10 w-64 bg-[#e3e6ee] rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-white border border-[#c6cbd6] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const { order: o, account, otherOrders } = data;
  const c = STATUS_COLORS[o.status] ?? '#7f7f7f';
  const lines = o.totals.filter((t) => t.code !== 'ot_total');
  const hasInternal = o.statusHistory.some((h) => h.internalNote);

  return (
    <div className="min-h-screen">
      {back}

      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-[0.68rem] tracking-[0.22em] uppercase text-[#1c4874] font-semibold mb-2 flex items-center gap-1.5">
            <Archive size={11} strokeWidth={2.2} /> Previous website order
          </p>
          <h1 className="text-[2.2rem] font-medium text-[#222222] tracking-tight leading-none">Order #{o.legacyOrderId}</h1>
          <p className="text-[0.78rem] text-[#7f7f7f] mt-2">Placed {date(o.purchasedAt, true)} · Read-only</p>
        </div>
        <div className="text-right">
          <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-wide px-3 py-1 rounded-full" style={{ color: c, background: `${c}15` }}>
            {o.status}
          </span>
          <p className="text-[1.6rem] font-semibold text-[#222222] mt-2 tabular-nums">{money(o.total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: items + history ── */}
        <div className="xl:col-span-2 space-y-6">
          <Card title={`Items (${o.items.reduce((n, i) => n + i.quantity, 0)})`} icon={Package}>
            {o.items.length === 0 ? (
              <p className="text-[#999999]">No items were recorded for this order on the old website.</p>
            ) : (
              <div className="overflow-x-auto -mx-5 -mt-5">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="bg-[#f5f7fb] border-b border-[#c6cbd6]">
                      {['Product', 'Qty', 'Unit price', 'Line total'].map((h, i) => (
                        <th key={h} className={`px-5 py-2.5 text-[0.6rem] tracking-[0.15em] uppercase text-[#999999] font-semibold ${i ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((it, k) => (
                      <tr key={k} className="border-b border-[#e3e6ee] align-top">
                        <td className="px-5 py-3">
                          <div className="font-medium text-[#222222]">{it.name}</div>
                          <div className="text-[0.68rem] text-[#7f7f7f]">
                            {[it.model && `Model ${it.model}`, it.legacyProductId && `Old product #${it.legacyProductId}`].filter(Boolean).join(' · ')}
                          </div>
                          {it.options?.map((op, j) => (
                            <div key={j} className="text-[0.68rem] text-[#555555]">{op.name}: {op.value}</div>
                          ))}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums">{it.quantity}</td>
                        <td className="px-5 py-3 text-right tabular-nums">{money(it.price)}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium">{money(it.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 ml-auto max-w-sm space-y-1.5">
              {lines.map((t, k) => (
                <div key={k} className="flex justify-between gap-4 text-[0.75rem]">
                  <span className="text-[#555555]">{t.title}</span>
                  <span className="tabular-nums shrink-0">{money(t.value)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-2 mt-2 border-t-2 border-[#222222] text-[0.85rem] font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{money(o.total)} {o.currency !== 'USD' ? o.currency : ''}</span>
              </div>
            </div>
          </Card>

          <Card title="Status history" icon={MessageSquare}>
            {o.customerComment && (
              <div className="mb-4 p-3 rounded-xl bg-[#f5f7fb] border border-[#e3e6ee]">
                <p className="text-[0.62rem] uppercase tracking-[0.15em] font-semibold text-[#7f7f7f] mb-1">Customer&apos;s note at checkout</p>
                <p className="whitespace-pre-line">{o.customerComment}</p>
              </div>
            )}
            {o.statusHistory.length === 0 ? (
              <p className="text-[#999999]">No history recorded.</p>
            ) : (
              <ol className="space-y-3">
                {o.statusHistory.map((h, k) => {
                  const hc = STATUS_COLORS[h.status] ?? '#7f7f7f';
                  return (
                    <li key={k} className="flex gap-3">
                      <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: hc }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" style={{ color: hc }}>{h.status}</span>
                          <span className="text-[0.68rem] text-[#999999]">{date(h.date, true)}</span>
                        </div>
                        {h.comment && <p className="whitespace-pre-line mt-0.5">{h.comment}</p>}
                        {h.internalNote && (
                          <div className="mt-1 p-2 rounded-lg bg-[#fff8e6] border border-[#f0dca8]">
                            <p className="text-[0.6rem] uppercase tracking-[0.12em] font-semibold text-[#a37a1c] flex items-center gap-1 mb-0.5">
                              <Lock size={9} strokeWidth={2.4} /> Staff only — customer did not see this
                            </p>
                            <p className="whitespace-pre-line text-[0.72rem] text-[#555555] break-words">{h.internalNote}</p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {hasInternal && (
              <p className="mt-4 text-[0.68rem] text-[#7f7f7f]">
                Customers see this order under My Orders, but never the staff-only notes.
              </p>
            )}
          </Card>
        </div>

        {/* ── Right: customer, addresses, payment, tracking ── */}
        <div className="space-y-6">
          <Card title="Customer" icon={User}>
            <p className="font-semibold text-[#222222]">{o.customerName || '—'}</p>
            <p className="break-all"><a href={`mailto:${o.email}`} className="text-[#1c4874] hover:underline">{o.email}</a></p>
            {o.phone && <p><a href={`tel:${o.phone.replace(/[^\d+]/g, '')}`} className="text-[#1c4874] hover:underline">{o.phone}</a></p>}
            <p className="text-[0.68rem] text-[#7f7f7f] mt-1">Old customer #{o.legacyCustomerId}</p>
            <div className="mt-3 pt-3 border-t border-[#e3e6ee]">
              {account ? (
                <Link href={`/admin/users/${account._id}`} className="text-[0.75rem] font-semibold text-[#1c4874] hover:underline">
                  View account on the new website →
                </Link>
              ) : (
                <p className="text-[0.72rem] text-[#a37a1c]">
                  Not linked to an account. This customer wasn&apos;t in the old customer list, so the order is kept here for reference.
                </p>
              )}
            </div>
            {otherOrders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#e3e6ee]">
                <p className="text-[0.62rem] uppercase tracking-[0.15em] font-semibold text-[#7f7f7f] mb-1.5">
                  Their other old orders ({otherOrders.length})
                </p>
                <ul className="space-y-1 max-h-48 overflow-auto">
                  {otherOrders.map((s) => (
                    <li key={s.legacyOrderId} className="flex justify-between gap-2 text-[0.72rem]">
                      <Link href={`/admin/legacy-orders/${s.legacyOrderId}`} className="text-[#1c4874] hover:underline">#{s.legacyOrderId}</Link>
                      <span className="text-[#7f7f7f]">{date(s.purchasedAt)}</span>
                      <span className="tabular-nums">{money(s.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card title="Delivery address" icon={MapPin}><AddressBlock a={o.delivery} /></Card>
          <Card title="Billing address" icon={MapPin}><AddressBlock a={o.billing} /></Card>

          <Card title="Payment" icon={CreditCard}>
            <p>{o.paymentMethod || '—'}</p>
          </Card>

          <Card title="Tracking" icon={Truck}>
            {o.tracking.length === 0 ? (
              <p className="text-[#999999]">No tracking number recorded</p>
            ) : (
              <ul className="space-y-1">
                {o.tracking.map((t, k) => (
                  <li key={k}>
                    <span className="text-[#7f7f7f]">{t.carrier}: </span>
                    {TRACK_URL[t.carrier] ? (
                      <a href={TRACK_URL[t.carrier](t.number)} target="_blank" rel="noopener noreferrer" className="text-[#1c4874] font-medium hover:underline break-all">{t.number}</a>
                    ) : (
                      <span className="break-all">{t.number}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
