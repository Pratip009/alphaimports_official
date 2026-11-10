'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Tag, Search, Loader2, CheckCircle2, Clock, XCircle,
  Copy, Check, Trash2, RefreshCw, BarChart2, RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthFetch } from '@/hooks/useAuthFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CouponDoc {
  _id: string;
  email: string;
  code: string;
  discountPercent: number;
  minPurchase: number;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  usedByOrderId?: { _id: string } | string | null;
  createdAt: string;
}

interface Stats { total: number; active: number; used: number; expired: number; }
type StatusFilter = 'all' | 'active' | 'used' | 'expired';

function statusOf(c: CouponDoc): 'active' | 'used' | 'expired' {
  if (c.isUsed) return 'used';
  if (new Date(c.expiresAt) < new Date()) return 'expired';
  return 'active';
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCouponsPage() {
  const { loading: authLoading } = useAuth();
  const authFetch = useAuthFetch();

  const [stats, setStats]               = useState<Stats | null>(null);
  const [coupons, setCoupons]           = useState<CouponDoc[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading]           = useState(false);
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [renewLoading, setRenewLoading]   = useState<string | null>(null);

  // ─── Fetch stats ──────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res  = await authFetch('/api/admin/coupons?statsOnly=true');
      const json = await res.json();
      if (json?.data) setStats(json.data);
    } catch { /* silent */ }
  }, [authFetch]);

  // ─── Fetch list ───────────────────────────────────────────────────────────

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: statusFilter,
        ...(search ? { search } : {}),
      });
      const res  = await authFetch(`/api/admin/coupons?${params}`);
      const json = await res.json();
      if (json?.data) {
        setCoupons(json.data.coupons ?? []);
        setTotal(json.data.total ?? 0);
        setTotalPages(json.data.totalPages ?? 1);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [authFetch, page, statusFilter, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    setDeleteLoading(id);
    try {
      const res  = await authFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? 'Failed to delete');
      fetchCoupons();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally { setDeleteLoading(null); }
  }

  // ─── Renew (reset a used/expired coupon back to usable) ────────────────────

  async function handleRenew(id: string) {
    if (!confirm('Renew this coupon? It will become usable again with a fresh 30-day expiry.')) return;
    setRenewLoading(id);
    try {
      const res  = await authFetch(`/api/admin/coupons/${id}/renew`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? 'Failed to renew');
      fetchCoupons();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to renew');
    } finally { setRenewLoading(null); }
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  }

  if (authLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="text-[#1c4874] animate-spin" />
    </div>
  );

  // ─── Stat cards ───────────────────────────────────────────────────────────
  const STAT_CARDS = [
    { label: 'Total Issued', value: stats?.total   ?? '—', icon: Tag,          color: '#6366f1' },
    { label: 'Active',       value: stats?.active  ?? '—', icon: CheckCircle2, color: '#22c55e' },
    { label: 'Used',         value: stats?.used    ?? '—', icon: BarChart2,    color: '#1c4874' },
    { label: 'Expired',      value: stats?.expired ?? '—', icon: XCircle,      color: '#ef4444' },
  ];

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className=" text-3xl font-semibold text-[#222222]">
            Coupon Management
          </h1>
          <p className="mt-1 text-sm text-[#555555]">
            Coupons are sent automatically when users subscribe · Track codes and redemptions here
          </p>
        </div>
        <button
          onClick={() => { fetchCoupons(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1c4874]/10 text-[#154273] rounded-lg text-sm font-medium hover:bg-[#1c4874]/20 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[#c6cbd6] p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#222222]">{value}</p>
              <p className="text-xs text-[#555555] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#c6cbd6] p-5 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-[#f5f7fb] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-[#7f7f7f]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search email or code…"
            className="bg-transparent text-sm text-[#222222] placeholder:text-[#7f7f7f] outline-none w-full"
          />
        </div>

        <div className="flex gap-1.5">
          {(['all', 'active', 'used', 'expired'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#1c4874] text-white'
                  : 'bg-[#f5f7fb] text-[#555555] hover:bg-[#eef0f5]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#7f7f7f] ml-auto">{total} coupons</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#c6cbd6] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={22} className="text-[#1c4874] animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[#7f7f7f]">
            <Tag size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No coupons found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e3e6ee]">
                  {['Email', 'Code', 'Discount', 'Status', 'Issued', 'Expires', 'Used At / Order', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-[#7f7f7f] tracking-wide uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e6ee]">
                {coupons.map((c) => {
                  const status  = statusOf(c);
                  const orderId = c.usedByOrderId
                    ? (typeof c.usedByOrderId === 'object' ? c.usedByOrderId._id : c.usedByOrderId)
                    : null;

                  return (
                    <tr key={c._id} className="hover:bg-[#f5f7fb] transition-colors">
                      <td className="px-5 py-4 text-[#222222] font-medium">{c.email}</td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] font-bold tracking-widest text-[#1c4874] bg-[#1c4874]/5 px-2.5 py-1 rounded">
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyCode(c._id, c.code)}
                            className="text-[#7f7f7f] hover:text-[#1c4874] transition-colors"
                            title="Copy code"
                          >
                            {copiedId === c._id
                              ? <Check size={13} className="text-[#22c55e]" />
                              : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[#222222]">
                        <span className="font-semibold">{c.discountPercent}% off</span>
                        <span className="block text-[11px] text-[#7f7f7f]">Min. ${c.minPurchase}</span>
                      </td>

                      <td className="px-5 py-4">
                        {status === 'active'  && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700"><CheckCircle2 size={10} /> Active</span>}
                        {status === 'used'    && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1c4874]/10 text-[#154273]"><Check size={10} /> Used</span>}
                        {status === 'expired' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600"><Clock size={10} /> Expired</span>}
                      </td>

                      <td className="px-5 py-4 text-[#555555] text-[12.5px]">{fmt(c.createdAt)}</td>
                      <td className="px-5 py-4 text-[#555555] text-[12.5px]">{fmt(c.expiresAt)}</td>

                      <td className="px-5 py-4 text-[12.5px]">
                        {c.isUsed && c.usedAt ? (
                          <div>
                            <p className="text-[#555555]">{fmt(c.usedAt)}</p>
                            {orderId && (
                              <a href="/admin/orders" className="text-[#1c4874] hover:underline font-mono text-[11px]">
                                #{orderId.toString().slice(-8).toUpperCase()}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#999999]">—</span>
                        )}
                      </td>

                      {/* Actions: delete (unused only) · renew (used/expired only) */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {!c.isUsed && (
                            <button
                              onClick={() => handleDelete(c._id)}
                              disabled={deleteLoading === c._id}
                              title="Delete coupon"
                              className="p-1.5 rounded-lg text-[#555555] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                            >
                              {deleteLoading === c._id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Trash2 size={14} />}
                            </button>
                          )}
                          {status !== 'active' && (
                            <button
                              onClick={() => handleRenew(c._id)}
                              disabled={renewLoading === c._id}
                              title="Renew coupon (make usable again)"
                              className="p-1.5 rounded-lg text-[#555555] hover:bg-green-50 hover:text-green-700 transition-colors disabled:opacity-40"
                            >
                              {renewLoading === c._id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <RotateCcw size={14} />}
                            </button>
                          )}
                          {c.isUsed === false && status === 'active' && (
                            <span className="text-[#999999] text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#e3e6ee]">
            <p className="text-xs text-[#7f7f7f]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f5f7fb] text-[#555555] hover:bg-[#eef0f5] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f5f7fb] text-[#555555] hover:bg-[#eef0f5] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}