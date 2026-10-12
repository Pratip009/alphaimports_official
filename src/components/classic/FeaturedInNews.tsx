/**
 * "Featured in the News" logo strip (logos already in /public/logo).
 * fit "cover" trims the empty space above/below logos saved on square canvases.
 */
const LOGOS: { src: string; alt: string; fit: "cover" | "contain" }[] = [
  { src: "/logo/google.png", alt: "Google", fit: "cover" },
  { src: "/logo/yahoo.png", alt: "Yahoo!", fit: "cover" },
  { src: "/logo/msn.webp", alt: "MSN", fit: "contain" },
  { src: "/logo/logo.png", alt: "AOL", fit: "cover" },
  { src: "/logo/ask.jpg", alt: "Ask.com", fit: "contain" },
];

export default function FeaturedInNews() {
  return (
    <div className="sbc-section sbc-news">
      <span className="sbc-section-title">Featured in the News</span>
      <div className="sbc-news-logos">
        {LOGOS.map((l) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={l.alt} src={l.src} alt={l.alt} decoding="async" style={{ objectFit: l.fit }} />
        ))}
      </div>
    </div>
  );
}