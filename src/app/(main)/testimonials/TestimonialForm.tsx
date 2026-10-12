"use client";
import { useState, FormEvent } from "react";

/**
 * "Share your own experience" form. Submissions go to the existing contact
 * inbox (/api/contact → Admin › Contacts) with a "Testimonial" subject, so
 * staff can review them before anything is published.
 */
export default function TestimonialForm() {
  const [form, setForm] = useState({ name: "", email: "", location: "", subject: "", message: "" });
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "err"; msg?: string }>({ kind: "idle" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.message.trim().length < 10) {
      setState({ kind: "err", msg: "Please write at least 10 characters." });
      return;
    }
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: `Testimonial${form.subject.trim() ? `: ${form.subject.trim()}` : ""}`,
          message: `${form.location.trim() ? `From: ${form.location.trim()}\n\n` : ""}${form.message.trim()}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState({ kind: "ok", msg: "Thank you! Your testimonial has been sent and will appear once reviewed." });
        setForm({ name: "", email: "", location: "", subject: "", message: "" });
      } else {
        const first = data?.errors ? Object.values(data.errors).flat()[0] : null;
        setState({ kind: "err", msg: (first as string) || data?.message || "Could not send. Please try again." });
      }
    } catch {
      setState({ kind: "err", msg: "Could not send. Please try again." });
    }
  };

  return (
    <form className="ct-form" onSubmit={submit} id="share">
      <div className="ct-card-head">Share your own experience</div>
      <div className="ct-form-body">
        <label>
          <span>Your name *</span>
          <input required minLength={2} value={form.name} onChange={set("name")} />
        </label>
        <label>
          <span>E-mail *</span>
          <input required type="email" value={form.email} onChange={set("email")} />
        </label>
        <label>
          <span>City / Country</span>
          <input value={form.location} onChange={set("location")} placeholder="e.g. Istanbul, Turkey" />
        </label>
        <label>
          <span>Subject</span>
          <input value={form.subject} onChange={set("subject")} />
        </label>
        <label className="ct-form-wide">
          <span>Your testimonial *</span>
          <textarea required rows={6} value={form.message} onChange={set("message")} />
        </label>
        <div className="ct-form-wide ct-form-actions">
          <button type="submit" disabled={state.kind === "busy"}>
            {state.kind === "busy" ? "Sending..." : "Submit"}
          </button>
          {(state.kind === "ok" || state.kind === "err") && (
            <span className={`ct-form-msg ${state.kind}`} role="status">
              {state.msg}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}