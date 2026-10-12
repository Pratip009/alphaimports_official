import type { Metadata } from "next";
import Link from "next/link";
import ClassicSidebar from "@/components/classic/ClassicSidebar";
import { getTestimonials, type Testimonial } from "@/lib/testimonials";
import TestimonialForm from "./TestimonialForm";

export const metadata: Metadata = {
  title: "Customer Testimonials",
  description: "Read what Alpha Imports customers from around the world say about our diamonds, gemstones and service.",
  alternates: { canonical: "/testimonials" },
};

export const revalidate = 300;

const PER_PAGE = 20;

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  let result: { data: Testimonial[]; total: number; totalPages: number } = { data: [], total: 0, totalPages: 1 };
  try {
    result = await getTestimonials(page, PER_PAGE);
  } catch (err) {
    console.error("[testimonials page]", err);
  }

  return (
    <>
      <style>{`
        .ct {
          font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 11px; color: #000; background: #fff;
          display: grid; grid-template-columns: 175px minmax(0, 1fr); gap: 14px;
          padding: 6px 24px 30px; align-items: start;
        }
        .ct a { text-decoration: none; }
        .ct-main { min-width: 0; }
        .ct-title { color: #a6aec5; font: bold 18px Arial, Helvetica, sans-serif; margin: 2px 0 18px; }
        .ct-intro { color: #777; font-size: 11px; line-height: 14px; margin-bottom: 30px; }
        .ct-intro p { margin: 0; }
        .ct-intro .ct-gap { margin-top: 12px; }
        .ct-intro a { color: #000; font-weight: bold; }
        .ct-intro a:hover { text-decoration: underline; }

        .ct-card { border: 1px solid #a6aec5; background: #dfe2ea; margin: 0 0 22px; scroll-margin-top: 80px; }
        .ct-card:target { outline: 2px solid #003366; }
        .ct-card-head {
          background: #a6aec5; color: #fff; font-weight: bold; text-align: center;
          padding: 2px 6px; font-size: 10px; border-top-left-radius: 6px;
        }
        .ct-card-body { padding: 4px 6px 6px; color: #777; font-size: 10px; line-height: 14px; }
        .ct-subject { padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid #c9cedc; }
        .ct-comment { white-space: pre-line; overflow-wrap: anywhere; }
        .ct-view { margin-top: 8px; font-weight: bold; }
        .ct-view span { color: #0000ff; }
        .ct-view a { color: #000; }
        .ct-view a:hover { text-decoration: underline; }
        .ct-date { float: right; color: #999; font-size: 9px; }
        .ct-empty { color: #777; padding: 20px 0; }

        .ct-pages { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin: 4px 0 26px; font-size: 11px; color: #777; }
        .ct-pages a, .ct-pages strong { padding: 1px 6px; border: 1px solid #a6aec5; }
        .ct-pages a { color: #003366; }
        .ct-pages a:hover { background: #dfe2ea; }
        .ct-pages strong { background: #a6aec5; color: #fff; }

        .ct-form { border: 1px solid #a6aec5; background: #dfe2ea; }
        .ct-form-body { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; padding: 10px; }
        .ct-form label { display: flex; flex-direction: column; gap: 3px; color: #555; font-size: 10px; font-weight: bold; }
        .ct-form input, .ct-form textarea {
          font: 12px Verdana, Geneva, sans-serif; border: 1px solid #7a7a7a; padding: 3px 5px; background: #fff; border-radius: 0;
        }
        .ct-form input:focus, .ct-form textarea:focus { outline: 2px solid #0075ff; outline-offset: -1px; }
        .ct-form-wide { grid-column: 1 / -1; }
        .ct-form-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .ct-form button {
          background: #003366; color: #fff; border: 1px solid #0a2e57; cursor: pointer;
          font: bold 11px Verdana, Geneva, sans-serif; padding: 3px 14px;
        }
        .ct-form button:disabled { opacity: .6; cursor: wait; }
        .ct-form-msg { font-size: 11px; }
        .ct-form-msg.ok { color: #1a7f1a; }
        .ct-form-msg.err { color: #b91c1c; }

        @media (max-width: 760px) {
          .ct { grid-template-columns: minmax(0, 1fr); padding: 6px 8px 20px; }
          .ct-form-body { grid-template-columns: 1fr; }
          .ct-card-body, .ct-intro { font-size: 12px; line-height: 17px; }
        }
      `}</style>

      <div className="ct">
        <ClassicSidebar />

        <main className="ct-main">
          <h1 className="ct-title">Customer Testimonials</h1>

          <div className="ct-intro">
            <p>Welcome to testimonials section of Alpha Imports web page.</p>
            <p>The testimonials below reflect only some of the people who have chosen to write to us and to share their reflections.</p>
            <p>
              These are candid and largely unedited comments. They express both satisfaction and sometimes pointed
              dissatisfaction, and that&apos;s a good thing. For Alpha we need honest, direct responses in order to get better.
            </p>
            <p>The testimonials come from all over the world but have been submitted in English.</p>
            <p className="ct-gap">
              If you know of any more, or if you would like to <a href="#share">share your own experience</a>, please
              fill out the <a href="#share">form</a> on the bottom of this page.
            </p>
          </div>

          {result.data.length === 0 && <p className="ct-empty">No testimonials yet. Be the first to share yours below!</p>}

          {result.data.map((t) => (
            <article key={t._id} id={`t-${t._id}`} className="ct-card">
              <div className="ct-card-head">Testimonial by {t.name}</div>
              <div className="ct-card-body">
                {t.subject && (
                  <div className="ct-subject">
                    Subject: {t.subject}
                    {t.createdAt && (
                      <span className="ct-date">
                        {new Date(t.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                )}
                <div className="ct-comment">{t.comment}</div>
                {t.product && (
                  <div className="ct-view">
                    <span>Click to view: </span>
                    <Link href={`/products/${t.product.slug || t.product._id}`} prefetch={false}>
                      {t.product.name}
                    </Link>
                  </div>
                )}
              </div>
            </article>
          ))}

          {result.totalPages > 1 && (
            <nav className="ct-pages" aria-label="Testimonial pages">
              <span>Pages:</span>
              {page > 1 && <Link href={`/testimonials?page=${page - 1}`}>« Prev</Link>}
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) =>
                n === page ? (
                  <strong key={n} aria-current="page">{n}</strong>
                ) : (
                  <Link key={n} href={`/testimonials?page=${n}`}>
                    {n}
                  </Link>
                ),
              )}
              {page < result.totalPages && <Link href={`/testimonials?page=${page + 1}`}>Next »</Link>}
            </nav>
          )}

          <TestimonialForm />
        </main>
      </div>
    </>
  );
}