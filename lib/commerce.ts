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
function decrypt(secret: string) {
  const [iv, tag, bytes] = secret.split(":");
  const cipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "hex"));
  cipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([
    cipher.update(Buffer.from(bytes, "hex")),
    cipher.final(),
  ]).toString("utf8");
}
export async function checkout(input: unknown) {
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
    "SELECT m.secret,m.delivery FROM merchant_accounts m JOIN sites s ON s.id=m.site_id WHERE m.site_id=$1 AND m.verified=true AND s.status='published' AND s.subscription='active' AND s.paid_until>now() AND s.category='commerce'",
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
        "UPDATE records SET data=jsonb_set(data,'{stock}',to_jsonb($1::int)) WHERE id=$2",
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
    const r = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
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
    });
    const response = await r.json();
    if (!r.ok || !response.status)
      throw new Error("The payment provider could not start this payment.");
    return { url: response.data.authorization_url, reference };
  } catch (e) {
    await cancelUnpaidOrder(b.site, reference);
    throw e;
  }
}
export async function cancelUnpaidOrder(site: string, reference: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [order],
    } = await client.query(
      "SELECT * FROM orders WHERE site_id=$1 AND reference=$2 AND payment_status='pending' FOR UPDATE",
      [site, reference],
    );
    if (order) {
      for (const item of order.items)
        await client.query(
          "UPDATE records SET data=jsonb_set(data,'{stock}',to_jsonb((data->>'stock')::int+$1::int)) WHERE id=$2 AND site_id=$3",
          [item.quantity, item.id, site],
        );
      await client.query(
        "UPDATE orders SET payment_status='cancelled' WHERE reference=$1",
        [reference],
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [order],
    } = await client.query(
      "SELECT * FROM orders WHERE reference=$1 AND site_id=$2 FOR UPDATE",
      [event.data.reference, site],
    );
    if (
      !order ||
      order.amount !== event.data.amount ||
      order.currency !== event.data.currency ||
      event.data.status !== "success"
    )
      throw new Error("Payment mismatch");
    if (order.payment_status === "pending")
      await client.query(
        "UPDATE orders SET payment_status='paid' WHERE reference=$1",
        [order.reference],
      );
    else if (order.payment_status === "cancelled")
      await client.query(
        "UPDATE orders SET payment_status='review_required' WHERE reference=$1",
        [order.reference],
      );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
