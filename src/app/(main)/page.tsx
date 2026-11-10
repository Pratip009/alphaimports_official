import ShopByCategory from "@/components/ui/Shopbycategory";

// Only "Shop by category" is live on the home page right now; the other
// sections are commented out below. The hero-slide database query that fed
// the (commented-out) carousel used to run on every regeneration anyway —
// it's removed. To bring the carousel back, re-import HeroCarousel, HeroSlide
// and connectDB, fetch active slides (HeroSlide.find({ isActive: true })
// sorted by displayOrder) and pass them as initialSlides.

// Statically generate this page (ISR): built once, served from cache, and
// silently regenerated in the background at most once every 5 minutes.
// Visitors always get a pre-rendered HTML response with the hero image
// URL already in it — no per-request DB round trip — while edits made in
// /admin/hero-slides still show up within ~5 min without a redeploy.
export const revalidate = 300;

export default function HomePage() {
  return (
    <main className="w-full">
      {/* <section className="overflow-hidden">
        <HeroCarousel initialSlides={initialSlides} />
      </section> */}
      {/* <CompleteSource /> */}
      {/* <TrustBadges />
      <CertificationMarquee/> */}
      <ShopByCategory />
      {/* <WorldShipping/>
      <GemsPromise />
      <BirthstoneCarousel/> */}
      {/* <AwardsAccolades/> */}
      {/* <SpecialsMarquee /> */}
      {/* <OurCollectionSection videoSrc="/video/shop.mp4" /> */}
      {/* <Testimonials /> */}
      {/* <FeaturedInNews /> */}
      {/* <JewelryModal /> */}
      {/* <MetalPriceTicker/> */}
    </main>
  );
}