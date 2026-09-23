import { query } from "./db";
import { cancelUnpaidOrder, confirmStorePayment, decrypt } from "./commerce";

// A timeout/unknown reference is not proof that a customer has not paid.
export function recoveryAction(status: string) {
  if (status === "success") return "confirm";
  if (["abandoned", "failed"].includes(status)) return "release";
  return "retry";
}

export async function reconcileOrders(
  transport: typeof fetch = fetch,
  limit = 25,
) {
  const results = { confirmed: 0, released: 0, deferred: 0 };
  for (let i = 0; i < limit; i++) {
    // Atomic lease prevents workers repeatedly selecting the same due order.
    const [order] = await query<{
      id: string;
      site_id: string;
      reference: string;
      amount: number;
      currency: string;
    }>(
      "UPDATE orders SET reconcile_after=now()+interval '5 minutes',reconcile_attempts=reconcile_attempts+1 WHERE id=(SELECT id FROM orders WHERE payment_status='pending' AND reservation_expires_at<=now() AND reconcile_after<=now() ORDER BY reconcile_after FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,site_id,reference,amount,currency",
    );
    if (!order) break;
    try {
      const [merchant] = await query<{ secret: string }>(
        "SELECT secret FROM merchant_accounts WHERE site_id=$1",
        [order.site_id],
      );
      if (!merchant) throw Error("Merchant connection unavailable");
      const response = await transport(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(order.reference)}`,
        {
          headers: { Authorization: `Bearer ${decrypt(merchant.secret)}` },
          signal: AbortSignal.timeout(15000),
          redirect: "error",
        },
      );
      if (!response.ok) throw Error("Provider verification unavailable");
      const body = await response.json();
      const payment = body.data;
      if (
        body.status !== true ||
        payment?.reference !== order.reference ||
        payment.amount !== order.amount ||
        payment.currency !== order.currency
      )
        throw Error("Provider verification mismatch");
      const action = recoveryAction(payment.status);
      if (action === "confirm") {
        await confirmStorePayment(order.site_id, payment);
        results.confirmed++;
      } else if (action === "release") {
        await cancelUnpaidOrder(order.site_id, order.reference);
        results.released++;
      } else {
        throw Error("Payment not terminal; stock remains reserved");
      }
      await query("UPDATE orders SET reconcile_error=NULL WHERE id=$1", [
        order.id,
      ]);
    } catch (error) {
      const permitted = [
        "Merchant connection unavailable",
        "Provider verification unavailable",
        "Provider verification mismatch",
        "Payment not terminal; stock remains reserved",
      ];
      const message =
        error instanceof Error && permitted.includes(error.message)
          ? error.message
          : "Verification failed; retry scheduled";
      await query("UPDATE orders SET reconcile_error=$2 WHERE id=$1", [
        order.id,
        message,
      ]);
      results.deferred++;
    }
  }
  return results;
}
