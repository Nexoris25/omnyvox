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
import {
  fulfilmentChoiceSchema,
  fulfilmentSettingsSchema,
  lineKey,
  MAX_LINE_QUANTITY,
  resolveFulfilment,
  resolveLine,
  type FulfilmentSettings,
  type StoreProduct,
} from "./store";
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
type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> };
export type OrderLine = { id: string; variant?: string; quantity: number };

/** Locks a product and moves stock by `delta` for the product or one of its
 * variants. Returns ok: false (and changes nothing) when stock would go
 * negative, or the product or variant no longer exists. */
export async function adjustStock(
  client: Queryable,
  site: string,
  line: OrderLine,
  delta: number,
): Promise<{ ok: boolean; title: string }> {
  const {
    rows: [p],
  } = await client.query(
    "SELECT id,data FROM records WHERE id=$1 AND site_id=$2 AND kind='products' FOR UPDATE",
    [line.id, site],
  );
  if (!p) return { ok: false, title: "an item" };
  const title = p.data.title || "an item";
  const variants: { id: string; stock: number }[] = p.data.variants || [];
  if (variants.length || line.variant) {
    const index = variants.findIndex((v) => v.id === line.variant);
    if (index < 0) return { ok: false, title };
    const next = (variants[index].stock || 0) + delta;
    if (next < 0) return { ok: false, title };
    await client.query(
      "UPDATE records SET data=jsonb_set(data,ARRAY['variants',$1::text,'stock'],to_jsonb($2::int))||jsonb_build_object('revision',COALESCE((data->>'revision')::int,0)+1) WHERE id=$3",
      [index, next, line.id],
    );
    return { ok: true, title };
  }
  const next = (Number(p.data.stock) || 0) + delta;
  if (next < 0) return { ok: false, title };
  await client.query(
    "UPDATE records SET data=jsonb_set(data,'{stock}',to_jsonb($1::int))||jsonb_build_object('revision',COALESCE((data->>'revision')::int,0)+1) WHERE id=$2",
    [next, line.id],
  );
  return { ok: true, title };
}
/** Consistent lock order across checkout, release and fulfilment. */
export const lineOrder = (a: OrderLine, b: OrderLine) =>
  lineKey(a.id, a.variant).localeCompare(lineKey(b.id, b.variant));

export async function storeFulfilment(site: string) {
  const [row] = await query<{ settings: FulfilmentSettings }>(
    "SELECT settings FROM store_fulfilment WHERE site_id=$1",
    [site],
  );
  return row ? fulfilmentSettingsSchema.parse(row.settings) : null;
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
      address: z.string().max(500).optional(),
      note: z.string().max(500).optional(),
      consent: z.literal(true, {
        error: "Please accept the store's terms, refund policy and privacy policy.",
      }),
      fulfilment: fulfilmentChoiceSchema.optional(),
      items: z
        .array(
          z.object({
            id: z.uuid(),
            variant: z.string().regex(/^[a-z0-9]{4,16}$/).optional(),
            quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
          }),
        )
        .min(1)
        .max(50),
    })
    .parse(input);
  if (new Set(b.items.map((i) => lineKey(i.id, i.variant))).size !== b.items.length)
    throw new Error("Duplicate cart items are not allowed.");
  const [merchant] = await query<{ secret: string; delivery: number }>(
    "SELECT m.secret,m.delivery FROM merchant_accounts m JOIN effective_sites s ON s.id=m.site_id WHERE m.site_id=$1 AND m.verified=true AND s.status='published' AND s.subscription='active' AND s.service_until>now() AND s.category='commerce'",
    [b.site],
  );
  if (!merchant)
    throw new Error("This store is not accepting online payments yet.");
  // The fee always comes from the store's settings, never from the browser.
  const fulfilment = resolveFulfilment(
    await storeFulfilment(b.site),
    merchant.delivery,
    b.fulfilment,
  );
  const address = b.address?.trim() || "";
  if (fulfilment.method === "delivery" && address.length < 5)
    throw new Error("Enter a delivery address.");
  const secret = decrypt(merchant.secret);
  const client = await pool.connect();
  const reference = `store_${randomUUID()}`;
  let subtotal = 0;
  const items: {
    id: string;
    variant?: string;
    label?: string;
    sku?: string;
    quantity: number;
    price: number;
    title: string;
  }[] = [];
  try {
    await client.query("BEGIN");
    for (const item of [...b.items].sort(lineOrder)) {
      const {
        rows: [p],
      } = await client.query(
        "SELECT id,data FROM records WHERE id=$1 AND site_id=$2 AND kind='products' AND data->>'status'='published' FOR UPDATE",
        [item.id, b.site],
      );
      const line = p && resolveLine(p as StoreProduct, item.variant);
      if (!line || line.stock < item.quantity)
        throw new Error(
          "One of the products no longer has enough stock. Please update your cart.",
        );
      if (!Number.isSafeInteger(line.price) || line.price < 0)
        throw new Error("Invalid product price.");
      subtotal += line.price * item.quantity;
      items.push({
        id: item.id,
        ...(item.variant ? { variant: item.variant, label: line.label } : {}),
        ...(line.sku ? { sku: line.sku } : {}),
        quantity: item.quantity,
        price: line.price,
        title: p.data.title,
      });
      const moved = await adjustStock(client, b.site, item, -item.quantity);
      if (!moved.ok)
        throw new Error(
          "One of the products no longer has enough stock. Please update your cart.",
        );
    }
    const total = subtotal + fulfilment.fee;
    if (!Number.isSafeInteger(total) || total < 100)
      throw new Error("The order total must be at least NGN 1.");
    await client.query(
      "INSERT INTO orders(site_id,reference,customer,items,amount,subtotal,delivery_fee,fulfilment) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        b.site,
        reference,
        JSON.stringify({
          name: b.name,
          email: b.email,
          phone: b.phone,
          address: fulfilment.method === "delivery" ? address : "",
          ...(b.note?.trim() ? { note: b.note.trim() } : {}),
          consentedAt: new Date().toISOString(),
        }),
        JSON.stringify(items),
        total,
        subtotal,
        fulfilment.fee,
        JSON.stringify(fulfilment),
      ],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  const amount = subtotal + fulfilment.fee;
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
      for (const item of [...order.items].sort(lineOrder))
        await adjustStock(client, site, item, item.quantity);
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
