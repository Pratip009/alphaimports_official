import ClassicPageShell from '@/components/ui/ClassicPageShell';
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/customer-service`;
const TITLE = "Customer Service Center | Alpha Gemstone";
const DESCRIPTION =
  "Contact Alpha Gemstone's customer service team for product inquiries, order updates, and shipping support.";

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
                  <strong>Alpha Gemstone NY Inc.</strong>
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