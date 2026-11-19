"use client";
import { useState } from "react";

/**
 * Shown to guest-checkout customers on their order page: one click to get
 * an emailed link that turns their details into an account. Optional —
 * they never need an account to buy.
 */
export default function GuestAccountPrompt({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  const send = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/auth/password-setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, from: "guest" }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.message || "We couldn't send the email. Please try again.");
      setState("sent");
      setMsg(
        d?.data?.status === "throttled"
          ? d.data.message
          : `We've emailed a link to ${email}. Click it, choose a password, and your orders and address will be saved in your new account.`
      );
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "We couldn't send the email. Please try again.");
    }
  };

  return (
    <div className="gp">
      <style>{`
        .gp { border: 1px solid #b9cbe4; background: #f3f7fd; padding: 8px 10px; margin-bottom: 12px; line-height: 1.7; }
        .gp p { margin: 0 0 6px; }
        .gp-ok { color: #1d5a1d; }
        .gp-err { color: #b00000; }
      `}</style>
      {state === "sent" ? (
        <p className="gp-ok">{msg}</p>
      ) : (
        <>
          <p>
            <strong>Save your details for next time?</strong> Create a password and you&apos;ll be able to track
            this order and check out faster. Completely optional.
          </p>
          <button className="or-btn" onClick={send} disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Email Me a Link to Create a Password"}
          </button>
          {state === "error" && <p className="gp-err">{msg}</p>}
        </>
      )}
    </div>
  );
}
