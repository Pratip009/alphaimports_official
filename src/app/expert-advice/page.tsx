import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/expert-advice`;
const TITLE = "Expert Advice | Alpha Gemstone";
const DESCRIPTION =
  "Professional guidance from Alpha Gemstone for customers, jewelers, designers, and wholesale buyers worldwide.";

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
    <FooterPageLayout title="Expert Advice">

      <p>
        Alpha Gemstone NY Inc. provides professional guidance and
        personalized assistance for customers, jewelers, designers,
        and wholesale buyers worldwide.
      </p>

      {/* Services */}
      <div>
        <h2 className="fp-h2">
          Professional Assistance For
        </h2>

        <ul className="fp-list">
          <li>Jewelry designers</li>

          <li>Stone matching services</li>

          <li>Custom jewelry projects</li>

          <li>Wholesale buying assistance</li>

          <li>Gemstone recommendations</li>
        </ul>
      </div>

      {/* Consultation Box */}
      <div className="fp-box">

        <h3 className="fp-h3">
          Personalized Guidance
        </h3>

        <p>
          Our experienced team can help you select the right gemstones,
          match stones for jewelry projects, source wholesale inventory,
          and provide recommendations tailored to your business or
          personal requirements.
        </p>

        <div className="fp-stack">

          <a
            href="mailto:orders@alphaimports.com"
            className="cl-link fp-block"
          >
            orders@alphaimports.com
          </a>

          <a
            href="mailto:balkhatod@gmail.com"
            className="cl-link fp-block"
          >
            balkhatod@gmail.com
          </a>

        </div>

      </div>

    </FooterPageLayout>
  );
};

export default page;