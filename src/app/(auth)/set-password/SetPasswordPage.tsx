"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import LoginHelp from "@/components/auth/LoginHelp";

/**
 * Where the emailed "Set my password" link lands.
 *
 *   /set-password?token=…  → choose a new password → signed in, done.
 *   /set-password          → enter your email to get a link (also used as
 *                            "forgot password" and when a link has expired).
 */

const MIN_LENGTH = 8;

type TokenInfo = {
  status: "valid" | "expired" | "used" | "invalid";
  maskedEmail?: string;
  email?: string;
  firstName?: string;
  isNewPassword?: boolean;
};

export default function SetPasswordPage() {
  const params = useSearchParams();
  const { setSignedInUser } = useAuth();

  // Read once, then strip the token from the address bar so it isn't left
  // in browser history or shared by accident.
  const [token] = useState(() => params.get("token") || "");
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [checking, setChecking] = useState(!!token);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ firstName: string } | null>(null);

  const [email, setEmail] = useState(params.get("email") || "");
  const [requestState, setRequestState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [requestMsg, setRequestMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    window.history.replaceState(null, "", "/set-password");
    fetch(`/api/auth/password-setup?token=${encodeURIComponent(token)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const i: TokenInfo = d?.data ?? { status: "invalid" };
        setInfo(i);
        if (i.email) setEmail(i.email);
      })
      .catch(() => setInfo({ status: "invalid" }))
      .finally(() => setChecking(false));
  }, [token]);

  const requestLink = async (e?: React.FormEvent, from: "request" | "expired" = "request") => {
    e?.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setRequestState("error");
      setRequestMsg("Please enter the email address you use with Alpha Imports.");
      return;
    }
    setRequestState("sending");
    setRequestMsg("");
    try {
      const res = await fetch("/api/auth/password-setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, from }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.message || "We couldn't send the email. Please try again.");
      setRequestState("sent");
      setRequestMsg(d?.data?.message || "If that email is registered with us, a link is on its way.");
    } catch (err) {
      setRequestState("error");
      setRequestMsg(err instanceof Error ? err.message : "We couldn't send the email. Please try again.");
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < MIN_LENGTH) {
      setError(`Please choose a password with at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match. Please type them again.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/password-setup/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.message || "Could not set your password. Please try again.");
      setSignedInUser(d.data.user);
      setDone({ firstName: (d.data.user?.name || "").split(" ")[0] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set your password. Please try again.");
      // Link might have expired or been used meanwhile — refresh its status.
      fetch(`/api/auth/password-setup?token=${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then((d) => d?.data?.status && d.data.status !== "valid" && setInfo(d.data))
        .catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const strength =
    password.length === 0 ? "" : password.length < MIN_LENGTH ? "Too short" : password.length < 12 ? "Good" : "Strong";

  // ── What to show ──────────────────────────────────────────────────────────
  let content: React.ReactNode;

  if (done) {
    content = (
      <Panel title="All set!">
        <p className="sp-ok">
          {done.firstName ? `Thank you, ${done.firstName}. ` : ""}Your new password is saved and you&apos;re signed in.
        </p>
        <p>Next time, just sign in with your email and this new password.</p>
        <div className="sp-actions">
          <Link href="/" className="sp-btn sp-btn-primary">Start Shopping</Link>
          <Link href="/orders" className="sp-btn">View My Orders</Link>
          <Link href="/account" className="sp-btn">My Account</Link>
        </div>
      </Panel>
    );
  } else if (checking) {
    content = (
      <Panel title="One moment…">
        <p><span className="sp-spinner" /> Checking your link…</p>
      </Panel>
    );
  } else if (token && info?.status === "valid") {
    content = (
      <Panel title={info.isNewPassword ? "Set your new password" : "Choose a new password"}>
        <p>
          {info.firstName ? `Welcome back, ${info.firstName}! ` : "Welcome back! "}
          Choose a password for your account ({info.maskedEmail}). After this you&apos;ll be signed in automatically.
        </p>
        <form onSubmit={submitPassword} noValidate className="sp-form">
          <label htmlFor="sp-pw">New password</label>
          <div className="sp-pw">
            <input
              id="sp-pw"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              minLength={MIN_LENGTH}
            />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <span className={`sp-hint${strength === "Too short" ? " is-bad" : strength ? " is-good" : ""}`}>
            {strength ? `${strength} · ` : ""}At least {MIN_LENGTH} characters.
          </span>

          <label htmlFor="sp-pw2">Type it again</label>
          <input
            id="sp-pw2"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && <p className="sp-err" role="alert">{error}</p>}

          <button type="submit" className="sp-btn sp-btn-primary" disabled={saving}>
            {saving && <span className="sp-spinner" />}
            {saving ? "Saving…" : "Save Password & Sign In"}
          </button>
        </form>
      </Panel>
    );
  } else if (token && info?.status === "expired") {
    content = (
      <Panel title="This link has expired">
        <p>For your security, password links only work for a limited time. No problem — we can send you a fresh one.</p>
        {requestState === "sent" ? (
          <p className="sp-ok">{requestMsg}</p>
        ) : (
          <>
            <button
              type="button"
              className="sp-btn sp-btn-primary"
              onClick={() => requestLink(undefined, "expired")}
              disabled={requestState === "sending"}
            >
              {requestState === "sending" ? "Sending…" : `Send a New Link to ${info.maskedEmail ?? "my email"}`}
            </button>
            {requestState === "error" && <p className="sp-err" role="alert">{requestMsg}</p>}
          </>
        )}
      </Panel>
    );
  } else if (token && info?.status === "used") {
    content = (
      <Panel title="This link has already been used">
        <p>Your password was already set with this link. You can sign in with your email and password now.</p>
        <div className="sp-actions">
          <Link href="/login" className="sp-btn sp-btn-primary">Sign In</Link>
        </div>
        <p className="sp-small">Forgot the password you chose? Enter your email below and we&apos;ll send a new link.</p>
        <RequestForm email={email} setEmail={setEmail} state={requestState} msg={requestMsg} onSubmit={requestLink} />
      </Panel>
    );
  } else {
    content = (
      <Panel title={token ? "This link isn't working" : "Set or reset your password"}>
        <p>
          {token
            ? "The link may be incomplete — sometimes email programs cut long links in two. Enter your email and we'll send you a fresh one."
            : "Enter the email address you use with Alpha Imports. We'll email you a secure link — click it, choose a password, and you're signed in."}
        </p>
        <RequestForm email={email} setEmail={setEmail} state={requestState} msg={requestMsg} onSubmit={requestLink} />
      </Panel>
    );
  }

  return (
    <div className="sp-root">
      <style>{CSS}</style>
      <div className="sp-main">
        <h1 className="sp-sr">Set your password</h1>
        {content}
        <LoginHelp email={email || undefined} />
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="sp-panel">
      <div className="sp-panel-head">{title}</div>
      <div className="sp-panel-body">{children}</div>
    </section>
  );
}

function RequestForm({
  email,
  setEmail,
  state,
  msg,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  state: "idle" | "sending" | "sent" | "error";
  msg: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (state === "sent") return <p className="sp-ok" role="status">{msg}</p>;
  return (
    <form onSubmit={onSubmit} noValidate className="sp-form">
      <label htmlFor="sp-email">E-Mail Address</label>
      <input
        id="sp-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {state === "error" && <p className="sp-err" role="alert">{msg}</p>}
      <button type="submit" className="sp-btn sp-btn-primary" disabled={state === "sending"}>
        {state === "sending" && <span className="sp-spinner" />}
        {state === "sending" ? "Sending…" : "Email Me a Link"}
      </button>
    </form>
  );
}

const CSS = `
  .sp-root { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #4a4a4a; background: #fff; min-height: 60vh; }
  .sp-root *, .sp-root *::before, .sp-root *::after { box-sizing: border-box; }
  .sp-main { max-width: 560px; margin: 0 auto; padding: 20px 16px 40px; }
  .sp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .sp-panel { border: 1px solid #a9b3cf; border-top-right-radius: 8px; background: #e8ebf3; margin-bottom: 20px; }
  .sp-panel-head { background: #a9b3cf; color: #fff; font-weight: bold; font-size: 12px; padding: 4px 10px; border-top-right-radius: 7px; }
  .sp-panel-body { padding: 14px 14px 16px; line-height: 1.7; }
  .sp-panel-body p { margin: 0 0 10px; }
  .sp-form { display: flex; flex-direction: column; gap: 4px; max-width: 340px; margin-top: 6px; }
  .sp-form label { font-weight: bold; color: #333; margin-top: 6px; }
  .sp-form input { height: 26px; padding: 0 6px; border: 1px solid #333; background: #fff; font: inherit; font-size: 13px; color: #000; width: 100%; }
  .sp-form input:focus { outline: 2px solid #1c4874; outline-offset: 0; }
  .sp-pw { position: relative; }
  .sp-pw input { padding-right: 46px; }
  .sp-pw button { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: 0; color: #1c4874; text-decoration: underline; cursor: pointer; font: inherit; font-size: 10px; }
  .sp-hint { font-size: 10px; color: #6b6b6b; }
  .sp-hint.is-bad { color: #b00000; }
  .sp-hint.is-good { color: #1d7a1d; }
  .sp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 26px; padding: 0 14px;
    background: #c6cfe6; border: 1px solid #2b547e; color: #1c4874; font: inherit; font-size: 11px; cursor: pointer; text-decoration: none; }
  .sp-btn:hover { background: #b5c0de; }
  .sp-btn:disabled { opacity: .65; cursor: default; }
  .sp-btn-primary { font-weight: bold; margin-top: 10px; align-self: flex-start; }
  .sp-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 10px; }
  .sp-actions .sp-btn-primary { margin-top: 0; }
  .sp-ok { padding: 7px 10px; background: #eef6ee; border: 1px solid #b9dbb9; color: #1d5a1d; }
  .sp-err { color: #b00000; margin: 6px 0 0 !important; }
  .sp-small { font-size: 10px; color: #6b6b6b; margin-top: 10px !important; }
  .sp-spinner { width: 10px; height: 10px; border: 1.5px solid rgba(28,72,116,.25); border-top-color: #1c4874; border-radius: 50%;
    animation: spSpin .7s linear infinite; display: inline-block; vertical-align: middle; }
  @keyframes spSpin { to { transform: rotate(360deg); } }
  @media (max-width: 600px) {
    .sp-root { font-size: 13px; }
    .sp-btn { min-height: 36px; font-size: 13px; }
    .sp-form input { height: 36px; font-size: 15px; }
  }
`;
