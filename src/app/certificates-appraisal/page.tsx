import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/certificates-appraisal`;
const TITLE = "Certificates & Appraisal | Alphaimports.com";
const DESCRIPTION =
  "Certification and appraisal documentation available on select Alphaimports.com diamonds and gemstones.";

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
    <FooterPageLayout title="Certificates & Appraisal">

      <p>
        Selected products from Alphaimports.com may include
        professional certification and appraisal documentation
        for added confidence and authenticity.
      </p>

      {/* Included Documents */}
      <div>
        <h2 className="fp-h2">
          Available Documentation
        </h2>

        <ul className="fp-list">
          <li>Gemstone certificates</li>

          <li>Diamond grading reports</li>

          <li>Insurance appraisal documents</li>
        </ul>
      </div>

      {/* Information Box */}
      <div className="fp-box">

        <h3 className="fp-h3">
          Authenticity & Verification
        </h3>

        <p>
          Certificates and appraisal reports provide detailed information
          about gemstone quality, grading characteristics, authenticity,
          and estimated value. Availability may vary depending on the
          product and stone type.
        </p>

        <div className="fp-stack">

          <a
            href="mailto:orders@alphaimports.com"
            className="cl-link fp-block"
          >
            Contact Us for Certificate Information
          </a>

          <a
            href="https://www.alphaimports.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cl-link fp-block"
          >
            Visit AlphaImports.com
          </a>

        </div>

      </div>

    </FooterPageLayout>
  );
};

export default page;