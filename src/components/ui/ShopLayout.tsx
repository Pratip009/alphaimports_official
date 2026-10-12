"use client";
/**
 * Classic Alpha Imports home "shop by category" block.
 *
 *   left   – <ClassicSidebar /> (Categories, Testimonials, Information, promos)
 *   centre – newsletter Subscribe bar, announcement banner, one boxed section
 *            per DB category (4 subcategory tiles), then Testimonials,
 *            gold & silver prices, Featured in the News, and the SEO copy
 *   right  – Buyers Picks (recently ordered products from /api/products/popular)
 */
import React, { useState, useEffect, useTransition, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClassicSidebar, {
  useClassicCategories,
  subcategoryHref,
  type ISubcategory,
} from "@/components/classic/ClassicSidebar";
import HomeTestimonial from "@/components/classic/HomeTestimonial";
import MetalPrices from "@/components/classic/MetalPrices";
import FeaturedInNews from "@/components/classic/FeaturedInNews";
import AboutAlphaText from "@/components/classic/AboutAlphaText";
// Kept for its existing global side effects (CSS reset + :root variables)
// that other home-page sections may rely on. None of its classes are used here.
import "./ShopLayout.css";

interface IPickProduct {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  price: number;
  compareAtPrice?: number;
  originalPrice?: number;
}

// ─── Config (edit here) ───────────────────────────────────────────────────────
/** Set to null to hide the yellow banner. */
const ANNOUNCEMENT: { text: string; href: string } | null = {
  text: "OUR NEW WEBSITE IS NOW LIVE! — CLICK HERE TO VISIT",
  href: "https://www.alphagemstone.com",
};

const TILES_PER_SECTION = 4;
const FALLBACK_IMG =
  "https://images.pexels.com/photos/1458867/pexels-photo-1458867.jpeg?auto=compress&cs=tinysrgb&w=200";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
const isFresh = (t: number) => Date.now() - t < CACHE_TTL_MS;
let _picksCache: { picks: IPickProduct[]; fetchedAt: number } | null = null;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShopLayout() {
  const router = useRouter();
  const { categories, subsByCat, loading: loadingCats } = useClassicCategories();
  const [buyersPicks, setBuyersPicks] = useState<IPickProduct[]>(() => _picksCache?.picks ?? []);
  const [isPending, startTransition] = useTransition();

  // Subscribe form
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [subState, setSubState] = useState<{ kind: "idle" | "busy" | "ok" | "err"; msg?: string }>({
    kind: "idle",
  });

  // ── Buyers picks ──
  useEffect(() => {
    if (_picksCache && isFresh(_picksCache.fetchedAt)) return;
    fetch("/api/products/popular")
      .then((r) => r.json())
      .then((res) => {
        const raw = res?.data ?? [];
        const picks = Array.isArray(raw) ? raw : [];
        _picksCache = { picks, fetchedAt: Date.now() };
        setBuyersPicks(picks);
      })
      .catch(() => {});
  }, []);

  // Deterministic picks for SSR/hydration, shuffled once mounted.
  const [shuffled, setShuffled] = useState<Record<string, ISubcategory[]> | null>(null);
  useEffect(() => {
    const map: Record<string, ISubcategory[]> = {};
    categories.forEach((c) => {
      map[c._id] = shuffleArray(subsByCat[c._id] ?? []).slice(0, TILES_PER_SECTION);
    });
    setShuffled(map);
  }, [categories, subsByCat]);
  const tilesFor = (catId: string) =>
    shuffled?.[catId] ?? (subsByCat[catId] ?? []).slice(0, TILES_PER_SECTION);

  const prefetch = (href: string) => router.prefetch(href);
  const navigate = (href: string) => startTransition(() => router.push(href));

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setSubState({ kind: "err", msg: "Please enter your e-mail." });
      return;
    }
    setSubState({ kind: "busy" });
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), lastName: lastName.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubState({ kind: "ok", msg: "Thank you for subscribing!" });
        setEmail("");
        setLastName("");
      } else {
        setSubState({
          kind: "err",
          msg: data?.message || data?.error || "Could not subscribe. Please try again.",
        });
      }
    } catch {
      setSubState({ kind: "err", msg: "Could not subscribe. Please try again." });
    }
  };

  return (
    <>
      <style>{`
        .sbc {
          --sbc-navy: #003366;
          --sbc-bar1: #154273;
          --sbc-bar2: #2f5681;
          --sbc-frame: #99aece;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          font-size: 11px;
          color: #000;
          background: #fff;
          display: grid;
          grid-template-columns: 175px minmax(0, 1fr);
          gap: 6px;
          padding: 6px 24px 24px;
          align-items: start;
        }
        .sbc a { text-decoration: none; }

        .sbc-box-head {
          background: linear-gradient(to bottom, var(--sbc-bar1), var(--sbc-bar2));
          color: #fff; font-weight: bold; line-height: 14px;
          display: flex; justify-content: center; align-items: center;
        }

        /* ── Framed area: centre + Buyers Picks ── */
        .sbc-frame {
          border: 1px solid var(--sbc-frame);
          display: grid; grid-template-columns: minmax(0, 1fr) 180px;
          gap: 6px; padding: 4px 4px 6px 6px; align-items: start;
        }
        .sbc-center { display: flex; flex-direction: column; gap: 4px; min-width: 0; }

        .sbc-sub-bar {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px;
          padding: 6px 8px; background: #fff;
          box-shadow: 0 0 0 1px #f0f0f0, 1px 2px 3px rgba(0,0,0,.12);
          scroll-margin-top: 80px;
        }
        .sbc-sub-bar label { font-size: 11px; color: #000; margin-right: 4px; }
        .sbc-sub-bar input {
          width: 128px; height: 15px; padding: 0 3px; border: 1px solid #555;
          font: 11px Verdana, Geneva, sans-serif; border-radius: 0;
        }
        .sbc-sub-bar input:focus { outline: 1px solid #0075ff; }
        .sbc-sub-bar button {
          margin-left: 18px; background: var(--sbc-navy); color: #fff; border: 1px solid #0a2e57;
          font: bold 10px Verdana, Geneva, sans-serif; padding: 1px 6px; cursor: pointer;
        }
        .sbc-sub-bar button:disabled { opacity: .6; cursor: wait; }
        .sbc-sub-msg { flex-basis: 100%; font-size: 10px; }
        .sbc-sub-msg.ok { color: #1a7f1a; }
        .sbc-sub-msg.err { color: #b91c1c; }

        .sbc-banner {
          display: block; margin: 4px 0 2px; padding: 10px 8px; text-align: center;
          background: #fff3cd; border: 1px solid #e0b84c;
          color: #8a5a00; font: bold 14px/1.2 Arial, Helvetica, sans-serif; letter-spacing: .2px;
        }
        .sbc-banner:hover { text-decoration: underline !important; }

        .sbc-section {
          background: linear-gradient(to bottom, #fff 55%, #f1f1f1); padding: 3px 4px 8px 8px;
          box-shadow: 0 0 0 1px #f2f2f2, 1px 1px 3px rgba(0,0,0,.14);
        }
        .sbc-section-title {
          display: inline-block; font-weight: bold; font-size: 11px; color: #000;
          text-decoration: underline !important; margin: 0 0 4px;
        }
        .sbc-section-title:hover { color: #003366; }
        .sbc-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2px 4px; }
        .sbc-tile { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .sbc-tile-img {
          width: 100%; max-width: 160px; aspect-ratio: 1; display: flex;
          align-items: center; justify-content: center; background: #fff; margin-bottom: 4px;
        }
        .sbc-tile-img img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .sbc-tile-name { color: #7f7f7f; font-size: 11px; line-height: 14px; }
        .sbc-tile:hover .sbc-tile-name { color: #003366; text-decoration: underline; }
        .sbc-tile-skel { width: 80px; height: 80px; background: #f0f0f0; margin: 4px auto 6px; }

        /* ── Testimonial box ── */
        .sbc-testi { padding-top: 14px; }
        .sbc-testi .sbc-section-title { display: block; width: max-content; margin-bottom: 2px; }
        .sbc-testi-text, .sbc-testi-link { display: block; color: #878790; font-size: 11px; line-height: 15px; }
        .sbc-testi-text:hover, .sbc-testi-link:hover { color: #003366; text-decoration: underline !important; }
        .sbc-testi-all { margin-top: 15px; }

        /* ── Gold & silver ── */
        .sbc-metal-text { font-size: 11px; line-height: 16px; color: #000; margin: 2px 0 2px; }
        .sbc-metal-charts { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 40px; padding: 2px 0 12px; }
        .sbc-metal-charts img { display: block; max-width: 100%; height: auto; }

        /* ── Featured in the News ── */
        .sbc-news { padding-top: 6px; }
        .sbc-news-logos {
          display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px;
          align-items: center; justify-items: center; padding: 4px 6px 2px;
        }
        .sbc-news-logos img { width: 100%; max-width: 130px; height: 50px; display: block; }

        /* ── SEO copy + inclusive banner ── */
        .sbc-about { padding: 4px 2px 0; color: #333; font-size: 11px; line-height: 16px; }
        .sbc-about h2 { font-size: 11px; font-weight: bold; color: #000; margin: 0; line-height: 16px; }
        .sbc-about p { margin: 0; }
        .sbc-about a { color: #999; }
        .sbc-about a:hover { color: #003366; text-decoration: underline; }
        .sbc-about a[href^="tel:"] { color: #000; }
        .sbc-inclusive { display: block; width: 100%; height: auto; margin-top: 4px; }

        /* ── Buyers Picks ── */
        .sbc-picks { margin-top: 23px; }
        .sbc-picks .sbc-box-head { font-size: 10px; padding: 9px 4px; }
        .sbc-pick-list { border-left: 2px solid #c6c4c6; border-right: 2px solid #c6c4c6; margin: 0 4px; }
        .sbc-pick {
          display: block; position: relative; text-align: center;
          padding: 8px 2px 4px; border-bottom: 1px solid #c6c4c6;
        }
        .sbc-pick-num {
          position: absolute; top: 22px; left: 6px; width: 24px; height: 24px;
          background: var(--sbc-navy); color: #fff;
          font: bold 17px/24px "Times New Roman", Times, serif; text-align: center;
        }
        .sbc-pick-img { width: 110px; height: 110px; margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; }
        .sbc-pick-img img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .sbc-pick-name {
          display: block; color: #7f7f7f; font-size: 11px; line-height: 15px;
          text-decoration: underline; padding: 0 4px;
        }
        .sbc-pick:hover .sbc-pick-name { color: #003366; }
        .sbc-pick-label { display: block; color: #990000; font-weight: bold; font-size: 10px; margin-top: 2px; }
        .sbc-pick-price { font-weight: bold; font-size: 10px; }
        .sbc-pick-price s { color: #990000; margin-right: 6px; }
        .sbc-pick-price span { color: #ff0000; }
        .sbc-picks-empty { padding: 10px 4px; color: #7f7f7f; text-align: center; font-size: 10px; }

        /* ── Mobile ── */
        @media (max-width: 1000px) {
          .sbc-frame { grid-template-columns: minmax(0, 1fr); }
          .sbc-picks { margin-top: 6px; }
          .sbc-pick-list { display: flex; overflow-x: auto; border: 1px solid #c6c4c6; margin: 0; }
          .sbc-pick { flex: 0 0 160px; border-bottom: 0; border-right: 1px solid #c6c4c6; }
        }
        @media (max-width: 760px) {
          .sbc { grid-template-columns: minmax(0, 1fr); padding: 6px 8px 16px; }
          .sbc-sub-bar label { flex-basis: 100%; }
          .sbc-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sbc-sub-bar input { flex: 1 1 120px; min-width: 0; height: 26px; font-size: 14px; }
          .sbc-sub-bar button { margin-left: 0; padding: 5px 12px; font-size: 12px; }
          .sbc-banner { font-size: 13px; }
          .sbc-news-logos { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .sbc-testi-text, .sbc-testi-link, .sbc-about, .sbc-metal-text { font-size: 13px; line-height: 19px; }
        }

        .sbc-loading {
          position: fixed; inset: 0; z-index: 999; display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.45);
        }
        .sbc-spinner {
          width: 38px; height: 38px; border-radius: 50%;
          border: 3px solid rgba(0,51,102,.15); border-top-color: #003366;
          animation: sbcSpin .7s linear infinite;
        }
        @keyframes sbcSpin { to { transform: rotate(360deg); } }
      `}</style>

      <section className="sbc" aria-label="Shop by category">
        <ClassicSidebar />

        {/* ── Framed centre + Buyers Picks ── */}
        <div className="sbc-frame">
          <div className="sbc-center">
            <form id="newsletter" className="sbc-sub-bar" onSubmit={handleSubscribe}>
              <label htmlFor="sbc-email">Subscribe</label>
              <input
                id="sbc-email"
                type="email"
                placeholder="Enter E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="E-mail"
              />
              <input
                type="text"
                placeholder="Enter Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-label="Last name"
              />
              <button type="submit" disabled={subState.kind === "busy"}>
                GO
              </button>
              {(subState.kind === "ok" || subState.kind === "err") && (
                <span className={`sbc-sub-msg ${subState.kind}`} role="status">
                  {subState.msg}
                </span>
              )}
            </form>

            {ANNOUNCEMENT && (
              <a className="sbc-banner" href={ANNOUNCEMENT.href}>
                {ANNOUNCEMENT.text}
              </a>
            )}

            {loadingCats
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="sbc-section">
                    <div className="sbc-tiles">
                      {[0, 1, 2, 3].map((j) => (
                        <div key={j} className="sbc-tile-skel" />
                      ))}
                    </div>
                  </div>
                ))
              : categories.map((cat) => {
                  const tiles = tilesFor(cat._id);
                  if (tiles.length === 0) return null;
                  const catHref = `/category/${cat.slug}`;
                  return (
                    <div key={cat._id} className="sbc-section">
                      <Link
                        href={catHref}
                        className="sbc-section-title"
                        prefetch={false}
                        onMouseEnter={() => prefetch(catHref)}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(catHref);
                        }}
                      >
                        {cat.name}
                      </Link>
                      <div className="sbc-tiles">
                        {tiles.map((sub) => {
                          const href = subcategoryHref(cat.slug, sub);
                          return (
                            <Link
                              key={sub._id}
                              href={href}
                              className="sbc-tile"
                              prefetch={false}
                              onMouseEnter={() => prefetch(href)}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(href);
                              }}
                            >
                              <span className="sbc-tile-img">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={sub.imageUrl || FALLBACK_IMG}
                                  alt={sub.name}
                                  loading="lazy"
                                  decoding="async"
                                />
                              </span>
                              <span className="sbc-tile-name">{sub.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

            <HomeTestimonial />
            <MetalPrices />
            <FeaturedInNews />
            <AboutAlphaText />
          </div>

          {/* ── Buyers Picks ── */}
          <aside className="sbc-picks" aria-label="Buyers picks">
            <div className="sbc-box-head">Buyers Picks</div>
            <div className="sbc-pick-list">
              {buyersPicks.length === 0 && (
                <p className="sbc-picks-empty">Check back soon for our buyers&apos; picks.</p>
              )}
              {buyersPicks.map((p, i) => {
                const was = p.compareAtPrice ?? p.originalPrice;
                const href = `/products/${p.slug ?? p._id}`;
                return (
                  <Link
                    key={p._id}
                    href={href}
                    className="sbc-pick"
                    prefetch={false}
                    onMouseEnter={() => prefetch(href)}
                  >
                    <span className="sbc-pick-num">{i + 1}</span>
                    <span className="sbc-pick-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image || FALLBACK_IMG} alt={p.name} loading="lazy" />
                    </span>
                    <span className="sbc-pick-name">{p.name}</span>
                    <span className="sbc-pick-label">Our Price:</span>
                    <span className="sbc-pick-price">
                      {was && was > p.price && <s>{money(was)}</s>}
                      <span>{money(p.price)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      {isPending && (
        <div className="sbc-loading" role="status" aria-live="polite">
          <div className="sbc-spinner" />
        </div>
      )}
    </>
  );
}