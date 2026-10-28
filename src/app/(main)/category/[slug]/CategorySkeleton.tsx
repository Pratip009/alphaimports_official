// Shared skeleton for the category browsing routes:
//   /category/[slug]            (e.g. /category/semi-precious)
//   /category/[slug]/[subSlug]  (e.g. /category/precious-gems/emerald)
//
// Mirrors CategoryClientPage's classic catalogue layout: a left sidebar
// (Categories / Information boxes) and a main column with title,
// description, rule, and a 5-across grid of square image tiles.

const grey = "bg-neutral-200";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`${grey} ${className}`} />;
}

export default function CategorySkeleton() {
  return (
    <div className="bg-white animate-pulse" style={{ minHeight: "60vh" }}>
      <div className="grid grid-cols-1 min-[901px]:grid-cols-[200px_1fr] gap-1.5 px-3.5 min-[901px]:px-6 pt-1.5 pb-10">
        {/* Sidebar */}
        <div className="order-2 min-[901px]:order-1 space-y-3.5">
          <div>
            <div className="h-5" style={{ background: "#1c4874" }} />
            <div className="p-2 space-y-2" style={{ background: "#c9cfdf" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Bar key={i} className="h-2.5 w-2/3 bg-white/60" />
              ))}
            </div>
          </div>
          <div>
            <div className="h-5" style={{ background: "#1c4874" }} />
            <div className="p-2 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Bar key={i} className="h-2.5 w-1/2" />
              ))}
            </div>
          </div>
        </div>

        {/* Main column */}
        <div className="order-1 min-[901px]:order-2">
          <Bar className="h-4 w-48 mb-3" />
          <div className="space-y-2 mb-3">
            <Bar className="h-2.5 w-full" />
            <Bar className="h-2.5 w-11/12" />
            <Bar className="h-2.5 w-4/5" />
          </div>
          <div className="h-0.5 bg-neutral-400 mb-2" />
          <div className="flex justify-end mb-4">
            <Bar className="h-4 w-40" />
          </div>
          <div className="grid grid-cols-2 min-[521px]:grid-cols-3 min-[621px]:grid-cols-4 min-[1101px]:grid-cols-5 gap-x-3 gap-y-6 max-w-[900px] mx-auto">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Bar className="w-full max-w-[140px] aspect-square" />
                <Bar className="h-2.5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}