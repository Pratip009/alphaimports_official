import type { Metadata } from "next";

// Legacy page with no site header that nothing links to — kept reachable,
// but out of search results (and removed from the sitemap).
export const metadata: Metadata = {
  title: "Customer Info & Policies",
  description:
    "Shipping, returns, certification, and other customer information for shopping with Alphaimports.com.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
