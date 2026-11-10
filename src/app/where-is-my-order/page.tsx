import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/where-is-my-order`;
const TITLE = "Where Is My Order? | Alphaimports.com";
const DESCRIPTION =
  "Track your Alphaimports.com order using your shipment details or account information.";

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
    <FooterPageLayout title="Where Is My Order?">

      <p>
        Customers can easily track their orders using their shipment
        details or account information.
      </p>

      {/* Tracking Options */}
      <div>
        <h2 className="fp-h2">
          Track Your Order
        </h2>

        <ul className="fp-list">
          <li>Tracking number provided after shipment</li>

          <li>
            Order confirmation email with shipment details
          </li>

          <li>
            Customer account login for order history and updates
          </li>
        </ul>
      </div>

      {/* Assistance Box */}
      <div className="fp-box">
        <h3 className="fp-h3">
          Need Assistance?
        </h3>

        <p>
          If you need help locating your order or tracking shipment
          information, please contact our support team.
        </p>

        <div className="fp-stack">
          <p className="fp-eyebrow">
            Support Email
          </p>

          <a
            href="mailto:orders@alphaimports.com"
            className="cl-link"
          >
            orders@alphaimports.com
          </a>
        </div>
      </div>

    </FooterPageLayout>
  );
};

export default page;