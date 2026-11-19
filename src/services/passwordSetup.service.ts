import crypto from 'crypto';
import mongoose from 'mongoose';
import User, { IUser } from '@/models/User';
import PasswordSetupToken, { PasswordSetupPurpose } from '@/models/PasswordSetupToken';
import { resend } from '@/lib/resend';
import { SITE_URL } from '@/lib/site';
import { resolveAuthProviders } from '@/services/auth.service';
import {
  passwordSetupEmailHtml,
  passwordSetupEmailText,
  passwordResetConfirmationEmailHtml,
} from '@/lib/email-templates';

/**
 * One-click "set your password" links.
 *
 * Used by:
 *   - the login page, when a customer from the old website signs in for the
 *     first time ("Welcome back… please set a new password")
 *   - the website-upgrade announcement email (scripts/send-upgrade-announcement.mjs)
 *   - "forgot password" — works for every account, not only migrated ones
 *   - guest-checkout customers who want to turn their details into an account
 */

const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** How long each kind of link works. */
export const LINK_TTL: Record<PasswordSetupPurpose, { ms: number; words: string }> = {
  login_prompt: { ms: 24 * HOUR, words: '24 hours' },
  request: { ms: 24 * HOUR, words: '24 hours' },
  guest_claim: { ms: 7 * DAY, words: '7 days' },
  announcement: { ms: 21 * DAY, words: '21 days' },
};

/** Expired records are kept this long so the page can offer a fresh link. */
const RETENTION_MS = 45 * DAY;

/** Per email address: at most this many emailed links per window. */
const SEND_LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 3 },
  { windowMs: DAY, max: 8 },
];

export const MIN_PASSWORD_LENGTH = 8;

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function setupLink(rawToken: string): string {
  return `${SITE_URL}/set-password?token=${encodeURIComponent(rawToken)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const shown = local.length <= 2 ? local[0] : `${local.slice(0, 2)}`;
  return `${shown}${'•'.repeat(Math.max(2, Math.min(6, local.length - shown.length)))}@${domain}`;
}

/** Creates a token record and returns the raw token (only ever in the email). */
export async function createSetupToken(
  user: { _id: mongoose.Types.ObjectId | string; email: string },
  purpose: PasswordSetupPurpose
): Promise<string> {
  const raw = crypto.randomBytes(32).toString('base64url');
  const ttl = LINK_TTL[purpose].ms;
  await PasswordSetupToken.create({
    user: user._id,
    email: user.email.toLowerCase(),
    tokenHash: hashToken(raw),
    purpose,
    expiresAt: new Date(Date.now() + ttl),
    usedAt: null,
    deleteAt: new Date(Date.now() + ttl + RETENTION_MS),
  });
  return raw;
}

export type SendResult = 'sent' | 'throttled' | 'no_account';

async function isThrottled(email: string): Promise<boolean> {
  const now = Date.now();
  for (const { windowMs, max } of SEND_LIMITS) {
    const n = await PasswordSetupToken.countDocuments({
      email,
      purpose: { $ne: 'announcement' },
      createdAt: { $gte: new Date(now - windowMs) },
    });
    if (n >= max) return true;
  }
  return false;
}

/**
 * Emails a one-time set-password link to the account with this address.
 * Never reveals by itself whether an account exists — callers decide what
 * to tell the visitor.
 */
export async function sendSetupLink(
  email: string,
  purpose: Exclude<PasswordSetupPurpose, 'announcement'>
): Promise<SendResult> {
  const normalized = email.trim().toLowerCase();
  const user = (await User.findOne({ email: normalized, isGuest: { $ne: true } })
    .collation({ locale: 'en', strength: 2 })
    .select('+password')) as (IUser & { password?: string }) | null;
  if (!user) return 'no_account';

  if (await isThrottled(user.email)) return 'throttled';

  if (!process.env.RESEND_API_KEY) {
    throw new Error('Email service is not configured (missing RESEND_API_KEY).');
  }

  const raw = await createSetupToken(user, purpose);
  const data = {
    name: user.name,
    link: setupLink(raw),
    validFor: LINK_TTL[purpose].words,
    kind: (user.password ? 'reset' : 'setup') as 'reset' | 'setup',
  };
  const result = await resend.emails.send({
    from: FROM,
    to: user.email,
    replyTo: process.env.SUPPORT_EMAIL || undefined,
    subject: data.kind === 'reset' ? 'Reset your Alpha Imports password' : 'Set your new Alpha Imports password',
    html: passwordSetupEmailHtml(data),
    text: passwordSetupEmailText(data),
  });
  if (result?.error) {
    console.error('[sendSetupLink] Resend rejected the send:', result.error);
    throw new Error('We could not send the email right now. Please try again in a few minutes, or contact us for help.');
  }
  return 'sent';
}

export type TokenStatus = 'valid' | 'expired' | 'used' | 'invalid';

/** For the set-password page: is this link still good, and whose is it? */
export async function inspectSetupToken(raw: string): Promise<{
  status: TokenStatus;
  maskedEmail?: string;
  email?: string;
  firstName?: string;
  isNewPassword?: boolean;
}> {
  if (!raw || raw.length > 200) return { status: 'invalid' };
  const record = await PasswordSetupToken.findOne({ tokenHash: hashToken(raw) }).lean();
  if (!record) return { status: 'invalid' };
  const user = await User.findById(record.user).select('+password name email').lean() as
    | (IUser & { password?: string })
    | null;
  if (!user || user.email.toLowerCase() !== record.email) return { status: 'invalid' };

  const base = {
    maskedEmail: maskEmail(record.email),
    firstName: (user.name || '').split(' ')[0],
    isNewPassword: !user.password,
  };
  if (record.usedAt) return { status: 'used', ...base };
  // The email is only shared for expired links, so the "send me a new link"
  // button can be one click. A valid link only shows the masked address.
  if (record.expiresAt < new Date()) return { status: 'expired', ...base, email: record.email };
  return { status: 'valid', ...base };
}

/**
 * Uses a link to set the password. Single-use: the token is claimed with one
 * atomic update, so a double-click or a forwarded email can't use it twice.
 */
export async function completeSetup(raw: string, newPassword: string): Promise<IUser> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Please choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  const now = new Date();
  const record = await PasswordSetupToken.findOneAndUpdate(
    { tokenHash: hashToken(raw), usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { new: true }
  );
  if (!record) {
    const info = await inspectSetupToken(raw);
    if (info.status === 'expired') throw new Error('This link has expired. Please request a new one below.');
    if (info.status === 'used') throw new Error('This link has already been used. You can sign in, or request a new link.');
    throw new Error('This link is not valid. Please request a new one.');
  }

  const user = (await User.findById(record.user).select('+password')) as (IUser & { password?: string }) | null;
  if (!user || user.email.toLowerCase() !== record.email) {
    throw new Error('This link is not valid. Please request a new one.');
  }

  const hadPassword = !!user.password;
  user.password = newPassword; // hashed by the pre-save hook
  user.needsPasswordSetup = undefined;
  // Opening the emailed link proves they own the address.
  user.emailVerified = true;
  const providers = resolveAuthProviders(user);
  user.authProviders = providers.includes('password') ? providers : [...providers, 'password'];
  await user.save();

  // Every other outstanding link for this account stops working.
  await PasswordSetupToken.updateMany(
    { user: user._id, usedAt: null },
    { $set: { usedAt: now } }
  );

  if (hadPassword) {
    void resend.emails
      .send({
        from: FROM,
        to: user.email,
        subject: 'Your Alpha Imports password was changed',
        html: passwordResetConfirmationEmailHtml(user.name),
      })
      .catch((err) => console.error('[completeSetup] confirmation email failed', err));
  }

  return user;
}
