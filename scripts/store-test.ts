import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, query } from "../lib/db";
import { cancelUnpaidOrder, checkout, encrypt } from "../lib/commerce";
import { resolveOrderPayment } from "../lib/payment-recovery";
import {
  deliveryOptions,
  readCart,
  resolveFulfilment,
  resolveLine,
  variantsSchema,
} from "../lib/store";

if (!/\/omnyvox_test(\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Run against the isolated omnyvox_test database only.");
process.env.APP_URL ||= "http://localhost:3010";

let passes = 0;
const check = (v: unknown, label: string) => {
  assert.ok(v, label);
  passes++;
  console.log("PASS", label);
};
const fails = async (fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
    return false;
  } catch (e) {
    return pattern.test((e as Error).message);
  }
};
/** Accepts any payment start and echoes the reference back. */
const paystack = (async (_url: string, init: RequestInit) => {
  const { reference } = JSON.parse(String(init.body));
  return new Response(
    JSON.stringify({
      status: true,
      data: { reference, authorization_url: "https://checkout.paystack.com/qa" },
    }),
    { status: 200 },
  );
}) as unknown as typeof fetch;

const shirt = {
  title: "Adire shirt",
  slug: "adire-shirt",
  status: "published",
  price: 1_500_000,
  stock: 0,
  options: [
    { name: "Size", values: ["M", "L"] },
    { name: "Colour", values: ["Indigo", "Rust"] },
  ],
  variants: [
    { id: "mindigo", options: { Size: "M", Colour: "Indigo" }, sku: "ADR-M-IND", stock: 3 },
    { id: "lindigo", options: { Size: "L", Colour: "Indigo" }, sku: "ADR-L-IND", stock: 1, price: 1_700_000 },
    { id: "mrust", options: { Size: "M", Colour: "Rust" }, sku: "ADR-M-RST", stock: 0 },
    { id: "lrust", options: { Size: "L", Colour: "Rust" }, sku: "ADR-L-RST", stock: 2 },
  ],
};

try {
  // Pure rules shared by browser and server.
  check(variantsSchema.safeParse({ options: shirt.options, variants: shirt.variants }).success, "a valid option set is accepted");
  check(
    !variantsSchema.safeParse({
      options: shirt.options,
      variants: [shirt.variants[0], { ...shirt.variants[1], options: shirt.variants[0].options }],
    }).success,
    "two variants with the same options are rejected",
  );
  check(
    !variantsSchema.safeParse({
      options: shirt.options,
      variants: [shirt.variants[0], { ...shirt.variants[1], sku: "ADR-M-IND" }],
    }).success,
    "duplicate SKUs are rejected",
  );
  check(
    !variantsSchema.safeParse({
      options: shirt.options,
      variants: [{ ...shirt.variants[0], options: { Size: "XXL", Colour: "Indigo" } }],
    }).success,
    "variant values must come from the product options",
  );
  const product = { id: randomUUID(), data: shirt };
  check(resolveLine(product, "lindigo")?.price === 1_700_000 && resolveLine(product, "mindigo")?.price === 1_500_000, "variant price overrides fall back to the product price");
  check(resolveLine(product) === null && resolveLine({ id: "x", data: { title: "Mug", price: 1 } }, "mindigo") === null, "a variant is required exactly when the product has variants");
  const id = randomUUID();
  const cart = readCart(JSON.stringify({ [id]: 2, [`${id}:mindigo`]: 1, "bad:key": 1, [`${id}:BAD!`]: 1 }));
  check(Object.keys(cart).length === 2, "saved carts keep product and variant lines and drop malformed keys");
  check(resolveFulfilment(null, 150000, undefined).fee === 150000, "stores without zones keep their flat delivery fee");
  const settings = {
    pickupOnly: false,
    zones: [
      { id: "mainland", name: "Lagos Mainland", fee: 250000, eta: "1–2 days", areas: "" },
      { id: "island", name: "Lagos Island", fee: 350000, eta: "", areas: "" },
    ],
    pickup: [{ id: "showroom", name: "Showroom", address: "12 Admiralty Way, Lekki", hours: "", instructions: "" }],
  };
  check(resolveFulfilment(settings, 150000, { method: "delivery", zone: "island" }).fee === 350000, "the chosen zone sets the delivery fee");
  check(resolveFulfilment(settings, 150000, { method: "pickup", location: "showroom" }).fee === 0, "pickup is free");
  check(
    await fails(async () => resolveFulfilment(settings, 150000, { method: "delivery" }), /Choose a delivery area/),
    "a store with several zones requires the shopper to choose one",
  );
  check(deliveryOptions({ ...settings, pickupOnly: true }, 150000).zones.length === 0, "pickup-only stores offer no delivery");

  // Database: checkout, stock reservation and release per variant.
  const [owner] = await query<{ id: string }>(
    "INSERT INTO users(name,email,password) VALUES('Store QA',$1,'x') RETURNING id",
    [`store-${randomUUID()}@example.test`],
  );
  const [site] = await query<{ id: string }>(
    "INSERT INTO sites(owner_id,name,slug,category,tier,status,subscription,paid_until,data) VALUES($1,'QA Store',$2,'commerce','basic','published','active',now()+interval '20 days','{}') RETURNING id",
    [owner.id, `store-${randomUUID().slice(0, 8)}`],
  );
  await query("INSERT INTO merchant_accounts(site_id,secret,verified,delivery) VALUES($1,$2,true,150000)", [
    site.id,
    encrypt("sk_test_qa"),
  ]);
  const [row] = await query<{ id: string }>(
    "INSERT INTO records(site_id,kind,data) VALUES($1,'products',$2) RETURNING id",
    [site.id, JSON.stringify(shirt)],
  );
  const [mug] = await query<{ id: string }>(
    "INSERT INTO records(site_id,kind,data) VALUES($1,'products',$2) RETURNING id",
    [site.id, JSON.stringify({ title: "Mug", slug: "mug", status: "published", price: 400_000, stock: 5 })],
  );
  const variantStock = async (variant: string) =>
    (await query<{ stock: number }>(
      "SELECT (v->>'stock')::int AS stock FROM records, jsonb_array_elements(data->'variants') v WHERE id=$1 AND v->>'id'=$2",
      [row.id, variant],
    ))[0].stock;
  const mugStock = async () =>
    (await query<{ stock: number }>("SELECT (data->>'stock')::int AS stock FROM records WHERE id=$1", [mug.id]))[0].stock;
  const customer = { site: site.id, name: "Ada Obi", email: "ada@example.test", phone: "08030000000" };

  const legacy = await checkout(
    { ...customer, address: "4 Allen Avenue, Ikeja", items: [{ id: mug.id, quantity: 2 }] },
    paystack,
  );
  const [legacyOrder] = await query<{ amount: number; subtotal: number; delivery_fee: number }>(
    "SELECT amount,subtotal,delivery_fee FROM orders WHERE reference=$1",
    [legacy.reference],
  );
  check(
    legacyOrder.subtotal === 800_000 && legacyOrder.delivery_fee === 150000 && legacyOrder.amount === 950_000 && (await mugStock()) === 3,
    "existing checkouts keep working with the flat fee and record subtotal and fee separately",
  );

  await query("INSERT INTO store_fulfilment(site_id,settings) VALUES($1,$2)", [site.id, JSON.stringify(settings)]);
  const zoned = await checkout(
    {
      ...customer,
      address: "4 Allen Avenue, Ikeja",
      fulfilment: { method: "delivery", zone: "island" },
      items: [
        { id: row.id, variant: "lindigo", quantity: 1 },
        { id: row.id, variant: "mindigo", quantity: 2 },
      ],
    },
    paystack,
  );
  const [zonedOrder] = await query<{ amount: number; items: { variant: string; label: string; sku: string; price: number }[]; fulfilment: { name: string } }>(
    "SELECT amount,items,fulfilment FROM orders WHERE reference=$1",
    [zoned.reference],
  );
  check(zonedOrder.amount === 1_700_000 + 2 * 1_500_000 + 350000, "the order total uses variant prices and the server's zone fee");
  check(
    zonedOrder.items.some((i) => i.variant === "lindigo" && i.label === "L / Indigo" && i.sku === "ADR-L-IND") &&
      zonedOrder.fulfilment.name === "Lagos Island",
    "orders record the variant, its SKU and the delivery zone",
  );
  check((await variantStock("lindigo")) === 0 && (await variantStock("mindigo")) === 1 && (await variantStock("lrust")) === 2, "only the purchased variants' stock is reserved");

  check(
    await fails(
      () => checkout({ ...customer, address: "4 Allen Avenue", fulfilment: { method: "delivery", zone: "island" }, items: [{ id: row.id, variant: "lindigo", quantity: 1 }] }, paystack),
      /enough stock/,
    ),
    "a sold-out variant cannot be bought",
  );
  check(
    await fails(() => checkout({ ...customer, address: "4 Allen Avenue", fulfilment: { method: "delivery", zone: "island" }, items: [{ id: row.id, quantity: 1 }] }, paystack), /enough stock/),
    "a product with options cannot be bought without choosing one",
  );
  check(
    await fails(
      () => checkout({ ...customer, address: "4 Allen Avenue", fulfilment: { method: "delivery", zone: "moon" }, items: [{ id: mug.id, quantity: 1 }] }, paystack),
      /Choose a delivery area/,
    ),
    "an unknown delivery zone is refused",
  );
  check(
    await fails(
      () => checkout({ ...customer, fulfilment: { method: "delivery", zone: "island" }, items: [{ id: mug.id, quantity: 1 }] }, paystack),
      /delivery address/,
    ),
    "delivery orders need an address",
  );
  const before = await mugStock();
  const pickup = await checkout(
    { ...customer, fulfilment: { method: "pickup", location: "showroom" }, items: [{ id: mug.id, quantity: 1 }] },
    paystack,
  );
  const [pickupOrder] = await query<{ amount: number; delivery_fee: number; customer: { address: string } }>(
    "SELECT amount,delivery_fee,customer FROM orders WHERE reference=$1",
    [pickup.reference],
  );
  check(pickupOrder.amount === 400_000 && pickupOrder.delivery_fee === 0 && pickupOrder.customer.address === "" && (await mugStock()) === before - 1, "pickup orders need no address and pay no delivery fee");

  await cancelUnpaidOrder(site.id, zoned.reference);
  check((await variantStock("lindigo")) === 1 && (await variantStock("mindigo")) === 3, "releasing an unpaid order returns stock to the right variants");

  // A payment that arrives after release is fulfilled from the same variants.
  const [zonedId] = await query<{ id: string }>("SELECT id FROM orders WHERE reference=$1", [zoned.reference]);
  await query("UPDATE orders SET payment_status='review_required' WHERE id=$1", [zonedId.id]);
  await resolveOrderPayment(site.id, zonedId.id, owner.id, { action: "fulfil", note: "Customer paid late; stock still available." });
  check((await variantStock("lindigo")) === 0 && (await variantStock("mindigo")) === 1, "fulfilling a late payment re-reserves the same variants");
  console.log(`${passes} store checks passed`);
} finally {
  await pool.end();
}
