import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { resend } from '@/lib/resend';
import Otp from '@/models/Otp';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';
import { resolveAuthProviders, toPublicUser } from '@/services/auth.service';
import { otpEmailHtml, welcomeEmailHtml } from '@/lib/email-templates';

const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 3;
const MAX_CODES_PER_HOUR = 6;
const MAX_FAILED_PER_HOUR = 10;
const MAX_FAILED_PER_DAY = 20;
/** How long code records are kept (for the limits above) before TTL deletion. */
const RECORD_RETENTION_MS = 24 * 60 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1_000_000).padStart(6, '0');
}

/**
 * Limits on how often codes can be requested for one email + purpose.
 *
 * Previously this counted Otp records created in the last minute, but every
 * request deleted the older records first (Otp.deleteMany) — so the count was
 * never more than 1 and the limit never applied. Replaced codes are now kept
 * (marked `superseded`, retained until RECORD_RETENTION_MS) so they're counted.
 */
async function checkRateLimit(email: string, purpose: string): Promise<void> {
  const now = Date.now();
  const base = { email: email.toLowerCase(), purpose };
  const [lastMinute, lastHour] = await Promise.all([
    Otp.countDocuments({ ...base, createdAt: { $gte: new Date(now - RATE_LIMIT_WINDOW_SECONDS * 1000) } }),
    Otp.countDocuments({ ...base, createdAt: { $gte: new Date(now - 60 * 60 * 1000) } }),
  ]);
  if (lastMinute >= RATE_LIMIT_MAX) {
    throw new Error('Too many codes sent. Please wait a moment before requesting another.');
  }
  if (lastHour >= MAX_CODES_PER_HOUR) {
    throw new Error('Too many codes requested. Please try again in an hour.');
  }
}

/**
 * Wrong guesses for one email + purpose across ALL codes in the window, so
 * asking for a fresh code no longer resets the guess budget. Without this, a
 * 6-digit code could be brute-forced by requesting new codes indefinitely
 * and making MAX_ATTEMPTS guesses at each.
 */
async function failedAttemptsSince(email: string, purpose: string, sinceMs: number): Promise<number> {
  const [row] = await Otp.aggregate<{ total: number }>([
    { $match: { email: email.toLowerCase(), purpose, createdAt: { $gte: new Date(Date.now() - sinceMs) } } },
    { $group: { _id: null, total: { $sum: '$attempts' } } },
  ]);
  return row?.total ?? 0;
}

async function assertGuessBudget(email: string, purpose: string): Promise<void> {
  const [hour, day] = await Promise.all([
    failedAttemptsSince(email, purpose, 60 * 60 * 1000),
    failedAttemptsSince(email, purpose, RECORD_RETENTION_MS),
  ]);
  if (hour >= MAX_FAILED_PER_HOUR || day >= MAX_FAILED_PER_DAY) {
    throw new Error('Too many incorrect codes. For your security, please try again later.');
  }
}

/** Retire any live code for this email + purpose, keeping the record for rate limiting. */
async function supersedeActiveCodes(email: string, purpose: string): Promise<void> {
  await Otp.updateMany(
    { email, purpose, superseded: { $ne: true } },
    {
      $set: { superseded: true, expiresAt: new Date(Date.now() + RECORD_RETENTION_MS) },
      $unset: { pendingPassword: 1 },
    },
  );
}

function codeExpired(record: { codeExpiresAt?: Date; expiresAt: Date }): boolean {
  return (record.codeExpiresAt ?? record.expiresAt) < new Date();
}

async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: 'signup' | 'reset_password'
): Promise<void> {
  const subject =
    purpose === 'signup'
      ? 'Your Alphaimports.com verification code'
      : 'Reset your Alphaimports.com password';

  if (!process.env.RESEND_API_KEY) {
    // Fail loudly instead of letting `resend.emails.send` throw an opaque
    // auth error further down — this is the #1 cause of "OTP never
    // arrives" reports and is easy to miss because signup still appears
    // to "work" up until this call.
    throw new Error(
      'Email service is not configured (missing RESEND_API_KEY). Verification codes cannot be sent.'
    );
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html: otpEmailHtml(otp, purpose),
      // A plain-text part alongside the HTML. Yahoo/AOL and Outlook filters
      // treat HTML-only mail as a spam signal, and it's what text-only mail
      // clients and screen readers show.
      text: otpEmailText(otp, purpose),
    });

    // The Resend SDK often resolves successfully even when delivery was
    // rejected (e.g. sandbox `onboarding@resend.dev` can only deliver to
    // the account owner's own verified address until a custom domain is
    // verified) — the failure shows up in `result.error`, not a thrown
    // exception. Surface it instead of silently telling the user "code
    // sent" when nothing was actually delivered.
    if (result?.error) {
      console.error('[sendOtpEmail] Resend rejected the send:', result.error);
      const isSandboxRestriction =
        FROM.endsWith('@resend.dev') ||
        /only send testing emails|verify a domain/i.test(result.error.message ?? '');
      throw new Error(
        isSandboxRestriction
          ? 'Email could not be delivered: the sending domain is not verified with Resend yet, so codes can only reach the account\'s own test address. Verify a domain and set EMAIL_FROM to an address on it.'
          : `Email could not be delivered: ${result.error.message ?? 'unknown error'}`
      );
    }
  } catch (err) {
    console.error('[sendOtpEmail] Resend threw an error:', err instanceof Error ? err.message : err);
    throw err;
  }
}

function otpEmailText(otp: string, purpose: 'signup' | 'reset_password'): string {
  const lines =
    purpose === 'signup'
      ? [
          'Verify your email',
          '',
          'Enter this code to complete your registration and activate your Alphaimports.com account:',
        ]
      : [
          'Reset your password',
          '',
          'Use this code to reset your Alphaimports.com password. If you did not request this, you can safely ignore this email.',
        ];
  return [
    ...lines,
    '',
    `    ${otp}`,
    '',
    `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    '',
    'Never share this code. Alphaimports.com will never ask for it by phone or email.',
    '',
    'Alphaimports.com',
  ].join('\n');
}

// ─── Signup OTP ───────────────────────────────────────────────────────────────

export async function sendSignupOtp(
  name: string,
  email: string,
  password: string
): Promise<void> {
  // Normalize defensively even though the API layer (zod `emailSchema`)
  // already trims + lowercases — this function is also reachable from
  // scripts/tests that may not go through that layer.
  const normalizedEmail = email.trim().toLowerCase();

  // Collation strength 2 makes this comparison case-insensitive AND
  // accent-insensitive at the query level, independent of whatever the
  // stored casing happens to be. Without this, a document written before
  // the schema's `lowercase: true` was added (or inserted by a script
  // that bypassed it) could sit in the collection with mixed case and
  // silently evade a plain `{ email: normalizedEmail }` match in one
  // direction while still colliding with it via the unique index in the
  // other — i.e. exactly the "I deleted it but it still says it exists"
  // (or the reverse: "it lets me register a duplicate") symptom.
  const existing = await User.findOne({ email: normalizedEmail })
    .collation({ locale: 'en', strength: 2 })
    .lean();
  if (existing) {
    throw new Error(
      'An account with this email already exists. Sign in instead — with your password or with Google.'
    );
  }

  await checkRateLimit(normalizedEmail, 'signup');

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const passwordHash = await bcrypt.hash(password, 12);

  await supersedeActiveCodes(normalizedEmail, 'signup');

  await Otp.create({
    email: normalizedEmail,
    otp: otpHash,
    purpose: 'signup',
    pendingName: name,
    pendingPassword: passwordHash,
    codeExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    expiresAt: new Date(Date.now() + RECORD_RETENTION_MS),
    verified: false,
    attempts: 0,
  });

  await sendOtpEmail(normalizedEmail, otp, 'signup');
}

export async function verifySignupOtp(
  email: string,
  otp: string
): Promise<{ token: string; user: object }> {
  const normalizedEmail = email.trim().toLowerCase();

  await assertGuessBudget(normalizedEmail, 'signup');

  const record = await Otp.findOne({
    email: normalizedEmail,
    purpose: 'signup',
    verified: false,
    superseded: { $ne: true },
  })
    .sort({ createdAt: -1 }).select('+otp +pendingPassword');

  if (!record) throw new Error('No pending verification found. Please request a new code.');
  if (!record.pendingName) throw new Error('Signup data is missing. Please start over.');
  if (codeExpired(record)) throw new Error('Code expired. Please request a new one.');
  if (record.attempts >= MAX_ATTEMPTS) throw new Error('Too many wrong attempts. Please request a new code.');

  const isMatch = await bcrypt.compare(otp, record.otp);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    throw new Error(
      remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many wrong attempts. Please request a new code.'
    );
  }

  record.verified = true;
  await record.save();

  // Insert directly to bypass pre-save hook (password is already bcrypt-hashed)
  const now = new Date();
  let result;
  try {
    result = await User.collection.insertOne({
      name: record.pendingName,
      email: normalizedEmail,
      password: record.pendingPassword,
      role: 'user',
      authProviders: ['password'],
      emailVerified: true,
      phone: '',
      avatarUrl: '',
      address: { line1: '', line2: '', city: '', state: '', postalCode: '', country: '' },
      memoStatus: 'none',
      memoCreditLimit: 0,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err: any) {
    // E11000 = duplicate key. Can happen if two verify requests for the
    // same pending OTP race each other (e.g. a double-click or a client
    // retry), or if an account with this email was created through some
    // other path in the split second between the "does this exist"
    // check at OTP-send time and this insert. Either way, surface a
    // clear, actionable message instead of a raw Mongo error string.
    if (err?.code === 11000) {
      await Otp.deleteOne({ _id: record._id });
      throw new Error(
        'An account with this email already exists. Try logging in instead.'
      );
    }
    throw err;
  }

  const token = signToken({
    userId: result.insertedId.toString(),
    email: normalizedEmail,
    role: 'user',
  });

  await Otp.deleteOne({ _id: record._id });

  // Send welcome email — fires after account is fully created, exactly once.
  // Using void to not block the response on email delivery.
  void resend.emails.send({
    from: FROM,
    to: normalizedEmail,
    subject: `Welcome to Alphaimports.com`,
    html: welcomeEmailHtml(record.pendingName),
  });

  // Return the same shape as login / me so the client context is complete
  // straight after signup (previously address/phone/avatar were missing
  // until the next page load).
  const created = await User.findById(result.insertedId).lean();
  return {
    token,
    user: created
      ? toPublicUser(created as any)
      : {
          id: result.insertedId.toString(),
          name: record.pendingName,
          email: normalizedEmail,
          role: 'user',
          authProviders: ['password'],
          hasPassword: true,
          googleLinked: false,
        },
  };
}

// ─── Forgot Password OTP ──────────────────────────────────────────────────────

export async function sendForgotPasswordOtp(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  await checkRateLimit(normalizedEmail, 'reset_password');

  const userExists = await User.findOne({ email: normalizedEmail })
    .collation({ locale: 'en', strength: 2 })
    .lean();
  if (!userExists) return; // Silent — prevent email enumeration

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await supersedeActiveCodes(normalizedEmail, 'reset_password');

  await Otp.create({
    email: normalizedEmail,
    otp: otpHash,
    purpose: 'reset_password',
    codeExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    expiresAt: new Date(Date.now() + RECORD_RETENTION_MS),
    verified: false,
    attempts: 0,
  });

  await sendOtpEmail(normalizedEmail, otp, 'reset_password');
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  await assertGuessBudget(normalizedEmail, 'reset_password');

  const record = await Otp.findOne({
    email: normalizedEmail,
    purpose: 'reset_password',
    verified: false,
    superseded: { $ne: true },
  })
    .sort({ createdAt: -1 }).select('+otp');

  if (!record) throw new Error('No pending reset found. Please request a new code.');
  if (codeExpired(record)) throw new Error('Code expired. Please request a new one.');
  if (record.attempts >= MAX_ATTEMPTS) throw new Error('Too many wrong attempts. Please request a new code.');

  const isMatch = await bcrypt.compare(otp, record.otp);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    throw new Error(
      remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many wrong attempts. Please request a new code.'
    );
  }

  record.verified = true;
  await record.save();

  const user = await User.findOne({ email: normalizedEmail })
    .collation({ locale: 'en', strength: 2 })
    .select('+password');
  if (!user) throw new Error('Account not found.');

  user.password = newPassword; // pre-save hook will hash this
  // Resetting via an emailed code proves ownership of the address, and gives
  // Google-only accounts a password so they can use either method.
  user.emailVerified = true;
  const providers = resolveAuthProviders(user);
  user.authProviders = providers.includes('password') ? providers : [...providers, 'password'];
  await user.save();

  await Otp.deleteOne({ _id: record._id });
}