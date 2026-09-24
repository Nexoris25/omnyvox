import { z } from "zod";
import { sectionSchema, indexingSchema, imagePath } from "./model";
import { policyTypes } from "./legal-policies";
import { MAX_OPTIONS, MAX_VARIANTS, productOptionSchema, productVariantSchema } from "./store";
export const contentSchema = z.object({
  revision: z.number().int().nonnegative().default(0),
  details: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        value: z.string().max(500),
      }),
    )
    .max(15)
    .optional(),
  title: z.string().min(2).max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  body: z.string().max(200000).default(""),
  status: z
    .enum(["draft", "published", "scheduled", "archived"])
    .default("draft"),
  publishAt: z.iso.datetime().or(z.literal("")).optional(),
  category: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .default("general"),
  authorId: z.uuid().or(z.literal("")).optional(),
  price: z.number().int().nonnegative().default(0),
  stock: z.number().int().nonnegative().default(0),
  sku: z.string().trim().max(64).optional(),
  options: z.array(productOptionSchema).max(MAX_OPTIONS).optional(),
  variants: z
    .array(productVariantSchema.extend({ image: imagePath.optional() }))
    .max(MAX_VARIANTS)
    .optional(),
  image: imagePath.default(""),
  imageAlt: z.string().max(300).optional(),
  sections: z
    .array(sectionSchema)
    .max(15, "A page can contain at most 15 sections")
    .optional(),
  indexing: indexingSchema.optional(),
  seoTitle: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  socialImage: imagePath.optional(),
  policyType: z.enum(policyTypes).optional(),
  /** Testimonials: confirms the person agreed to be quoted publicly. */
  consentConfirmed: z.boolean().optional(),
  /** Author profiles: job title and professional links. */
  role: z.string().trim().max(100).optional(),
  links: z
    .object({
      website: z.url({ protocol: /^https$/ }).or(z.literal("")).optional(),
      linkedin: z
        .url({ protocol: /^https$/, hostname: /(^|\.)linkedin\.com$/ })
        .or(z.literal(""))
        .optional(),
      x: z
        .url({ protocol: /^https$/, hostname: /(^|\.)(x|twitter)\.com$/ })
        .or(z.literal(""))
        .optional(),
    })
    .optional(),
  policyReviewed: z.boolean().optional(),
});
