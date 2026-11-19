import { connectDB } from '@/lib/db';
import '@/lib/registerModels';
import LegacyOrder from '@/models/LegacyOrder';
import User from '@/models/User';
import { withAdmin } from '@/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * GET /api/admin/legacy-orders/:orderId — one old-website order in full,
 * including staff-only notes and the account it belongs to.
 */
export const GET = withAdmin(async (_req, context: { params: Promise<{ orderId: string }> }) => {
  try {
    const { orderId } = await context.params;
    const n = parseInt(String(orderId).replace(/^#/, ''), 10);
    if (!Number.isFinite(n)) return errorResponse('Invalid order number', 400);

    await connectDB();
    const order = await LegacyOrder.findOne({ legacyOrderId: n }).select('-__v').lean();
    if (!order) return errorResponse('Order not found', 404);

    const account = order.user
      ? await User.findById(order.user).select('name email').lean()
      : null;

    // Other old orders by the same customer, for quick navigation.
    const siblings = await LegacyOrder.find(
      order.user ? { user: order.user } : { email: order.email },
    )
      .select('legacyOrderId purchasedAt total')
      .sort({ purchasedAt: -1 })
      .limit(50)
      .lean();

    return successResponse({
      order: { ...order, _id: undefined, user: undefined },
      account: account ? { _id: String(account._id), name: account.name, email: account.email } : null,
      otherOrders: siblings
        .filter((s) => s.legacyOrderId !== n)
        .map((s) => ({ legacyOrderId: s.legacyOrderId, purchasedAt: s.purchasedAt, total: s.total })),
    });
  } catch (err) {
    console.error('[admin/legacy-orders/:id]', err);
    return errorResponse('Failed to load order', 500);
  }
});
