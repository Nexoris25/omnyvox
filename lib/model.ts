import { z } from "zod";
import { contrast } from "./theme";
import { templateIds } from "./templates";
export const tiers = ["basic", "growth", "advanced"] as const;
export type Tier = (typeof tiers)[number];
export const limits = {
  basic: { websites: 1, pages: 5, products: 25, articles: 0, team: 1 },
  growth: { websites: 1, pages: 15, products: 250, articles: 100, team: 3 },
  advanced: {
    websites: 3,
    pages: 100,
    products: 2000,
    articles: 1000,
    team: 10,
  },
};
export function entitled(tier: Tier, feature: string) {
  return feature === "blog" || feature === "domains"
    ? tier !== "basic"
    : feature === "integrations"
      ? tier === "advanced"
      : true;
}
export const safeLink = z
  .string()
  .max(2000)
  .refine(
    (v) => v === "" || /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(v),
    "Use a website URL, email, phone, or relative link",
  );
export const imagePath = z
  .string()
  .regex(/^\/api\/media\/[a-f0-9-]+$/)
  .or(z.literal(""));
export const indexingSchema = z.object({
  index: z.boolean().default(true),
  follow: z.boolean().default(true),
});
export const sectionSchema = z.object({
  id: z.string(),
  type: z.enum(["hero", "text", "services", "cta", "faq", "insights"]),
  title: z.string().max(160),
  body: z.string().max(10000),
  visible: z.boolean().default(true),
  image: imagePath.optional(),
  imageAlt: z.string().max(300).optional(),
  layout: z.enum(["column", "row", "row-reverse", "column-reverse"]).optional(),
  ctas: z
    .array(z.object({ label: z.string().min(1).max(60), href: safeLink }))
    .max(3)
    .optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        answer: z.string().max(5000),
      }),
    )
    .max(30)
    .optional(),
});
export const siteSchema = z.object({
  industry: z
    .string()
    .regex(/^[a-z-]+$/)
    .optional(),
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z][a-z0-9-]{2,48}$/)
    .refine(
      (v) => !["www", "app", "admin", "api", "mail", "omnyvox"].includes(v),
    ),
  category: z.enum(["corporate", "commerce"]),
  tier: z.enum(tiers),
  template: z.enum(templateIds).optional(),
});
export const brandSchema = z
  .object({
    favicon: imagePath.optional(),
    navigation: z
      .array(
        z.object({
          label: z.string().min(1).max(60),
          href: safeLink,
          pageId: z.uuid().or(z.literal("")).optional(),
          footer: z.boolean().default(false),
          children: z
            .array(
              z.object({
                label: z.string().min(1).max(60),
                href: safeLink,
                pageId: z.uuid().or(z.literal("")).optional(),
              }),
            )
            .max(8)
            .optional(),
        }),
      )
      .max(12)
      .optional(),
    name: z.string().min(2).max(100),
    description: z.string().max(300),
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    font: z.enum(["sans", "serif"]),
    email: z.union([z.email(), z.literal("")]),
    notificationEmail: z.union([z.email(), z.literal("")]).optional(),
    categoryUrls: z.boolean(),
    logo: z
      .string()
      .regex(/^\/api\/media\/[a-f0-9-]+$/)
      .or(z.literal(""))
      .default(""),
    businessNature: z
      .enum(["general", "commerce", "services", "healthcare", "education"])
      .optional(),
    socials: z
      .object({
        facebook: safeLink.optional(),
        instagram: safeLink.optional(),
        linkedin: safeLink.optional(),
        x: safeLink.optional(),
        youtube: safeLink.optional(),
        tiktok: safeLink.optional(),
        whatsapp: safeLink.optional(),
      })
      .optional(),
    robots: z
      .object({
        index: z.boolean(),
        follow: z.boolean(),
        rules: z
          .string()
          .max(4000)
          .refine((v) => !/[\u0000-\u0008]/.test(v)),
      })
      .optional(),
  })
  .refine(
    (b) => contrast(b.text, b.background) >= 4.5,
    "Choose text and background colours with at least 4.5:1 contrast.",
  );
export type Brand = z.infer<typeof brandSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Site = {
  industry_id?: string;
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  category: "corporate" | "commerce";
  tier: Tier;
  status: string;
  subscription: string;
  paid_until?: string;
  service_until?: string;
  billing_interval?: string;
  subscription_site_id?: string | null;
  data: { brand: Brand; sections: Section[]; template: string };
  published: Site["data"] | null;
};
export function articlePath(
  slug: string,
  category: string,
  includeCategory: boolean,
) {
  return `/insights/${includeCategory ? `${category}/` : ""}${slug}`;
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
export const initialSections: Section[] = [
  {
    id: "hero",
    type: "hero",
    title: "A better way to do business.",
    body: "Thoughtful solutions. Lasting partnerships. Discover what we can do together.",
    visible: true,
  },
  {
    id: "services",
    type: "services",
    title: "Built around your needs",
    body: "Strategy & consulting\nDesign & development\nSupport & growth",
    visible: true,
  },
  {
    id: "about",
    type: "text",
    title: "Good work starts with good people.",
    body: "Tell your customers what makes your business different. Share your story, your approach, and the people behind the work.",
    visible: true,
  },
  {
    id: "contact",
    type: "cta",
    title: "Let’s build something great.",
    body: "Get in touch to discuss your next project.",
    visible: true,
  },
];
