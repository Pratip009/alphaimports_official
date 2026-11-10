"use client";
/**
 * Welcome offer — 10% off the first order — in the classic Alphaimports.com
 * style: a boxed panel with the navy small-caps header bar, a red offer and
 * the site's red sign-up button (as in the footer's Alpha Club box).
 *
 * Behaviour (unchanged): shown once per visitor (localStorage[storageKey]),
 * posts the email to /api/coupons/subscribe, which emails a one-use code;
 * Escape / overlay click / × close it.
 * New: waits until the visitor has answered the cookie bar, keeps keyboard
 * focus inside while open and returns it afterwards.
 */
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY } from "@/lib/cookieConsent";

interface JewelryModalProps {
  delay?: number;
  onSubmit?: (email: string) => void;
  onDismiss?: () => void;
  storageKey?: string;
}

// Must match src/services/coupon.service.ts
const DISCOUNT_PERCENT = 10;
const MIN_PURCHASE = 200;
const VALID_DAYS = 30;

function stored(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export default function JewelryModal({
  delay = 2500,
  onSubmit,
  onDismiss,
  storageKey = "jewelry_modal_dismissed",
}: JewelryModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Show after `delay` — but only once the visitor has dealt with the cookie bar.
  useEffect(() => {
    if (stored(storageKey)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => { timer = setTimeout(() => setVisible(true), delay); };
    if (stored(COOKIE_CONSENT_KEY)) {
      start();
      return () => clearTimeout(timer);
    }
    const onConsent = () => start();
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent, { once: true });
    return () => { window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent); clearTimeout(timer); };
  }, [delay, storageKey]);

  // Scroll lock + focus in, focus back out.
  useEffect(() => {
    if (!visible) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      returnFocusRef.current?.focus?.();
    };
  }, [visible]);

  useEffect(() => { if (submitted) doneRef.current?.focus(); }, [submitted]);

  const closeModal = useCallback(() => {
    setClosing(true);
    try { localStorage.setItem(storageKey, "true"); } catch { /* ignore */ }
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onDismiss?.();
    }, 200);
  }, [storageKey, onDismiss]);

  // Escape closes; Tab stays inside the dialog.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const f = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
      );
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, closeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/coupons/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
      try { localStorage.setItem(storageKey, "true"); } catch { /* ignore */ }
      onSubmit?.(trimmed);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`wo-overlay${closing ? " is-closing" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <style>{CSS}</style>
      <div
        ref={dialogRef}
        className="wo"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
      >
        <div className="wo-head">
          <span>{submitted ? "Code on its way" : "Welcome Offer"}</span>
          <button type="button" className="wo-x" aria-label="Close" onClick={closeModal}>×</button>
        </div>

        {!submitted ? (
          <div className="wo-body">
            <p className="wo-kicker">Welcome to Alphaimports.com</p>
            <h2 id={`${id}-title`} className="wo-offer">
              <span className="wo-pct">{DISCOUNT_PERCENT}% OFF</span>
              <span className="wo-sub">your first order</span>
            </h2>
            <p id={`${id}-desc`} className="wo-copy">
              Join Alpha Club for exclusive deals and early access to new gems. We’ll email your
              one-time code right away.
            </p>
            <p className="wo-terms">
              Min. ${MIN_PURCHASE} purchase · Valid {VALID_DAYS} days · One use only
            </p>

            <form onSubmit={handleSubmit} noValidate className="wo-form">
              <label htmlFor={`${id}-email`} className="wo-label">Email address</label>
              <div className="wo-row">
                <input
                  ref={inputRef}
                  id={`${id}-email`}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                  disabled={loading}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${id}-err` : undefined}
                />
                <button type="submit" className="wo-cta" disabled={loading}>
                  {loading ? "Sending…" : `Get My ${DISCOUNT_PERCENT}% Code`}
                </button>
              </div>
              {error && <p id={`${id}-err`} className="wo-err" role="alert">{error}</p>}
              <p className="wo-fine">
                By signing up you agree to our <Link href="/terms-and-conditions">Terms</Link> and{" "}
                <Link href="/privacy-policy">Privacy Policy</Link>. Unsubscribe any time.
              </p>
            </form>

            <button type="button" className="wo-skip" onClick={closeModal}>No thanks</button>
          </div>
        ) : (
          <div className="wo-body wo-done">
            <h2 id={`${id}-title`} className="wo-thanks">Thank you!</h2>
            <p id={`${id}-desc`} className="wo-copy">
              Check your inbox — your {DISCOUNT_PERCENT}% off code is on its way to <b>{email.trim()}</b>.
              Enter it at checkout on any order of ${MIN_PURCHASE} or more within {VALID_DAYS} days.
            </p>
            <button ref={doneRef} type="button" className="wo-btn" onClick={closeModal}>Continue Shopping</button>
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
  .wo-overlay {
    position: fixed; inset: 0; z-index: 10001; display: flex; /* above chat bubble + cookie bar */ align-items: center; justify-content: center;
    padding: 24px 16px; background: rgba(0, 0, 40, .55);
    animation: wo-fade .2s ease;
  }
  .wo-overlay.is-closing { opacity: 0; transition: opacity .2s ease; }
  @keyframes wo-fade { from { opacity: 0 } to { opacity: 1 } }
  .wo {
    width: 100%; max-width: 440px; max-height: 92vh; overflow-y: auto;
    background: #fff; border: 1px solid #a6aec5; box-shadow: 2px 4px 18px rgba(0,0,0,.35);
    font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 12px; color: #444;
  }
  .wo-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 4px 6px 5px 14px; color: #fff; font-weight: bold; font-size: 12px;
    font-variant: small-caps; letter-spacing: .3px;
    background: linear-gradient(to bottom, #154273, #2f5681);
  }
  .wo-x {
    width: 26px; height: 24px; line-height: 20px; font-size: 20px; cursor: pointer;
    background: none; border: 1px solid transparent; color: #fff;
  }
  .wo-x:hover { border-color: rgba(255,255,255,.6); }
  .wo-body { padding: 16px 20px 14px; text-align: center; }
  .wo-kicker { margin: 0; color: #1c4874; font-weight: bold; font-size: 12px; }
  .wo-offer { margin: 6px 0 8px !important; font-family: inherit !important; letter-spacing: 0 !important; line-height: 1.1; }
  .wo-pct { display: block; color: #c8102e; font-size: 40px; font-weight: bold; }
  .wo-sub { display: block; color: #333; font-size: 15px; font-weight: bold; margin-top: 2px; }
  .wo-copy { margin: 0 0 8px; line-height: 1.6; }
  .wo-terms {
    display: inline-block; margin: 0 0 12px; padding: 3px 10px;
    background: #e8ebf3; border: 1px solid #c9cfdf; color: #1c4874; font-size: 11px; font-weight: bold;
  }
  .wo-form { text-align: left; }
  .wo-label { display: block; font-size: 11px; font-weight: bold; color: #333; margin-bottom: 3px; }
  .wo-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .wo-row input {
    flex: 1 1 200px; min-width: 0; height: 28px; padding: 0 7px; font: 13px Verdana, Geneva, sans-serif;
    border: 1px solid #333; color: #222; background: #fff;
  }
  .wo-row input[aria-invalid="true"] { border-color: #c8102e; }
  .wo-cta {
    flex: 0 0 auto; height: 28px; padding: 0 14px; cursor: pointer; white-space: nowrap;
    font: bold 12px Verdana, Geneva, sans-serif; background: #c8102e; border: 1px solid #8f0a20; color: #fff;
  }
  .wo-cta:hover:not(:disabled) { background: #a50d26; }
  .wo-cta:disabled, .wo-row input:disabled { opacity: .7; cursor: default; }
  .wo-err { margin: 6px 0 0; color: #c8102e; font-weight: bold; font-size: 11px; }
  .wo-fine { margin: 8px 0 0; color: #7f7f7f; font-size: 10px; line-height: 1.5; }
  .wo-fine a { color: #1c4874; text-decoration: underline; }
  .wo-skip {
    margin-top: 10px; background: none; border: 0; cursor: pointer;
    color: #7f7f7f; font: 11px Verdana, Geneva, sans-serif; text-decoration: underline;
  }
  .wo-skip:hover { color: #333; }
  .wo-done { padding-top: 20px; }
  .wo-thanks { margin: 0 0 8px !important; color: #1c4874 !important; font: bold 18px Verdana, Geneva, sans-serif !important; letter-spacing: 0 !important; }
  .wo-btn {
    margin-top: 6px; height: 28px; padding: 0 18px; cursor: pointer;
    font: bold 12px Verdana, Geneva, sans-serif; background: #1c4874; border: 1px solid #154273; color: #fff;
  }
  .wo-btn:hover { background: #154273; }
  .wo button:focus-visible, .wo a:focus-visible, .wo input:focus-visible { outline: 2px solid #1c4874; outline-offset: 1px; }
  .wo-head .wo-x:focus-visible { outline-color: #fff; }

  @media (max-width: 480px) {
    .wo-body { padding: 14px 14px 12px; }
    .wo-pct { font-size: 34px; }
    .wo-row input, .wo-cta { height: 40px; font-size: 14px; }
    .wo-cta { flex: 1 1 100%; }
    .wo-skip { padding: 8px; font-size: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .wo-overlay { animation: none; }
  }
`;
