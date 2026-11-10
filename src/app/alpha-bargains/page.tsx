import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import ClassicSubscribeBox from '@/components/footer-pages/ClassicSubscribeBox';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/alpha-bargains`;
const TITLE = "Alpha Bargains | Alphaimports.com";
const DESCRIPTION =
  "Subscribe for exclusive bargains, new product announcements, and the latest updates from Alphaimports.com.";

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
    <FooterPageLayout title="Subscribe to Alpha Bargains">

      <p>
        Join our mailing list to receive exclusive offers, new product
        announcements, and the latest updates from Alphaimports.com
      </p>

      {/* Benefits */}
      <div>
        <h2 className="fp-h2">
          Subscriber Benefits
        </h2>

        <ul className="fp-list">
          <li>Exclusive discounts and member-only offers</li>

          <li>Early access to new arrivals</li>

          <li>Special promotions and limited-time deals</li>

          <li>Holiday sales and seasonal offers</li>

          <li>Jewelry and gemstone industry news</li>
        </ul>
      </div>

      {/* Newsletter Box */}
      <ClassicSubscribeBox title="Stay Connected">
        <p>
          Be the first to discover new gemstone collections, colored diamonds, jewelry trends, and exclusive promotions.
        </p>
      </ClassicSubscribeBox>

    </FooterPageLayout>
  );
};

export default page;