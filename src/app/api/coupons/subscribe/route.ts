import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { subscribeCoupon } from '@/services/coupon.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/coupons/subscribe
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const email = body?.email?.toString().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Please provide a valid email address.', 400);
    }

    const coupon = await subscribeCoupon(email);

    return successResponse(
      { message: 'Coupon sent! Check your inbox.' },
      201
    );
  } catch (err) {
    console.error('[coupon/subscribe]', err);
    return errorResponse(err instanceof Error ? err.message : 'Failed to create coupon', 500);
  }
}