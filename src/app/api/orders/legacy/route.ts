import { connectDB } from '@/lib/db';
import '@/lib/registerModels';
import LegacyOrder from '@/models/LegacyOrder';
import { withMember, AuthenticatedRequest } from '@/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * GET /api/orders/legacy — the signed-in customer's orders from the old
 * Alpha Imports website (read-only). Internal notes are never stored on
 * these records; only comments the customer was told about are included.
 */
export const GET = withMember(async (req: AuthenticatedRequest) => {
  try {
    await connectDB();
    const orders = await LegacyOrder.find({ user: req.user.userId })
      .sort({ purchasedAt: -1 })
      .select('-_id -__v -user -legacyCustomerId -importedAt -billing')
      .limit(1000)
      .lean();
    return successResponse(orders);
  } catch (err) {
    console.error('[orders/legacy]', err);
    return errorResponse('Failed to fetch your previous orders', 500);
  }
});
