"use client";
import { useEffect, useState } from "react";
type Settings = {
  form: {
    active_email: string | null;
    pending_email: string | null;
    verified_at: string | null;
  };
  mailConfigured: boolean;
  delivery: {
    id: string;
    recipient: string;
    sent_at: string | null;
    attempts: number;
    last_error: string | null;
  }[];
};
export function FormRouting({ siteId }: { siteId: string }) {
  const [data, setData] = useState<Settings | null>(null),
    [message, setMessage] = useState("");
  async function load() {
    const r = await fetch(`/api/sites/${siteId}/forms`);
    if (r.ok) setData(await r.json());
  }
  useEffect(() => {
    load();
  }, [siteId]);
  async function save(e: React.FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch(`/api/sites/${siteId}/forms/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setMessage(
        action === "verify"
          ? "Your enquiry inbox is verified."
          : "Verification email queued. Enter the code from the destination inbox.",
      );
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <section className="panel panel-body">
      <h2>Where should enquiries go?</h2>
      <p>
        Your private recipient can differ from your public business email. Every
        plan supports a verified enquiry inbox.
      </p>
      <p role="status">{message}</p>
      {data && (
        <>
          <p>
            Active inbox: {data.form.active_email || "No verified inbox yet"}
          </p>
          {!data.mailConfigured && (
            <p className="notice">
              Email transport needs configuration by the platform administrator.
              Your submissions remain stored in the inbox.
            </p>
          )}
          <form onSubmit={(e) => save(e, "request")}>
            <label className="field">
              New recipient email
              <input name="email" type="email" required maxLength={254} />
            </label>
            <button className="button secondary">Send verification code</button>
          </form>
          {data.form.pending_email && (
            <form onSubmit={(e) => save(e, "verify")}>
              <p>
                Pending verification: {data.form.pending_email}. Your existing
                verified inbox remains active.
              </p>
              <label className="field">
                Six-digit code
                <input
                  name="code"
                  required
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  maxLength={6}
                />
              </label>
              <button className="button">Verify inbox</button>
            </form>
          )}
          <details>
            <summary>Recent email delivery attempts</summary>
            {data.delivery.map((m) => (
              <p key={m.id}>
                {m.recipient} —{" "}
                {m.sent_at
                  ? "Accepted by email provider"
                  : m.attempts >= 5
                    ? "Failed — contact support"
                    : m.last_error
                      ? "Retry pending"
                      : "Queued"}
              </p>
            ))}
          </details>
        </>
      )}
    </section>
  );
}
