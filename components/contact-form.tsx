"use client";
import { useState } from "react";
export function ContactForm() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="panel contact-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        try {
          const r = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(form))),
          });
          const b = await r.json();
          if (!r.ok) throw Error(b.error);
          setMessage("Message received. Our support team will reply by email.");
          form.reset();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        Your name
        <input
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
        />
      </label>
      <label className="field">
        Email address
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        What can we help with?
        <select name="topic">
          <option>Choosing a plan</option>
          <option>Website setup</option>
          <option>Payments & billing</option>
          <option>Technical support</option>
          <option>Something else</option>
        </select>
      </label>
      <label className="field">
        Your message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
        />
      </label>
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="honeypot"
        aria-hidden="true"
      />
      <label className="consent-check">
        <input type="checkbox" name="consent" required />
        <span>
          I agree that Omnyvox may use these details to respond to my enquiry, as
          described in the{" "}
          <a href="/legal/privacy" target="_blank" rel="noopener">
            Privacy notice
          </a>
          .
        </span>
      </label>
      <button className="button" disabled={busy}>
        {busy ? "Sending…" : "Send your message →"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
