/**
 * "Displaying 1 to 12 (of 221 products)   Result Pages: 1 2 3 ... [Next >>]"
 * Plain links (crawlable, work without JS) that keep every other URL param.
 */
import Link from "next/link";

const WINDOW = 12;

export default function ClassicResultsBar({
  page,
  totalPages,
  total,
  limit,
  searchParams,
  basePath = "/products",
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  searchParams: Record<string, string>;
  basePath?: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const href = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Window of up to 12 page numbers around the current page.
  let start = Math.max(1, page - Math.floor(WINDOW / 2));
  const end = Math.min(totalPages, start + WINDOW - 1);
  start = Math.max(1, end - WINDOW + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="crb">
      <div className="crb-count">
        Displaying <b>{from}</b> to <b>{to}</b> (of <b>{total.toLocaleString()}</b> products)
      </div>
      {totalPages > 1 && (
        <nav className="crb-pages" aria-label="Result pages">
          Result Pages:
          {page > 1 && (
            <Link href={href(page - 1)} rel="prev" prefetch={false}>
              [&lt;&lt; Prev]
            </Link>
          )}
          {start > 1 && (
            <>
              <Link href={href(1)} prefetch={false}>1</Link>
              {start > 2 && <span>...</span>}
            </>
          )}
          {pages.map((p) =>
            p === page ? (
              <b key={p} aria-current="page">
                {p}
              </b>
            ) : (
              <Link key={p} href={href(p)} prefetch={false}>
                {p}
              </Link>
            ),
          )}
          {end < totalPages && <span>...</span>}
          {page < totalPages && (
            <Link href={href(page + 1)} rel="next" prefetch={false}>
              [Next &gt;&gt;]
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}