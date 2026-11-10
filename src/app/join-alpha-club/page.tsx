import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import ClassicSubscribeBox from '@/components/footer-pages/ClassicSubscribeBox';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/join-alpha-club`;
const TITLE = "Join Alpha Club | Alpha Gemstone";
const DESCRIPTION =
  "Sign up for exclusive offers, new arrivals, and the latest updates from Alpha Gemstone.";

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
    <FooterPageLayout title="Subscribe to Alpha Bargains">

      <p>
        Join our mailing list to receive exclusive offers, new arrivals,
        and the latest updates from Alpha Gemstone NY Inc.
      </p>

      {/* Subscriber Benefits */}
      <div>
        <h2 className="fp-h2">
          Subscriber Benefits
        </h2>

        <ul className="fp-list">
          <li>Exclusive discounts and special offers</li>

          <li>Early access to new arrivals</li>

          <li>Special promotions and limited-time deals</li>

          <li>Holiday sales and seasonal savings</li>

          <li>Jewelry and gemstone industry news</li>
        </ul>
      </div>

      {/* Subscription Box */}
      <ClassicSubscribeBox title="Stay Updated">
        <p>
          Subscribe to receive updates about gemstone collections, colored diamonds, jewelry trends, wholesale specials, and exclusive promotions directly in your inbox.
        </p>
      </ClassicSubscribeBox>

    </FooterPageLayout>
  );
};

export default page;