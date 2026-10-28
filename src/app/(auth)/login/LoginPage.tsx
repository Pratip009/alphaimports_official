"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GoogleButton from "@/components/auth/GoogleButton";
import { googleAuthErrorMessage } from "@/lib/google-auth-messages";
import { safeRedirectPath } from "@/lib/safe-redirect";
import ClassicSidebar from "@/components/ui/ClassicSidebar";
import type { NavCategory } from "@/lib/getNavCategories";

export default function LoginPage({
  googleEnabled = false,
  navCategories = [],
}: {
  googleEnabled?: boolean;
  // Display-only: category tree for the classic left sidebar.
  navCategories?: NavCategory[];
}) {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showGoogleHint, setShowGoogleHint] = useState(false);

  // Sanitised once: only same-site relative paths are ever followed.
  const redirectParam = searchParams.get("redirect");
  const redirectTarget = safeRedirectPath(redirectParam, "/");

  // Errors coming back from the Google flow arrive as ?error=<code>.
  useEffect(() => {
    const message = googleAuthErrorMessage(searchParams.get("error"));
    if (message) setError(message);
  }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowGoogleHint(false);
    setLoading(true);
    try {
      await login(form.email, form.password);
      setRedirecting(true);
      router.push(redirectTarget);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in. Please try again.");
      // Accounts created with Google have no password. The server keeps its
      // generic "invalid email or password" (so it can't be used to probe
      // which emails exist), and the page offers the likely fix instead.
      setShowGoogleHint(googleEnabled);
      setLoading(false);
    }
  };

  const signupHref = redirectParam
    ? `/signup?redirect=${encodeURIComponent(redirectTarget)}`
    : "/signup";

  return (
    <>
      <style>{`
        .lg-root {
          font-family: Verdana, Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #6b6b6b;
          background: #fff;
          min-height: 60vh;
        }
        .lg-root *, .lg-root *::before, .lg-root *::after { box-sizing: border-box; }
        .lg-layout {
          display: grid;
          grid-template-columns: 200px minmax(0, 1fr);
          gap: 12px;
          padding: 6px 24px 40px;
          align-items: start;
        }
        .lg-main { padding-top: 8px; max-width: 700px; min-width: 0; }

        /* Classic boxed panels */
        .lg-panel {
          border: 1px solid #a9b3cf;
          border-top-right-radius: 8px;
          background: #e8ebf3;
          margin-bottom: 24px;
        }
        .lg-panel-head {
          background: #a9b3cf;
          color: #fff;
          font-weight: bold;
          font-size: 11px;
          padding: 3px 10px;
          border-top-right-radius: 7px;
        }
        .lg-panel-body { padding: 14px 6px 16px; }

        .lg-row {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
          gap: 0 14px;
          align-items: start;
        }
        .lg-fields {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 150px);
          gap: 2px 14px;
          align-items: center;
        }
        .lg-label { letter-spacing: .3px; }
        .lg-input-cell { display: flex; flex-direction: column; gap: 2px; }
        .lg-input {
          width: 100%;
          height: 18px;
          padding: 0 3px;
          border: 1px solid #333;
          border-radius: 0;
          background: #fff;
          font: inherit;
          font-size: 11px;
          color: #000;
        }
        .lg-input:focus { outline: 1px solid #1c4874; }
        .lg-pw-wrap { position: relative; }
        .lg-pw-wrap .lg-input { padding-right: 38px; }
        .lg-show {
          position: absolute;
          right: 3px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: 0;
          padding: 0;
          font: inherit;
          font-size: 9px;
          color: #1c4874;
          cursor: pointer;
          text-decoration: underline;
        }
        .lg-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          text-align: center;
        }
        .lg-btn {
          min-width: 88px;
          height: 19px;
          padding: 0 12px;
          background: #c6cfe6;
          border: 1px solid #2b547e;
          border-radius: 0;
          color: #1c4874;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
        }
        .lg-btn:hover { background: #b5c0de; }
        .lg-btn:disabled { opacity: .65; cursor: default; }
        .lg-forgot { color: #6b6b6b; text-decoration: none; }
        .lg-forgot:hover { color: #1c4874; text-decoration: underline; }

        .lg-google { width: 100%; max-width: 230px; }
        .lg-google .gbtn { height: 30px; font-size: 12px; border-radius: 2px; gap: 8px; }
        .lg-or { font-size: 10px; color: #8a8a8a; margin-bottom: -8px; }

        .lg-msg {
          grid-column: 1 / -1;
          margin-top: 10px;
          padding: 5px 8px;
          border: 1px solid #d9a3a3;
          background: #fbecec;
          color: #b00000;
        }
        .lg-hint { grid-column: 1 / -1; margin-top: 6px; line-height: 1.5; }
        .lg-hint a { color: #1c4874; }

        .lg-text { padding: 0 4px; line-height: 1.75; letter-spacing: .2px; }
        .lg-create { display: flex; justify-content: flex-end; padding: 10px 60px 0 0; }

        .lg-spinner {
          width: 10px; height: 10px;
          border: 1.5px solid rgba(28,72,116,.25);
          border-top-color: #1c4874;
          border-radius: 50%;
          animation: lgSpin .7s linear infinite;
          display: inline-block;
        }
        @keyframes lgSpin { to { transform: rotate(360deg); } }

        .lg-overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(255,255,255,.88);
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-family: Verdana, Arial, Helvetica, sans-serif;
          font-size: 12px; color: #1c4874; font-weight: bold;
        }
        .lg-overlay .lg-spinner { width: 18px; height: 18px; border-width: 2px; }

        @media (max-width: 900px) {
          .lg-layout { grid-template-columns: 1fr; padding: 8px 14px 32px; }
          .lg-main { order: 1; max-width: none; }
          .lg-layout > aside { order: 2; }
        }
        @media (max-width: 600px) {
          .lg-row, .lg-fields { grid-template-columns: 1fr; }
          .lg-label { padding-top: 6px; }
          .lg-actions { margin-top: 14px; }
          .lg-input { height: 28px; font-size: 14px; }
          .lg-btn { height: 28px; min-width: 120px; }
          .lg-create { justify-content: center; padding-right: 0; }
        }
      `}</style>

      {redirecting && (
        <div className="lg-overlay" role="status">
          <span className="lg-spinner" />
          Signing you in…
        </div>
      )}

      <div className="lg-root">
        <div className="lg-layout">
          <ClassicSidebar categories={navCategories} />

          <div className="lg-main">
            <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              Log in
            </h1>

            {/* ── Returning Customer ── */}
            <section className="lg-panel" aria-labelledby="lg-returning">
              <div className="lg-panel-head" id="lg-returning">Returning Customer</div>
              <div className="lg-panel-body">
                <form onSubmit={handleSubmit}>
                  <div className="lg-row">
                   <div className="lg-fields">
                    <label className="lg-label" htmlFor="login-email">E-Mail Address:</label>
                    <div className="lg-input-cell">
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        className="lg-input"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>

                    <label className="lg-label" htmlFor="login-password">Password:</label>
                    <div className="lg-input-cell">
                      <div className="lg-pw-wrap">
                        <input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="lg-input"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="lg-show"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          tabIndex={-1}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                   </div>

                    <div className="lg-actions">
                      <button type="submit" disabled={loading} className="lg-btn">
                        {loading && <span className="lg-spinner" />}
                        {loading ? "Signing in…" : "Sign In"}
                      </button>
                      <Link href="/forgot-password" className="lg-forgot">
                        Password forgotten? Click here.
                      </Link>
                      {googleEnabled && (
                        <>
                          <span className="lg-or">or</span>
                          <div className="lg-google">
                            <GoogleButton
                              from="login"
                              redirect={redirectParam ? redirectTarget : null}
                              disabled={loading}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {error && (
                      <div className="lg-msg">
                        <span role="alert">{error}</span>
                      </div>
                    )}
                    {showGoogleHint && (
                      <p className="lg-hint">
                        Created your account with Google? Use Continue with Google, or{" "}
                        <Link href="/forgot-password">set a password</Link> to sign in with email too.
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </section>

            {/* ── New Customer ── */}
            <section className="lg-panel" aria-labelledby="lg-new">
              <div className="lg-panel-head" id="lg-new">New Customer</div>
              <div className="lg-panel-body">
                <p className="lg-text">
                  By creating an account at Alphaimports.com you will be able to shop faster, be up
                  to date on an order&apos;s status, and keep track of the orders you have previously made.
                </p>
                <div className="lg-create">
                  <Link href={signupHref} className="lg-btn">Create Account</Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}