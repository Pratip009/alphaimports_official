import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/return-policy`;
const TITLE = "Return Policy | Alphaimports.com";
const DESCRIPTION =
  "Alphaimports.com's return and exchange policy — eligibility windows, conditions, and how to start a return.";

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

export default function ReturnPolicyPage() {
  return (
    <FooterPageLayout title="Return Policy">

      <p>
        Customer satisfaction is important to us.
      </p>

      <div>
      

        <ul className="fp-list">
          <li>Returns accepted within 10 days of delivery unless otherwise specified.</li>
          <li>Item must be unused and in original condition.</li>
          <li>Custom orders and special-cut stones are non-returnable.</li>
          <li>Shipping charges are non-refundable.</li>
          <li>Return authorization is required before sending any package back.</li>
          <li>Order history.</li>
          <li>Refunds are processed after inspection of returned merchandise.</li>
        </ul>
      </div>


    </FooterPageLayout>
  );
}