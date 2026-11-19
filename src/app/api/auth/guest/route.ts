import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import '@/lib/registerModels';
import User from '@/models/User';
import { signToken, verifyToken, extractTokenFromCookie } from '@/lib/jwt';
import { setSessionCookies } from '@/lib/auth-cookies';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/api-response';
import { createGuestUser } from '@/services/guest.service';
import { toPublicUser } from '@/services/auth.service';

/**
 * POST /api/auth/guest — start shopping without an account.
 *
 * Called by the site the first time a visitor who isn't signed in adds
 * something to their cart. Returns the existing session if there already is
 * one (guest or member), so it's safe to call more than once.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = extractTokenFromCookie(req);
    if (token) {
      try {
        const payload = verifyToken(token);
        const existing = await User.findById(payload.userId).lean();
        if (existing) {
          return NextResponse.json({ success: true, data: { user: toPublicUser(existing as any) } });
        }
      } catch {
        // expired / invalid — fall through and start a fresh guest session
      }
    }

    const limit = await rateLimit(req, { id: 'guest-session', limit: 20, windowSec: 3600 });
    if (!limit.success) return rateLimitResponse(limit);

    const guest = await createGuestUser();
    const response = NextResponse.json(
      { success: true, data: { user: toPublicUser(guest) } },
      { status: 201 }
    );
    setSessionCookies(
      response,
      signToken({ userId: guest._id.toString(), email: guest.email, role: 'user', guest: true })
    );
    return response;
  } catch (err) {
    console.error('[auth/guest]', err);
    return errorResponse('Could not start your shopping session. Please try again.', 500);
  }
}
