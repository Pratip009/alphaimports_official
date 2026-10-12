"use client";
/**
 * Old-site product photo block: big image, thumbnails under it (when there
 * is more than one photo) and "enlarge", which opens a full-size viewer.
 */
import { useEffect, useState } from "react";
import { optimizedImageUrl } from "@/lib/image-url";

export default function ClassicGallery({
  images,
  name,
  certLabel,
  soldOut,
}: {
  images: string[];
  name: string;
  /** e.g. "GIA" → shows a small "GIA Certified" tag on the photo. */
  certLabel?: string;
  soldOut?: boolean;
}) {
  const list = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = list[active];

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % list.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + list.length) % list.length);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoom, list.length]);

  return (
    <div className="pdc-gallery">
      <button
        type="button"
        className="pdc-main-img"
        onClick={() => current && setZoom(true)}
        aria-label={current ? `Enlarge photo of ${name}` : undefined}
        disabled={!current}
      >
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={optimizedImageUrl(current, { width: 700 })} alt={name} />
        ) : (
          <span className="pdc-noimg">No image available</span>
        )}
        {certLabel && <span className="pdc-cert">{certLabel} Certified</span>}
        {soldOut && <span className="pdc-soldout">Sold Out</span>}
      </button>

      <div className="pdc-thumbs">
        {list.map((src, i) => (
          <button
            key={src + i}
            type="button"
            className={i === active ? "is-active" : undefined}
            onClick={() => setActive(i)}
            aria-label={`Show photo ${i + 1}`}
            aria-pressed={i === active}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={optimizedImageUrl(src, { width: 160 })} alt="" loading="lazy" />
          </button>
        ))}
      </div>

      {current && (
        <button type="button" className="pdc-enlarge" onClick={() => setZoom(true)}>
          <span aria-hidden="true">⊕</span> enlarge
        </button>
      )}

      {zoom && current && (
        <div className="pdc-zoom" role="dialog" aria-modal="true" aria-label={name} onClick={() => setZoom(false)}>
          <div className="pdc-zoom-box" onClick={(e) => e.stopPropagation()}>
            <div className="pdc-zoom-head">
              <span>{name}</span>
              <button type="button" onClick={() => setZoom(false)}>
                Close [x]
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={optimizedImageUrl(current, { width: 1400 })} alt={name} />
            {list.length > 1 && (
              <div className="pdc-zoom-nav">
                <button type="button" onClick={() => setActive((i) => (i - 1 + list.length) % list.length)}>
                  &lt;&lt; Previous
                </button>
                <span>
                  {active + 1} of {list.length}
                </span>
                <button type="button" onClick={() => setActive((i) => (i + 1) % list.length)}>
                  Next &gt;&gt;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}