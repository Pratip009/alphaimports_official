"use client";
import Link from "next/link";
import { useState } from "react";
import FooterSitemap from "../sitemap/FooterSitemap";
import Image from "next/image";

const FOOTER_COLUMNS = [
  {
    title: "Help & Policies",
    links: [
      {
        label: "Privacy Policy",
        href: "/privacy-policy",
      },
      {
        label: "Return Policy",
        href: "/return-policy",
      },
      {
        label: "Shipping Policy",
        href: "/shipping-policy",
      },
      {
        label: "💎 Sell With Alpha (Dropship)",
        href: "/drop-shipping",
      },
      {
        label: "Terms & Conditions",
        href: "/terms-and-conditions",
      },
    ],
  },

  {
    title: "Customer Service",
    links: [
      {
        label: "Help Center",
        href: "/help-center",
      },
      {
        label: "Track My Order",
        href: "/where-is-my-order",
      },
      {
        label: "FAQ",
        href: "/faq",
      },
      {
        label: "Wish List",
        href: "/wishlist",
      },
      {
        label: "Customer Service Center",
        href: "/customer-service",
      },
    ],
  },

  {
    title: "Find Products",
    links: [
      {
        label: "Find Products",
        href: "/find-products",
      },
      {
        label: "Subscribe to Alpha Bargains",
        href: "/alpha-bargains",
      },
      {
        label: "Ask for Catalog",
        href: "/ask-for-catalog",
      },
      {
        label: "Volume Discount Program",
        href: "/volume-discount",
      },
      {
        label: "Sitemap",
        href: "/sitemap",
      },
    ],
  },

  {
    title: "Product Info",
    links: [
      {
        label: "Learning Center",
        href: "/learning-center",
      },
      {
        label: "Expert Advice",
        href: "/expert-advice",
      },
      {
        label: "E-Catalog",
        href: "/e-catalog",
      },
      {
        label: "Quality Score Chart",
        href: "/quality-score-chart",
      },
      {
        label: "Certificates & Appraisal",
        href: "/certificates-appraisal",
      },
      {
        label: "Join Our Alpha Club",
        href: "/join-alpha-club",
      },
      {
        label: "Compare Stones",
        href: "/compare",
      },
    ],
  },
];

const DISCLAIMER = `All our colored gemstones & Color Diamonds, except Tsavorite, Garnet etc., are "E" (Enhanced) and/or "T" (Treated). Enhancement methods may include heating, oiling, filling with resin agents, coating, diffusion, dyeing, glass filling, irradiation, and lasering. All Diamond weights shown in fractions are approximate: ¼ ct. (0.23–0.27), ⅓ ct. (0.31–0.35), ½ ct. (0.48–0.52), ¾ ct. (0.73–0.77). Products shown are subject to availability. Alphaimports.com is not responsible for typographical or pricing errors.`;

const FOOTER_CSS = `
  @keyframes ftSpin { to { transform: rotate(360deg); } }
  .ft { margin-top: 24px; font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #6b6b6b; background: #fff; }
  .ft *, .ft *::before, .ft *::after { box-sizing: border-box; }
  .ft p { margin: 0; }
  .ft-inner { padding: 0 24px; }
  .ft-rule { border: 0; border-top: 2px solid #1c4874; margin: 0; }

  .ft-top { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; padding: 14px 0; }
  .ft-brand { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .ft-logo { display: block; width: 220px; height: auto; max-width: 100%; }
  .ft-brand-lines { line-height: 1.8; color: #555; border-left: 1px solid #c9cfdf; padding-left: 14px; }
  .ft-brand-lines b { color: #1c4874; }

  .ft-panel { border: 1px solid #a9b3cf; border-top-right-radius: 8px; background: #e8ebf3; }
  .ft-panel-head { background: #a9b3cf; color: #fff; font-weight: bold; padding: 3px 10px; border-top-right-radius: 7px; }
  .ft-panel-body { padding: 8px 10px 10px; }
  .ft-news-row { display: flex; gap: 6px; margin-top: 6px; }
  .ft-input {
    flex: 1; min-width: 0; height: 22px; padding: 0 5px;
    border: 1px solid #333; border-radius: 0; background: #fff;
    font: inherit; font-size: 11px; color: #000;
  }
  .ft-input:focus { outline: 1px solid #1c4874; border-color: #1c4874; }
  .ft-input:disabled { background: #f4f5f9; }
  .ft-btn {
    display: inline-flex; align-items: center; justify-content: center; min-width: 54px; height: 22px; padding: 0 12px;
    background: #c8102e; border: 1px solid #8f0a20; color: #fff; border-radius: 0;
    font: inherit; font-size: 11px; font-weight: bold; cursor: pointer;
  }
  .ft-btn:hover:not(:disabled) { background: #a90d27; }
  .ft-btn:disabled { opacity: .7; cursor: default; }
  .ft-spinner { width: 11px; height: 11px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: ftSpin .7s linear infinite; }
  .ft-ok { color: #1d5e1d; font-weight: bold; padding: 4px 0; }
  .ft-warn { color: #6b5200; margin-top: 4px !important; }
  .ft-err { color: #b00000; margin-top: 4px !important; }

  .ft-cols { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid #a9b3cf; }
  .ft-col { border-left: 1px solid #a9b3cf; background: #f4f5f9; }
  .ft-col:first-child { border-left: 0; }
  .ft-col-head {
    background: linear-gradient(to bottom, #164472 0px, #0d3b6c 3px, #2b547e 100%);
    color: #fff; font-weight: bold; font-variant: small-caps; letter-spacing: .3px; padding: 4px 10px;
    margin: 0; font-size: 11px;
  }
  .ft-col ul { list-style: none; margin: 0; padding: 5px 10px 8px; }
  .ft-col a { display: block; line-height: 1.8; color: #555; text-decoration: none; }
  .ft-col a:hover { color: #1c4874; text-decoration: underline; }

  .ft-disc { padding: 10px 0; line-height: 1.6; font-size: 10px; color: #8a8a8a; }
  .ft-disc b { color: #333; }
  .ft-more { background: none; border: 0; padding: 0; font: inherit; font-size: 10px; color: #1c4874; font-weight: bold; text-decoration: underline; cursor: pointer; }

  .ft-bar { background: #dfe2ea; border-top: 1px solid #a9b3cf; }
  .ft-bar-inner { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 6px 24px; }
  .ft-copy { color: #000; font-weight: bold; }
  .ft-bar-links { display: flex; align-items: center; gap: 6px; }
  .ft-bar-links span { color: #8a8a8a; }
  .ft-bar-links button { background: none; border: 0; padding: 0; font: inherit; font-size: 11px; color: #000; font-weight: bold; cursor: pointer; }
  .ft-bar-links button:hover { text-decoration: underline; }
  .ft-made { color: #555; }
  .ft-made b { color: #c8102e; }

  @media (max-width: 900px) {
    .ft-top { grid-template-columns: 1fr; }
    .ft-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ft-col:nth-child(3) { border-left: 0; }
    .ft-col:nth-child(n+3) { border-top: 1px solid #a9b3cf; }
    .ft-inner, .ft-bar-inner { padding-left: 14px; padding-right: 14px; }
  }
  @media (max-width: 480px) {
    .ft-cols { grid-template-columns: 1fr; }
    .ft-col { border-left: 0 !important; }
    .ft-col:nth-child(n+2) { border-top: 1px solid #a9b3cf; }
    .ft-input, .ft-btn { height: 30px; font-size: 13px; }
    .ft-bar-inner { justify-content: center; text-align: center; }
  }
`;

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<
    "idle" | "loading" | "success" | "duplicate" | "error"
  >("idle");

  const handleSubscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubState("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setSubState("duplicate");
      } else if (data.success) {
        setSubState("success");
        setEmail("");
      } else {
        setSubState("error");
      }
    } catch {
      setSubState("error");
    }
  };
  return (
    <footer className="ft">
      <style>{FOOTER_CSS}</style>
      <hr className="ft-rule" />

      <div className="ft-inner">
        {/* ── Brand + Newsletter ── */}
        <div className="ft-top">
          <div className="ft-brand">
            <Link href="/" className="nav-logo">
              <Image
                src="/images/logo.png"
                alt="Alphaimports.com — Lowest prices on the planet"
                width={220}
                height={52}
                className="ft-logo"
                priority
              />
            </Link>
            <div className="ft-brand-lines">
              {[
                { label: "Phone:", text: "Customer Service Center" },
                { label: "Address:", text: "New York, NY" },
                { label: "E-Mail:", text: "Contact via Help Center" },
              ].map(({ label, text }) => (
                <p key={text}>
                  <b>{label}</b> {text}
                </p>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="ft-panel">
            <div className="ft-panel-head">Alpha Club &amp; Newsletter</div>
            <div className="ft-panel-body">
              <p>Exclusive deals &amp; early access to new gems.</p>

              {subState === "success" ? (
                <p className="ft-ok">✓ You&apos;re subscribed. Welcome!</p>
              ) : (
                <>
                  <div className="ft-news-row">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      aria-label="Email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setSubState("idle");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                      disabled={subState === "loading"}
                      className="ft-input"
                    />
                    <button
                      onClick={handleSubscribe}
                      disabled={subState === "loading"}
                      className="ft-btn"
                    >
                      {subState === "loading" ? (
                        <span className="ft-spinner" aria-label="Subscribing" />
                      ) : (
                        "Join"
                      )}
                    </button>
                  </div>
                  {subState === "duplicate" && (
                    <p className="ft-warn">You are already subscribed.</p>
                  )}
                  {subState === "error" && (
                    <p className="ft-err">Something went wrong. Please try again.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Link columns ── */}
        <div className="ft-cols">
          {FOOTER_COLUMNS.map(({ title, links }) => (
            <div key={title} className="ft-col">
              <h3 className="ft-col-head">{title}</h3>
              <ul>
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Disclaimer ── */}
        <p className="ft-disc">
          <b>Gemstone Disclosure: </b>
          {DISCLAIMER}{" "}
          <button className="ft-more">More…</button>
        </p>
      </div>

      {/* ── Bottom bar ── */}
      <div className="ft-bar">
        <div className="ft-bar-inner">
          <p className="ft-copy">
            © {new Date().getFullYear()} Alphaimports.com · Alpha Gemstone NY Inc. All Rights
            Reserved.
          </p>

          <div className="ft-bar-links">
            {["Privacy Policy", "Terms"].map((label, i) => (
              <span key={label} style={{ display: "inline-flex", gap: 6, color: "inherit" }}>
                {i > 0 && <span>|</span>}
                <button>{label}</button>
              </span>
            ))}
          </div>

          <p className="ft-made">
            Crafted with <b>♥</b> in New York
          </p>
        </div>
      </div>
    </footer>
  );
}