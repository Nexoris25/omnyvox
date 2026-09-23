import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { pool, query } from "./db";
function key() {
  const value = process.env.ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value))
    throw new Error("Payment credential encryption is not configured.");
  return Buffer.from(value, "hex");
}
export function encrypt(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const bytes = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${bytes.toString("hex")}`;
}
export function decrypt(secret: string) {
  const [iv, tag, bytes] = secret.split(":");
  const cipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "hex"));
  cipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([
    cipher.update(Buffer.from(bytes, "hex")),
    cipher.final(),
  ]).toString("utf8");
}
export async function checkout(
  input: unknown,
  transport: typeof fetch = fetch,
) {
  const b = z
    .object({
      site: z.uuid(),
      email: z.email(),
      name: z.string().min(2).max(100),
      phone: z.string().min(7).max(30),
      address: z.string().min(5).max(500),
      items: z
        .array(
          z.object({ id: z.uuid(), quantity: z.number().int().min(1).max(50) }),
        )
        .min(1)
        .max(50),
    })
    .parse(input);
  if (new Set(b.items.map((i) => i.id)).size !== b.items.length)
    throw new Error("Duplicate cart items are not allowed.");
  const [merchant] = await query<{ secret: string; delivery: number }>(
    "SELECT m.secret,m.delivery FROM merchant_accounts m JOIN effective_sites s ON s.id=m.site_id WHERE m.site_id=$1 AND m.verified=true AND s.status='published' AND s.subscription='active' AND s.service_until>now() AND s.category='commerce'",
    [b.site],
  );
  if (!merchant)
    throw new Error("This store is not accepting online payments yet.");
  const secret = decrypt(merchant.secret);
  const client = await pool.connect();
  const reference = `store_${randomUUID()}`;
  let amount = merchant.delivery;
  const items: {
    id: string;
    quantity: number;
    price: number;
    title: string;
  }[] = [];
  try {
    await client.query("BEGIN");
    for (const item of [...b.items].sort((a, b) => a.id.localeCompare(b.id))) {
      const {
        rows: [p],
      } = await client.query(
        "SELECT * FROM records WHERE id=$1 AND site_id=$2 AND kind='products' AND data->>'status'='published' FOR UPDATE",
        [item.id, b.site],
      );
      if (!p || p.data.stock < item.quantity)
        throw new Error(
          "One of the products no longer has enough stock. Please update your cart.",
        );
      if (!Number.isSafeInteger(p.data.price) || p.data.price < 0)
        throw new Error("Invalid product price.");
      amount += p.data.price * item.quantity;
      items.push({ ...item, price: p.data.price, title: p.data.title });
      await client.query(
        "UPDATE records SET data=jsonb_set(data,'{stock}',to_jsonb($1::int))||jsonb_build_object('revision',COALESCE((data->>'revision')::int,0)+1) WHERE id=$2",
        [p.data.stock - item.quantity, item.id],
      );
    }
    if (!Number.isSafeInteger(amount) || amount < 100)
      throw new Error("The order total must be at least NGN 1.");
    await client.query(
      "INSERT INTO orders(site_id,reference,customer,items,amount) VALUES($1,$2,$3,$4,$5)",
      [
        b.site,
        reference,
        JSON.stringify({
          name: b.name,
          email: b.email,
          phone: b.phone,
          address: b.address,
        }),
        JSON.stringify(items),
        amount,
      ],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  try {
    const r = await transport(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference,
          amount,
          currency: "NGN",
          email: b.email,
          callback_url: `${process.env.APP_URL}/order/${reference}`,
        }),
      },
    );
    const response = await r.json();
    if (r.status >= 400 && r.status < 500 && response.status === false) {
      await cancelUnpaidOrder(b.site, reference);
      throw new Error("The payment provider could not start this payment.");
    }
    if (
      !r.ok ||
      response.status !== true ||
      response.data?.reference !== reference
    )
      throw new Error("Payment initialization needs verification.");
    const destination = new URL(response.data.authorization_url);
    if (
      destination.protocol !== "https:" ||
      destination.hostname !== "checkout.paystack.com" ||
      destination.username ||
      destination.password
    )
      throw new Error("Unexpected payment destination.");
    return { url: response.data.authorization_url, reference };
  } catch {
    await query(
      "UPDATE orders SET reconcile_error='Payment initialization needs verification',reconcile_after=now()+interval '5 minutes' WHERE reference=$1 AND payment_status='pending'",
      [reference],
    );
    throw new Error(
      "Payment could not be opened. Please contact the store with order reference " +
        reference +
        " before trying again.",
    );
  }
}
export async function cancelUnpaidOrder(site: string, reference: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [order],
    } = await client.query(
      "SELECT * FROM orders WHERE site_id=$1 AND reference=$2 AND payment_status IN ('pending','verification_required') FOR UPDATE",
      [site, reference],
    );
    if (order) {
      for (const item of [...order.items].sort((a, b) =>
        a.id.localeCompare(b.id),
      ))
        await client.query(
          "UPDATE records SET data=jsonb_set(data,'{stock}',to_jsonb((data->>'stock')::int+$1::int))||jsonb_build_object('revision',COALESCE((data->>'revision')::int,0)+1) WHERE id=$2 AND site_id=$3",
          [item.quantity, item.id, site],
        );
      await client.query(
        "UPDATE orders SET payment_status='cancelled' WHERE reference=$1",
        [reference],
      );
      await client.query(
        "INSERT INTO order_events(order_id,actor,event) VALUES($1,'system','reservation.released')",
        [order.id],
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
export async function merchantWebhook(
  site: string,
  raw: string,
  signature: string,
) {
  const [merchant] = await query<{ secret: string }>(
    "SELECT secret FROM merchant_accounts WHERE site_id=$1",
    [site],
  );
  if (!merchant) throw new Error("Merchant not found");
  const secret = decrypt(merchant.secret);
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    throw new Error("Invalid signature");
  const event = JSON.parse(raw);
  if (event.event !== "charge.success") return;
  await confirmStorePayment(site, event.data);
}

/** Shared by authenticated webhooks and server-side provider reconciliation. */
export async function confirmStorePayment(
  site: string,
  payment: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
  },
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [order],
    } = await client.query(
      "SELECT * FROM orders WHERE reference=$1 AND site_id=$2 FOR UPDATE",
      [payment.reference, site],
    );
    if (
      !order ||
      order.amount !== payment.amount ||
      order.currency !== payment.currency ||
      payment.status !== "success"
    )
      throw new Error("Payment mismatch");
    if (["pending", "verification_required"].includes(order.payment_status))
      await client.query(
        "UPDATE orders SET payment_status='paid',review_reason=NULL,review_opened_at=NULL WHERE reference=$1",
        [order.reference],
      );
    else if (order.payment_status === "cancelled")
      await client.query(
        "UPDATE orders SET payment_status='review_required',review_reason='Payment received after the stock reservation was released.',review_opened_at=now() WHERE reference=$1",
        [order.reference],
      );
    if (["pending", "verification_required", "cancelled"].includes(order.payment_status))
      await client.query(
        "INSERT INTO order_events(order_id,actor,event) VALUES($1,'provider',$2)",
        [
          order.id,
          order.payment_status !== "cancelled"
            ? "payment.confirmed"
            : "payment.late_review_required",
        ],
      );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
