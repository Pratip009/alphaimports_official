import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/ask-for-catalog`;
const TITLE = "Ask For Catalog | Alphaimports.com";
const DESCRIPTION =
  "Request a digital or printed catalog featuring Alphaimports.com's latest jewelry, diamond, and gemstone collections.";

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
    <FooterPageLayout title="Ask For Catalog">

      <p>
        Customers may request digital or printed catalogs featuring our
        latest jewelry, diamonds, and gemstone collections.
      </p>

      {/* Catalog Options */}
      <div>
        <h2 className="fp-h2">
          Available Catalogs
        </h2>

        <ul className="fp-list">
          <li>Latest gemstone collections</li>

          <li>Fine jewelry selections</li>

          <li>Colored diamond inventory</li>

          <li>Wholesale and bulk product catalogs</li>

          <li>Seasonal specials and featured collections</li>
        </ul>
      </div>

      {/* Request Box */}
      <div className="fp-box">

        <h3 className="fp-h3">
          Request a Catalog
        </h3>

        <p>
          Contact our team to receive a digital or printed catalog
          showcasing our newest arrivals and featured gemstone selections.
        </p>

        <div className="fp-stack">

          <div>
            <p className="fp-eyebrow">
              Email
            </p>

            <a
              href="mailto:orders@alphaimports.com"
              className="cl-link"
            >
              orders@alphaimports.com
            </a>
          </div>

          <div>
            <p className="fp-eyebrow">
              Website
            </p>

            <a
              href="https://www.alphaimports.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cl-link"
            >
              www.alphaimports.com
            </a>
          </div>

        </div>

      </div>

    </FooterPageLayout>
  );
};

export default page;