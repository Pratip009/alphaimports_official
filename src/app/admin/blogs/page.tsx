'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen, Plus, Search, Eye, Heart, MessageCircle, Edit, Trash2,
  ChevronLeft, ChevronRight, TrendingUp, FileText, BarChart2, Users,
  CheckCircle2, Clock, Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthFetch } from '@/hooks/useAuthFetch';

// ─── Types ─────────────────────────────────────────────────────────────────

interface BlogRow {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  category: string;
  publishedAt?: string;
  views: number;
  likes: string[];
  comments: unknown[];
  createdAt: string;
}

interface BlogStats {
  totalBlogs: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

interface Pagination {
  total: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: number; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white border border-[#c6cbd6] rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
      <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
          <Icon size={15} strokeWidth={1.7} style={{ color: accent }} />
        </div>
      </div>
      <div className=" text-[2rem] font-medium text-[#222222] leading-none mb-1 tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="text-[0.7rem] text-[#7f7f7f] tracking-wide uppercase font-medium">{label}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminBlogsPage() {
  const { user, loading: authLoading } = useAuth();
  const authFetch = useAuthFetch();

  const [blogs, setBlogs]       = useState<BlogRow[]>([]);
  const [stats, setStats]       = useState<BlogStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch stats
  useEffect(() => {
    if (authLoading || !user) return;
    authFetch('/api/admin/blogs/stats').then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
    });
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch blogs
  const fetchBlogs = useCallback(() => {
    if (authLoading || !user) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', status: statusFilter });
    if (search) params.set('search', search);

    authFetch(`/api/admin/blogs?${params}`)
      .then(r => r.json())
      .then(d => {
        setBlogs(d.data ?? []);
        setPagination(d.pagination ?? null);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user, page, search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post permanently?')) return;
    setDeleting(id);
    await authFetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchBlogs();
  };

  const handleToggleStatus = async (blog: BlogRow) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    await authFetch(`/api/admin/blogs/${blog._id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    fetchBlogs();
  };

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div>

      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[0.68rem] tracking-[0.22em] uppercase text-[#1c4874] font-semibold mb-2">◆ Content Management</p>
          <h1 className=" text-[2.6rem] font-medium text-[#222222] leading-none">Blog</h1>
        </div>
        <Link
          href="/admin/blogs/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1c4874] text-white text-[0.75rem] font-semibold rounded-xl hover:bg-[#1c4874] transition-colors shadow-md shadow-[#1c4874]/20"
        >
          <Plus size={14} strokeWidth={2.5} /> New Post
        </Link>
      </div>
      <div className="mb-8 h-px bg-gradient-to-r from-[#1c4874]/30 via-[#e3e6ee] to-transparent" />

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Posts"   value={stats.totalBlogs}    icon={BookOpen}   accent="#1c4874" />
          <StatCard label="Total Views"   value={stats.totalViews}    icon={TrendingUp} accent="#2f5681" />
          <StatCard label="Total Likes"   value={stats.totalLikes}    icon={Heart}      accent="#990000" />
          <StatCard label="Comments"      value={stats.totalComments} icon={MessageCircle} accent="#2d7a52" />
        </div>
      )}

      {/* ── Table card ── */}
      <div className="bg-white border border-[#c6cbd6] rounded-2xl overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#c6cbd6]">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search posts…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2 text-[0.72rem] bg-[#f5f7fb] border border-[#c6cbd6] rounded-lg outline-none focus:border-[#1c4874]/50 focus:ring-1 focus:ring-[#1c4874]/20 w-44 placeholder:text-[#999999]"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            {(['all', 'published', 'draft'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[0.65rem] font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-[#1c4874] text-white'
                    : 'text-[#555555] hover:bg-[#eef0f5]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {pagination && (
            <span className="ml-auto text-[0.68rem] text-[#7f7f7f]">
              {pagination.total} post{pagination.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_110px_80px_80px_80px_100px] px-5 py-2.5 border-b border-[#c6cbd6] bg-[#f5f7fb]">
          {['Title', 'Category', 'Views', 'Likes', 'Comments', 'Actions'].map(h => (
            <span key={h} className="text-[0.6rem] tracking-[0.15em] uppercase text-[#999999] font-semibold">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_110px_80px_80px_80px_100px] px-5 py-3.5 border-b border-[#e3e6ee] animate-pulse">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-48 bg-[#e3e6ee] rounded" />
                  <div className="h-3 w-24 bg-[#e3e6ee] rounded" />
                </div>
                <div className="h-5 w-20 bg-[#e3e6ee] rounded-full self-center" />
                {[1,2,3].map(j => <div key={j} className="h-3 w-10 bg-[#e3e6ee] rounded self-center" />)}
                <div className="h-7 w-20 bg-[#e3e6ee] rounded-lg self-center" />
              </div>
            ))
          ) : blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText size={28} strokeWidth={1.2} className="text-[#999999] mb-3" />
              <p className="text-[0.78rem] text-[#999999]">No blog posts found</p>
              <Link href="/admin/blogs/new" className="mt-4 text-[0.72rem] text-[#1c4874] hover:underline font-semibold">
                Create your first post →
              </Link>
            </div>
          ) : (
            blogs.map(blog => (
              <div
                key={blog._id}
                className="grid grid-cols-[1fr_110px_80px_80px_80px_100px] px-5 py-3.5 border-b border-[#e3e6ee] hover:bg-[#f5f7fb] transition-colors"
              >
                {/* Title */}
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[0.55rem] font-semibold ${
                      blog.status === 'published'
                        ? 'bg-[#2d7a52]/15 text-[#4a7a2a] border border-[#2d7a52]/25'
                        : 'bg-[#a6aec5]/20 text-[#154273] border border-[#1c4874]/20'
                    }`}>
                      {blog.status === 'published'
                        ? <><Globe size={8} /> Live</>
                        : <><Clock size={8} /> Draft</>
                      }
                    </span>
                  </div>
                  <p className="text-[0.8rem] font-semibold text-[#222222] truncate">{blog.title}</p>
                  <p className="text-[0.65rem] text-[#7f7f7f] mt-0.5">{timeAgo(blog.createdAt)}</p>
                </div>

                {/* Category */}
                <div className="self-center">
                  <span className="text-[0.65rem] text-[#7f7f7f] bg-[#eef0f5] px-2 py-0.5 rounded-full">{blog.category}</span>
                </div>

                {/* Views */}
                <div className="self-center">
                  <span className="flex items-center gap-1 text-[0.72rem] text-[#7f7f7f]">
                    <Eye size={11} strokeWidth={1.8} />
                    {blog.views.toLocaleString()}
                  </span>
                </div>

                {/* Likes */}
                <div className="self-center">
                  <span className="flex items-center gap-1 text-[0.72rem] text-[#7f7f7f]">
                    <Heart size={11} strokeWidth={1.8} />
                    {blog.likes.length}
                  </span>
                </div>

                {/* Comments */}
                <div className="self-center">
                  <span className="flex items-center gap-1 text-[0.72rem] text-[#7f7f7f]">
                    <MessageCircle size={11} strokeWidth={1.8} />
                    {blog.comments.length}
                  </span>
                </div>

                {/* Actions */}
                <div className="self-center flex items-center gap-1.5">
                  {/* Publish/Draft toggle */}
                  <button
                    onClick={() => handleToggleStatus(blog)}
                    title={blog.status === 'published' ? 'Set to draft' : 'Publish'}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                      blog.status === 'published'
                        ? 'border-[#2d7a52]/30 text-[#4a7a2a] hover:bg-[#2d7a52]/10'
                        : 'border-[#1c4874]/30 text-[#154273] hover:bg-[#1c4874]/10'
                    }`}
                  >
                    <CheckCircle2 size={13} strokeWidth={1.8} />
                  </button>

                  {/* Edit */}
                  <Link
                    href={`/admin/blogs/${blog._id}`}
                    className="w-7 h-7 rounded-lg border border-[#c6cbd6] flex items-center justify-center text-[#555555] hover:border-[#2f5681]/40 hover:text-[#2f5681] transition-all"
                  >
                    <Edit size={13} strokeWidth={1.8} />
                  </Link>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(blog._id)}
                    disabled={deleting === blog._id}
                    className="w-7 h-7 rounded-lg border border-[#c6cbd6] flex items-center justify-center text-[#555555] hover:border-red-200 hover:text-red-500 disabled:opacity-50 transition-all"
                  >
                    <Trash2 size={13} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#c6cbd6] bg-[#f5f7fb]">
            <span className="text-[0.68rem] text-[#7f7f7f]">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-lg border border-[#c6cbd6] flex items-center justify-center hover:border-[#1c4874]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={13} strokeWidth={2} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 rounded-lg text-[0.7rem] font-semibold transition-all"
                    style={p === page
                      ? { background: '#1c4874', color: '#fff', border: '1px solid #1c4874' }
                      : { background: 'transparent', color: '#555555', border: '1px solid #c6cbd6' }}>
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 rounded-lg border border-[#c6cbd6] flex items-center justify-center hover:border-[#1c4874]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}