import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import ClassicSidebar from "@/components/ui/ClassicSidebar";
import { getNavCategories } from "@/lib/getNavCategories";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const CANONICAL = `${SITE_URL}/drop-shipping`;
const TITLE = "Free Dropship Program | Alpha Gemstone";
const DESCRIPTION =
  "Sell diamonds, gemstones & jewelry without holding inventory. No membership fee, no dropship program fee — Alpha ships directly to your customer.";

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

const STEPS = [
  {
    n: "1",
    title: "Choose It",
    body: "Browse AlphaGemstone.com and choose the diamonds, gemstones or jewelry you want to offer.",
  },
  {
    n: "2",
    title: "Sell It",
    body: "Use our available product images and descriptions on your website, social media or an approved marketplace. You decide your own retail selling price.",
  },
  {
    n: "3",
    title: "Order It",
    body: 'After making the sale, submit a "DROPSHIP ORDER" through your seller portal with your customer\'s shipping information.',
  },
  {
    n: "4",
    title: "We Ship It",
    body: "Alpha prepares and ships the merchandise directly to your customer — no Alpha branding or pricing included.",
  },
];

const BENEFITS = [
  { label: "No Membership Fee", body: "There is no membership fee to participate in our standard dropship program." },
  { label: "No Dropship Program Fee", body: "We don't charge you simply for becoming an Alpha dropship customer." },
  { label: "No Large Inventory Investment", body: "You don't have to purchase hundreds of gemstones just to offer a large selection." },
  { label: "No Warehouse", body: "Let Alpha maintain the physical merchandise." },
  { label: "No Packing Department", body: "When we fulfill your dropship order, we handle the packing and shipment." },
  { label: "Thousands of Products", body: "Diamonds, colored diamonds, rubies, sapphires, emeralds, Tanzanite, gemstones, beads, pearls, jewelry and more." },
  { label: "Use Our Images & Descriptions", body: "Approved sellers may use available Alpha product photography and descriptions." },
  { label: "You Set Your Retail Price", body: "You decide the price you charge your customer." },
  { label: "Domestic & International Shipping", body: "We fulfill qualifying orders across the U.S. and many international destinations." },
  { label: "Decades of Experience", body: "Alpha Imports NY Inc. has served the gemstone and jewelry trade since 1988." },
];

const CHANNELS = [
  "Your Own Website",
  "Online Store",
  "Social Media",
  "eBay",
  "Etsy",
  "Amazon",
  "Walmart Marketplace",
  "Facebook / Instagram",
  "Google Shopping",
];

const NICHES = [
  "Natural Diamonds",
  "Fancy Color Diamonds",
  "Small Diamond Melee",
  "Rubies",
  "Sapphires",
  "Emeralds",
  "Tanzanite",
  "Birthstones",
  "Semi-Precious Gemstones",
  "Pearls & Beads",
  "Jewelry",
  "Hard-to-Find Sizes & Shapes",
  "Special Deals & Closeouts",
];

const AUDIENCES = [
  { title: "Jewelers", body: "Expand your online selection without stocking every size and gemstone." },
  { title: "Jewelry Designers", body: "Offer more gemstone choices without purchasing every stone beforehand." },
  { title: "Online Entrepreneurs", body: "Build a specialized gemstone or jewelry store." },
  { title: "eBay & Etsy Sellers", body: "Add qualifying Alpha merchandise to your mix, subject to marketplace rules." },
  { title: "Social Media Sellers", body: "Promote selected products to your followers and customers." },
  { title: "Existing Retail Stores", body: "Expand beyond the merchandise physically in your showcases." },
  { title: "New Business Owners", body: "Start small and grow as your customer base grows." },
];

const CLASSIC_CSS = `
  .ds-root { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #6b6b6b; background: #fff; }
  .ds-root *, .ds-root *::before, .ds-root *::after { box-sizing: border-box; }
  .ds-layout {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 12px;
    padding: 6px 24px 40px;
    align-items: start;
  }
  .ds-main { min-width: 0; padding-top: 4px; line-height: 1.7; }
  .ds-main p { margin: 0 0 8px; }
  .ds-main strong { color: #333; }
  .ds-title { font-size: 15px; font-weight: bold; color: #4f72a8; margin: 2px 0 8px; line-height: 1.3; }
  .ds-rule { border: 0; border-top: 2px solid #555; margin: 10px 0 14px; }

  /* Promo banner (the old site's red/blue dropship ad) */
  .ds-banner {
    border: 1px solid #0d3b6c;
    background: linear-gradient(to bottom, #164472 0px, #0d3b6c 3px, #2b547e 100%);
    color: #fff;
    padding: 18px 20px 20px;
    text-align: center;
    margin-bottom: 14px;
  }
  .ds-banner-kicker { font-size: 12px; color: #dfe2ea; margin-bottom: 4px; }
  .ds-banner h1 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 26px;
    line-height: 1.15;
    margin: 0 0 8px;
    color: #fff;
  }
  .ds-banner h1 span { display: block; color: #ffd84a; }
  .ds-banner p { color: #dfe2ea; max-width: 620px; margin: 0 auto 12px; font-size: 11.5px; }
  .ds-banner-tags { font-weight: bold; color: #fff; margin-bottom: 14px; }
  .ds-banner-tags b { color: #ffd84a; padding: 0 6px; font-weight: normal; }

  .ds-btns { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
  .ds-btn {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 24px; padding: 3px 14px;
    background: #c6cfe6; border: 1px solid #2b547e; color: #1c4874;
    font-size: 11px; font-weight: bold; text-decoration: none;
  }
  .ds-btn:hover { background: #b5c0de; }
  .ds-btn.is-red { background: #c8102e; border-color: #8f0a20; color: #fff; }
  .ds-btn.is-red:hover { background: #a90d27; }

  /* Classic boxed panels */
  .ds-panel {
    border: 1px solid #a9b3cf;
    border-top-right-radius: 8px;
    background: #e8ebf3;
    margin-bottom: 16px;
  }
  .ds-panel-head {
    background: #a9b3cf;
    color: #fff;
    font-weight: bold;
    font-size: 11px;
    padding: 3px 10px;
    border-top-right-radius: 7px;
    margin: 0;
  }
  .ds-panel-body { padding: 10px 10px 8px; }
  .ds-panel-body p:last-child { margin-bottom: 0; }
  .ds-two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ds-two .ds-panel { margin-bottom: 0; }
  .ds-two-wrap { margin-bottom: 16px; }

  /* Steps table */
  .ds-table { width: 100%; border-collapse: collapse; background: #fff; }
  .ds-table th, .ds-table td { border: 1px solid #c9cfdf; padding: 6px 8px; vertical-align: top; text-align: left; }
  .ds-table th { background: #dfe2ea; color: #1c4874; font-size: 11px; }
  .ds-step-n { color: #c8102e; font-weight: bold; margin-right: 4px; }
  .ds-steps td { width: 25%; padding: 0 0 8px; }
  .ds-step-title {
    background: #dfe2ea; color: #1c4874; font-weight: bold;
    padding: 5px 8px; margin-bottom: 6px; border-bottom: 1px solid #c9cfdf;
  }
  .ds-step-body { padding: 0 8px; }

  .ds-list { list-style: none; margin: 0; padding: 0; columns: 2; column-gap: 24px; }
  .ds-list li { break-inside: avoid; padding: 0 0 6px 12px; position: relative; }
  .ds-list li::before { content: "\\00BB"; position: absolute; left: 0; color: #1c4874; font-weight: bold; }
  .ds-list b { color: #1c4874; }

  .ds-inline { color: #1c4874; font-weight: bold; }
  .ds-inline span { color: #999; font-weight: normal; padding: 0 5px; }
  .ds-small { font-size: 10px; color: #8a8a8a; }

  .ds-margin td { text-align: center; font-size: 11px; }
  .ds-margin .amt { display: block; font-size: 18px; font-weight: bold; color: #333; margin-top: 2px; }
  .ds-margin .amt.is-green { color: #1d7a1d; }

  .ds-notice {
    border: 1px solid #e0c36a;
    background: #fff8d6;
    color: #6b5200;
    padding: 8px 10px;
    margin-bottom: 16px;
  }
  .ds-notice b { color: #8a1c00; }
  .ds-link { color: #1c4874; font-weight: bold; }

  .ds-cta { text-align: center; padding: 14px 10px 6px; }
  .ds-cta-title { font-size: 14px; font-weight: bold; color: #4f72a8; margin-bottom: 4px; }
  .ds-cta .ds-small { margin-top: 10px; }

  @media (max-width: 900px) {
    .ds-layout { grid-template-columns: 1fr; padding: 8px 14px 32px; }
    .ds-main { order: 1; }
    .ds-layout > aside { order: 2; }
  }
  @media (max-width: 620px) {
    .ds-two { grid-template-columns: 1fr; }
    .ds-list { columns: 1; }
    .ds-steps, .ds-steps tbody, .ds-steps tr, .ds-steps td { display: block; width: 100%; }
    .ds-steps td { border-top-width: 0; }
    .ds-steps td:first-child { border-top-width: 1px; }
    .ds-banner h1 { font-size: 21px; }
    .ds-btn { min-height: 32px; }
  }
`;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ds-panel">
      <h2 className="ds-panel-head">{title}</h2>
      <div className="ds-panel-body">{children}</div>
    </section>
  );
}

export default async function DropshipLandingPage() {
  // Display-only: category tree for the header nav and the classic sidebar.
  const navCategories = await getNavCategories();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar initialCategories={navCategories} />
      <style>{CLASSIC_CSS}</style>

      <main className="flex-1 w-full ds-root">
        <div className="ds-layout">
          <ClassicSidebar categories={navCategories} />

          <div className="ds-main">
            {/* ── Banner ── */}
            <div className="ds-banner">
              <div className="ds-banner-kicker">Alpha Gemstone Dropship Program</div>
              <h1>
                Your Store. Our Inventory.
                <span>We Ship. You Profit.</span>
              </h1>
              <p>
                Start or grow a diamond, gemstone &amp; jewelry business — without investing in
                inventory. Sell diamonds, precious and semi-precious gemstones, beads, pearls and
                jewelry online. You sell it. Alpha ships it.
              </p>
              <div className="ds-banner-tags">
                No Membership Fee<b>|</b>No Inventory Commitment<b>|</b>Alpha Ships Directly
              </div>
              <div className="ds-btns">
                <Link href="/drop-shipping/apply" className="ds-btn is-red">
                  Start Dropshipping With Alpha
                </Link>
                <Link href="/" className="ds-btn">
                  Explore Products To Sell
                </Link>
              </div>
            </div>

            <Panel title="What Is Alpha Dropshipping?">
              <p>
                Dropshipping gives you a simple way to sell Alpha products without keeping them in
                your own inventory. You choose products from AlphaGemstone.com, market them to your
                customers, decide your own retail price, and make the sale.
              </p>
              <p>
                Once you have the order, submit it to Alpha with your customer&apos;s shipping
                information.{" "}
                <strong>We prepare it, we pack it, we ship it directly to your customer.</strong>{" "}
                You never need to physically handle the merchandise.
              </p>
            </Panel>

            <Panel title="Start In 4 Simple Steps">
              <table className="ds-table ds-steps">
                <tbody>
                  <tr>
                    {STEPS.map((s) => (
                      <td key={s.n}>
                        <div className="ds-step-title">
                          <span className="ds-step-n">{s.n}.</span>
                          {s.title}
                        </div>
                        <div className="ds-step-body">{s.body}</div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <p style={{ marginTop: 8, textAlign: "center" }}>
                <strong>You build the business. We handle the fulfillment.</strong>
              </p>
            </Panel>

            <Panel title="Sell Where Your Customers Shop">
              <p>
                Build your business through your own website, social media, or an approved online
                marketplace. You choose where and how.
              </p>
              <p className="ds-inline">
                {CHANNELS.map((c, i) => (
                  <Fragment key={c}>
                    {i > 0 && <span>|</span>}
                    {c}
                  </Fragment>
                ))}
              </p>
              <p className="ds-small">
                Sellers are responsible for following the current rules and dropshipping policies of
                each marketplace or platform they use.
              </p>
            </Panel>

            <Panel title="Why Sell With Alpha?">
              <ul className="ds-list">
                {BENEFITS.map((b) => (
                  <li key={b.label}>
                    <b>{b.label}</b> — {b.body}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Your Price. Your Margin.">
              <p>
                One of the biggest advantages of dropshipping is that you control your selling price.
              </p>
              <table className="ds-table ds-margin">
                <tbody>
                  <tr>
                    <td>
                      Alpha Price<span className="amt">$100</span>
                    </td>
                    <td>
                      You Sell For<span className="amt">$175</span>
                    </td>
                    <td>
                      Gross Margin<span className="amt is-green">$75</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="ds-small" style={{ marginTop: 6 }}>
                Illustration only. Your actual profit depends on your selling price, shipping costs,
                marketplace fees, payment-processing fees, taxes, returns and other expenses.
              </p>
            </Panel>

            <Panel title="Your Customer Stays Your Customer">
              <p>
                This is extremely important to us. When Alpha fulfills an approved dropship order, we
                work behind the scenes as your supplier. We do not include Alpha promotional flyers or
                Alpha retail pricing in the package. Your customer purchased from{" "}
                <strong>you</strong> — and we respect that relationship.
              </p>
            </Panel>

            <Panel title="Find Your Niche">
              <p>
                You don&apos;t have to sell everything. Pick your specialty — or offer them all.
              </p>
              <p className="ds-inline">
                {NICHES.map((n, i) => (
                  <Fragment key={n}>
                    {i > 0 && <span>|</span>}
                    {n}
                  </Fragment>
                ))}
              </p>
            </Panel>

            <Panel title="Who Is This Program For?">
              <ul className="ds-list">
                {AUDIENCES.map((a) => (
                  <li key={a.title}>
                    <b>{a.title}</b> — {a.body}
                  </li>
                ))}
              </ul>
            </Panel>

            <div className="ds-two ds-two-wrap">
              <Panel title="What Does It Cost To Join?">
                <ul className="ds-list" style={{ columns: 1, marginBottom: 6 }}>
                  {["$0 Membership Fee", "$0 Standard Dropship Program Fee", "$0 Fee To Use Approved Alpha Images"].map(
                    (t) => (
                      <li key={t}>
                        <b>{t}</b>
                      </li>
                    )
                  )}
                </ul>
                <p>
                  You pay Alpha for the merchandise you order, plus applicable shipping, taxes, duties
                  or other charges. No need to buy a large inventory just to get started.
                </p>
              </Panel>
              <Panel title="Returns & Exchanges">
                <p>
                  All dropship purchases are covered according to the current AlphaGemstone.com
                  return, refund and exchange policy applicable to the merchandise purchased. Certain
                  special-order or clearance merchandise may have different conditions.
                </p>
                <p>
                  <Link href="/return-policy" className="ds-link">
                    View Current Return Policy
                  </Link>
                </p>
              </Panel>
            </div>

            <div className="ds-notice">
              <p>
                <b>Important: Confirm Availability.</b> Gemstones are not always mass-produced. Some
                Alpha items — particularly unusual gemstones, larger stones, special colors,
                closeouts and one-of-a-kind pieces — may be available in very limited quantities.
                Please confirm availability before promising a limited item to your customer.
              </p>
            </div>

            <Panel title="Since 1988. Your Partner, Not Just Your Supplier.">
              <p>
                Dropshipping is only as good as the supplier standing behind the seller. Alpha brings
                decades of experience sourcing and supplying diamonds, gemstones and jewelry. Our goal
                isn&apos;t simply to sell you a gemstone — it&apos;s to become a dependable source
                behind your business.
              </p>
              <p>
                If you make one sale, we want to help you make the next one. If you start small, we
                want to be there as you grow.
              </p>
            </Panel>

            <Panel title="Questions? Talk To A Real Gemstone Person.">
              <p>
                Sometimes you don&apos;t want another form, chatbot or automated answer. You want to
                talk to someone who understands gemstones.
              </p>
              <p>
                <a href="tel:+19143101480" className="ds-link">
                  Call Mr. Balu — 914-310-1480
                </a>
                <span style={{ padding: "0 8px", color: "#999" }}>|</span>
                <a href="mailto:balu@alphaimports.com" className="ds-link">
                  balu@alphaimports.com
                </a>
              </p>
            </Panel>

            <hr className="ds-rule" />

            {/* ── Final CTA ── */}
            <div className="ds-cta">
              <div className="ds-cta-title">Ready To Build Your Business?</div>
              <p>
                Don&apos;t buy the inventory first. Find the customer first — then let Alpha help you
                fulfill the order.
              </p>
              <div className="ds-btns">
                <Link href="/drop-shipping/apply" className="ds-btn is-red">
                  Join The Free Dropship Program
                </Link>
                <Link href="/" className="ds-btn">
                  Browse Products To Sell
                </Link>
              </div>
              <p className="ds-small">
                No Membership Fee | No Large Inventory Commitment | Alpha Ships To Your Customer
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}