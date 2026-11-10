import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/shipping-policy`;
const TITLE = "Shipping Policy | Alphaimports.com";
const DESCRIPTION =
  "Worldwide shipping partners, delivery timelines, and policies for jewelry and gemstone orders at Alphaimports.com.";

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
    <FooterPageLayout title="Shipping Policy">

      <p>
        We ship worldwide using trusted carriers to ensure safe and reliable
        delivery of your jewelry and gemstones.
      </p>

      {/* Shipping Partners */}
      <div>
        <h2 className="fp-h2">
          Shipping Partners
        </h2>

        <ul className="fp-list">
          <li>FedEx</li>
          <li>UPS</li>
          <li>USPS</li>
        </ul>
      </div>

      {/* Important Notes */}
      <div>
        <h2 className="fp-h2">
          Important Notes
        </h2>

        <ul className="fp-list">
          <li>Orders ship after payment verification.</li>

          <li>
            Tracking information will be emailed after shipment.
          </li>

          <li>
            Delivery times may vary depending on destination and customs
            clearance.
          </li>

          <li>
            International buyers are responsible for local duties and taxes.
          </li>
        </ul>
      </div>

    </FooterPageLayout>
  );
};

export default page;