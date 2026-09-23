import { z } from "zod";

/** Shared, database-free store rules used by the server and the browser. */

export const MAX_OPTIONS = 3;
export const MAX_VARIANTS = 50;
export const MAX_LINE_QUANTITY = 50;

const variantId = z.string().regex(/^[a-z0-9]{4,16}$/);
export const productOptionSchema = z.object({
  name: z.string().trim().min(1).max(30),
  values: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
});
export const productVariantSchema = z.object({
  id: variantId,
  /** option name → chosen value, e.g. { Size: "M", Colour: "Blue" } */
  options: z.record(z.string(), z.string()),
  sku: z.string().trim().max(64).default(""),
  /** Kobo. Omit to use the product price. */
  price: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().default(0),
  image: z.string().optional(),
});
export type ProductOption = z.infer<typeof productOptionSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;

export const variantsSchema = z
  .object({
    options: z.array(productOptionSchema).max(MAX_OPTIONS).default([]),
    variants: z.array(productVariantSchema).max(MAX_VARIANTS).default([]),
  })
  .superRefine((v, ctx) => {
    const names = v.options.map((o) => o.name.toLowerCase());
    if (new Set(names).size !== names.length)
      ctx.addIssue({ code: "custom", message: "Option names must be unique." });
    const ids = new Set<string>(),
      combos = new Set<string>(),
      skus = new Set<string>();
    for (const variant of v.variants) {
      if (ids.has(variant.id)) ctx.addIssue({ code: "custom", message: "Duplicate variant." });
      ids.add(variant.id);
      for (const o of v.options)
        if (!o.values.includes(variant.options[o.name] || ""))
          ctx.addIssue({ code: "custom", message: `Each variant needs a valid ${o.name}.` });
      if (Object.keys(variant.options).length !== v.options.length)
        ctx.addIssue({ code: "custom", message: "Variants must match the product options." });
      const combo = v.options.map((o) => variant.options[o.name]).join("|");
      if (combos.has(combo))
        ctx.addIssue({ code: "custom", message: "Two variants have the same options." });
      combos.add(combo);
      if (variant.sku) {
        if (skus.has(variant.sku)) ctx.addIssue({ code: "custom", message: `SKU ${variant.sku} is used twice.` });
        skus.add(variant.sku);
      }
    }
    if (v.variants.length && !v.options.length)
      ctx.addIssue({ code: "custom", message: "Add options before adding variants." });
  });

export type StoreProduct = {
  id: string;
  data: {
    title: string;
    slug?: string;
    price?: number;
    stock?: number;
    sku?: string;
    image?: string;
    imageAlt?: string;
    body?: string;
    category?: string;
    options?: ProductOption[];
    variants?: ProductVariant[];
  };
};

export const variantLabel = (v: ProductVariant, options: ProductOption[] = []) =>
  options.map((o) => v.options[o.name]).filter(Boolean).join(" / ");

/** Price, stock and labels for a product or one of its variants. */
export function resolveLine(product: StoreProduct, variant?: string) {
  const variants = product.data.variants || [];
  if (variants.length) {
    const v = variants.find((x) => x.id === variant);
    if (!v) return null;
    return {
      price: v.price ?? product.data.price ?? 0,
      stock: v.stock,
      sku: v.sku || product.data.sku || "",
      label: variantLabel(v, product.data.options),
      image: v.image || product.data.image,
    };
  }
  if (variant) return null;
  return {
    price: product.data.price ?? 0,
    stock: product.data.stock ?? 0,
    sku: product.data.sku || "",
    label: "",
    image: product.data.image,
  };
}

export const hasVariants = (p: StoreProduct) => !!p.data.variants?.length;
export const totalStock = (p: StoreProduct) =>
  hasVariants(p)
    ? p.data.variants!.reduce((sum, v) => sum + v.stock, 0)
    : (p.data.stock ?? 0);
export function priceRange(p: StoreProduct) {
  if (!hasVariants(p)) return [p.data.price ?? 0, p.data.price ?? 0] as const;
  const prices = p.data.variants!.map((v) => v.price ?? p.data.price ?? 0);
  return [Math.min(...prices), Math.max(...prices)] as const;
}

/** Cart keys are "<productId>" or "<productId>:<variantId>". */
export const lineKey = (product: string, variant?: string) =>
  variant ? `${product}:${variant}` : product;
export function parseLineKey(key: string) {
  const [id, variant] = key.split(":");
  return { id, variant: variant || undefined };
}
const KEY = /^[a-f0-9-]{36}(:[a-z0-9]{4,16})?$/i;

/** Only IDs and quantities are persisted; never prices or customer details. */
export function readCart(raw: string | null): Record<string, number> {
  try {
    const value = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key, quantity]) =>
            KEY.test(key) &&
            Number.isInteger(quantity) &&
            Number(quantity) > 0 &&
            Number(quantity) <= MAX_LINE_QUANTITY,
        )
        .slice(0, 50),
    ) as Record<string, number>;
  } catch {
    return {};
  }
}

/* ---------------- Fulfilment: delivery zones and pickup ---------------- */

export const fulfilmentSettingsSchema = z.object({
  /** Collection only: the store does not deliver at all. */
  pickupOnly: z.boolean().default(false),
  zones: z
    .array(
      z.object({
        id: variantId,
        name: z.string().trim().min(2).max(60),
        fee: z.number().int().nonnegative(),
        eta: z.string().trim().max(60).default(""),
        areas: z.string().trim().max(300).default(""),
      }),
    )
    .max(20)
    .default([]),
  pickup: z
    .array(
      z.object({
        id: variantId,
        name: z.string().trim().min(2).max(60),
        address: z.string().trim().min(5).max(300),
        hours: z.string().trim().max(120).default(""),
        instructions: z.string().trim().max(300).default(""),
      }),
    )
    .max(10)
    .default([]),
}).refine((s) => !s.pickupOnly || s.pickup.length > 0, {
  message: "Add a pickup location before turning off delivery.",
});
export type FulfilmentSettings = z.infer<typeof fulfilmentSettingsSchema>;

export const fulfilmentChoiceSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("delivery"), zone: z.string().optional() }),
  z.object({ method: z.literal("pickup"), location: z.string() }),
]);
export type FulfilmentChoice = z.infer<typeof fulfilmentChoiceSchema>;

/** Options a shopper can choose. Stores without zones keep one flat fee. */
export function deliveryOptions(settings: FulfilmentSettings | null, flatFee: number) {
  const zones = settings?.pickupOnly && settings.pickup.length
    ? []
    : settings?.zones?.length
      ? settings.zones
      : [{ id: "standard", name: "Standard delivery", fee: flatFee, eta: "", areas: "" }];
  return { zones, pickup: settings?.pickup || [] };
}

/** Resolves the shopper's choice to a fee and a description, or throws. */
export function resolveFulfilment(
  settings: FulfilmentSettings | null,
  flatFee: number,
  choice: FulfilmentChoice | undefined,
) {
  const { zones, pickup } = deliveryOptions(settings, flatFee);
  if (choice?.method === "pickup") {
    const location = pickup.find((p) => p.id === choice.location);
    if (!location) throw new Error("Choose an available pickup location.");
    return { method: "pickup" as const, fee: 0, name: location.name, detail: location.address };
  }
  const zone = choice?.zone ? zones.find((z) => z.id === choice.zone) : zones.length === 1 ? zones[0] : undefined;
  if (!zone) throw new Error("Choose a delivery area.");
  return { method: "delivery" as const, fee: zone.fee, name: zone.name, detail: zone.eta };
}
