// Frame for the footer-link information pages (privacy, terms, return &
// shipping policy, FAQ, help center, …) in the classic Alphaimports style:
// site header, left Categories/Information sidebar, blue page title, footer.
//
// It renders through ClassicPageShell, so these pages match Customer Service
// and the other classic content pages. Page content uses a few semantic
// classes defined below instead of per-page Tailwind colours:
//   .fp-h2      section heading           .fp-h3     sub-heading
//   .fp-list    bulleted list             .fp-stack  vertical group
//   .fp-box     boxed panel               .fp-eyebrow small label above a value
//   .cl-link    (from ClassicPageShell)   blue bold link
//   .fp-block   put a link on its own line

import ClassicPageShell from "@/components/ui/ClassicPageShell";

type Props = {
  title: string;
  /** Optional one-line introduction shown under the title. */
  intro?: React.ReactNode;
  children: React.ReactNode;
};

const FOOTER_PAGE_CSS = `
  .fp-body { color: #555; font-size: 12px; line-height: 1.75; max-width: 860px; }
  .fp-body > * + * { margin-top: 14px; }
  .fp-body p { margin: 0 0 8px; }
  .fp-body p:last-child { margin-bottom: 0; }
  .fp-intro { color: #555; font-size: 12px; margin: 0 0 4px; }

  .fp-h2 {
    margin: 4px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #c9cfdf;
    color: #1c4874; font-size: 13px; font-weight: bold; line-height: 1.4;
  }
  .fp-h3 { margin: 0 0 6px; color: #333; font-size: 12px; font-weight: bold; line-height: 1.4; }

  .fp-list { margin: 0 0 4px; padding-left: 20px; list-style: disc; }
  .fp-list li { margin: 3px 0; padding-left: 2px; }
  .fp-list li::marker { color: #1c4874; }
  .fp-body ol { margin: 0 0 4px; padding-left: 22px; list-style: decimal; }

  .fp-stack > * + * { margin-top: 10px; }

  .fp-box {
    border: 1px solid #a9b3cf; border-top-right-radius: 8px;
    background: #e8ebf3; padding: 10px 12px;
  }
  .fp-box .fp-h3 { color: #1c4874; }

  .fp-eyebrow { margin: 0 0 1px !important; color: #7f7f7f; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: .04em; }

  .fp-block { display: block; width: fit-content; }
  .fp-body a:not(.cl-link) { color: #1c4874; text-decoration: underline; }
  .fp-body a:focus-visible { outline: 2px solid #1c4874; outline-offset: 1px; }

  @media (max-width: 600px) {
    .fp-body { font-size: 13px; }
    .fp-h2 { font-size: 14px; }
  }
`;

export default function FooterPageLayout({ title, intro, children }: Props) {
  return (
    <ClassicPageShell>
      <style>{FOOTER_PAGE_CSS}</style>
      <h1 className="cl-title">{title}</h1>
      {intro && <p className="fp-intro">{intro}</p>}
      <hr className="cl-rule" />
      <div className="fp-body">{children}</div>
    </ClassicPageShell>
  );
}
