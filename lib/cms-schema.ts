import { z } from "zod";
import { sectionSchema, indexingSchema, imagePath } from "./model";
export const contentSchema = z.object({
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
  policyType: z
    .enum([
      "terms",
      "privacy",
      "cookies",
      "refund",
      "shipping",
      "returns",
      "fulfilment",
      "other",
    ])
    .optional(),
  policyReviewed: z.boolean().optional(),
});
