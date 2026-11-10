'use client';
/**
 * Admin dashboard in the classic storefront style: bordered panels with
 * small-caps gradient headers, plain tables and "Result Pages" pagination.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  products: { total: number; active: number; newThisMonth: number };
  users:    { total: number; newThisMonth: number; growth: number };
  categories: { total: number };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface UsersData {
  users: User[];
  total: number;
  adminCount: number;
  userCount: number;
  newThisMonth: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 8;

// ─── Quick links ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { href: '/admin/products',   label: 'Products',    desc: 'Add, edit and price the catalogue' },
  { href: '/admin/upload',     label: 'Bulk Upload', desc: 'Import products from CSV / Excel' },
  { href: '/admin/categories', label: 'Categories',  desc: 'Categories and subcategories' },
  { href: '/admin/orders',     label: 'Orders',      desc: 'Process and ship customer orders' },
  { href: '/admin/contacts',   label: 'Contacts',    desc: 'Customer enquiries' },
  { href: '/admin/blogs',      label: 'Blog',        desc: 'Write and publish posts' },
  { href: '/admin/newsletter', label: 'Newsletter',  desc: 'Campaigns and subscribers' },
  { href: '/',                 label: 'Storefront',  desc: 'Open the public website' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

function Stat({ label, value, note, loading }: { label: string; value?: number; note?: string; loading: boolean }) {
  return (
    <div className="dsh-stat">
      <div className="dsh-stat-label">{label}</div>
      <div className="dsh-stat-value">{loading ? '…' : (value ?? 0).toLocaleString()}</div>
      <div className="dsh-stat-note">{note ?? '\u00a0'}</div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const authFetch = useAuthFetch();

  const [stats, setStats]         = useState<Stats | null>(null);
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // Wait for the auth cookie check (/api/auth/me) before fetching.
  useEffect(() => {
    if (authLoading || !user) return;
    setStatsLoading(true);
    setStatsError(false);
    authFetch('/api/admin/stats')
      .then(r => r.json())
      .then(j => setStats(j.data))
      .catch((e: unknown) => { console.error('[stats]', e); setStatsError(true); })
      .finally(() => setStatsLoading(false));
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authLoading || !user) return;
    setUsersLoading(true);
    authFetch(`/api/admin/users?page=${page}&limit=${PAGE_SIZE}`)
      .then(r => r.json())
      .then(j => setUsersData(j.data))
      .catch((e: unknown) => console.error('[users]', e))
      .finally(() => setUsersLoading(false));
  }, [authLoading, user, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = search.trim().toLowerCase();
  const filteredUsers = usersData?.users.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  ) ?? [];

  const total = usersData?.total ?? 0;
  const totalPages = usersData ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  // Up to 10 page numbers around the current page.
  const start = Math.max(1, Math.min(page - 4, totalPages - 9));
  const pages = Array.from({ length: Math.min(10, totalPages) }, (_, i) => start + i);

  const growth = stats?.users.growth;

  return (
    <div className="dsh">
      <style>{DASH_CSS}</style>

      <h1>Dashboard</h1>
      <p className="dsh-intro">
        Welcome back{user?.name ? `, ${user.name}` : ''}. Here is how the store looks today.
      </p>
      {statsError && (
        <p className="dsh-error" role="alert">
          The store figures could not be loaded. Refresh the page to try again.
        </p>
      )}

      {/* ── Figures ── */}
      <section className="dsh-box" aria-label="Store figures">
        <h2 className="dsh-head">Store Figures</h2>
        <div className="dsh-stats">
          <Stat label="Total products" value={stats?.products.total} loading={statsLoading}
            note={stats ? `+${stats.products.newThisMonth} added this month` : undefined} />
          <Stat label="Active listings" value={stats?.products.active} loading={statsLoading}
            note={stats && stats.products.total ? `${Math.round((stats.products.active / stats.products.total) * 100)}% of catalogue` : undefined} />
          <Stat label="Registered users" value={stats?.users.total} loading={statsLoading}
            note={growth !== undefined ? `${growth > 0 ? '+' : ''}${growth}% vs last month` : undefined} />
          <Stat label="Categories" value={stats?.categories.total} loading={statsLoading} />
        </div>
      </section>

      <div className="dsh-cols">
        {/* ── Left column ── */}
        <div className="dsh-left">
          <section className="dsh-box">
            <h2 className="dsh-head">Quick Access</h2>
            <ul className="dsh-links">
              {QUICK_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} target={l.href === '/' ? '_blank' : undefined}>{l.label}</Link>
                  <span>{l.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="dsh-box">
            <h2 className="dsh-head">This Month</h2>
            <div className="dsh-month">
              <div><b>{statsLoading ? '…' : `+${stats?.users.newThisMonth ?? 0}`}</b> new users registered</div>
              <div><b>{statsLoading ? '…' : `+${stats?.products.newThisMonth ?? 0}`}</b> products added</div>
            </div>
          </section>
        </div>

        {/* ── User registry ── */}
        <section className="dsh-box dsh-users" aria-label="User registry">
          <h2 className="dsh-head">User Registry</h2>

          <div className="dsh-toolbar">
            <span>
              {usersData
                ? <><b>{usersData.total.toLocaleString()}</b> users · <b>{usersData.adminCount}</b> admin · <b>{usersData.userCount}</b> customers</>
                : '\u00a0'}
            </span>
            <label className="dsh-search">
              <span>Search this page:</span>
              <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email" />
            </label>
          </div>

          <div className="dsh-table-wrap">
            <table className="dsh-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="dsh-skel"><td colSpan={4}><span /></td></tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="dsh-empty">
                    {q ? `No users on this page match “${search.trim()}”.` : 'No users yet.'}
                  </td></tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td className="dsh-name">
                        <Link href={`/admin/users/${u._id}`}>{u.name}</Link>
                      </td>
                      <td className="dsh-email">{u.email}</td>
                      <td>
                        <span className={`dsh-role ${u.role === 'admin' ? 'is-admin' : ''}`}>
                          {u.role === 'admin' ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td title={formatDate(u.createdAt)}>{timeAgo(u.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {usersData && (
            <div className="dsh-pager">
              <span>Displaying <b>{from}</b> to <b>{to}</b> (of <b>{total.toLocaleString()}</b> users)</span>
              <nav aria-label="User pages">
                Result Pages:
                {page > 1 && <button type="button" onClick={() => setPage(page - 1)}>[&lt;&lt; Prev]</button>}
                {pages.map(p => p === page
                  ? <b key={p} aria-current="page">{p}</b>
                  : <button type="button" key={p} onClick={() => setPage(p)}>{p}</button>)}
                {page < totalPages && <button type="button" onClick={() => setPage(page + 1)}>[Next &gt;&gt;]</button>}
              </nav>
            </div>
          )}
          <div className="dsh-more"><Link href="/admin/users">Manage all users »</Link></div>
        </section>
      </div>
    </div>
  );
}

const DASH_CSS = `
  .dsh { font-size: 11px; color: #222; }
  .dsh h1 { margin: 2px 0 2px; }
  .dsh-intro { margin: 0 0 14px; color: #7f7f7f; font-size: 12px; }
  .dsh-error { margin: 0 0 12px; padding: 6px 10px; border: 1px solid #e0a3a3; background: #fdf0f0; color: #990000; }

  .dsh-box { border: 1px solid #a6aec5; background: #fff; margin-bottom: 16px; }
  .dsh-head {
    margin: 0; padding: 4px 14px 5px; color: #fff; font-size: 12px; font-weight: bold;
    font-variant: small-caps; letter-spacing: .3px;
    background: linear-gradient(to bottom, #7d90c5 0, #bec9e4 2px, #a9b4d3 100%);
  }

  .dsh-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .dsh-stat { padding: 12px 14px; border-left: 1px solid #e3e6ee; }
  .dsh-stat:first-child { border-left: 0; }
  .dsh-stat-label { color: #7f7f7f; font-size: 11px; }
  .dsh-stat-value { color: #1c4874; font-size: 24px; font-weight: bold; margin: 4px 0 2px; font-variant-numeric: tabular-nums; }
  .dsh-stat-note { color: #555; font-size: 10px; }

  .dsh-cols { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 16px; align-items: start; }
  .dsh-left .dsh-box:last-child { margin-bottom: 0; }

  .dsh-links { list-style: none; margin: 0; padding: 6px 0; }
  .dsh-links li { padding: 5px 14px; border-bottom: 1px dotted #dfe2ea; }
  .dsh-links li:last-child { border-bottom: 0; }
  .dsh-links a { display: block; color: #003366; font-weight: bold; }
  .dsh-links a::before { content: "\\00BB"; color: #999; margin-right: 6px; font-weight: normal; }
  .dsh-links a:hover { text-decoration: underline; }
  .dsh-links span { display: block; color: #7f7f7f; font-size: 10px; padding-left: 14px; }

  .dsh-month { padding: 10px 14px; line-height: 20px; color: #555; }
  .dsh-month b { color: #1c4874; font-size: 14px; margin-right: 4px; }

  .dsh-toolbar {
    display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 8px 10px; background: #dfe2ea; border-bottom: 1px solid #a6aec5; color: #555;
  }
  .dsh-toolbar b { color: #000; }
  .dsh-search { display: inline-flex; align-items: center; gap: 6px; color: #555; }
  .dsh-search input { font-size: 11px; border: 1px solid #333; height: 20px; padding: 0 4px; width: 170px; background: #fff; }

  .dsh-table-wrap { overflow-x: auto; }
  .dsh-table { width: 100%; border-collapse: collapse; }
  .dsh-table th {
    text-align: left; font-size: 10px; font-weight: bold; color: #000; padding: 3px 8px;
    border-left: 1px solid #fff; white-space: nowrap;
  }
  .dsh-table th:first-child { border-left: 0; }
  .dsh-table td { padding: 7px 8px; border-bottom: 1px solid #eee; color: #555; vertical-align: middle; }
  .dsh-table tbody tr:hover td { background: #f5f7fb; }
  .dsh-name a { color: #003366; font-weight: bold; }
  .dsh-name a:hover { text-decoration: underline; }
  .dsh-email { word-break: break-all; }
  .dsh-role { display: inline-block; padding: 0 6px; border: 1px solid #a6aec5; background: #eef2f8; color: #333; font-size: 10px; }
  .dsh-role.is-admin { border-color: #1c4874; background: #1c4874; color: #fff; }
  .dsh-empty { text-align: center; padding: 26px 10px !important; color: #7f7f7f; }
  .dsh-skel span { display: block; height: 12px; background: #eef0f5; }

  .dsh-pager {
    display: flex; justify-content: space-between; align-items: center; gap: 8px 16px; flex-wrap: wrap;
    padding: 8px 10px; color: #7f7f7f; font-size: 10px;
  }
  .dsh-pager b { color: #333; }
  .dsh-pager nav { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .dsh-pager button { background: none; border: 0; padding: 0; cursor: pointer; color: #0000ee; text-decoration: underline; font-size: 10px; }
  .dsh-pager button:hover { color: #003366; }
  .dsh-more { padding: 0 10px 8px; text-align: right; }
  .dsh-more a { color: #003366; font-weight: bold; }
  .dsh-more a:hover { text-decoration: underline; }

  @media (max-width: 1100px) {
    .dsh-cols { grid-template-columns: minmax(0, 1fr); }
  }
  @media (max-width: 700px) {
    .dsh-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dsh-stat:nth-child(3) { border-left: 0; }
    .dsh-stat:nth-child(n+3) { border-top: 1px solid #e3e6ee; }
    .dsh, .dsh-links span, .dsh-pager, .dsh-pager button { font-size: 12px; }
    .dsh-search input { height: 30px; font-size: 14px; width: 100%; }
    .dsh-search { width: 100%; }
  }
`;
