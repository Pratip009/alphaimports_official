import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { faqs } from "./faq-data";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";

const TITLE = "Frequently Asked Questions | Alphaimports.com";
const DESCRIPTION =
  "Answers to common questions about pricing, shipping, certification, custom orders, and more at Alphaimports.com.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
      images: [DEFAULT_OG_IMAGE],
    type: "website",
    url: `${SITE_URL}/faq`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Alphaimports.com",
  },
  twitter: { images: [DEFAULT_OG_IMAGE.url],  card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  // FAQPage structured data is one of the highest-value schema types for
  // organic real estate — Google renders eligible entries as expandable
  // rich results directly in the SERP. Every Q&A pair on the page is
  // included since none are gated behind interaction.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}