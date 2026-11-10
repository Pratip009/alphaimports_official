"use client";
/**
 * FAQ list in the classic Alphaimports style: search box, category filter
 * and an accordion of questions. Each question is a real <button> with
 * aria-expanded, so it works from the keyboard and with screen readers
 * (the previous version was a clickable <div>).
 */
import { useId, useMemo, useState } from "react";
import { faqs, type FAQItem } from "./faq-data";

const CATEGORIES = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

function FaqRow({ item, open, onToggle }: { item: FAQItem; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li className={`fq-row${open ? " is-open" : ""}`}>
      <h3 className="fq-q">
        <button type="button" aria-expanded={open} aria-controls={`${id}-a`} id={`${id}-q`} onClick={onToggle}>
          <span className="fq-sign" aria-hidden="true">{open ? "−" : "+"}</span>
          <span className="fq-text">{item.question}</span>
          <span className="fq-cat">{item.category}</span>
        </button>
      </h3>
      <div id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} className="fq-a" hidden={!open}>
        <p>{item.answer}</p>
      </div>
    </li>
  );
}

export default function FaqClient() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const searchId = useId();

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      faqs.filter(
        (f) =>
          (category === "All" || f.category === category) &&
          (q === "" || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
      ),
    [category, q],
  );

  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOpen = filtered.length > 0 && filtered.every((f) => openIds.has(f.id));
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(filtered.map((f) => f.id)));

  return (
    <div className="fq">
      <style>{CSS}</style>

      <div className="fp-box fq-tools">
        <label htmlFor={searchId} className="fq-label">Search questions:</label>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. shipping, certificate, returns"
        />
        <div className="fq-cats" role="group" aria-label="Filter by topic">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              className={category === c ? "is-on" : undefined}
              onClick={() => setCategory(c)}
            >
              {c}
              {c === "All" && ` (${faqs.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="fq-bar">
        <span role="status">
          Showing <b>{filtered.length}</b> of <b>{faqs.length}</b> questions
        </span>
        {filtered.length > 0 && (
          <button type="button" className="fq-all" onClick={toggleAll}>
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="fq-empty">
          No questions match your search. Try another word, or choose <b>All</b> topics.
        </p>
      ) : (
        <ul className="fq-list">
          {filtered.map((item) => (
            <FaqRow key={item.id} item={item} open={openIds.has(item.id)} onToggle={() => toggle(item.id)} />
          ))}
        </ul>
      )}

      <div className="fp-box fq-help">
        <h3 className="fp-h3">Still have questions?</h3>
        <p>
          Call us at <a className="cl-link" href="tel:+19143101480">914-310-1480</a> or fax{" "}
          <b>212-768-0599</b>.
        </p>
      </div>
    </div>
  );
}

const CSS = `
  .fq > * + * { margin-top: 10px; }
  .fq-tools { display: grid; gap: 6px; }
  .fq-label { font-size: 11px; font-weight: bold; color: #333; }
  .fq-tools input {
    height: 24px; padding: 0 6px; font: 12px Verdana, Arial, sans-serif; color: #222;
    border: 1px solid #333; background: #fff; max-width: 420px; width: 100%;
  }
  .fq-tools input:focus-visible { outline: 2px solid #1c4874; outline-offset: 0; }
  .fq-cats { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
  .fq-cats button {
    padding: 1px 8px; font: 11px Verdana, Arial, sans-serif; cursor: pointer;
    background: #fff; border: 1px solid #a9b3cf; color: #1c4874;
  }
  .fq-cats button:hover { background: #dfe2ea; }
  .fq-cats button.is-on { background: #1c4874; border-color: #1c4874; color: #fff; font-weight: bold; }
  .fq-cats button:focus-visible, .fq-all:focus-visible { outline: 2px solid #1c4874; outline-offset: 1px; }

  .fq-bar { display: flex; justify-content: space-between; align-items: center; gap: 10px; color: #7f7f7f; font-size: 11px; }
  .fq-bar b { color: #333; }
  .fq-all { background: none; border: 0; padding: 0; cursor: pointer; color: #1c4874; font: bold 11px Verdana, Arial, sans-serif; text-decoration: underline; }

  .fq-list { list-style: none; margin: 0; padding: 0; border: 1px solid #c9cfdf; }
  .fq-row + .fq-row { border-top: 1px solid #e3e6ee; }
  .fq-q { margin: 0; font-size: 12px; }
  .fq-q button {
    width: 100%; display: flex; align-items: baseline; gap: 8px; text-align: left; cursor: pointer;
    background: #fff; border: 0; padding: 7px 10px; font: bold 12px Verdana, Arial, sans-serif; color: #1c4874;
  }
  .fq-q button:hover { background: #f5f7fb; }
  .fq-row.is-open .fq-q button { background: #dfe2ea; color: #000040; }
  .fq-q button:focus-visible { outline: 2px solid #1c4874; outline-offset: -2px; }
  .fq-sign { flex: 0 0 12px; color: #7f7f7f; font-weight: bold; }
  .fq-text { flex: 1 1 auto; }
  .fq-cat { flex: 0 0 auto; font-weight: normal; font-size: 10px; color: #7f7f7f; white-space: nowrap; }
  .fq-a { padding: 6px 12px 10px 30px; background: #fff; color: #444; }
  .fq-a p { margin: 0; }
  .fq-empty { padding: 18px 10px; border: 1px solid #c9cfdf; text-align: center; color: #7f7f7f; }

  @media (max-width: 600px) {
    .fq-cat { display: none; }
    .fq-q button { font-size: 13px; padding: 10px; }
    .fq-cats button { padding: 5px 10px; font-size: 12px; }
    .fq-tools input { height: 34px; font-size: 14px; }
  }
`;
