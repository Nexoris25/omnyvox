"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type History = {
  settings: {
    auto_renew: boolean;
    cancelled_at?: string;
    payment_available: boolean;
    payment_label?: string;
    amount?: number;
    currency?: string;
    interval?: string;
    bonus_months?: number;
    last_error?: string;
  };
  payments: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }[];
  invoices: {
    number: string;
    amount: number;
    currency: string;
    issued_at: string;
  }[];
};
export function BillingHistory({ site }: { site: string }) {
  const [data, setData] = useState<History>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const money = (amount: number, currency = "NGN") =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
      amount / 100,
    );
  async function load() {
    const r = await fetch(`/api/sites/${site}/billing-history`);
    const b = await r.json();
    if (!r.ok) throw Error(b.error);
    setData(b);
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, [site]);
  async function toggle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`/api/sites/${site}/renewal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: !data?.settings.auto_renew,
          consent: true,
        }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setMessage("Renewal preference updated.");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel panel-body stack">
      <h2>Renewals & payment history</h2>
      <p role="status">{message}</p>
      {data && (
        <>
          <p>
            {data.settings.auto_renew
              ? "Automatic renewal is on."
              : "Automatic renewal is off. Renew manually using the payment options above."}
          </p>
          {data.settings.last_error && (
            <p className="notice">{data.settings.last_error}</p>
          )}
          {data.settings.amount && (
            <p>
              Saved renewal terms:{" "}
              {money(data.settings.amount, data.settings.currency)} /{" "}
              {data.settings.interval}
              {data.settings.bonus_months
                ? ` plus ${data.settings.bonus_months} bonus months`
                : ""}
              . {data.settings.payment_label}
            </p>
          )}
          {(data.settings.payment_available || data.settings.auto_renew) && (
            <form className="stack" onSubmit={toggle}>
              <label>
                <input type="checkbox" required />{" "}
                {data.settings.auto_renew
                  ? "Cancel future automatic charges. Paid access continues to its end date; an already submitted payment may still complete."
                  : "I authorise recurring charges to this saved payment method at the amount and interval shown above until I cancel."}
              </label>
              <button className="button secondary" disabled={busy}>
                {data.settings.auto_renew
                  ? "Cancel automatic renewal"
                  : "Enable automatic renewal"}
              </button>
            </form>
          )}
          {!data.settings.payment_available && (
            <p>
              A successful payment with a reusable payment method is required
              before automatic renewal can be enabled.
            </p>
          )}
          <h3>Payments</h3>
          {!data.payments.length && <p>No payments yet.</p>}
          {data.payments.map((p) => (
            <article key={p.reference}>
              <p>
                {new Date(p.created_at).toLocaleDateString()} ·{" "}
                {money(p.amount, p.currency)} · {p.status}
              </p>
              <small style={{ overflowWrap: "anywhere" }}>{p.reference}</small>
            </article>
          ))}
          <h3>Invoices</h3>
          {!data.invoices.length && (
            <p>Invoices appear after payment is confirmed.</p>
          )}
          {data.invoices.map((i) => (
            <p key={i.number}>
              <Link href={`/account/invoices/${i.number}`}>
                Invoice OMN-{String(i.number).padStart(6, "0")}
              </Link>{" "}
              · {money(i.amount, i.currency)}
            </p>
          ))}
        </>
      )}
    </section>
  );
}
