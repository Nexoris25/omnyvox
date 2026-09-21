"use client";
import { useState } from "react";
export function EnquiryForm({ site }: { site: string }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="rendered-section" id="enquiry">
      <h2>Start a conversation.</h2>
      <form
        style={{ maxWidth: 600 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const form = e.currentTarget;
          try {
            const r = await fetch("/api/enquiries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...Object.fromEntries(new FormData(form)),
                site,
              }),
            });
            const b = await r.json();
            if (!r.ok) throw new Error(b.error);
            setMessage("Thank you. Your message has been sent.");
            form.reset();
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label className="field">
            Your name
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <label className="field">
            Email address
            <input name="email" type="email" required />
          </label>
          <label className="field full">
            How can we help?
            <textarea name="message" required minLength={5} maxLength={4000} />
          </label>
          <label
            style={{ position: "absolute", left: "-10000px" }}
            aria-hidden="true"
          >
            Leave this blank
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <button disabled={busy} className="button" style={{ marginTop: 20 }}>
          Send message ↗
        </button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
