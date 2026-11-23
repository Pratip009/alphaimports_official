/**
 * Banner for the Diamonds category landing page.
 *
 * Left: the page title and a plain one-line summary of what's in the
 * section, plus shortcuts to the collections most visitors want first.
 * Right: a top-view facet diagram of a round brilliant, drawn as fine gold
 * lines (pure SVG geometry — no image to download, sharp at any size). It
 * draws itself once on page load; with reduced motion it simply appears.
 */
import Link from "next/link";
import type { ReactNode } from "react";

// ─── Round-brilliant crown diagram (top view) ───────────────────────────────
const R = 100; // girdle
const T = 0.56 * R; // table octagon radius
const S = 0.8 * R; // star-facet tips

const pt = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
};

function facetPaths() {
  const table = Array.from({ length: 8 }, (_, k) => pt(T, 22.5 + 45 * k));
  const paths: string[] = [`M${table.join(" L")} Z`];
  for (let k = 0; k < 8; k++) {
    const tv = pt(T, 22.5 + 45 * k); // table vertex
    const s0 = pt(S, 45 * k); // star tip before
    const s1 = pt(S, 45 * (k + 1)); // star tip after
    const gKite = pt(R, 22.5 + 45 * k); // girdle point at the kite's tip
    paths.push(`M${s0} L${tv} L${s1}`); // star facets
    paths.push(`M${s0} L${gKite} L${s1}`); // kite (bezel) facets
    paths.push(`M${s0} L${pt(R, 45 * k)}`); // upper-girdle split
  }
  return paths;
}

const PATHS = facetPaths();

function BrilliantDiagram() {
  return (
    <svg className="ai-dia-svg" viewBox="-110 -110 220 220" aria-hidden="true" focusable="false">
      <circle className="ai-dia-line" cx="0" cy="0" r={R} pathLength={1} />
      {PATHS.map((d, i) => (
        <path
          key={i}
          className="ai-dia-line"
          d={d}
          pathLength={1}
          style={{ animationDelay: `${120 + i * 28}ms` }}
        />
      ))}
    </svg>
  );
}

export interface BannerLink {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

export default function DiamondBanner({
  title,
  links,
  children,
}: {
  title: string;
  links: BannerLink[];
  children?: ReactNode;
}) {
  return (
    <header className="ai-dia-banner">
      <div className="ai-dia-copy">
        <h1 className="ai-dia-title">{title}</h1>
        <p className="ai-dia-lede">
          Natural white, certified and fancy-color diamonds, from melee lots to single stones.
          Hand-picked by a family business that has traded gems since 1988.
        </p>
        {links.length > 0 && (
          <div className="ai-dia-links">
            {links.map((l) =>
              l.href ? (
                <Link
                  key={l.label}
                  href={l.href}
                  prefetch={false}
                  className={`ai-dia-link${l.primary ? " is-primary" : ""}`}
                >
                  {l.label}
                </Link>
              ) : (
                <button
                  key={l.label}
                  type="button"
                  onClick={l.onClick}
                  className={`ai-dia-link${l.primary ? " is-primary" : ""}`}
                >
                  {l.label}
                </button>
              ),
            )}
          </div>
        )}
        <ul className="ai-dia-promise">
          <li>Free insured shipping</li>
          <li>30-day returns</li>
          <li>Lab reports on certified stones</li>
        </ul>
        {children}
      </div>
      <BrilliantDiagram />
    </header>
  );
}
