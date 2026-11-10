import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/privacy-policy`;
const TITLE = "Privacy Policy | Alphaimports.com";
const DESCRIPTION =
  "How Alphaimports.com collects, uses, and protects your personal information when you shop or browse our site.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
      images: [DEFAULT_OG_IMAGE],
    type: "website",
    url: CANONICAL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Alphaimports.com",
  },
  twitter: { images: [DEFAULT_OG_IMAGE.url],  card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function PrivacyPolicyPage() {
  return (
    <FooterPageLayout title="Privacy Policy">

      <p>
        At Alphaimports.com, operated by Alpha Gemstone NY Inc., we respect your privacy and are committed
        to protecting your personal information.
      </p>

      <div>
        <h2 className="fp-h2">
          Information We Collect
        </h2>

        <ul className="fp-list">
          <li>Name</li>
          <li>Address</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>Payment details</li>
          <li>Order history</li>
          <li>IP address/browser information for security purposes</li>
        </ul>
      </div>

      <div>
        <h2 className="fp-h2">
          How We Use Your Information
        </h2>

        <ul className="fp-list">
          <li>Process and ship orders</li>
          <li>Customer support</li>
          <li>Fraud prevention</li>
          <li>Improve website experience</li>
          <li>Promotional offers/newsletters (optional)</li>
        </ul>
      </div>

    </FooterPageLayout>
  );
}