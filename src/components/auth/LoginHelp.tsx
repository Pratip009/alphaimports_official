import Link from "next/link";
import { PHONE_DISPLAY, PHONE_E164 } from "@/lib/site";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@alphaimports.com";

/**
 * "Need help signing in?" box shown on the sign-in, set-password and
 * forgot-password pages. Phone, email and the contact form (pre-set to the
 * sign-in topic), plus a reminder that no account is needed to buy.
 */
export default function LoginHelp({ email }: { email?: string }) {
  const contactHref = `/contact?topic=login${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  return (
    <section className="lh-box" aria-labelledby="lh-title">
      <style>{`
        .lh-box { border: 1px solid #c9d3b0; background: #f7faef; padding: 10px 12px; margin-bottom: 24px;
          font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #4a4a4a; line-height: 1.7; }
        .lh-box h2 { margin: 0 0 4px; font-size: 12px; color: #1c4874; }
        .lh-box ul { margin: 4px 0 6px; padding-left: 18px; }
        .lh-box a { color: #1c4874; font-weight: bold; }
        .lh-box p { margin: 0; }
        @media (max-width: 600px) { .lh-box { font-size: 13px; } }
      `}</style>
      <h2 id="lh-title">Need help signing in?</h2>
      <p>We&apos;re happy to help — reach us any of these ways:</p>
      <ul>
        <li>Call <a href={`tel:${PHONE_E164}`}>{PHONE_DISPLAY}</a></li>
        <li>Email <a href={`mailto:${SUPPORT_EMAIL}?subject=Help%20signing%20in`}>{SUPPORT_EMAIL}</a></li>
        <li>Send us a message with our <Link href={contactHref}>contact form</Link></li>
      </ul>
      <p>
        <strong>Just want to buy something?</strong> You don&apos;t need to sign in —{" "}
        add items to your cart and check out as a guest.
      </p>
    </section>
  );
}
