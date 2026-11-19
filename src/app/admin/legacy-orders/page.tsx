'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Archive, Search, ChevronLeft, ChevronRight, DollarSign, CalendarRange,
  UserX, ArrowUpRight, X,
} from 'lucide-react';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useAuth } from '@/hooks/useAuth';
import { STATUS_COLORS } from './status';

/**
 * Admin › Old Website Orders
 *
 * Read-only history imported from the old Alpha Imports (osCommerce) site.
 * Deliberately separate from Orders so 20 years of old sales never affect
 * revenue figures, shipping lists or stock.
 */

interface Row {
  legacyOrderId: number;
  legacyCustomerId: number;
  userId: string | null;
  email: string;
  customerName: string;
  purchasedAt: string | null;
  total: number;
  status: string;
  itemCount: number;
  place: string;
}

interface ListData {
  orders: Row[];
  total: number;
  page: number;
  limit: number;
  summary: { value: number; unlinked: number; first: string | null; last: string | null };
  forUser: { _id: string; name: string; email: string } | null;
}

const LIMIT = 25;


const money = (n: number) =>
  `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const year = (iso: string | null) => (iso ? new Date(iso).getFullYear() : '—');

function SummaryCard({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  return (
    <div className="relative bg-white border border-[#c6cbd6] rounded-2xl p-5 overflow-hidden">
      <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
        <Icon size={17} strokeWidth={1.7} style={{ color: accent }} />
      </div>
      <div className="text-[1.6rem] font-medium text-[#222222] leading-none mb-1 tabular-nums">{value}</div>
      <div className="text-[0.72rem] text-[#7f7f7f] tracking-wide uppercase font-medium">{label}</div>
    </div>
  );
}

export default function LegacyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const authFetch = useAuthFetch();

  const [ready, setReady] = useState(false);
  const [userFilter, setUserFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [unlinked, setUnlinked] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ?user=<id> (from a customer's admin page) or ?search=<text>
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setUserFilter(p.get('user') || '');
    const s = p.get('search') || '';
    setSearch(s);
    setDebounced(s);
    setReady(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debounced, unlinked, userFilter]);

  useEffect(() => {
    if (!ready || authLoading || !user) return;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (debounced) params.set('search', debounced);
    if (userFilter) params.set('user', userFilter);
    else if (unlinked) params.set('unlinked', '1');
    authFetch(`/api/admin/legacy-orders?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message || 'Failed to load');
        setData(j.data);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [ready, authLoading, user, page, debounced, unlinked, userFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearUser = () => {
    setUserFilter('');
    window.history.replaceState(null, '', '/admin/legacy-orders');
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const cols = 'grid-cols-[90px_100px_1.6fr_1.1fr_60px_100px_130px]';

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[0.68rem] tracking-[0.22em] uppercase text-[#1c4874] font-semibold mb-2">◆ Alphaimports.com</p>
            <h1 className="text-[2.6rem] font-medium text-[#222222] tracking-tight leading-none">Old Website Orders</h1>
            <p className="text-[0.78rem] text-[#7f7f7f] mt-2 max-w-xl">
              Order history moved over from the previous website. Read-only, and kept separate from
              Orders so it never affects sales figures or shipping.
            </p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]" strokeWidth={2} />
            <input
              type="text"
              placeholder="Order #, email or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search old website orders"
              className="pl-9 pr-4 py-2.5 text-[0.8rem] bg-white border border-[#c6cbd6] rounded-xl outline-none focus:border-[#1c4874]/50 focus:ring-1 focus:ring-[#1c4874]/20 transition-all w-72 placeholder:text-[#999999]"
            />
          </div>
        </div>
      </div>

      {/* ── Customer filter banner ── */}
      {userFilter && (
        <div className="mb-5 flex items-center justify-between gap-3 bg-[#1c4874]/5 border border-[#1c4874]/20 rounded-xl px-4 py-3">
          <p className="text-[0.78rem] text-[#222222]">
            Showing old orders for{' '}
            {data?.forUser ? (
              <Link href={`/admin/users/${data.forUser._id}`} className="font-semibold text-[#1c4874] hover:underline">
                {data.forUser.name} ({data.forUser.email})
              </Link>
            ) : (
              'this customer'
            )}
          </p>
          <button onClick={clearUser} className="flex items-center gap-1 text-[0.72rem] font-semibold text-[#1c4874] hover:underline">
            <X size={12} strokeWidth={2.2} /> Show all
          </button>
        </div>
      )}

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard label={debounced || userFilter || unlinked ? 'Matching orders' : 'Old orders'} value={data ? data.total.toLocaleString() : '—'} icon={Archive} accent="#1c4874" />
        <SummaryCard label="Order value" value={data ? money(data.summary.value) : '—'} icon={DollarSign} accent="#2d7a52" />
        <SummaryCard label="Years" value={data && data.total ? `${year(data.summary.first)}–${year(data.summary.last)}` : '—'} icon={CalendarRange} accent="#7d88aa" />
        <SummaryCard label="No matching account" value={data ? data.summary.unlinked.toLocaleString() : '—'} icon={UserX} accent="#a37a1c" />
      </div>

      {/* ── Filter ── */}
      {!userFilter && (
        <div className="flex items-center gap-2 mb-3">
          {[
            { on: false, label: 'All old orders' },
            { on: true, label: 'No matching account' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => setUnlinked(f.on)}
              className="px-3 py-1.5 rounded-lg text-[0.72rem] font-semibold transition-all"
              style={unlinked === f.on
                ? { background: '#1c4874', color: '#fff', border: '1px solid #1c4874' }
                : { background: '#fff', color: '#555555', border: '1px solid #c6cbd6' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-[#c6cbd6] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className={`grid ${cols} px-5 py-2.5 border-b border-[#c6cbd6] bg-[#f5f7fb]`}>
              {['Order #', 'Date', 'Customer', 'Ship to', 'Items', 'Total', 'Status'].map((h) => (
                <span key={h} className="text-[0.6rem] tracking-[0.15em] uppercase text-[#999999] font-semibold">{h}</span>
              ))}
            </div>

            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`grid ${cols} px-5 py-3.5 border-b border-[#e3e6ee] animate-pulse`}>
                  {Array.from({ length: 7 }).map((__, j) => <div key={j} className="h-3 w-16 bg-[#e3e6ee] rounded" />)}
                </div>
              ))
            ) : error ? (
              <div className="py-16 text-center text-[0.78rem] text-[#9b2c2c]">{error}</div>
            ) : !data || data.orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Archive size={28} strokeWidth={1.2} className="text-[#999999] mb-3" />
                <p className="text-[0.78rem] text-[#999999]">
                  {debounced ? `No old orders match “${debounced}”` : 'No old website orders'}
                </p>
              </div>
            ) : (
              data.orders.map((o) => {
                const c = STATUS_COLORS[o.status] ?? '#7f7f7f';
                return (
                  <Link
                    key={o.legacyOrderId}
                    href={`/admin/legacy-orders/${o.legacyOrderId}`}
                    className={`grid ${cols} px-5 py-3.5 border-b border-[#e3e6ee] hover:bg-[#f5f7fb] transition-colors group items-center`}
                  >
                    <span className="text-[0.78rem] font-semibold text-[#1c4874] flex items-center gap-1">
                      #{o.legacyOrderId}
                      <ArrowUpRight size={11} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-[0.72rem] text-[#555555]">{date(o.purchasedAt)}</span>
                    <div className="min-w-0">
                      <div className="text-[0.78rem] font-medium text-[#222222] truncate">{o.customerName || '—'}</div>
                      <div className="text-[0.68rem] text-[#7f7f7f] truncate flex items-center gap-1.5">
                        <span className="truncate">{o.email}</span>
                        {!o.userId && (
                          <span className="shrink-0 px-1.5 py-px rounded text-[0.55rem] font-semibold text-[#a37a1c] bg-[#a37a1c]/10 border border-[#a37a1c]/20">
                            No account
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[0.72rem] text-[#555555] truncate pr-2">{o.place || '—'}</span>
                    <span className="text-[0.75rem] text-[#555555] tabular-nums">{o.itemCount}</span>
                    <span className="text-[0.78rem] font-semibold text-[#222222] tabular-nums">{money(o.total)}</span>
                    <span>
                      <span
                        className="text-[0.62rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ color: c, background: `${c}15` }}
                      >
                        {o.status}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {!loading && data && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#c6cbd6] bg-[#f5f7fb]">
            <span className="text-[0.68rem] text-[#7f7f7f]">
              Page {page} of {totalPages.toLocaleString()} · {data.total.toLocaleString()} order{data.total === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="w-7 h-7 rounded-lg border border-[#c6cbd6] flex items-center justify-center hover:border-[#1c4874]/40 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={13} strokeWidth={2} className="text-[#555555]" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="min-w-7 h-7 px-1.5 rounded-lg text-[0.7rem] font-semibold transition-all"
                    style={p === page
                      ? { background: '#1c4874', color: '#fff', border: '1px solid #1c4874' }
                      : { background: 'transparent', color: '#555555', border: '1px solid #c6cbd6' }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="w-7 h-7 rounded-lg border border-[#c6cbd6] flex items-center justify-center hover:border-[#1c4874]/40 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={13} strokeWidth={2} className="text-[#555555]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
