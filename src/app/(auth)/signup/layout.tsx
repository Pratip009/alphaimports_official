import type { Metadata } from "next";

// Private / transactional page: keep it out of search results.
// (robots.txt only discourages crawling; "noindex" is what keeps a linked page
// from being indexed.)
export const metadata: Metadata = {
  title: "Create an Account",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
