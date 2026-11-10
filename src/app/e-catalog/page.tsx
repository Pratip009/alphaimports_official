import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/e-catalog`;
const TITLE = "E-Catalog | Alpha Gemstone";
const DESCRIPTION =
  "Browse Alpha Gemstone's digital product catalogs featuring the latest jewelry, diamond, and gemstone collections.";

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
    <FooterPageLayout title="E-Catalog">

      <p>
        Explore our digital product catalogs featuring the latest
        jewelry, diamonds, and gemstone collections from
        Alpha Gemstone NY Inc.
      </p>

      {/* Catalog Features */}
      <div>
        <h2 className="fp-h2">
          Featured Catalog Collections
        </h2>

        <ul className="fp-list">
          <li>New arrivals</li>

          <li>Featured jewelry collections</li>

          <li>Sale and promotional items</li>

          <li>Seasonal specials</li>

          <li>Wholesale product selections</li>
        </ul>
      </div>

      {/* Digital Catalog Box */}
      <div className="fp-box">

        <h3 className="fp-h3">
          Browse Our Digital Catalogs
        </h3>

        <p>
          Our E-Catalog provides convenient access to a wide range of
          gemstones, colored diamonds, jewelry collections, and wholesale
          inventory available for customers, retailers, and designers
          worldwide.
        </p>

        <div className="fp-stack">

          <a
            href="https://www.alphaimports.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cl-link fp-block"
          >
            Visit AlphaImports.com
          </a>

          <a
            href="mailto:orders@alphaimports.com"
            className="cl-link fp-block"
          >
            Request Catalog Information
          </a>

        </div>

      </div>

    </FooterPageLayout>
  );
};

export default page;