import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, query } from "../lib/db";
import { encrypt } from "../lib/commerce";
import {
  MAX_AUTOMATIC_CHECKS,
  reconcileOrders,
  resolveOrderPayment,
  ResolutionError,
} from "../lib/payment-recovery";

if (!/\/omnyvox_test(\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Run against the isolated omnyvox_test database only.");

let passes = 0;
const check = (v: unknown, label: string) => {
  assert.ok(v, label);
  passes++;
  console.log("PASS", label);
};
const provider = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;
const paystack = (reference: string, status: string) =>
  provider(200, { status: true, data: { reference, status, amount: 5000, currency: "NGN" } });
const notFound = provider(400, { status: false, message: "Transaction reference not found" });
const outage = (async () => {
  throw Error("network down");
}) as typeof fetch;

const [owner] = await query<{ id: string }>(
  "INSERT INTO users(name,email,password) VALUES('QA',$1,'x') RETURNING id",
  [`pay-${randomUUID()}@example.test`],
);
async function store() {
  const [site] = await query<{ id: string }>(
    "INSERT INTO sites(owner_id,name,slug,category,tier,data) VALUES($1,'QA',$2,'commerce','basic','{}') RETURNING id",
    [owner.id, `pay-${randomUUID().slice(0, 8)}`],
  );
  await query("INSERT INTO merchant_accounts(site_id,secret,verified) VALUES($1,$2,true)", [
    site.id,
    encrypt("sk_test_qa"),
  ]);
  const [product] = await query<{ id: string }>(
    "INSERT INTO records(site_id,kind,data) VALUES($1,'products',$2) RETURNING id",
    [site.id, JSON.stringify({ title: "Kettle", slug: "kettle", status: "published", stock: 4, price: 5000 })],
  );
  return { site: site.id, product: product.id };
}
async function order(s: { site: string; product: string }, status = "pending", attempts = 0) {
  const reference = "store_" + randomUUID();
  const [o] = await query<{ id: string }>(
    "INSERT INTO orders(site_id,reference,customer,items,amount,payment_status,reservation_expires_at,reconcile_after,reconcile_attempts) VALUES($1,$2,$3,$4,5000,$5,'1970-01-01','1970-01-01',$6) RETURNING id",
    [
      s.site,
      reference,
      JSON.stringify({ name: "Ada", email: "ada@example.test" }),
      JSON.stringify([{ id: s.product, quantity: 1, price: 5000, title: "Kettle" }]),
      status,
      attempts,
    ],
  );
  return { id: o.id, reference };
}
const state = async (id: string) =>
  (await query<{ payment_status: string; refund_reference: string | null; review_reason: string | null }>(
    "SELECT payment_status,refund_reference,review_reason FROM orders WHERE id=$1",
    [id],
  ))[0];
const stock = async (id: string) =>
  (await query<{ stock: number }>("SELECT (data->>'stock')::int AS stock FROM records WHERE id=$1", [id]))[0].stock;
const rejects = async (fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
    return false;
  } catch (e) {
    return e instanceof ResolutionError && pattern.test(e.message);
  }
};

try {
  await query("UPDATE orders SET payment_status='settled_for_test' WHERE payment_status='pending'");
  const s = await store();

  const stuck = await order(s, "pending", MAX_AUTOMATIC_CHECKS - 2);
  await reconcileOrders(paystack(stuck.reference, "ongoing"), 1);
  check((await state(stuck.id)).payment_status === "pending", "inconclusive checks keep retrying below the cap");
  await query("UPDATE orders SET reconcile_after='1970-01-01' WHERE id=$1", [stuck.id]);
  const r = await reconcileOrders(paystack(stuck.reference, "ongoing"), 1);
  const esc = await state(stuck.id);
  check(r.escalated === 1 && esc.payment_status === "verification_required", "reaching the cap escalates to a person");
  check(esc.review_reason === "Payment not terminal; stock remains reserved", "escalation records the reason");
  check(
    (await query("SELECT id FROM email_outbox WHERE site_id=$1 AND subject='Order payment needs your review'", [s.site])).length === 1,
    "store owner is emailed once",
  );
  await query("UPDATE orders SET reconcile_after='1970-01-01' WHERE id=$1", [stuck.id]);
  const again = await reconcileOrders(paystack(stuck.reference, "success"), 1);
  check(again.confirmed === 0 && (await state(stuck.id)).payment_status === "verification_required", "escalated orders leave the automatic queue");

  check(
    await rejects(() => resolveOrderPayment(s.site, stuck.id, owner.id, { action: "release", note: "Customer says they did not pay" }, paystack(stuck.reference, "ongoing")), /only be released/),
    "stock is not released while payment is still in progress",
  );
  check(
    await rejects(() => resolveOrderPayment(s.site, stuck.id, owner.id, { action: "release", note: "Customer says they did not pay" }, outage), /only be released/),
    "stock is not released when the provider cannot be reached",
  );
  const checked = await resolveOrderPayment(s.site, stuck.id, owner.id, { action: "verify" }, outage);
  check(checked.outcome === "unavailable" && (await state(stuck.id)).payment_status === "verification_required", "a failed manual check changes nothing");
  const before = await stock(s.product);
  await resolveOrderPayment(s.site, stuck.id, owner.id, { action: "release", note: "Provider shows no such transaction" }, notFound);
  check((await state(stuck.id)).payment_status === "cancelled" && (await stock(s.product)) === before + 1, "provider-confirmed non-payment releases the stock");
  check(
    (await query("SELECT note FROM order_events WHERE order_id=$1 AND event='reservation.released_by_staff'", [stuck.id]))[0]?.note === "Provider shows no such transaction",
    "release is recorded with the staff reason",
  );

  const recovered = await order(s, "verification_required");
  const res = await resolveOrderPayment(s.site, recovered.id, owner.id, { action: "verify" }, paystack(recovered.reference, "success"));
  check(res.outcome === "paid" && (await state(recovered.id)).payment_status === "paid", "a manual check can confirm a real payment");

  const other = await store();
  check(
    await rejects(() => resolveOrderPayment(other.site, recovered.id, owner.id, { action: "verify" }), /not found/),
    "another store cannot act on this order",
  );

  const late = await order(s, "review_required");
  const lateStock = await stock(s.product);
  await resolveOrderPayment(s.site, late.id, owner.id, { action: "fulfil" });
  check((await state(late.id)).payment_status === "paid" && (await stock(s.product)) === lateStock - 1, "a late payment can be fulfilled by re-reserving stock");

  await query("UPDATE records SET data=jsonb_set(data,'{stock}','0') WHERE id=$1", [s.product]);
  const soldOut = await order(s, "review_required");
  check(
    await rejects(() => resolveOrderPayment(s.site, soldOut.id, owner.id, { action: "fulfil" }), /Not enough stock/),
    "fulfilment is refused when stock is gone",
  );
  check((await state(soldOut.id)).payment_status === "review_required" && (await stock(s.product)) === 0, "a refused fulfilment changes nothing");
  await resolveOrderPayment(s.site, soldOut.id, owner.id, {
    action: "refunded",
    refundReference: "RFND-12345",
    note: "Refunded in full through Paystack",
  });
  const refunded = await state(soldOut.id);
  check(refunded.payment_status === "refunded" && refunded.refund_reference === "RFND-12345", "a refund is recorded with its reference");
  check(
    await rejects(() => resolveOrderPayment(s.site, soldOut.id, owner.id, { action: "fulfil" }), /Only late payments/),
    "a resolved order cannot be resolved twice",
  );
  console.log(`${passes} payment review checks passed`);
} finally {
  await pool.end();
}
