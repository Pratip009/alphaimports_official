import FooterPageLayout from '@/components/footer-pages/footer-page-layout';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/terms-and-conditions`;
const TITLE = "Terms & Conditions | Alphaimports.com";
const DESCRIPTION =
  "The terms and conditions governing purchases and use of AlphaImports.com / Alphaimports.com.";

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
    <FooterPageLayout title="Terms & Conditions">

      <p>
        By using alphaimports.com, customers agree to the following terms
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
          Alpha Gemstone NY Inc., the operator of Alphaimports.com, reserves the right to update or modify
          these terms at any time without prior notice. Continued use
          of the website constitutes acceptance of any revised terms.
        </p>
      </div>

    </FooterPageLayout>
  );
};

export default page;