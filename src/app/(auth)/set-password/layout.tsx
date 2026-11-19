import type { Metadata } from "next";

// Private page reached from an emailed link: keep it out of search results,
// and never send the link (which is in the URL) to other sites as a referrer.
export const metadata: Metadata = {
  title: "Set Your Password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
