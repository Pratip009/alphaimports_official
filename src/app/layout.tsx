import type { Metadata, Viewport } from "next";
import { cache } from "react";
import Providers from "./providers";
import "./global.css";
import CookieConsentLazy from "./CookieConsentLazy";
import HomeOnlyWidgets from "./HomeOnlyWidgets";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next"
import {
  SITE_URL, SITE_NAME, SITE_SHORT_NAME, LEGAL_NAME, TAGLINE, FOUNDING_YEAR,
  PHONE_E164, ORDERS_EMAIL, BRAND_NAVY, DEFAULT_DESCRIPTION,
} from "@/lib/site";
// Every other data-facing module in this codebase (newsletter service, email
// templates, blog metadata) resolves the canonical origin from
// NEXT_PUBLIC_SITE_URL and falls back to https://www.alphaimports.com (src/lib/site.ts). The old
// hardcoded gmstone-new-2026.vercel.app preview URL here meant canonical
// links, Open Graph tags, and JSON-LD were all pointing search engines at a
// staging deployment instead of the real production domain — fixed below.
export const BASE_URL = SITE_URL;

const OG_IMAGE = `${BASE_URL}/og-image.jpg`;
const LOGO_URL = `${BASE_URL}/brand/alphaimports-a-1024.png`;

const FALLBACK_DESCRIPTION = DEFAULT_DESCRIPTION;

const BASE_KEYWORDS = [
  "diamonds",
  "gemstones",
  "fine jewelry",
  "natural diamonds",
  "certified diamonds",
  "sapphires",
  "rubies",
  "emeralds",
  "Alphaimports.com",
  "Alpha Imports",
  "alphaimports",
  "wholesale gemstones",
  "loose gemstones",
  "watches",
];

/**
 * Live snapshot of the catalogue, used to keep the site-wide <title>,
 * <meta description>, keywords, and JSON-LD in sync with what's actually in
 * stock instead of a paragraph hand-written once and never revisited.
 * Wrapped in React's `cache()` so generateMetadata() and RootLayout share a
 * single DB round trip per request instead of querying twice, and wrapped in
 * try/catch so a DB hiccup degrades gracefully to static copy rather than
 * breaking every page on the site.
 */
const getCatalogSnapshot = cache(async () => {
  try {
    const { connectDB } = await import("@/lib/db");
    const { getNavCategories } = await import("@/lib/getNavCategories");
    const { getProductStats } = await import("@/services/product.service");

    await connectDB();

    const [categories, stats] = await Promise.all([
      getNavCategories(),
      getProductStats(),
    ]);

    const categoryNames = categories.map((c) => c.name).filter(Boolean);

    return { categoryNames, activeCount: stats?.active ?? 0 };
  } catch (err) {
    console.error("[layout] catalog snapshot failed, using static SEO fallback:", err);
    return { categoryNames: [] as string[], activeCount: 0 };
  }
});

// Root layout metadata is otherwise fully static at build time. Marking it
// as an ISR-style revalidation target means the live category/stock-derived
// copy below is recomputed on a schedule instead of only at the next deploy.
export const revalidate = 3600; // 1 hour

export const viewport: Viewport = {
  themeColor: BRAND_NAVY,
};

export async function generateMetadata(): Promise<Metadata> {
  const { categoryNames, activeCount } = await getCatalogSnapshot();

  const topCategories = categoryNames.slice(0, 6);
  const categoryPhrase = topCategories.length
    ? topCategories.slice(0, -1).join(", ") +
      (topCategories.length > 1
        ? `, and ${topCategories[topCategories.length - 1]}`
        : topCategories[0])
    : "natural diamonds, fine gemstones, sapphires, rubies, and emeralds";

  const description =
    activeCount > 0
      ? `Shop ${activeCount.toLocaleString()}+ pieces across ${categoryPhrase}, and luxury fine jewelry — with certification available on applicable products.`
      : FALLBACK_DESCRIPTION;

  const title =
    topCategories.length > 0
      ? `${SITE_NAME} – ${TAGLINE} | ${topCategories.slice(0, 3).join(", ")} & Jewelry`
      : `${SITE_NAME} – ${TAGLINE} | Diamonds, Gemstones & Jewelry`;

  const keywords = Array.from(new Set([...BASE_KEYWORDS, ...categoryNames]));

  return {
    metadataBase: new URL(BASE_URL),

    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },

    description,
    keywords,

    creator: SITE_NAME,
    publisher: SITE_NAME,
    applicationName: SITE_NAME,
    category: "Jewelry & Gemstones",

    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    alternates: {
      canonical: BASE_URL,
    },

    openGraph: {
      type: "website",
      url: BASE_URL,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${TAGLINE}: diamonds, gemstones, jewelry and watches`,
          type: "image/jpeg",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },

    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },

    appleWebApp: { capable: true, title: SITE_SHORT_NAME, statusBarStyle: "default" },

    manifest: "/site.webmanifest",

    // Populate these via env vars once you have real verification codes from
    // Google Search Console / Bing Webmaster Tools; harmless no-ops until then.
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { categoryNames, activeCount } = await getCatalogSnapshot();

  const organization = {
    "@type": ["JewelryStore", "OnlineStore"],
    "@id": `${BASE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["Alpha Imports", "Alphaimports"],
    legalName: LEGAL_NAME,
    slogan: TAGLINE,
    url: BASE_URL,
    logo: { "@type": "ImageObject", url: LOGO_URL, width: 1024, height: 1024 },
    image: OG_IMAGE,
    foundingDate: String(FOUNDING_YEAR),
    telephone: PHONE_E164,
    email: ORDERS_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: PHONE_E164,
      email: ORDERS_EMAIL,
      contactType: "customer service",
      availableLanguage: ["English"],
    },
    description:
      activeCount > 0
        ? `${SITE_NAME} offers ${activeCount.toLocaleString()}+ diamonds, gemstones, jewelry pieces and watches — serving customers since ${FOUNDING_YEAR}.`
        : DEFAULT_DESCRIPTION,
    ...(categoryNames.length > 0 && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Diamond, Gemstone, Jewelry & Watch Categories",
        itemListElement: categoryNames.map((name, i) => ({
          "@type": "OfferCatalog",
          position: i + 1,
          name,
        })),
      },
    }),
  };

  // WebSite + SearchAction lets Google show a sitelinks search box that
  // searches this store directly.
  const website = {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: SITE_NAME,
    alternateName: "Alpha Imports",
    url: BASE_URL,
    publisher: { "@id": `${BASE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/products?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const jsonLd = { "@context": "https://schema.org", "@graph": [organization, website] };

  return (
    <html lang="en">
      <head>
       {/* "Elms Sans" is self-hosted from /public/fonts (see global.css)
           instead of fetched from fonts.googleapis.com / fonts.gstatic.com.
           That removes the render-blocking preconnect -> stylesheet -> font
           request chain Lighthouse flagged. Preloading the primary (latin)
           file lets the browser start fetching it immediately, in parallel
           with everything else. */}
       <link
         rel="preload"
         href="/fonts/elms-sans/elms-sans-latin-wght-normal.woff2"
         as="font"
         type="font/woff2"
         crossOrigin="anonymous"
       />

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
      </head>

      <body
        style={{
          background: "var(--bg)",
          color: "var(--text)",
          position: "relative",
        }}
      >
        <Providers>
          {children}
          <HomeOnlyWidgets />
        </Providers>
        <CookieConsentLazy />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}