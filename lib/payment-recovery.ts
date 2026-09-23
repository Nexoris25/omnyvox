import { z } from "zod";
import { pool, query } from "./db";
import { adjustStock, cancelUnpaidOrder, confirmStorePayment, decrypt, lineOrder } from "./commerce";

/** Automatic checks run every five minutes after a reservation expires; after
 * this many inconclusive checks a person must decide. Stock stays reserved. */
export const MAX_AUTOMATIC_CHECKS = 24;

// A timeout/unknown reference is not proof that a customer has not paid.
export function recoveryAction(status: string) {
  if (status === "success") return "confirm";
  if (["abandoned", "failed", "reversed"].includes(status)) return "release";
  return "retry";
}

type Order = {
  id: string;
  site_id: string;
  reference: string;
  amount: number;
  currency: string;
};
export type Verification =
  | { outcome: "success"; payment: { reference: string; amount: number; currency: string; status: string } }
  | { outcome: "unpaid"; status: string }
  | { outcome: "not_found" }
  | { outcome: "in_progress"; status: string }
  | { outcome: "unavailable"; reason: string };

/** Asks the merchant's Paystack account what happened to an order payment. */
export async function verifyOrderPayment(
  order: Order,
  transport: typeof fetch = fetch,
): Promise<Verification> {
  const [merchant] = await query<{ secret: string }>(
    "SELECT secret FROM merchant_accounts WHERE site_id=$1",
    [order.site_id],
  );
  if (!merchant)
    return { outcome: "unavailable", reason: "Merchant connection unavailable" };
  let response: Response;
  try {
    response = await transport(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(order.reference)}`,
      {
        headers: { Authorization: `Bearer ${decrypt(merchant.secret)}` },
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      },
    );
  } catch {
    return { outcome: "unavailable", reason: "Provider verification unavailable" };
  }
  const body = await response.json().catch(() => null);
  if (
    (response.status === 404 || response.status === 400) &&
    body?.status === false &&
    /not found/i.test(String(body?.message))
  )
    return { outcome: "not_found" };
  if (!response.ok || !body)
    return { outcome: "unavailable", reason: "Provider verification unavailable" };
  const payment = body.data;
  if (
    body.status !== true ||
    payment?.reference !== order.reference ||
    payment.amount !== order.amount ||
    payment.currency !== order.currency
  )
    return { outcome: "unavailable", reason: "Provider verification mismatch" };
  const action = recoveryAction(payment.status);
  if (action === "confirm") return { outcome: "success", payment };
  if (action === "release") return { outcome: "unpaid", status: payment.status };
  return { outcome: "in_progress", status: payment.status };
}

/** Stops automatic checks, keeps stock reserved and tells the store owner. */
async function escalate(order: Order, reason: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [row],
    } = await client.query(
      "UPDATE orders SET payment_status='verification_required',review_reason=$2,review_opened_at=now() WHERE id=$1 AND payment_status='pending' RETURNING reference",
      [order.id, reason],
    );
    if (row) {
      await client.query(
        "INSERT INTO order_events(order_id,actor,event,note) VALUES($1,'system','payment.verification_required',$2)",
        [order.id, reason],
      );
      await client.query(
        "INSERT INTO email_outbox(recipient,subject,body,site_id) SELECT u.email,'Order payment needs your review',$2,s.id FROM sites s JOIN users u ON u.id=s.owner_id WHERE s.id=$1",
        [
          order.site_id,
          `We could not confirm payment for order ${order.reference} automatically. The items remain reserved so a paid order is not oversold. Open Orders in your dashboard to check the payment again or release the stock once your payment provider confirms the order was not paid.`,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function reconcileOrders(
  transport: typeof fetch = fetch,
  limit = 25,
) {
  const results = { confirmed: 0, released: 0, deferred: 0, escalated: 0 };
  for (let i = 0; i < limit; i++) {
    // Atomic lease prevents workers repeatedly selecting the same due order.
    const [order] = await query<Order & { reconcile_attempts: number }>(
      "UPDATE orders SET reconcile_after=now()+interval '5 minutes',reconcile_attempts=reconcile_attempts+1 WHERE id=(SELECT id FROM orders WHERE payment_status='pending' AND reservation_expires_at<=now() AND reconcile_after<=now() ORDER BY reconcile_after FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,site_id,reference,amount,currency,reconcile_attempts",
    );
    if (!order) break;
    const result = await verifyOrderPayment(order, transport);
    if (result.outcome === "success") {
      await confirmStorePayment(order.site_id, result.payment);
      results.confirmed++;
    } else if (result.outcome === "unpaid") {
      await cancelUnpaidOrder(order.site_id, order.reference);
      results.released++;
    } else {
      const reason =
        result.outcome === "unavailable"
          ? result.reason
          : result.outcome === "not_found"
            ? "Payment reference not found at the provider"
            : "Payment not terminal; stock remains reserved";
      await query("UPDATE orders SET reconcile_error=$2 WHERE id=$1", [
        order.id,
        reason,
      ]);
      if (order.reconcile_attempts >= MAX_AUTOMATIC_CHECKS) {
        await escalate(order, reason);
        results.escalated++;
      } else results.deferred++;
      continue;
    }
    await query("UPDATE orders SET reconcile_error=NULL WHERE id=$1", [
      order.id,
    ]);
  }
  return results;
}

const resolution = z.discriminatedUnion("action", [
  z.object({ action: z.literal("verify") }),
  z.object({ action: z.literal("release"), note: z.string().trim().min(10).max(500) }),
  z.object({ action: z.literal("fulfil"), note: z.string().trim().max(500).default("") }),
  z.object({
    action: z.literal("refunded"),
    refundReference: z.string().trim().min(3).max(120),
    note: z.string().trim().min(10).max(500),
  }),
]);

export class ResolutionError extends Error {}

/** Store staff actions for orders a person must resolve. Every action is
 * recorded; stock is only released when the provider confirms non-payment. */
export async function resolveOrderPayment(
  siteId: string,
  orderId: string,
  actor: string,
  input: unknown,
  transport: typeof fetch = fetch,
) {
  const b = resolution.parse(input);
  const [order] = await query<Order & { payment_status: string; items: { id: string; variant?: string; label?: string; quantity: number }[] }>(
    "SELECT id,site_id,reference,amount,currency,payment_status,items FROM orders WHERE id=$1 AND site_id=$2",
    [orderId, siteId],
  );
  if (!order) throw new ResolutionError("Order not found");
  const log = (event: string, note = "") =>
    query(
      "INSERT INTO order_events(order_id,actor,event,note) VALUES($1,$2,$3,$4)",
      [order.id, actor, event, note],
    );

  if (b.action === "verify" || b.action === "release") {
    if (!["pending", "verification_required"].includes(order.payment_status))
      throw new ResolutionError("This order's payment is already settled.");
    const result = await verifyOrderPayment(order, transport);
    if (result.outcome === "success") {
      await confirmStorePayment(siteId, result.payment);
      await query(
        "UPDATE orders SET review_reason=NULL,review_opened_at=NULL,reconcile_error=NULL WHERE id=$1",
        [order.id],
      );
      await log("payment.confirmed_by_staff_check");
      return { outcome: "paid", message: "Payment confirmed. The order is ready to fulfil." };
    }
    if (b.action === "verify") {
      await log("payment.checked", result.outcome);
      return {
        outcome: result.outcome,
        message:
          result.outcome === "unpaid" || result.outcome === "not_found"
            ? "The provider confirms this order was not paid. You can release the stock."
            : result.outcome === "in_progress"
              ? "The payment is still in progress at the provider. Stock remains reserved."
              : "The payment provider could not be reached. Stock remains reserved; try again later.",
      };
    }
    if (result.outcome !== "unpaid" && result.outcome !== "not_found")
      throw new ResolutionError(
        "Stock can only be released when your payment provider confirms the order was not paid. It currently reports: " +
          (result.outcome === "in_progress" ? `payment ${result.status}` : "status unavailable") +
          ". Contact the provider with this order reference if it does not resolve.",
      );
    if (order.payment_status === "verification_required")
      await query("UPDATE orders SET payment_status='pending' WHERE id=$1", [order.id]);
    await cancelUnpaidOrder(siteId, order.reference);
    await log("reservation.released_by_staff", b.note);
    return { outcome: "released", message: "Stock released and the order cancelled." };
  }

  if (order.payment_status !== "review_required")
    throw new ResolutionError("Only late payments awaiting review can be fulfilled or refunded here.");

  if (b.action === "refunded") {
    await query(
      "UPDATE orders SET payment_status='refunded',refund_reference=$2,review_reason=NULL,review_opened_at=NULL WHERE id=$1 AND payment_status='review_required'",
      [order.id, b.refundReference],
    );
    await log("payment.refunded_recorded", `${b.refundReference} — ${b.note}`);
    return { outcome: "refunded", message: "Refund recorded against this order." };
  }

  // Fulfil a late payment only if every item can be re-reserved right now.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [locked],
    } = await client.query(
      "SELECT id FROM orders WHERE id=$1 AND payment_status='review_required' FOR UPDATE",
      [order.id],
    );
    if (!locked) throw new ResolutionError("This order was already resolved.");
    for (const item of [...order.items].sort(lineOrder)) {
      const moved = await adjustStock(client, siteId, item, -item.quantity);
      if (!moved.ok)
        throw new ResolutionError(
          `Not enough stock to fulfil ${moved.title}${item.label ? ` (${item.label})` : ""}. Restock it or record a refund instead.`,
        );
    }
    await client.query(
      "UPDATE orders SET payment_status='paid',review_reason=NULL,review_opened_at=NULL WHERE id=$1",
      [order.id],
    );
    await client.query(
      "INSERT INTO order_events(order_id,actor,event,note) VALUES($1,$2,'late_payment.fulfilled',$3)",
      [order.id, actor, b.note],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return { outcome: "paid", message: "Stock re-reserved. The order is ready to fulfil." };
}
