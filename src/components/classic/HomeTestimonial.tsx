"use client";
import Link from "next/link";
import { useLatestTestimonial, truncate } from "./useLatestTestimonial";

/** Centre-column "Testimonials" box on the classic home page. */
export default function HomeTestimonial() {
  const t = useLatestTestimonial();
  const href = t ? `/testimonials#t-${t._id}` : "/testimonials";

  return (
    <div className="sbc-section sbc-testi">
      <Link href="/testimonials" className="sbc-section-title" prefetch={false}>
        Testimonials
      </Link>
      {t && (
        <>
          <Link href={href} className="sbc-testi-text" prefetch={false}>
            {truncate(t.comment, 110)}
          </Link>
          <Link href={href} className="sbc-testi-link" prefetch={false}>
            Read more...
          </Link>
        </>
      )}
      <Link href="/testimonials" className="sbc-testi-link sbc-testi-all" prefetch={false}>
        View all testimonials...
      </Link>
    </div>
  );
}