import ClassicPageShell from '@/components/ui/ClassicPageShell';
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const CANONICAL = `${SITE_URL}/customer-service`;
const TITLE = "Customer Service Center | Alphaimports.com";
const DESCRIPTION =
  "Contact Alphaimports.com's customer service team for product inquiries, order updates, and shipping support.";

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
    <ClassicPageShell>
      <h1 className="cl-title">Customer Service Center</h1>
      <p>
        Our customer service team is available to assist with product
        inquiries, order updates, shipping support, and wholesale services.
      </p>

      <hr className="cl-rule" />

      <section className="cl-panel">
        <h2 className="cl-panel-head">Contact Information</h2>
        <div className="cl-panel-body">
          <table className="cl-table">
            <tbody>
              <tr>
                <th scope="row">Company</th>
                <td>
                  <strong>Alphaimports.com</strong>
                  <br />
                  Operated by Alpha Gemstone NY Inc.
                  <br />
                  Raleigh, North Carolina, USA
                </td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>
                  <a href="mailto:balkhatod@gmail.com" className="cl-link">
                    balkhatod@gmail.com
                  </a>
                  <br />
                  <a href="mailto:orders@alphaimports.com" className="cl-link">
                    orders@alphaimports.com
                  </a>
                </td>
              </tr>
              <tr>
                <th scope="row">Website</th>
                <td>
                  <a
                    href="https://www.alphaimports.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cl-link"
                  >
                    www.alphaimports.com
                  </a>
                </td>
              </tr>
              <tr>
                <th scope="row">Support Hours</th>
                <td>
                  Monday – Friday
                  <br />
                  10:00 AM – 6:00 PM EST
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ClassicPageShell>
  );
};

export default page;