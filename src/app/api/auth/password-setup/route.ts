import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import '@/lib/registerModels';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/api-response';
import { emailSchema, firstZodErrorMessage } from '@/lib/validation';
import { sendSetupLink, inspectSetupToken } from '@/services/passwordSetup.service';
import { currentGuestId } from '@/lib/auth-cookies';
import { PHONE_DISPLAY } from '@/lib/site';
import { createAccountFromGuestOrder } from '@/services/guest.service';

const requestSchema = z.object({
  email: emailSchema,
  /** 'login' when sent from the "Welcome back" message on the sign-in page. */
  from: z.enum(['login', 'request', 'expired', 'guest']).optional(),
});

/**
 * POST /api/auth/password-setup — email me a set-password link.
 * Same answer whether or not an account exists, so it can't be used to
 * check which emails are registered.
 */
export async function POST(req: NextRequest) {
  const ipLimit = await rateLimit(req, { id: 'pw-setup-request-ip', limit: 10, windowSec: 900 });
  if (!ipLimit.success) return rateLimitResponse(ipLimit);

  try {
    await connectDB();
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse(firstZodErrorMessage(parsed.error), 400);
    const { email, from } = parsed.data;

    const purpose = from === 'login' ? 'login_prompt' : from === 'guest' ? 'guest_claim' : 'request';
    let result = await sendSetupLink(email, purpose);

    // Guest who just checked out and wants an account: if this guest session
    // really placed an order with this email, create the account from that
    // order's details, then send the link. Opening the link proves the
    // email is theirs; their guest orders move into the account then.
    if (result === 'no_account' && from === 'guest') {
      const guestId = currentGuestId(req);
      if (guestId && (await createAccountFromGuestOrder(guestId, email))) {
        result = await sendSetupLink(email, 'guest_claim');
      }
    }

    if (result === 'throttled') {
      return successResponse({
        status: 'throttled',
        message: `We've already sent a few links to ${email} in the last few minutes. Please check your inbox and spam folder — the newest link is the one to use.`,
      });
    }
    return successResponse({
      status: 'sent',
      message: `If ${email} is registered with us, a secure link is on its way. It can take a minute or two — please check your spam folder too.`,
    });
  } catch (err) {
    // Technical detail (e.g. email service misconfigured) goes to the logs;
    // the customer gets something they can act on.
    console.error('[password-setup/request]', err);
    return errorResponse(
      `Sorry, we couldn't send the email right now. Please try again in a few minutes, or call us at ${PHONE_DISPLAY} and we'll help you sign in.`,
      500
    );
  }
}

/** GET /api/auth/password-setup?token=… — is this link still good? */
export async function GET(req: NextRequest) {
  const ipLimit = await rateLimit(req, { id: 'pw-setup-inspect-ip', limit: 30, windowSec: 900 });
  if (!ipLimit.success) return rateLimitResponse(ipLimit);
  try {
    await connectDB();
    const token = req.nextUrl.searchParams.get('token') || '';
    return successResponse(await inspectSetupToken(token));
  } catch (err) {
    console.error('[password-setup/inspect]', err);
    return errorResponse('Could not check this link. Please try again.', 500);
  }
}
