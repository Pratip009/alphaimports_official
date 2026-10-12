import Link from "next/link";

/**
 * SEO intro copy from the old home page, plus the accessibility
 * ("inclusive website") banner. Put the banner at
 * /public/images/classic/inclusive-website.png or change INCLUSIVE_IMG
 * (set it to null to hide the banner).
 */
const INCLUSIVE_IMG: string | null = "/images/gaad-social.jpg";

export default function AboutAlphaText() {
  return (
    <div className="sbc-about">
      <h2>Colored Diamonds, Diamond Jewelry, Gemstones and More from Alpha Imports!</h2>
      <p>
        Offering one of the best online selections of superior quality{" "}
        <Link href="/products?search=colored%20diamonds">colored diamonds</Link> (Treated),{" "}
        <Link href="/products?search=diamond%20jewelry">diamond jewelry</Link>,{" "}
        <Link href="/products/diamonds">loose diamonds</Link>,{" "}
        <Link href="/products/gemstones">precious gems</Link>,{" "}
        <Link href="/products?search=semi%20precious">semi precious gemstones</Link>,{" "}
        <Link href="/volume-discount">wholesale jewelry</Link> and so much more, at Alpha Imports we are dedicated
        to providing the most exquisite and diverse inventory of fine jewelry anywhere, available everyday at the
        lowest and most competitive values in the industry today!
      </p>
      <p>
        Our tremendous selection of diamond jewelry includes only the finest colored diamonds, white diamonds, blue
        diamonds, champagne and black diamonds, just to name a few! Available in more than 15 luminous shades, a
        stunning diamond ring, necklace, bracelet or pair of earrings from Alpha Imports is certain to leave any
        special person in your life speechless!
      </p>
      <p>
        If it&apos;s gemstones that you&apos;re interested in, our precious and semi-precious gems, including
        Tanzanite, Emerald, Ruby and Sapphire options, are available in a wide array of gorgeous cuts, shapes and
        sizes. Additionally, our beautiful selection of gold and sterling silver jewelry cannot be beat! Your total
        satisfaction is always guaranteed with every purchase you make with us here at Alpha Imports!
      </p>
      <p>
        Order colored diamonds, diamond jewelry, precious and semi-precious gemstones, discount wholesale jewelry
        and more online right now. For more information on any specific products, or to place an order by phone,
        please give us a call toll-free at <a href="tel:+18005625742"><strong>800-56-ALPHA</strong></a> to speak
        with a knowledgeable Alpha Imports fine jewelry professional!
      </p>

      {INCLUSIVE_IMG && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="sbc-inclusive"
          src={INCLUSIVE_IMG}
          alt="We're proud to have an inclusive website."
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}