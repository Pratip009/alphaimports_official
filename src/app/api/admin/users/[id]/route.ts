import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import LegacyOrder from '@/models/LegacyOrder';
import AnalyticsSession from '@/models/AnalyticsSession';
import { withAdmin } from '@/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

export const GET = withAdmin(async (_req, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse('Invalid user id', 400);
    }

    await connectDB();

    const user = await User.findById(id).select('-password -googleId -avatarPublicId').lean();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const [orders, sessionStatsAgg, recentSessions, legacyAgg] = await Promise.all([
      Order.find({ user: id })
        .select('items totalAmount status paymentStatus paymentMethod createdAt')
        .sort({ createdAt: -1 })
        .lean(),

      AnalyticsSession.aggregate([
        { $match: { userId: id } },
        {
          $group: {
            _id: null,
            totalScreenTime: { $sum: '$duration' },
            sessionCount: { $sum: 1 },
            totalPageViews: { $sum: '$pageViews' },
            avgSessionDuration: { $avg: '$duration' },
            lastActiveAt: { $max: '$lastActivityAt' },
            firstSeenAt: { $min: '$startedAt' },
          },
        },
      ]),

      AnalyticsSession.find({ userId: id })
        .select('sessionId startedAt lastActivityAt duration pageViews entryPage exitPage device')
        .sort({ startedAt: -1 })
        .limit(20)
        .lean(),

      // Orders from the old website (read-only history).
      LegacyOrder.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: '$total' },
            first: { $min: '$purchasedAt' },
            last: { $max: '$purchasedAt' },
          },
        },
      ]),
    ]);

    const orderCount = orders.length;
    const completedOrders = orders.filter((o) => o.paymentStatus === 'completed');
    const totalSpent = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = completedOrders.length ? totalSpent / completedOrders.length : 0;
    const lastOrderAt = orders[0]?.createdAt ?? null;

    const sessionStats = sessionStatsAgg[0] ?? {
      totalScreenTime: 0,
      sessionCount: 0,
      totalPageViews: 0,
      avgSessionDuration: 0,
      lastActiveAt: null,
      firstSeenAt: null,
    };

    return successResponse({
      user,
      purchases: {
        orderCount,
        completedOrderCount: completedOrders.length,
        totalSpent,
        avgOrderValue,
        lastOrderAt,
      },
      orders,
      legacyOrders: {
        count: legacyAgg[0]?.count ?? 0,
        total: Math.round((legacyAgg[0]?.total ?? 0) * 100) / 100,
        first: legacyAgg[0]?.first ?? null,
        last: legacyAgg[0]?.last ?? null,
      },
      analytics: {
        totalScreenTime: sessionStats.totalScreenTime || 0,
        sessionCount: sessionStats.sessionCount || 0,
        totalPageViews: sessionStats.totalPageViews || 0,
        avgSessionDuration: sessionStats.avgSessionDuration || 0,
        lastActiveAt: sessionStats.lastActiveAt,
        firstSeenAt: sessionStats.firstSeenAt,
        recentSessions,
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/users/[id]]', err);
    return errorResponse('Failed to fetch user', 500);
  }
});