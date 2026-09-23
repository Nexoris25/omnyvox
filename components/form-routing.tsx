"use client";
import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
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
type Recipient = {
  id: string;
  email: string;
  label: string;
  verified_at: string | null;
  sent_at: string | null;
  attempts: number;
};
export function FormRouting({ siteId }: { siteId: string }) {
  const [data, setData] = useState<Settings | null>(null),
    [message, setMessage] = useState(""),
    [recipients, setRecipients] = useState<Recipient[]>([]),
    [recipientLimit, setRecipientLimit] = useState(0),
    [pendingId, setPendingId] = useState<string | null>(null);
  async function load() {
    const r = await fetch(`/api/sites/${siteId}/forms`);
    if (r.ok) setData(await r.json());
    const r2 = await fetch(`/api/sites/${siteId}/recipients`);
    if (r2.ok) {
      const b = await r2.json();
      setRecipients(b.recipients);
      setRecipientLimit(b.limit);
    }
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
  async function addRecipient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try {
      const r = await fetch(`/api/sites/${siteId}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setMessage("Verification code sent to the new recipient.");
      setPendingId(b.id);
      form.reset();
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function verifyRecipient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch(`/api/sites/${siteId}/recipients/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, id: pendingId }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setMessage("Additional recipient verified.");
      setPendingId(null);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function removeRecipient(id: string) {
    try {
      const r = await fetch(`/api/sites/${siteId}/recipients/${id}`, {
        method: "DELETE",
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
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
      <div className="panel-divider" />
      <h2>Additional recipients</h2>
      <p>
        Send enquiries to more than one inbox — useful for sales, support or a
        second team member.
      </p>
      {recipientLimit <= 0 ? (
        <div className="panel empty">
          <Rocket />
          <h2>More room for your next chapter.</h2>
          <p>
            Additional verified recipients are available on Growth and
            Advanced. Your primary inbox above keeps working either way.
          </p>
        </div>
      ) : (
        <>
          {recipients.map((r) => (
            <div key={r.id} className="recipient-row">
              <div>
                <strong>{r.email}</strong>
                {r.label && <span className="muted"> — {r.label}</span>}
                <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                  {r.verified_at
                    ? "Verified"
                    : r.attempts >= 5
                      ? "Verification failed — remove and re-add"
                      : "Pending verification"}
                </p>
              </div>
              <button
                type="button"
                className="button secondary small"
                onClick={() => removeRecipient(r.id)}
              >
                Remove
              </button>
            </div>
          ))}
          {recipients.length < recipientLimit ? (
            <form onSubmit={addRecipient}>
              <div className="form-grid">
                <label className="field">
                  Recipient email
                  <input name="email" type="email" required maxLength={254} />
                </label>
                <label className="field">
                  Label (optional)
                  <input name="label" maxLength={60} placeholder="e.g. Sales" />
                </label>
              </div>
              <button className="button secondary">
                Send verification code
              </button>
            </form>
          ) : (
            <p className="muted">
              You’ve used all {recipientLimit} additional recipient slots on
              your plan. Remove one to add another.
            </p>
          )}
          {pendingId && (
            <form onSubmit={verifyRecipient}>
              <label className="field">
                Six-digit code for the new recipient
                <input
                  name="code"
                  required
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  maxLength={6}
                />
              </label>
              <button className="button">Verify recipient</button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
