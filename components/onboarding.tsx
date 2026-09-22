"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "./brand";
type Status = {
  email: string;
  emailVerified: boolean;
  business: null | {
    business_name: string;
    cac_number: string;
    status: string;
    review_note: string;
  };
};
export function Onboarding() {
  const [data, setData] = useState<Status | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch("/api/onboarding");
    const b = await r.json();
    if (!r.ok) throw Error(b.error);
    setData(b);
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  async function send(path: string, body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/onboarding/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setMessage(
        path === "resend"
          ? "A new code has been queued for your email."
          : "Saved successfully.",
      );
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="onboarding-page">
      <Brand />
      <h1>Let’s get your business ready.</h1>
      <p>
        Verify your email, then submit your registered business details for
        review.
      </p>
      <p role="status">{message}</p>
      {data && (
        <>
          <section className="panel">
            <h2>1. Verify your email</h2>
            {data.emailVerified ? (
              <p>✓ {data.email} is verified.</p>
            ) : (
              <>
                <p>
                  Enter the six-digit code sent to {data.email}. Codes expire
                  after 10 minutes.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(
                      "otp",
                      Object.fromEntries(new FormData(e.currentTarget)),
                    );
                  }}
                >
                  <label className="field">
                    Verification code
                    <input
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                    />
                  </label>
                  <button className="button" disabled={busy}>
                    Verify email
                  </button>
                </form>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => send("resend", {})}
                >
                  Send another code
                </button>
              </>
            )}
          </section>
          <section className="panel">
            <h2>2. Verify your business</h2>
            {data.business && (
              <p className="notice">
                Review status: {data.business.status}.{" "}
                {data.business.review_note}
              </p>
            )}
            {data.business?.status !== "verified" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  send("business", {
                    businessName: f.get("businessName"),
                    cacNumber: f.get("cacNumber"),
                    consent: f.get("consent") === "on",
                  });
                }}
              >
                <label className="field">
                  Registered business name
                  <input
                    name="businessName"
                    defaultValue={data.business?.business_name}
                    required
                    minLength={2}
                  />
                </label>
                <label className="field">
                  CAC registration number
                  <input
                    name="cacNumber"
                    placeholder="RC1234567"
                    defaultValue={data.business?.cac_number}
                    required
                  />
                </label>
                <label>
                  <input type="checkbox" name="consent" required /> I confirm
                  these details are accurate and authorize verification.
                </label>
                <p>
                  Our team reviews your CAC registration manually. You can
                  prepare your website while your review is pending.
                </p>
                <button
                  className="button"
                  disabled={busy || !data.emailVerified}
                >
                  Submit for review
                </button>
              </form>
            )}
          </section>
          <Link className="button secondary" href="/dashboard">
            Continue to your workspace →
          </Link>
        </>
      )}
    </main>
  );
}
