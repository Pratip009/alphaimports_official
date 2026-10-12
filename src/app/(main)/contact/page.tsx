import ContactPage from '@/components/ui/Contactpage'
import React from 'react'
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alphagemstone.com";
const TITLE = "Contact Us | Alpha Gemstone";
const DESCRIPTION =
  "Get in touch with Alpha Gemstone NY Inc. for product questions, order support, or wholesale inquiries.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/contact`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Alpha Gemstone",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const page = () => {
  return (
    <>
    <ContactPage/>
    </>
  )
}

export default page
    