import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/terms-and-conditions`;
const TITLE = "Terms & Conditions | Alpha Gemstone";
const DESCRIPTION =
  "The terms and conditions governing purchases and use of AlphaImports.com / Alpha Gemstone.";

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
    <FooterPageLayout title="Terms & Conditions">

      <p>
        By using alphagemstone.com, customers agree to the following terms
        and conditions.
      </p>

      {/* Terms List */}
      <div>
        <h2 className="fp-h2">
          Terms of Use
        </h2>

        <ul className="fp-list">
          <li>
            Product images may appear larger for display purposes.
          </li>

          <li>
            Natural gemstones may vary slightly in color, shape,
            or inclusions.
          </li>

          <li>
            Prices and availability may change without notice.
          </li>

          <li>
            Orders may be canceled in case of pricing or inventory errors.
          </li>

          <li>
            Customers are responsible for providing accurate shipping
            information.
          </li>

          <li>
            Unauthorized use of website images or content is prohibited.
          </li>

          <li>
            All disputes shall be governed under the laws of
            North Carolina, USA.
          </li>
        </ul>
      </div>

      {/* Additional Notice */}
      <div className="fp-box">
        <h3 className="fp-h3">
          Legal Notice
        </h3>

        <p>
          Alpha Gemstone NY Inc. reserves the right to update or modify
          these terms at any time without prior notice. Continued use
          of the website constitutes acceptance of any revised terms.
        </p>
      </div>

    </FooterPageLayout>
  );
};

export default page;