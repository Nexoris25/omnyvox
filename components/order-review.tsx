"use client";
import { useState } from "react";
import { AlertTriangle, RefreshCw, PackageCheck, Undo2, PackageX } from "lucide-react";

export type ReviewOrder = {
  id: string;
  reference: string;
  customer: { name: string; email: string };
  amount: number;
  payment_status: string;
  review_reason?: string | null;
  review_opened_at?: string | null;
  events?: { event: string; note?: string | null; at: string }[];
};

export const paymentLabels: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled — not paid",
  verification_required: "Payment unconfirmed",
  review_required: "Paid after stock was released",
  refunded: "Refunded",
};

const eventLabels: Record<string, string> = {
  "payment.confirmed": "Payment confirmed",
  "payment.late_review_required": "Payment arrived after the reservation expired",
  "payment.verification_required": "Automatic checks could not confirm payment",
  "payment.checked": "Payment checked with provider",
  "payment.confirmed_by_staff_check": "Payment confirmed after a manual check",
  "reservation.released": "Stock released",
  "reservation.released_by_staff": "Stock released by staff",
  "late_payment.fulfilled": "Stock re-reserved for fulfilment",
  "payment.refunded_recorded": "Refund recorded",
};

/** Orders a person must resolve. Stock is only released on provider proof. */
export function OrderReview({
  orders,
  resolve,
  busy,
}: {
  orders: ReviewOrder[];
  resolve: (id: string, body: Record<string, string>) => Promise<void>;
  busy: boolean;
}) {
  const [open, setOpen] = useState<Record<string, "release" | "refund" | undefined>>({});
  const [form, setForm] = useState<Record<string, Record<string, string>>>({});
  const needing = orders.filter((o) =>
    ["verification_required", "review_required"].includes(o.payment_status),
  );
  if (!needing.length) return null;
  const field = (id: string, key: string) => form[id]?.[key] || "";
  const set = (id: string, key: string, value: string) =>
    setForm({ ...form, [id]: { ...form[id], [key]: value } });
  return (
    <section className="panel order-review" aria-labelledby="order-review-title">
      <div className="panel-header">
        <h2 id="order-review-title">
          <AlertTriangle size={18} /> Payments needing your attention
        </h2>
        <span className="badge">{needing.length}</span>
      </div>
      <p className="muted order-review-intro">
        These orders could not be settled automatically. Items stay reserved so
        a paid order is never oversold. Stock is released only when your payment
        provider confirms the order was not paid.
      </p>
      {needing.map((o) => {
        const late = o.payment_status === "review_required";
        return (
          <article key={o.id} className="order-review-card">
            <header>
              <div>
                <b>{o.customer.name}</b> · ₦{(o.amount / 100).toLocaleString()}
                <small>
                  Ref {o.reference} · {o.customer.email}
                </small>
              </div>
              <span className={`badge ${late ? "badge-warn" : "badge-info"}`}>
                {paymentLabels[o.payment_status]}
              </span>
            </header>
            {o.review_reason && <p className="order-review-reason">{o.review_reason}</p>}
            <p className="field-hint">
              {late
                ? "The customer paid after the reservation expired and the stock was released. Fulfil the order if stock is available, or refund the customer through your payment provider and record it here."
                : "Check the payment again. If your provider confirms it was not paid, you can release the stock. If it stays unconfirmed, contact your provider with the reference above."}
            </p>
            <div className="order-review-actions">
              {late ? (
                <>
                  <button
                    type="button"
                    className="button small"
                    disabled={busy}
                    onClick={() => resolve(o.id, { action: "fulfil" })}
                  >
                    <PackageCheck size={14} /> Fulfil order
                  </button>
                  <button
                    type="button"
                    className="button secondary small"
                    disabled={busy}
                    onClick={() => setOpen({ ...open, [o.id]: open[o.id] === "refund" ? undefined : "refund" })}
                  >
                    <Undo2 size={14} /> Record refund
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="button small"
                    disabled={busy}
                    onClick={() => resolve(o.id, { action: "verify" })}
                  >
                    <RefreshCw size={14} /> Check payment again
                  </button>
                  <button
                    type="button"
                    className="button secondary small"
                    disabled={busy}
                    onClick={() => setOpen({ ...open, [o.id]: open[o.id] === "release" ? undefined : "release" })}
                  >
                    <PackageX size={14} /> Release stock
                  </button>
                </>
              )}
            </div>
            {open[o.id] === "release" && (
              <form
                className="order-review-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  resolve(o.id, { action: "release", note: field(o.id, "note") });
                }}
              >
                <label className="field">
                  Why are you releasing this stock?
                  <textarea
                    required
                    minLength={10}
                    maxLength={500}
                    rows={2}
                    value={field(o.id, "note")}
                    placeholder="e.g. Customer confirmed they did not complete payment."
                    onChange={(e) => set(o.id, "note", e.target.value)}
                  />
                </label>
                <button className="button small" disabled={busy}>
                  Verify with provider and release
                </button>
              </form>
            )}
            {open[o.id] === "refund" && (
              <form
                className="order-review-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  resolve(o.id, {
                    action: "refunded",
                    refundReference: field(o.id, "ref"),
                    note: field(o.id, "note"),
                  });
                }}
              >
                <label className="field">
                  Refund reference from your payment provider
                  <input
                    required
                    minLength={3}
                    maxLength={120}
                    value={field(o.id, "ref")}
                    onChange={(e) => set(o.id, "ref", e.target.value)}
                  />
                </label>
                <label className="field">
                  Note
                  <textarea
                    required
                    minLength={10}
                    maxLength={500}
                    rows={2}
                    value={field(o.id, "note")}
                    onChange={(e) => set(o.id, "note", e.target.value)}
                  />
                </label>
                <button className="button small" disabled={busy}>
                  Record refund
                </button>
              </form>
            )}
            {!!o.events?.length && (
              <details className="order-history">
                <summary>History</summary>
                <ol>
                  {o.events.map((e, i) => (
                    <li key={i}>
                      <time>{new Date(e.at).toLocaleString("en-NG")}</time>{" "}
                      {eventLabels[e.event] || e.event}
                      {e.note && ` — ${e.note}`}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </article>
        );
      })}
    </section>
  );
}
