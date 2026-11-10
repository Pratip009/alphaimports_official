import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/help-center`;
const TITLE = "Help Center | Alphaimports.com";
const DESCRIPTION =
  "Get support with product questions, shipping updates, returns, and wholesale inquiries at Alphaimports.com.";

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

const page = () => {
  return (
    <FooterPageLayout title="Help Center">

      <p>
        Our customer support team is available to assist you with
        product information, shipping updates, returns, wholesale
        inquiries, and technical assistance.
      </p>

      {/* Support Services */}
      <div>
        <h2 className="fp-h2">
          How We Can Help
        </h2>

        <ul className="fp-list">
          <li>Product questions and recommendations</li>

          <li>Shipping and delivery inquiries</li>

          <li>Returns and exchanges assistance</li>

          <li>Order status updates</li>

          <li>Wholesale and bulk purchase inquiries</li>

          <li>Technical website support</li>
        </ul>
      </div>

      {/* Customer Support Box */}
      <div className="fp-box">
        <h3 className="fp-h3">
          Customer Support
        </h3>

        <p>
          Our team is committed to providing fast, reliable, and
          professional support to ensure a smooth shopping experience
          for all customers worldwide.
        </p>
      </div>

    </FooterPageLayout>
  );
};

export default page;