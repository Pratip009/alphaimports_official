import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/ask-for-catalog`;
const TITLE = "Ask For Catalog | Alpha Gemstone";
const DESCRIPTION =
  "Request a digital or printed catalog featuring Alpha Gemstone's latest jewelry, diamond, and gemstone collections.";

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