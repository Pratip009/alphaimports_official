"use client";
/**
 * Cookie preferences bar in the classic Alphaimports.com style: a bottom bar
 * with the site's navy rule, Verdana copy and classic buttons, plus an
 * expandable "Preferences" panel.
 *
 * Behaviour is unchanged from the previous version:
 *   - shown 1.2s after the first visit, until a choice is saved;
 *   - stored in localStorage["alpha_cookie_consent"] as
 *     { necessary, analytics, marketing, ts };
 *   - "Accept All" saves everything on; "Reject Optional" and the close
 *     button save necessary-only; "Save Preferences" saves the toggles.
 * It also dispatches a window "alpha:cookie-consent" event when saved, so
 * other UI (the welcome-offer modal) can wait for the visitor's choice.
 *
 * NOTE: nothing else in the app reads this choice yet — analytics currently
 * runs regardless of it.
 */
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY } from "@/lib/cookieConsent";

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}


export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({ necessary: true, analytics: false, marketing: false });
  const id = useId();
  const firstToggleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(COOKIE_CONSENT_KEY); } catch { /* storage blocked */ }
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (expanded) firstToggleRef.current?.focus();
  }, [expanded]);

  const save = (choice: ConsentState) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...choice, ts: Date.now() }));
    } catch { /* storage blocked — still close the bar */ }
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: choice }));
    setLeaving(true);
    setTimeout(() => setVisible(false), 250);
  };
  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true });
  const rejectOptional = () => save({ necessary: true, analytics: false, marketing: false });
  const savePrefs = () => save(consent);

  if (!visible) return null;

  return (
    <section
      className={`ck${leaving ? " is-leaving" : ""}`}
      role="region"
      aria-labelledby={`${id}-title`}
      onKeyDown={(e) => { if (e.key === "Escape" && expanded) setExpanded(false); }}
    >
      <style>{CSS}</style>
      <div className="ck-inner">
        <div className="ck-text">
          <h2 id={`${id}-title`} className="ck-title">Cookies on Alphaimports.com</h2>
          <p>
            We use cookies to run the store, keep your cart and account working, and — with your
            permission — to understand how visitors use the site and to show relevant offers.
            Read our <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </div>

        <div className="ck-actions">
          <button type="button" className="ck-btn ck-primary" onClick={acceptAll}>Accept All</button>
          <button type="button" className="ck-btn" onClick={rejectOptional}>Reject Optional</button>
          <button
            type="button"
            className="ck-link"
            aria-expanded={expanded}
            aria-controls={`${id}-prefs`}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide preferences" : "Preferences"}
          </button>
        </div>

        <button type="button" className="ck-close" aria-label="Close and keep only necessary cookies" onClick={rejectOptional}>
          ×
        </button>
      </div>

      {expanded && (
        <div id={`${id}-prefs`} className="ck-prefs">
          <fieldset>
            <legend>Cookie preferences</legend>
            <Pref
              label="Strictly necessary"
              desc="Needed for the site to work — cart, checkout and sign-in. Always on."
              checked
              disabled
            />
            <Pref
              inputRef={firstToggleRef}
              label="Analytics"
              desc="Helps us see which pages and products visitors use, so we can improve the store."
              checked={consent.analytics}
              onChange={(v) => setConsent((c) => ({ ...c, analytics: v }))}
            />
            <Pref
              label="Marketing"
              desc="Lets us show offers and product suggestions that match your interests."
              checked={consent.marketing}
              onChange={(v) => setConsent((c) => ({ ...c, marketing: v }))}
            />
          </fieldset>
          <div className="ck-prefs-actions">
            <button type="button" className="ck-btn ck-primary" onClick={savePrefs}>Save Preferences</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Pref({
  label, desc, checked, disabled, onChange, inputRef,
}: {
  label: string; desc: string; checked: boolean; disabled?: boolean;
  onChange?: (v: boolean) => void; inputRef?: React.Ref<HTMLInputElement>;
}) {
  const id = useId();
  return (
    <div className="ck-pref">
      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={`${id}-d`}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <label htmlFor={id}>
        <b>{label}</b>{disabled && <span className="ck-always"> (always on)</span>}
        <span id={`${id}-d`} className="ck-desc">{desc}</span>
      </label>
    </div>
  );
}

const CSS = `
  .ck {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 10000; /* above the chat bubble (9998) */
    background: #fff; border-top: 3px solid #1c4874; box-shadow: 0 -2px 10px rgba(0,0,0,.18);
    font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 11px; color: #444;
    transition: transform .25s ease, opacity .25s ease;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .ck.is-leaving { transform: translateY(100%); opacity: 0; }
  .ck-inner {
    position: relative; max-width: 1260px; margin: 0 auto; padding: 10px 44px 10px 24px;
    display: flex; align-items: center; gap: 18px;
  }
  .ck-text { flex: 1 1 auto; min-width: 0; }
  .ck-title { margin: 0 0 2px; font: bold 12px Verdana, Geneva, sans-serif !important; color: #1c4874 !important; letter-spacing: 0 !important; }
  .ck-text p { margin: 0; line-height: 1.6; }
  .ck-text a { color: #1c4874; font-weight: bold; text-decoration: underline; }
  .ck-actions { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; }
  .ck-btn {
    height: 24px; padding: 0 12px; cursor: pointer; white-space: nowrap;
    font: bold 11px Verdana, Geneva, sans-serif;
    background: #ccd6e3; border: 1px solid #7f8aa8; color: #333;
  }
  .ck-btn:hover { background: #b8c5d8; color: #000; }
  .ck-btn.ck-primary { background: #1c4874; border-color: #154273; color: #fff; }
  .ck-btn.ck-primary:hover { background: #154273; }
  .ck-link { background: none; border: 0; padding: 0 4px; cursor: pointer; color: #1c4874; font: bold 11px Verdana, Geneva, sans-serif; text-decoration: underline; }
  .ck-close {
    position: absolute; top: 6px; right: 12px; width: 24px; height: 24px; line-height: 20px;
    background: none; border: 1px solid transparent; cursor: pointer; color: #777; font-size: 18px;
  }
  .ck-close:hover { color: #000; border-color: #c9cfdf; }
  .ck button:focus-visible, .ck a:focus-visible, .ck input:focus-visible { outline: 2px solid #1c4874; outline-offset: 1px; }

  .ck-prefs { max-width: 1260px; margin: 0 auto; padding: 0 24px 12px; }
  .ck-prefs fieldset { margin: 0; padding: 0; border: 1px solid #a9b3cf; border-top-right-radius: 8px; background: #e8ebf3; }
  .ck-prefs legend {
    margin-left: -1px; padding: 3px 10px; background: #a9b3cf; color: #fff; font-weight: bold; border-top-right-radius: 7px;
  }
  .ck-pref { display: flex; align-items: flex-start; gap: 8px; padding: 7px 10px; }
  .ck-pref + .ck-pref { border-top: 1px solid #d3d8e5; }
  .ck-pref input { margin: 2px 0 0; width: 14px; height: 14px; accent-color: #1c4874; flex: 0 0 auto; }
  .ck-pref label { cursor: pointer; color: #333; }
  .ck-pref input:disabled + label { cursor: default; }
  .ck-always { color: #7f7f7f; font-weight: normal; }
  .ck-desc { display: block; color: #555; margin-top: 1px; }
  .ck-prefs-actions { margin-top: 8px; display: flex; justify-content: flex-end; }

  @media (max-width: 760px) {
    .ck { font-size: 12px; }
    .ck-inner { flex-direction: column; align-items: stretch; gap: 10px; padding: 12px 40px 12px 14px; }
    .ck-actions { flex-wrap: wrap; }
    .ck-btn { height: 36px; flex: 1 1 140px; font-size: 12px; }
    .ck-link { flex: 1 1 100%; padding: 6px 0; text-align: center; font-size: 12px; }
    .ck-prefs { padding: 0 14px 12px; max-height: 50vh; overflow-y: auto; }
    .ck-prefs .ck-btn { width: 100%; }
    .ck-pref input { width: 18px; height: 18px; }
  }
`;
