import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import '@/lib/registerModels';
import { deleteStaleGuests } from '@/services/guest.service';

// Same auth pattern as the other cron routes:
// Authorization: Bearer <CRON_SECRET>  OR  ?secret=<CRON_SECRET>
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get('secret') === secret;
}

/**
 * Removes guest-checkout sessions that haven't been used for 30 days and
 * never placed an order (their carts go with them). Guests who did order
 * are kept, because their orders point at them.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    const deleted = await deleteStaleGuests(30);
    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    console.error('[cron/cleanup-guests]', err);
    return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 });
  }
}
