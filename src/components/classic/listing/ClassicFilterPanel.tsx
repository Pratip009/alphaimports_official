"use client";
/**
 * Old-site filter panel: "Categories" dropdown, one "Choose Item" dropdown
 * per CSV category filter (SHAPE / SIZE / CLARITY / ...), Reset Search, and
 * the "Sort by" dropdown underneath. Same URL params as before:
 *   filter[NAME]=a,b   (values in one filter are OR'd, filters are AND'd)
 *   sortBy=...         page resets to 1 on any change.
 * Picking an option toggles it, so several values can still be combined.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface Option {
  value: string;
  count: number;
  selected: boolean;
}
interface Group {
  filterName: string;
  attributeId: number;
  options: Option[];
}
interface SubOption {
  name: string;
  slug: string;
  href: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Recently added" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "size_asc", label: "Carat: Small to Large" },
  { value: "size_desc", label: "Carat: Large to Small" },
];

/** Params a "Reset Search" keeps (where you are), everything else is cleared. */
const KEEP_ON_RESET = ["category", "subcategory", "subSubcategory"];

export default function ClassicFilterPanel({
  groups,
  subcategories,
  activeSubSlug,
  currentSort,
}: {
  groups: Group[];
  subcategories: SubOption[];
  activeSubSlug?: string;
  currentSort?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const go = (params: URLSearchParams) =>
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));

  const toggleValue = (filterName: string, value: string) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    const key = `filter[${filterName}]`;
    const current = new Set((params.get(key) || "").split(",").map((s) => s.trim()).filter(Boolean));
    if (current.has(value)) current.delete(value);
    else current.add(value);
    if (current.size === 0) params.delete(key);
    else params.set(key, Array.from(current).join(","));
    params.delete("page");
    go(params);
  };

  const clearGroup = (filterName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(`filter[${filterName}]`);
    params.delete("page");
    go(params);
  };

  const reset = () => {
    const params = new URLSearchParams();
    KEEP_ON_RESET.forEach((k) => {
      const v = searchParams.get(k);
      if (v) params.set(k, v);
    });
    go(params);
  };

  const sort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    params.set("page", "1");
    go(params);
  };

  const hasActive =
    Array.from(searchParams.keys()).some((k) => !KEEP_ON_RESET.includes(k) && k !== "page");

  return (
    <>
      <div className={`cfp${pending ? " is-pending" : ""}`} aria-busy={pending}>
        <div className="cfp-top">
          {subcategories.length > 0 && (
            <label className="cfp-cat">
              <span>Categories</span>
              <select
                value={activeSubSlug ?? ""}
                onChange={(e) => {
                  const opt = subcategories.find((s) => s.slug === e.target.value);
                  if (opt) startTransition(() => router.push(opt.href));
                }}
              >
                {!activeSubSlug && <option value="">All</option>}
                {subcategories.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="button" className="cfp-reset" onClick={reset} disabled={!hasActive}>
            Reset Search
          </button>
        </div>

        {groups.length > 0 && (
          <div className="cfp-groups">
            {groups.map((g) => {
              const selected = g.options.filter((o) => o.selected);
              const display =
                selected.length === 0 ? "" : selected.length === 1 ? selected[0].value : "__multi__";
              return (
                <label key={g.filterName} className="cfp-group">
                  <span>
                    {g.filterName}:
                    {selected.length > 0 && (
                      <button
                        type="button"
                        className="cfp-clear"
                        onClick={(e) => {
                          e.preventDefault();
                          clearGroup(g.filterName);
                        }}
                        aria-label={`Clear ${g.filterName}`}
                      >
                        clear
                      </button>
                    )}
                  </span>
                  <select value={display} onChange={(e) => toggleValue(g.filterName, e.target.value)}>
                    <option value="">Choose Item</option>
                    {selected.length > 1 && (
                      <option value="__multi__" disabled>
                        {selected.length} selected
                      </option>
                    )}
                    {g.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.selected ? "✓ " : ""}
                        {o.value} ({o.count})
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="cfp-sort">
        <label>
          <span>Sort by:</span>
          <select value={currentSort || "newest"} onChange={(e) => sort(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}