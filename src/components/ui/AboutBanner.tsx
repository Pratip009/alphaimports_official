import Image from "next/image";

export default function AboutBanner() {
  return (
    <>
      <style>{`
        .ab-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .ab-sub { color: #8a8a8a; }
        .ab-banner { position: relative; height: 170px; border: 1px solid #a9b3cf; overflow: hidden; margin-bottom: 14px; }
        .ab-banner-cap {
          position: absolute; left: 0; right: 0; bottom: 0; z-index: 1;
          background: rgba(13,59,108,.82); color: #fff; padding: 6px 12px;
          font-size: 13px; font-weight: bold;
        }
        .ab-banner-cap span { color: #ffd84a; font-weight: normal; font-size: 11px; margin-left: 8px; }
      `}</style>

      <div className="ab-title-row">
        <h1 className="cl-title">About Us</h1>
        <span className="ab-sub">Our Story</span>
      </div>
      <hr className="cl-rule" />

      <div className="ab-banner">
        <Image
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1800&q=80"
          alt="Exquisite diamonds and gemstones"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="ab-banner-cap">
          Alpha Gemstone NY Inc.<span>Serving customers since 1988</span>
        </div>
      </div>
    </>
  );
}