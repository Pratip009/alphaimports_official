import AboutBanner from '@/components/ui/AboutBanner'
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import AlphaImportsSection from '@/components/ui/AlphaImportsSection'
import FAQSection from '@/components/ui/FAQSection'
import FoundersMessage from '@/components/ui/Foundersmessage'
import React from 'react'
import ClassicPageShell from '@/components/ui/ClassicPageShell'
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const TITLE = "About Us | Alphaimports.com";
const DESCRIPTION =
  "The story behind Alphaimports.com — our founders, our sourcing standards, and our commitment to quality diamonds, gemstones, and fine jewelry.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
      images: [DEFAULT_OG_IMAGE],
    type: "website",
    url: `${SITE_URL}/about`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Alphaimports.com",
  },
  twitter: { images: [DEFAULT_OG_IMAGE.url],  card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const page = () => {
  return (
    <ClassicPageShell withSiteChrome={false}>
      <AboutBanner />
      <AlphaImportsSection />
      <FoundersMessage />
      <FAQSection />
    </ClassicPageShell>
  )
}

export default page