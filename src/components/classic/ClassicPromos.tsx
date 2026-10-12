/**
 * "Additional Information" promo banners for the classic sidebar.
 * Put the banner images in /public/images/classic/ (names below) or change
 * the src values. Badges use images that already exist in /public/images.
 */
import Link from "next/link";

const PROMOS: { src: string; alt: string; href: string; width: number; height: number }[] = [
  { src: "/images/Free-Birthstone.gif", alt: "Choose your FREE birthstone – follow us on Twitter and Facebook", href: "/join-alpha-club", width: 160, height: 200 },
  { src: "/images/Guranteed_2.jpg", alt: "Subscribe now for Alpha newsletter – get $10 off your 1st purchase", href: "/#newsletter", width: 160, height: 160 },
  { src: "/images/e-bay-banner.gif", alt: "Sell on eBay without investing a cent – Dropship Program, no restocking fee", href: "/drop-shipping", width: 160, height: 200 },
  { src: "/images/sell-our-products.gif", alt: "Start small, finish big – sell our inventory on your website", href: "/drop-shipping", width: 160, height: 120 },
  { src: "/images/Valume-Offer.gif", alt: "We accept offers for volume purchase – make an offer now", href: "/volume-discount", width: 160, height: 56 },
  { src: "/images/guranteelogobg.jpg", alt: "Alpha Promise – lowest prices guaranteed", href: "/about", width: 210, height: 100 },
  { src: "/images/bestprice.jpg", alt: "Risk free buying – best price", href: "/about", width: 210, height: 100 },
  { src: "/images/alphaclub.jpg", alt: "Join the Alpha Club", href: "/join-alpha-club", width: 210, height: 100 },
];

export default function ClassicPromos() {
  return (
    <section className="csb-promos" aria-label="Additional information">
      <style>{`
        .csb-promos .csb-head { margin-bottom: 8px; }
        .csb-promo-list { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 0 2px; }
        .csb-promo-list a { display: block; width: 100%; text-align: center; line-height: 0; }
        .csb-promo-list img { max-width: 100%; height: auto; display: inline-block; }
        .csb-promo-list a:hover img { opacity: .9; }
        .csb-promo-list a:focus-visible { outline: 2px solid #003366; outline-offset: 2px; }
        @media (max-width: 760px) { .csb-promos { display: none; } }
      `}</style>
      <div className="csb-head">Additional Information</div>
      <div className="csb-promo-list">
        {PROMOS.map((p) => (
          <Link key={p.src} href={p.href} prefetch={false}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.alt} width={p.width} height={p.height} loading="lazy" decoding="async" />
          </Link>
        ))}
      </div>
    </section>
  );
}