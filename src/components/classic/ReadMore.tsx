"use client";
/**
 * Clamps long intro copy (category / subcategory descriptions) to a few
 * lines with a "Read more" toggle. The full text stays in the DOM, so search
 * engines still see all of it; visitors see the products sooner.
 * The toggle only appears when the text actually overflows.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function ReadMore({
  children,
  className = "",
  lines = 3,
}: {
  children: ReactNode;
  className?: string;
  lines?: number;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => {
      if (open) return;
      setOverflows(el.scrollHeight > el.clientHeight + 2);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <div className={`ai-readmore${open ? " is-open" : ""}`} style={{ ["--ai-lines" as string]: lines }}>
      <div ref={bodyRef} className={`ai-readmore-body ${className}`}>
        {children}
      </div>
      {(overflows || open) && (
        <button
          type="button"
          className="ai-readmore-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
