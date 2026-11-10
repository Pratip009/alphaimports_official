import Image from "next/image";

const gems = [
  { name: "Colored Diamonds", shade: "from-[#E8C97A] to-[#B8922A]", desc: "15+ luminous shades" },
  { name: "White & Blue", shade: "from-[#C8DCF5] to-[#6A9ED4]", desc: "Icy brilliance" },
  { name: "Tanzanite", shade: "from-[#B8A4E8] to-[#6B4FA8]", desc: "Rare violet depths" },
  { name: "Emerald", shade: "from-[#7ED4A0] to-[#2A7A50]", desc: "Colombian origins" },
  { name: "Ruby", shade: "from-[#F4907A] to-[#B83020]", desc: "Pigeon blood red" },
  { name: "Sapphire", shade: "from-[#6AAEDE] to-[#1A4F8A]", desc: "Kashmir blue" },
];

export default function AlphaImportsSection() {
  return (
    <>
      <style>{`
        .ais-intro { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 14px; align-items: start; }
        .ais-img { position: relative; height: 220px; border: 1px solid #a9b3cf; background: #fff; overflow: hidden; }
        .ais-badge {
          position: absolute; left: 8px; bottom: 8px; z-index: 1;
          background: #fff; border: 1px solid #a9b3cf; padding: 3px 8px; font-size: 10.5px; color: #333;
        }
        .ais-badge b { color: #c8102e; }
        .ais-h { font-size: 14px; font-weight: bold; color: #1c4874; margin: 0 0 8px; line-height: 1.35; }
        .ais-h span { color: #c8102e; }
        .ais-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .ais-btn {
          display: inline-flex; align-items: center; gap: 6px; min-height: 22px; padding: 3px 14px;
          background: #c6cfe6; border: 1px solid #2b547e; color: #1c4874;
          font-size: 11px; font-weight: bold; text-decoration: none;
        }
        .ais-btn:hover { background: #b5c0de; }
        .ais-btn.is-red { background: #c8102e; border-color: #8f0a20; color: #fff; }
        .ais-btn.is-red:hover { background: #a90d27; }
        .ais-gems { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); border: 1px solid #c9cfdf; background: #fff; }
        .ais-gem { text-align: center; padding: 10px 6px; border-left: 1px solid #c9cfdf; }
        .ais-gem:first-child { border-left: 0; }
        .ais-swatch { width: 30px; height: 30px; border-radius: 50%; margin: 0 auto 6px; border: 1px solid #a9b3cf; }
        .ais-gem strong { display: block; color: #1c4874; }
        .ais-gem span { color: #8a8a8a; font-size: 10px; }
        .ais-strip { display: grid; grid-template-columns: 200px minmax(0, 1fr) auto; gap: 14px; align-items: center; margin-top: 10px; }
        .ais-strip-img { position: relative; height: 60px; border: 1px solid #c9cfdf; overflow: hidden; }
        .ais-quote { font-style: italic; color: #555; text-align: center; }
        .ais-tags { text-align: right; line-height: 1.6; }
        .ais-tags b { color: #c8102e; }
        @media (max-width: 900px) {
          .ais-gems { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .ais-gem:nth-child(3n+1) { border-left: 0; }
          .ais-gem:nth-child(n+4) { border-top: 1px solid #c9cfdf; }
          .ais-strip { grid-template-columns: 1fr; text-align: center; }
          .ais-tags { text-align: center; }
        }
        @media (max-width: 640px) {
          .ais-intro { grid-template-columns: 1fr; }
          .ais-gems { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ais-gem:nth-child(3n+1) { border-left: 1px solid #c9cfdf; }
          .ais-gem:nth-child(2n+1) { border-left: 0; }
          .ais-gem:nth-child(n+3) { border-top: 1px solid #c9cfdf; }
        }
      `}</style>

      <section className="cl-panel">
        <h2 className="cl-panel-head">Alphaimports.com</h2>
        <div className="cl-panel-body">
          <div className="ais-intro">
            <div className="ais-img">
              <Image
                src="https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Luxury diamond jewelry"
                fill
                className="object-cover object-center"
                priority
              />
              <div className="ais-badge">
                <b>Easy Returns</b> — See Return Policy
              </div>
            </div>

            <div>
              <h3 className="ais-h">
                The World&apos;s Finest <span>Colored Diamonds</span> &amp; Gemstones
              </h3>
              <p>
                One of the best online selections of superior quality colored diamonds,
                diamond jewelry, loose diamonds, precious gems, semi-precious gemstones,
                and wholesale jewelry — at the most competitive values in the industry.
              </p>
              <p>
                Available in more than <strong>15 luminous shades</strong> — a stunning
                diamond ring, necklace, bracelet, or pair of earrings from Alphaimports.com
                is certain to leave any special person in your life speechless.
              </p>
              <div className="ais-btns">
                <a href="tel:8005642572" className="ais-btn is-red">
                  Call Toll-Free: 800-56-ALPHA
                </a>
                <a href="#shop" className="ais-btn">
                  Shop Now »
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cl-panel">
        <h2 className="cl-panel-head">Our Collections</h2>
        <div className="cl-panel-body">
          <div className="ais-gems">
            {gems.map((gem) => (
              <div key={gem.name} className="ais-gem">
                <div className={`ais-swatch bg-gradient-to-br ${gem.shade}`} />
                <strong>{gem.name}</strong>
                <span>{gem.desc}</span>
              </div>
            ))}
          </div>

          <div className="ais-strip">
            <div className="ais-strip-img">
              <Image
                src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80"
                alt="Gemstone jewelry collection"
                fill
                className="object-cover object-center"
              />
            </div>
            <p className="ais-quote">
              &ldquo;Tanzanite, Emerald, Ruby, Sapphire — in every cut, shape &amp; size imaginable.&rdquo;
            </p>
            <div className="ais-tags">
              <p>Gold &amp; Sterling Silver | Wholesale Jewelry</p>
              <p>
                <b>Lowest Prices, Every Day</b>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}