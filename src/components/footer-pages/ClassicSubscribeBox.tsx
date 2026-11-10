"use client";
/**
 * Newsletter sign-up for the Alpha Bargains / Alpha Club pages.
 *
 * These pages previously had an email box and Subscribe button that weren't
 * connected to anything, so signing up did nothing. This posts to the
 * existing /api/newsletter/subscribe endpoint and reports the outcome.
 */
import { useId, useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

export default function ClassicSubscribeBox({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.kind === "sending") return;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ kind: "done", message: "Thank you — you’re subscribed. Watch your inbox for our next offers." });
        setEmail("");
      } else if (res.status === 409) {
        setStatus({ kind: "done", message: "You’re already subscribed with this email address." });
      } else {
        setStatus({ kind: "error", message: json?.message || "Sorry, we couldn’t subscribe you. Please try again." });
      }
    } catch {
      setStatus({ kind: "error", message: "Network problem — please check your connection and try again." });
    }
  };

  return (
    <section className="fp-box csb-box" aria-labelledby={`${id}-title`}>
      <style>{CSS}</style>
      <h3 id={`${id}-title`} className="fp-h3">{title}</h3>
      {children}

      {status.kind === "done" ? (
        <p className="csb-ok" role="status">{status.message}</p>
      ) : (
        <form className="csb-form" onSubmit={onSubmit} noValidate={false}>
          <label htmlFor={`${id}-email`} className="csb-label">Email address</label>
          <div className="csb-row">
            <input
              id={`${id}-email`}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status.kind === "sending"}
            />
            <button type="submit" disabled={status.kind === "sending"}>
              {status.kind === "sending" ? "Subscribing…" : "Subscribe"}
            </button>
          </div>
          {status.kind === "error" && <p className="csb-err" role="alert">{status.message}</p>}
        </form>
      )}
    </section>
  );
}

const CSS = `
  .csb-form { margin-top: 8px; }
  .csb-label { display: block; font-size: 11px; font-weight: bold; color: #333; margin-bottom: 3px; }
  .csb-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .csb-row input {
    flex: 1 1 220px; min-width: 0; height: 24px; padding: 0 6px; font-size: 12px;
    border: 1px solid #333; background: #fff; color: #222; font-family: inherit;
  }
  .csb-row input:focus-visible { outline: 2px solid #1c4874; outline-offset: 0; }
  .csb-row button {
    height: 24px; padding: 0 14px; font: bold 11px Verdana, Arial, sans-serif; cursor: pointer;
    background: #ccd6e3; border: 1px solid #7f8aa8; color: #333;
  }
  .csb-row button:hover:not(:disabled) { background: #b8c5d8; color: #000; }
  .csb-row button:focus-visible { outline: 2px solid #1c4874; outline-offset: 1px; }
  .csb-row button:disabled, .csb-row input:disabled { opacity: .65; cursor: default; }
  .csb-ok { margin: 8px 0 0 !important; padding: 6px 8px; background: #edf7f0; border: 1px solid #9cc7a9; color: #1f5f3a; font-weight: bold; }
  .csb-err { margin: 6px 0 0 !important; color: #990000; font-weight: bold; }
  @media (max-width: 600px) {
    .csb-row input, .csb-row button { height: 34px; font-size: 14px; }
    .csb-row button { flex: 1 1 100%; }
  }
`;
