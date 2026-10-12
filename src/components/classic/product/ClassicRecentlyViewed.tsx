"use client";
/** "Recently Viewed" strip in the classic style (same data as before). */
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import ClassicProductCard from "@/components/classic/listing/ClassicProductCard";

export default function ClassicRecentlyViewed({ excludeId, limit = 6 }: { excludeId?: string; limit?: number }) {
  const { items, clear } = useRecentlyViewed({ excludeId, limit });
  if (items.length === 0) return null;

  return (
    <section className="pdc-recent" aria-label="Recently viewed">
      <h2 className="pdc-head">
        Recently Viewed
        <button type="button" onClick={clear}>
          clear history
        </button>
      </h2>
      <div className="pdc-recent-grid">
        {items.map((p) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ClassicProductCard key={p._id} product={p as any} compact />
        ))}
      </div>
    </section>
  );
}