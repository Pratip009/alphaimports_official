// Classic Alphaimports page frame for simple content pages: site header,
// left Categories/Information sidebar, full-width content column, footer.
// Also provides the shared classic styles used inside the content:
//   .cl-title    blue page title
//   .cl-panel    grey-blue boxed panel (with .cl-panel-head / .cl-panel-body)
//   .cl-table    bordered label/value table
//   .cl-link     blue bold link
// Display-only — the category tree is loaded the same way the navbar does.

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import ClassicSidebar from "@/components/ui/ClassicSidebar";
import { getNavCategories } from "@/lib/getNavCategories";

const CLASSIC_CSS = `
  .cl-root { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #6b6b6b; background: #fff; }
  .cl-root *, .cl-root *::before, .cl-root *::after { box-sizing: border-box; }
  .cl-layout {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 12px;
    padding: 6px 24px 40px;
    align-items: start;
  }
  .cl-main { min-width: 0; padding-top: 4px; line-height: 1.7; }
  .cl-main p { margin: 0 0 8px; }
  .cl-main strong { color: #333; }
  .cl-title { font-size: 15px; font-weight: bold; color: #4f72a8; margin: 2px 0 8px; line-height: 1.3; }
  .cl-rule { border: 0; border-top: 2px solid #555; margin: 8px 0 14px; }

  .cl-panel {
    border: 1px solid #a9b3cf;
    border-top-right-radius: 8px;
    background: #e8ebf3;
    margin-bottom: 16px;
  }
  .cl-panel-head {
    background: #a9b3cf;
    color: #fff;
    font-weight: bold;
    font-size: 11px;
    padding: 3px 10px;
    border-top-right-radius: 7px;
    margin: 0;
  }
  .cl-panel-body { padding: 10px; }
  .cl-panel-body p:last-child { margin-bottom: 0; }

  .cl-table { width: 100%; border-collapse: collapse; background: #fff; }
  .cl-table th, .cl-table td { border: 1px solid #c9cfdf; padding: 6px 10px; vertical-align: top; text-align: left; }
  .cl-table th { background: #dfe2ea; color: #1c4874; font-weight: bold; width: 180px; white-space: nowrap; }
  .cl-table td { color: #333; }

  .cl-link { color: #1c4874; font-weight: bold; }
  .cl-link:hover { color: #c8102e; }

  @media (max-width: 900px) {
    .cl-layout { grid-template-columns: 1fr; padding: 8px 14px 32px; }
    .cl-main { order: 1; }
    .cl-layout > aside { order: 2; }
  }
  @media (max-width: 520px) {
    .cl-table, .cl-table tbody, .cl-table tr, .cl-table th, .cl-table td { display: block; width: 100%; }
    .cl-table th { border-bottom: 0; }
    .cl-table tr + tr th { border-top: 0; }
    .cl-table td { border-top: 0; }
  }
`;

export default async function ClassicPageShell({
  children,
  withSiteChrome = true,
}: {
  children: React.ReactNode;
  // Pages inside a route group whose layout already renders the Navbar and
  // Footer (e.g. app/(main)) pass false so they aren't rendered twice.
  withSiteChrome?: boolean;
}) {
  const navCategories = await getNavCategories();

  const body = (
    <>
      <style>{CLASSIC_CSS}</style>
      <div className="w-full cl-root">
        <div className="cl-layout">
          <ClassicSidebar categories={navCategories} />
          <div className="cl-main">{children}</div>
        </div>
      </div>
    </>
  );

  if (!withSiteChrome) return body;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar initialCategories={navCategories} />
      <main className="flex-1 w-full">{body}</main>
      <Footer />
    </div>
  );
}