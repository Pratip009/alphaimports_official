import ContactPage from '@/components/ui/Contactpage'
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import React from 'react'
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphaimports.com";
const TITLE = "Contact Us | Alphaimports.com";
const DESCRIPTION =
  "Get in touch with Alphaimports.com for product questions, order support, or wholesale inquiries.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
      images: [DEFAULT_OG_IMAGE],
    type: "website",
    url: `${SITE_URL}/contact`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Alphaimports.com",
  },
  twitter: { images: [DEFAULT_OG_IMAGE.url],  card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const page = () => {
  return (
    <>
    <ContactPage/>
    </>
  )
}

export default page
    