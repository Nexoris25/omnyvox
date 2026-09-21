"use client";
import { useState } from "react";
import { Brand } from "./brand";
import Link from "next/link";
export function AccountRecovery({
  mode,
}: {
  mode: "verify" | "forgot" | "reset";
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main id="main" className="auth-form-wrap" style={{ minHeight: "100vh" }}>
      <Brand />
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const form = Object.fromEntries(new FormData(e.currentTarget));
            const token = new URLSearchParams(location.search).get("token");
            const r = await fetch(`/api/auth/${mode}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...form, token }),
            });
            const b = await r.json();
            if (!r.ok) throw new Error(b.error);
            setMessage(b.message);
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>
          {mode === "verify"
            ? "Confirm your email."
            : mode === "forgot"
              ? "Let’s get you back in."
              : "Choose a new password."}
        </h2>
        <p>
          {mode === "verify"
            ? "Confirm your email to unlock website publishing."
            : mode === "forgot"
              ? "Enter the email address you use for Omnyvox."
              : "Use at least 12 characters for your new password."}
        </p>
        {mode === "forgot" && (
          <label className="field">
            Email address
            <input name="email" type="email" required />
          </label>
        )}
        {mode === "reset" && (
          <label className="field">
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </label>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <button className="button" disabled={busy}>
          {mode === "verify"
            ? "Verify email"
            : mode === "forgot"
              ? "Send reset link"
              : "Reset password"}
        </button>
        <Link href="/login">Back to login →</Link>
      </form>
    </main>
  );
}
