import { query } from "@/lib/db";
import { notFound } from "next/navigation";
export const metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  if (!/^store_[a-f0-9-]{36}$/.test(reference)) notFound();
  const [order] = await query<{ payment_status: string; amount: number }>(
    "SELECT payment_status,amount FROM orders WHERE reference=$1",
    [reference],
  );
  if (!order) notFound();
  return (
    <main id="main" className="empty">
      <h1>
        {order.payment_status === "paid"
          ? "Your payment is confirmed."
          : "We’re checking your payment."}
      </h1>
      <p>
        {order.payment_status === "paid"
          ? "Your order has been received by the store."
          : "This page is not a payment confirmation. Your order is confirmed only after the payment provider verifies it."}
      </p>
      <p>Order total: ₦{(order.amount / 100).toLocaleString()}</p>
      <a href={`/order/${reference}`} className="button">
        Refresh status
      </a>
    </main>
  );
}
