import { query } from "@/lib/db";
import { notFound } from "next/navigation";
export const metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};
const naira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    kobo / 100,
  );
export default async function Page({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  if (!/^store_[a-f0-9-]{36}$/.test(reference)) notFound();
  // The reference is an unguessable ID; customer contact details are never shown.
  const [order] = await query<{
    payment_status: string;
    fulfilment_status: string;
    amount: number;
    subtotal: number | null;
    delivery_fee: number | null;
    items: { title: string; label?: string; quantity: number; price: number }[];
    fulfilment: { method: "delivery" | "pickup"; name: string; detail?: string } | null;
    store: string;
  }>(
    "SELECT o.payment_status,o.fulfilment_status,o.amount,o.subtotal,o.delivery_fee,o.items,o.fulfilment,s.name AS store FROM orders o JOIN sites s ON s.id=o.site_id WHERE o.reference=$1",
    [reference],
  );
  if (!order) notFound();
  const paid = order.payment_status === "paid";
  const closed = order.payment_status === "cancelled";
  return (
    <main id="main" className="order-status">
      <section className="order-status-card">
        <span className={`badge${paid ? " success" : ""}`}>
          {paid ? "Payment confirmed" : closed ? "Not paid" : "Checking payment"}
        </span>
        <h1>
          {paid
            ? "Thank you. Your order is confirmed."
            : closed
              ? "This order was not paid."
              : "We’re checking your payment."}
        </h1>
        <p>
          {paid
            ? `${order.store} has received your order${order.fulfilment?.method === "pickup" ? " and will let you know when it is ready to collect" : ""}. A receipt is on its way from the payment provider.`
            : closed
              ? "The items were released because payment was not completed. If you were charged, contact the store with the reference below."
              : "This page is not a payment confirmation. Your order is confirmed only after the payment provider verifies it."}
        </p>
        <ul className="order-status-lines">
          {order.items.map((i, n) => (
            <li key={n}>
              <span>
                {i.quantity} × {i.title}
                {i.label && <small>{i.label}</small>}
              </span>
              <span>{naira(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="order-totals">
          {order.subtotal !== null && (
            <div>
              <dt>Subtotal</dt>
              <dd>{naira(order.subtotal)}</dd>
            </div>
          )}
          {order.delivery_fee !== null && (
            <div>
              <dt>{order.fulfilment?.method === "pickup" ? "Pickup" : "Delivery"}</dt>
              <dd>{order.delivery_fee ? naira(order.delivery_fee) : "Free"}</dd>
            </div>
          )}
          <div className="order-total">
            <dt>Total</dt>
            <dd>{naira(order.amount)}</dd>
          </div>
        </dl>
        {order.fulfilment && (
          <p className="order-status-fulfilment">
            <b>{order.fulfilment.method === "pickup" ? "Collect from" : "Delivery"}:</b>{" "}
            {order.fulfilment.name}
            {order.fulfilment.detail && ` · ${order.fulfilment.detail}`}
          </p>
        )}
        <p className="order-status-ref">
          Order reference <code>{reference}</code>
        </p>
        {!paid && !closed && (
          <a href={`/order/${reference}`} className="button">
            Refresh status
          </a>
        )}
      </section>
    </main>
  );
}
