import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/quality-score-chart`;
const TITLE = "Quality Score Chart | Alphaimports.com";
const DESCRIPTION =
  "Gemstone and diamond grading standards and educational quality references from Alphaimports.com.";

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
    <FooterPageLayout title="Quality Score Chart">

      <p>
        Learn about gemstone and diamond grading standards through
        educational quality references used across the jewelry industry.
      </p>

      {/* Grading Topics */}
      <div>
        <h2 className="fp-h2">
          Educational Grading References
        </h2>

        <ul className="fp-list">
          <li>Clarity grading</li>

          <li>Color evaluation</li>

          <li>Cut quality standards</li>

          <li>Stone shape classifications</li>

          <li>Gemstone and diamond quality levels</li>

          <li>Industry grading standards and terminology</li>
        </ul>
      </div>


      {/* Additional Information */}
      <div className="fp-box">

        <h3 className="fp-h3">
          Understanding Gemstone Quality
        </h3>

        <p>
          Quality grading helps customers better understand gemstone
          characteristics, value, rarity, and overall appearance.
          Learning about grading standards allows buyers to make more
          informed purchasing decisions when selecting diamonds,
          gemstones, and fine jewelry.
        </p>

      </div>

    </FooterPageLayout>
  );
};

export default page;