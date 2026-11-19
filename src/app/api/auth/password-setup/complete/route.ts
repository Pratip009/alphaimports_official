import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import '@/lib/registerModels';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/api-response';
import { firstZodErrorMessage } from '@/lib/validation';
import { setSessionCookies, currentGuestId } from '@/lib/auth-cookies';
import { signToken } from '@/lib/jwt';
import { completeSetup, MIN_PASSWORD_LENGTH } from '@/services/passwordSetup.service';
import { toPublicUser } from '@/services/auth.service';
import { mergeGuestIntoMember } from '@/services/guest.service';

const schema = z.object({
  token: z.string().min(10, 'This link is not valid.').max(200),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Please choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(100, 'That password is too long.'),
});

/**
 * POST /api/auth/password-setup/complete — set the password from an emailed
 * link and sign the customer straight in (no extra login step).
 */
export async function POST(req: NextRequest) {
  const ipLimit = await rateLimit(req, { id: 'pw-setup-complete-ip', limit: 10, windowSec: 900 });
  if (!ipLimit.success) return rateLimitResponse(ipLimit);

  try {
    await connectDB();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return errorResponse(firstZodErrorMessage(parsed.error), 400);

    const user = await completeSetup(parsed.data.token, parsed.data.password);
    await mergeGuestIntoMember(currentGuestId(req), user);

    const response = NextResponse.json({ success: true, data: { user: toPublicUser(user) } });
    setSessionCookies(
      response,
      signToken({ userId: user._id.toString(), email: user.email, role: user.role })
    );
    return response;
  } catch (err) {
    console.error('[password-setup/complete]', err);
    return errorResponse(err instanceof Error ? err.message : 'Could not set your password. Please try again.', 400);
  }
}
