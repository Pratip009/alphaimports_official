import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/find-products`;
const TITLE = "Find Products | Alphaimports.com";
const DESCRIPTION =
  "Search and browse Alphaimports.com's extensive inventory of diamonds, gemstones, and fine jewelry.";

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