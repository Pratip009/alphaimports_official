import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/find-products`;
const TITLE = "Find Products | Alpha Gemstone";
const DESCRIPTION =
  "Search and browse Alpha Gemstone's extensive inventory of diamonds, gemstones, and fine jewelry.";

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
    <FooterPageLayout title="Find Products">

      <p>
        Customers can quickly search and browse our extensive inventory
        of diamonds, gemstones, and fine jewelry using multiple search
        filters and product categories.
      </p>

      {/* Search Options */}
      <div>
        <h2 className="fp-h2">
          Search Products By
        </h2>

        <ul className="fp-list">
          <li>Gemstone type</li>

          <li>Shape</li>

          <li>Size</li>

          <li>Color</li>

          <li>Price range</li>

          <li>Category</li>

          <li>SKU or item number</li>
        </ul>
      </div>

      {/* Additional Info */}
      <div className="fp-box">
        <h3 className="fp-h3">
          Advanced Product Discovery
        </h3>

        <p>
          Our advanced product search tools are designed to help customers,
          jewelers, designers, and wholesale buyers quickly locate the exact
          gemstones or jewelry items they need from our large inventory.
        </p>
      </div>

    </FooterPageLayout>
  );
};

export default page;