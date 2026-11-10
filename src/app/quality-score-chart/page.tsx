import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/quality-score-chart`;
const TITLE = "Quality Score Chart | Alpha Gemstone";
const DESCRIPTION =
  "Gemstone and diamond grading standards and educational quality references from Alpha Gemstone.";

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