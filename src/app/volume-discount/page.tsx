import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/volume-discount`;
const TITLE = "Volume Discount Program | Alpha Gemstone";
const DESCRIPTION =
  "Special wholesale pricing programs for large-quantity purchases at Alpha Gemstone.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Alpha Gemstone",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const page = () => {
  return (
    <FooterPageLayout title="Volume Discount Program">

      <p>
        Alpha Gemstone NY Inc. offers special pricing programs for
        wholesale customers and large quantity purchases.
      </p>

      {/* Eligible Customers */}
      <div>
        <h2 className="fp-h2">
          Special Pricing Available For
        </h2>

        <ul className="fp-list">
          <li>Bulk orders</li>

          <li>Jewelry manufacturers</li>

          <li>Retail stores</li>

          <li>Wholesale buyers</li>
        </ul>
      </div>

      {/* Pricing Information */}
      <div className="fp-box">

        <h3 className="fp-h3">
          Quantity Pricing
        </h3>

        <p>
          We provide competitive pricing and customized volume discounts
          based on order quantity, product selection, and business needs.
          Please contact our team directly for personalized pricing
          information.
        </p>

        <div className="fp-stack">

          <a
            href="mailto:orders@alphaimports.com"
            className="cl-link fp-block"
          >
            orders@alphaimports.com
          </a>

          <a
            href="mailto:balkhatod@gmail.com"
            className="cl-link fp-block"
          >
            balkhatod@gmail.com
          </a>

        </div>

      </div>

    </FooterPageLayout>
  );
};

export default page;