import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { listCoupons, getCouponStats } from '@/services/coupon.service';
import { withAdmin } from '@/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET /api/admin/coupons
export const GET = withAdmin(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    if (searchParams.get('statsOnly') === 'true') {
      const stats = await getCouponStats();
      return successResponse(stats);
    }

    const page   = parseInt(searchParams.get('page')  ?? '1', 10);
    const limit  = parseInt(searchParams.get('limit') ?? '20', 10);
    const search = searchParams.get('search') ?? undefined;
    const status = (searchParams.get('status') ?? 'all') as 'active' | 'used' | 'expired' | 'all';

    const result = await listCoupons({ page, limit, search, status });
    return successResponse(result);
  } catch (err) {
    console.error('[admin/coupons GET]', err);
    return errorResponse('Failed to fetch coupons', 500);
  }
});