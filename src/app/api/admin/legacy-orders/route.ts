import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import '@/lib/registerModels';
import LegacyOrder from '@/models/LegacyOrder';
import User from '@/models/User';
import { withAdmin } from '@/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/admin/legacy-orders — orders from the old Alpha Imports website.
 *
 * Query:
 *   search   order number, old customer number, email, or name
 *   user     only this account's old orders (User _id)
 *   unlinked "1" → only orders that couldn't be matched to an account
 *   page, limit
 *
 * Read-only, and kept apart from /api/admin/orders so old sales never
 * affect revenue figures or shipping lists.
 */
export const GET = withAdmin(async (req) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const search = (url.searchParams.get('search') || '').trim().slice(0, 100);
    const userId = url.searchParams.get('user') || '';
    const unlinked = url.searchParams.get('unlinked') === '1';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10) || 25));

    const filter: Record<string, unknown> = {};
    let forUser: { _id: string; name: string; email: string } | null = null;

    if (userId) {
      if (!mongoose.isValidObjectId(userId)) return errorResponse('Invalid user id', 400);
      filter.user = new mongoose.Types.ObjectId(userId);
      const u = await User.findById(userId).select('name email').lean();
      if (u) forUser = { _id: String(u._id), name: u.name, email: u.email };
    } else if (unlinked) {
      filter.user = null;
    }

    if (search) {
      const digits = search.replace(/^#/, '');
      if (/^\d+$/.test(digits)) {
        const n = parseInt(digits, 10);
        filter.$or = [{ legacyOrderId: n }, { legacyCustomerId: n }];
      } else if (search.includes('@')) {
        filter.email = { $regex: `^${escapeRegex(search.toLowerCase())}` };
      } else {
        const rx = { $regex: escapeRegex(search), $options: 'i' };
        filter.$or = [{ customerName: rx }, { 'delivery.name': rx }, { email: rx }];
      }
    }

    const [orders, total, summaryAgg] = await Promise.all([
      LegacyOrder.find(filter)
        .select('legacyOrderId legacyCustomerId user email customerName purchasedAt total status items.quantity delivery.city delivery.state delivery.country')
        .sort({ purchasedAt: -1, legacyOrderId: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LegacyOrder.countDocuments(filter),
      LegacyOrder.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            value: { $sum: '$total' },
            unlinked: { $sum: { $cond: [{ $eq: ['$user', null] }, 1, 0] } },
            first: { $min: '$purchasedAt' },
            last: { $max: '$purchasedAt' },
          },
        },
      ]),
    ]);

    const s = summaryAgg[0] || { value: 0, unlinked: 0, first: null, last: null };
    return successResponse({
      orders: orders.map((o) => ({
        legacyOrderId: o.legacyOrderId,
        legacyCustomerId: o.legacyCustomerId,
        userId: o.user ? String(o.user) : null,
        email: o.email,
        customerName: o.customerName,
        purchasedAt: o.purchasedAt,
        total: o.total,
        status: o.status,
        itemCount: (o.items || []).reduce((n: number, i: { quantity?: number }) => n + (i.quantity || 0), 0),
        place: [o.delivery?.city, o.delivery?.state, o.delivery?.country].filter(Boolean).join(', '),
      })),
      total,
      page,
      limit,
      summary: {
        value: Math.round((s.value || 0) * 100) / 100,
        unlinked: s.unlinked || 0,
        first: s.first,
        last: s.last,
      },
      forUser,
    });
  } catch (err) {
    console.error('[admin/legacy-orders]', err);
    return errorResponse('Failed to load old website orders', 500);
  }
});
