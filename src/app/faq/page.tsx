import FooterPageLayout from "@/components/footer-pages/footer-page-layout";
import FaqClient from "./FaqClient";

// Server page so it can use the classic page frame (sidebar + site chrome);
// the interactive search / filter / accordion lives in FaqClient.
export default function FAQPage() {
  return (
    <FooterPageLayout
      title="Frequently Asked Questions"
      intro="Everything you need to know about our gemstones, shipping, payments, and more."
    >
      <FaqClient />
    </FooterPageLayout>
  );
}
