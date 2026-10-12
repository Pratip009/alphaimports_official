"use client";
import { useState } from "react";

/** Old-site style "SHARE" button: native share sheet, or copies the link. */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  };

  return (
    <button type="button" className="csh" onClick={share} aria-label={`Share ${title}`}>
      <span className="csh-plus" aria-hidden="true">+</span>
      {copied ? "LINK COPIED" : "SHARE"}
    </button>
  );
}