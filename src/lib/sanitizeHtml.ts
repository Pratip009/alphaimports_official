/**
 * Small allow-list HTML sanitizer for admin-written rich text (category /
 * subcategory descriptions pasted from Word or the rich-text editor).
 *
 * - Removes <script>, <style>, <iframe>, <object>, <embed>, <form> etc. with their content
 * - Keeps only formatting tags (p, br, span, strong, em, a, lists, headings, …);
 *   any other tag is dropped but its text is kept
 * - Keeps only safe attributes: href (http/https/mailto/tel/relative), title,
 *   target, and inline style without url()/expression()/javascript:
 * - Drops every on*="" event handler and Word's class="MsoNormal" noise
 */

const DROP_WITH_CONTENT = ["script", "style", "iframe", "object", "embed", "noscript", "template", "form", "svg", "math", "xml"];

const ALLOWED_TAGS = new Set([
  "p", "br", "span", "div", "strong", "b", "em", "i", "u", "s", "sub", "sup", "small",
  "a", "ul", "ol", "li", "h2", "h3", "h4", "h5", "h6", "blockquote", "hr",
  "table", "thead", "tbody", "tr", "td", "th", "font",
]);

const VOID_TAGS = new Set(["br", "hr"]);

function cleanStyle(style: string): string {
  return style
    .split(";")
    .map((d) => d.trim())
    .filter((d) => {
      if (!d.includes(":")) return false;
      const lower = d.toLowerCase();
      return !/url\s*\(|expression\s*\(|javascript:|behavior\s*:|@import|position\s*:\s*fixed/.test(lower);
    })
    .join("; ");
}

function cleanHref(href: string): string | null {
  const v = href.trim();
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (/^[/#?]/.test(v) && !v.startsWith("//")) return v;
  return null;
}

function decodeAttr(v: string) {
  return v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

function escapeAttr(v: string) {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function cleanAttributes(tag: string, raw: string): string {
  const out: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    const value = decodeAttr(m[3] ?? m[4] ?? m[5] ?? "");
    if (name.startsWith("on")) continue;
    if (name === "style") {
      const s = cleanStyle(value);
      if (s) out.push(`style="${escapeAttr(s)}"`);
    } else if (name === "href" && tag === "a") {
      const h = cleanHref(value);
      if (h) out.push(`href="${escapeAttr(h)}"`);
    } else if (name === "title") {
      out.push(`title="${escapeAttr(value)}"`);
    } else if (name === "target" && tag === "a" && value === "_blank") {
      out.push(`target="_blank" rel="noopener noreferrer"`);
    } else if (name === "color" && tag === "font" && /^#?[\w]+$/.test(value)) {
      out.push(`color="${escapeAttr(value)}"`);
    }
  }
  return out.length ? " " + out.join(" ") : "";
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  let s = html;

  // Comments (incl. Word's <!--[if gte mso 9]> blocks)
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // Dangerous elements together with everything inside them
  for (const t of DROP_WITH_CONTENT) {
    s = s.replace(new RegExp(`<${t}\\b[\\s\\S]*?<\\/${t}\\s*>`, "gi"), "");
    s = s.replace(new RegExp(`<${t}\\b[^>]*\\/?>`, "gi"), "");
  }

  // Rebuild every remaining tag from the allow-list
  return s.replace(/<\/?([a-zA-Z][a-zA-Z0-9:-]*)([^>]*)>/g, (full, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (full.startsWith("</")) return VOID_TAGS.has(tag) ? "" : `</${tag}>`;
    return `<${tag}${cleanAttributes(tag, attrs)}>`;
  });
}

/** True when the text contains HTML markup (vs. plain text with line breaks). */
export function looksLikeHtml(text: string) {
  return /<\/?[a-z][\s\S]*?>/i.test(text);
}

/** Plain-text version (for meta descriptions etc.). */
export function htmlToText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}