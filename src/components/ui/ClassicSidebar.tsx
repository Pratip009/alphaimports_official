// Classic Alphaimports left sidebar (Categories + Information boxes), as on
// the old site's account/login pages: each category with its first few
// subcategories and a "More..." link to the full category page.
// Display-only — it renders whatever category tree it is given.

import Link from "next/link";
import type { NavCategory, NavSubcategory } from "@/lib/getNavCategories";

const PREVIEW_COUNT = 4;

const INFO_LINKS: { label: string; href: string }[] = [
  { label: "Help Center", href: "/help-center" },
  { label: "F.A.Q.", href: "/faq" },
  { label: "Customer Service", href: "/customer-service" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Learning Center", href: "/learning-center" },
  { label: "Expert Advice", href: "/expert-advice" },
  { label: "Quality Score Chart", href: "/quality-score-chart" },
  { label: "Certificates & Appraisal", href: "/certificates-appraisal" },
  { label: "E-Catalog", href: "/e-catalog" },
  { label: "Ask for a Catalog", href: "/ask-for-catalog" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

function subHref(catSlug: string, sub: NavSubcategory) {
  return sub.hasChildren
    ? `/category/${catSlug}/${sub.slug}`
    : `/products?category=${catSlug}&subcategory=${sub.slug}`;
}

export default function ClassicSidebar({ categories }: { categories: NavCategory[] }) {
  return (
    <aside className="cs-side">
      <style>{`
        .cs-side { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; }
        .cs-box { margin-bottom: 12px; }
        .cs-head {
          background: linear-gradient(to bottom, #164472 0px, #0d3b6c 3px, #2b547e 100%);
          color: #fff;
          font-weight: bold;
          font-size: 11px;
          font-variant: small-caps;
          letter-spacing: .3px;
          padding: 5px 8px 4px 18px;
        }
        .cs-cats { list-style: none; margin: 0; padding: 0; }
        .cs-cat > a {
          display: block;
          background: #c9cfdf;
          padding: 5px 8px;
          font-weight: bold;
          color: #000;
          text-decoration: none;
          border-top: 1px solid #fff;
        }
        .cs-cat > a:hover { text-decoration: underline; }
        .cs-subs { list-style: none; margin: 0; padding: 3px 0 2px; background: #ededed; }
        .cs-subs a {
          display: block;
          padding: 0 8px 0 15px;
          line-height: 1.45;
          color: #6b6b6b;
          text-decoration: none;
        }
        .cs-subs a:hover { color: #1c4874; text-decoration: underline; }
        .cs-subs a.cs-more {
          text-align: right;
          padding-right: 26px;
          color: #6b6b6b;
          font-weight: bold;
          margin-top: 2px;
        }
        .cs-info { list-style: none; margin: 0; padding: 3px 0; }
        .cs-info a { display: block; line-height: 1.75; color: #6b6b6b; text-decoration: none; }
        .cs-info a:hover { color: #1c4874; text-decoration: underline; }
      `}</style>

      {categories.length > 0 && (
        <div className="cs-box">
          <div className="cs-head">Categories</div>
          <ul className="cs-cats">
            {categories.map((cat) => {
              const preview = cat.subcategories.slice(0, PREVIEW_COUNT);
              const hasMore = cat.subcategories.length > PREVIEW_COUNT;
              return (
                <li key={cat._id} className="cs-cat">
                  <Link href={`/category/${cat.slug}`} prefetch={false}>
                    {cat.name}
                  </Link>
                  {preview.length > 0 && (
                    <ul className="cs-subs">
                      {preview.map((sub) => (
                        <li key={sub._id}>
                          <Link href={subHref(cat.slug, sub)} prefetch={false}>
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                      {hasMore && (
                        <li>
                          <Link href={`/category/${cat.slug}`} prefetch={false} className="cs-more">
                            More...
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="cs-box">
        <div className="cs-head">Information</div>
        <ul className="cs-info">
          {INFO_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} prefetch={false}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}