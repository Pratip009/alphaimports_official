import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { deleteCoupon } from '@/services/coupon.service';
import { withAdmin } from '@/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

// DELETE /api/admin/coupons/[id]
export const DELETE = withAdmin(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params;
    await connectDB();
    await deleteCoupon(id);
    return successResponse({ message: 'Coupon deleted.' });
  } catch (err) {
    console.error('[admin/coupons DELETE]', err);
    return errorResponse(err instanceof Error ? err.message : 'Failed to delete coupon', 400);
  }
});