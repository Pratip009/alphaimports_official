import { redirect } from 'next/navigation';

/**
 * "Forgot password" now uses the same one-click emailed link as the
 * website-upgrade password setup (/set-password), so customers only ever
 * have one simple flow to learn. Old links and bookmarks land there.
 * (The 6-digit code API at /api/auth/forgot-password still works.)
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  redirect(email ? `/set-password?email=${encodeURIComponent(email)}` : '/set-password');
}
