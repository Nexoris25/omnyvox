"use client";
import { useState } from "react";
import { Brand } from "./brand";
import Link from "next/link";
import { PasswordField } from "./password-field";
export function AccountRecovery({
  mode,
}: {
  mode: "verify" | "forgot" | "reset";
}) {
  const [password, setPassword] = useState("");
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
        <h1>
          {mode === "verify"
            ? "Verify your email"
            : mode === "forgot"
              ? "Reset your password"
              : "Choose a new password"}
        </h1>
        <p>
          {mode === "verify"
            ? "Confirm your email to unlock website publishing."
            : mode === "forgot"
              ? "Enter the email address you use for Omnyvox."
              : "Use at least 8 characters, a capital letter, a number and a special character."}
        </p>
        {mode === "forgot" && (
          <label className="field">
            Email address
            <input name="email" type="email" required />
          </label>
        )}
        {mode === "reset" && (
          <>
            <PasswordField
              label="New password"
              requirements
              onValueChange={setPassword}
            />
            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              confirmation={password}
            />
          </>
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
