/**
 * Site identity — the single source of truth for name, domain and contact
 * details used in metadata, structured data, sitemaps, emails and copy.
 *
 * The storefront is Alphaimports.com. It is operated by the company
 * Alpha Gemstone NY Inc. (see LEGAL_NAME), which is why that name still
 * appears in legal text (terms, privacy, copyright) — but never as the brand.
 */

/** Canonical origin, no trailing slash. Override per environment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com").replace(/\/+$/, "");

/** Brand name, as shown in the logo and used in titles ("About Us | Alphaimports.com"). */
export const SITE_NAME = "Alphaimports.com";

/** Short form for tight spaces (home-screen icon label, app name). */
export const SITE_SHORT_NAME = "Alphaimports";

/** The company that operates the site — used in legal text and structured data only. */
export const LEGAL_NAME = "Alpha Imports NY Inc.";

export const TAGLINE = "Lowest Prices on the Planet";
export const FOUNDING_YEAR = 1988;
export const PHONE_DISPLAY = "1-914-310-1480";
export const PHONE_E164 = "+19143101480";
export const ORDERS_EMAIL = "orders@alphaimports.com";

/** Brand colours, shared by favicons / OG images / manifest. */
export const BRAND_NAVY = "#1c4874";
export const BRAND_NAVY_DARK = "#0d2a4a";

export const DEFAULT_DESCRIPTION =
  "Alphaimports.com — serving customers since 1988 with the lowest prices on the planet on natural diamonds, precious and semi-precious gemstones, fine jewelry and watches.";

/** Absolute URL for a site path ("/faq" → "https://www.alphaimports.com/faq"). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Default social-share image. Next.js replaces (doesn't merge) a parent's
 * openGraph/twitter settings when a page defines its own, so pages that set
 * openGraph must list an image themselves — use this one unless the page has
 * something more specific (a product photo, a section image).
 */
export const DEFAULT_OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Alphaimports.com — Lowest Prices on the Planet: diamonds, gemstones, jewelry and watches",
  type: "image/jpeg",
};
