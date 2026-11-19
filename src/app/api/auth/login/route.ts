import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { login, PasswordSetupRequiredError } from "@/services/auth.service";
import { mergeGuestIntoMember } from "@/services/guest.service";
import { errorResponse } from "@/lib/api-response";
import { setSessionCookies, currentGuestId } from "@/lib/auth-cookies";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { emailSchema, firstZodErrorMessage } from "@/lib/validation";
import { z } from "zod";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please enter your password.'),
});

export async function POST(req: NextRequest) {
  try {
    const ipLimit = await rateLimit(req, {
      id: "login-ip",
      limit: 10,
      windowSec: 300,
    });
    if (!ipLimit.success) return rateLimitResponse(ipLimit);

    await connectDB();
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        firstZodErrorMessage(parsed.error),
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const { email, password } = parsed.data;

    const acctLimit = await rateLimit(req, {
      id: "login-acct",
      limit: 5,
      windowSec: 900,
      extraKey: email.toLowerCase(),
      scope: "key",
    });
    if (!acctLimit.success) {
      return rateLimitResponse(
        acctLimit,
        "Too many failed login attempts for this account. Please wait 15 minutes and try again, or reset your password."
      );
    }

    const result = await login(email, password);
    await mergeGuestIntoMember(currentGuestId(req), { _id: result.user.id, email: result.user.email });

    const response = NextResponse.json(
      { success: true, data: { user: result.user } },
      { status: 200 },
    );
    setSessionCookies(response, result.token);

    return response;
  } catch (err) {
    if (err instanceof PasswordSetupRequiredError) {
      // Customer from the old website, no password set yet. Not an error
      // for them — the sign-in page shows the welcome message and a
      // one-click "email me my link" button.
      return NextResponse.json(
        {
          success: false,
          code: err.code,
          message: err.message,
          data: { email: err.email, firstName: err.firstName },
        },
        { status: 409 },
      );
    }
    console.error("[login]", err);
    return errorResponse("Invalid email or password", 401);
  }
}