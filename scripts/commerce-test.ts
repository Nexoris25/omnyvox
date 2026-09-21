import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { pool, query } from "../lib/db";
import { encrypt, merchantWebhook, cancelUnpaidOrder } from "../lib/commerce";
if (!process.env.DATABASE_URL?.includes("55432"))
  throw new Error(
    "Run this test only against the isolated local database on port 55432.",
  );
process.env.ENCRYPTION_KEY = randomBytes(32).toString("hex");
const secret = "sk_test_" + randomBytes(20).toString("hex");
const id = randomUUID();
const reference = "store_" + randomUUID();
try {
  const [site] = await query<{ id: string }>(
    "SELECT id FROM sites WHERE slug LIKE $1 LIMIT 1",
    ["qa%"],
  );
  assert.ok(site);
  await query(
    "INSERT INTO merchant_accounts(site_id,secret,verified) VALUES($1,$2,true) ON CONFLICT(site_id) DO UPDATE SET secret=$2",
    [site.id, encrypt(secret)],
  );
  await query(
    "INSERT INTO orders(id,site_id,reference,customer,items,amount) VALUES($1,$2,$3,'{}','[]',25000)",
    [id, site.id, reference],
  );
  const raw = JSON.stringify({
    event: "charge.success",
    data: { reference, amount: 25000, currency: "NGN", status: "success" },
  });
  const signature = createHmac("sha512", secret).update(raw).digest("hex");
  await assert.rejects(() => merchantWebhook(site.id, raw, "invalid"));
  console.log("PASS forged merchant webhook rejected");
  const wrong = JSON.stringify({
    event: "charge.success",
    data: { reference, amount: 1, currency: "NGN", status: "success" },
  });
  await assert.rejects(() =>
    merchantWebhook(
      site.id,
      wrong,
      createHmac("sha512", secret).update(wrong).digest("hex"),
    ),
  );
  console.log("PASS wrong payment amount rejected");
  await Promise.all([
    merchantWebhook(site.id, raw, signature),
    merchantWebhook(site.id, raw, signature),
  ]);
  const [paid] = await query<{ payment_status: string }>(
    "SELECT payment_status FROM orders WHERE id=$1",
    [id],
  );
  assert.equal(paid.payment_status, "paid");
  console.log("PASS concurrent duplicate webhooks are idempotent");
  await cancelUnpaidOrder(site.id, reference);
  const [stillPaid] = await query<{ payment_status: string }>(
    "SELECT payment_status FROM orders WHERE id=$1",
    [id],
  );
  assert.equal(stillPaid.payment_status, "paid");
  console.log("PASS paid order cannot be cancelled by pending-order cleanup");
  const cancelledReference = "store_" + randomUUID();
  await query(
    "INSERT INTO orders(site_id,reference,customer,items,amount,payment_status) VALUES($1,$2,'{}','[]',25000,'cancelled')",
    [site.id, cancelledReference],
  );
  const late = JSON.stringify({
    event: "charge.success",
    data: {
      reference: cancelledReference,
      amount: 25000,
      currency: "NGN",
      status: "success",
    },
  });
  await merchantWebhook(
    site.id,
    late,
    createHmac("sha512", secret).update(late).digest("hex"),
  );
  const [review] = await query<{ payment_status: string }>(
    "SELECT payment_status FROM orders WHERE reference=$1",
    [cancelledReference],
  );
  assert.equal(review.payment_status, "review_required");
  console.log(
    "PASS late payment requires review rather than unreserved fulfilment",
  );
} finally {
  await pool.end();
}
