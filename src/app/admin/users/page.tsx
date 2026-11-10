'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Search, ChevronLeft, ChevronRight, Crown,
  ShoppingBag, Clock, ArrowUpRight,
} from 'lucide-react';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  authProviders?: ('password' | 'google')[];
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  totalScreenTime: number; // seconds
  sessionCount: number;
  lastActiveAt: string | null;
}

interface UsersData {
  users: AdminUserRow[];
  total: number;
  grandTotal: number;
  adminCount: number;
  userCount: number;
  newThisMonth: number;
  page: number;
  limit: number;
}

const LIMIT = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function formatScreenTime(seconds: number) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  return (
    <div className="relative bg-white border border-[#c6cbd6] rounded-2xl p-5 overflow-hidden">
      <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
          <Icon size={17} strokeWidth={1.7} style={{ color: accent }} />
        </div>
      </div>
      <div className=" text-[2rem] font-medium text-[#222222] leading-none mb-1 tabular-nums">
        {value}
      </div>
      <div className="text-[0.72rem] text-[#7f7f7f] tracking-wide uppercase font-medium">{label}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const authFetch = useAuthFetch();

  const [data, setData] = useState<UsersData | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Debounce search input so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever the search term changes
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => {
    if (authLoading || !user) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    authFetch(`/api/admin/users?${params.toString()}`)
      .then(r => r.json())
      .then(j => setData(j.data))
      .catch((e: unknown) => console.error('[admin/users]', e))
      .finally(() => setLoading(false));
  }, [authLoading, user, page, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[0.68rem] tracking-[0.22em] uppercase text-[#1c4874] font-semibold mb-2">◆ Alphaimports.com</p>
            <h1 className=" text-[2.6rem] font-medium text-[#222222] tracking-tight leading-none">
              Users
            </h1>
            <p className="text-[0.78rem] text-[#7f7f7f] mt-2">
              All registered accounts — purchases and screen time in one place.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-[0.8rem] bg-white border border-[#c6cbd6] rounded-xl outline-none focus:border-[#1c4874]/50 focus:ring-1 focus:ring-[#1c4874]/20 transition-all w-64 placeholder:text-[#999999]"
            />
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Users" value={data?.grandTotal ?? '—'} icon={Users} accent="#1c4874" />
        <SummaryCard label="Admins" value={data?.adminCount ?? '—'} icon={Crown} accent="#7d88aa" />
        <SummaryCard label="Customers" value={data?.userCount ?? '—'} icon={Users} accent="#2f5681" />
        <SummaryCard label="New This Month" value={data ? `+${data.newThisMonth}` : '—'} icon={ArrowUpRight} accent="#2d7a52" />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#c6cbd6] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1.6fr_70px_1fr_1fr_1fr_0.9fr] px-5 py-2.5 border-b border-[#c6cbd6] bg-[#f5f7fb]">
          {['User', 'Role', 'Orders', 'Total Spent', 'Screen Time', 'Joined'].map(h => (
            <span key={h} className="text-[0.6rem] tracking-[0.15em] uppercase text-[#999999] font-semibold">{h}</span>
          ))}
        </div>

        <div>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1.6fr_70px_1fr_1fr_1fr_0.9fr] px-5 py-3.5 border-b border-[#e3e6ee] animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e3e6ee]" />
                  <div className="h-3 w-28 bg-[#e3e6ee] rounded" />
                </div>
                <div className="h-5 w-12 bg-[#e3e6ee] rounded-full self-center" />
                <div className="h-3 w-10 bg-[#e3e6ee] rounded self-center" />
                <div className="h-3 w-16 bg-[#e3e6ee] rounded self-center" />
                <div className="h-3 w-14 bg-[#e3e6ee] rounded self-center" />
                <div className="h-3 w-16 bg-[#e3e6ee] rounded self-center" />
              </div>
            ))
          ) : !data || data.users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users size={28} strokeWidth={1.2} className="text-[#999999] mb-3" />
              <p className="text-[0.78rem] text-[#999999]">No users found</p>
            </div>
          ) : (
            data.users.map((u) => (
              <Link
                key={u._id}
                href={`/admin/users/${u._id}`}
                className="grid grid-cols-[1.6fr_70px_1fr_1fr_1fr_0.9fr] px-5 py-3.5 border-b border-[#e3e6ee] hover:bg-[#f5f7fb] transition-colors duration-150 group"
              >
                {/* Name + email */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0"
                    style={{
                      background: u.role === 'admin' ? '#1c487420' : '#2f568120',
                      color:      u.role === 'admin' ? '#1c4874'   : '#2f5681',
                      border: `1px solid ${u.role === 'admin' ? '#1c487430' : '#2f568130'}`,
                    }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.78rem] font-medium text-[#222222] truncate flex items-center gap-1">
                      {u.name}
                      <ArrowUpRight size={11} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1c4874]" />
                    </div>
                    <div className="text-[0.68rem] text-[#7f7f7f] truncate flex items-center gap-1.5">
                      <span className="truncate">{u.email}</span>
                      {u.authProviders?.includes('google') && (
                        <span
                          title={u.authProviders.includes('password') ? 'Signs in with Google or password' : 'Signs in with Google only'}
                          className="shrink-0 px-1.5 py-px rounded text-[0.55rem] font-semibold text-[#4285F4] bg-[#4285F4]/10 border border-[#4285F4]/20"
                        >
                          Google
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="self-center">
                  {u.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold tracking-wide bg-[#1c4874]/10 text-[#1c4874] border border-[#1c4874]/20">
                      <Crown size={9} strokeWidth={2} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold tracking-wide bg-[#2f5681]/10 text-[#2f5681] border border-[#2f5681]/20">
                      User
                    </span>
                  )}
                </div>

                {/* Orders */}
                <div className="self-center flex items-center gap-1.5 text-[0.75rem] text-[#555555]">
                  <ShoppingBag size={12} strokeWidth={1.8} className="text-[#999999]" />
                  {u.orderCount}
                </div>

                {/* Total spent */}
                <div className="self-center text-[0.75rem] font-medium text-[#222222]">
                  {u.totalSpent > 0 ? formatCurrency(u.totalSpent) : '—'}
                </div>

                {/* Screen time */}
                <div className="self-center flex items-center gap-1.5 text-[0.75rem] text-[#555555]">
                  <Clock size={12} strokeWidth={1.8} className="text-[#999999]" />
                  {formatScreenTime(u.totalScreenTime)}
                </div>

                {/* Joined */}
                <span className="self-center text-[0.68rem] text-[#7f7f7f]" title={formatDate(u.createdAt)}>
                  {timeAgo(u.createdAt)}
                </span>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && data && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#c6cbd6] bg-[#f5f7fb]">
            <span className="text-[0.68rem] text-[#7f7f7f]">
              Page {page} of {totalPages} · {data.total} user{data.total === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-lg border border-[#c6cbd6] flex items-center justify-center hover:border-[#1c4874]/40 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={13} strokeWidth={2} className="text-[#555555]" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1
                  : page >= totalPages - 2 ? totalPages - 4 + i
                  : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-7 h-7 rounded-lg text-[0.7rem] font-semibold transition-all"
                    style={p === page
                      ? { background: '#1c4874', color: '#fff', border: '1px solid #1c4874' }
                      : { background: 'transparent', color: '#555555', border: '1px solid #c6cbd6' }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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