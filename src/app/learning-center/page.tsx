import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/learning-center`;
const TITLE = "Learning Center | Alphaimports.com";
const DESCRIPTION =
  "Educational resources on diamonds, gemstones, and jewelry care from the Alphaimports.com Learning Center.";

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
    <FooterPageLayout title="Learning Center">

      <p>
        Explore educational resources and expert information about
        diamonds, gemstones, jewelry care, and industry knowledge
        through the Alphaimports.com Learning Center.
      </p>

      {/* Educational Topics */}
      <div>
        <h2 className="fp-h2">
          Educational Topics
        </h2>

        <ul className="fp-list">
          <li>Diamonds</li>

          <li>Gemstones</li>

          <li>Jewelry care and maintenance</li>

          <li>Stone grading standards</li>

          <li>Birthstones and their meanings</li>

          <li>Jewelry trends and styles</li>

          <li>Treatments and gemstone enhancements</li>
        </ul>
      </div>

      {/* Knowledge Box */}
      <div className="fp-box">

        <h3 className="fp-h3">
          Learn Before You Buy
        </h3>

        <p>
          Our Learning Center is designed to help customers,
          collectors, jewelers, and wholesale buyers make informed
          purchasing decisions by understanding gemstone quality,
          jewelry craftsmanship, grading systems, and market trends.
        </p>

      </div>

    </FooterPageLayout>
  );
};

export default page;