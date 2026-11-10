import Image from "next/image";

export default function FoundersMessage() {
  return (
    <>
      <style>{`
        .fm-grid { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 16px; align-items: start; }
        .fm-quote {
          border-left: 3px solid #1c4874; background: #fff; padding: 8px 10px; margin-bottom: 10px;
          color: #333; line-height: 1.7;
        }
        .fm-quote strong { color: #1c4874; }
        .fm-sig { margin-top: 10px; padding-top: 8px; border-top: 1px solid #c9cfdf; }
        .fm-sig-name { font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 16px; color: #1c4874; }
        .fm-photo { position: relative; height: 330px; border: 1px solid #a9b3cf; background: #fff; overflow: hidden; }
        .fm-since { background: #1c4874; color: #fff; padding: 6px 10px; text-align: center; border: 1px solid #0d3b6c; border-top: 0; line-height: 1.5; }
        .fm-since strong { display: block; color: #ffd84a; font-size: 14px; }
        @media (max-width: 760px) {
          .fm-grid { grid-template-columns: 1fr; }
          .fm-photo-col { order: -1; max-width: 300px; }
        }
      `}</style>

      <section className="cl-panel">
        <h2 className="cl-panel-head">A Word From Our Founder</h2>
        <div className="cl-panel-body">
          <div className="fm-grid">
            <div>
              <div className="fm-quote">
                <strong>Welcome to Alphaimports.com</strong>
                <br />
                Since 1988, our mission has been to offer beautiful diamonds, gemstones, and
                fine jewelry with exceptional value, honesty, and personal service. What began
                as a family passion has grown into a trusted international business serving
                jewelers, designers, collectors, wholesalers, and jewelry lovers around the world.
              </div>
              <p>
                At Alphaimports.com, we believe luxury should be exciting, affordable, and
                accessible. Our new website combines modern technology, faster browsing,
                advanced search tools, and secure ordering while maintaining the personal
                attention and trust our customers have valued for decades.
              </p>
              <p>
                Every product we offer is selected with care, and every customer is important
                to us. Whether you are shopping for a rare gemstone, fine jewelry, or wholesale
                opportunities, we are committed to providing quality merchandise at highly
                competitive prices.
              </p>
              <p>
                Thank you for visiting Alphaimports.com. We truly appreciate your trust and look
                forward to serving you for many years to come.
              </p>
              <div className="fm-sig">
                <p className="fm-sig-name">Mr. Balu Khatod</p>
                <p>Founder &amp; CEO, Alphaimports.com</p>
              </div>
            </div>

            <div className="fm-photo-col">
              <div className="fm-photo">
                <Image
                  src="/images/founder.JPG"
                  alt="Balu Khatod, Founder of Alphaimports.com"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div className="fm-since">
                <strong>Since 1988</strong>
                Years of Excellence Serving the Jewelry &amp; Gemstone Industry
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}