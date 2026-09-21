import { z } from "zod";
export const tiers = ["basic", "growth", "advanced"] as const;
export type Tier = (typeof tiers)[number];
export const limits = {
  basic: { pages: 5, products: 25, articles: 0, team: 1 },
  growth: { pages: 15, products: 250, articles: 100, team: 3 },
  advanced: { pages: 100, products: 2000, articles: 1000, team: 10 },
};
export function entitled(tier: Tier, feature: string) {
  return feature === "blog" || feature === "domains"
    ? tier !== "basic"
    : feature === "integrations"
      ? tier === "advanced"
      : true;
}
export const sectionSchema = z.object({
  id: z.string(),
  type: z.enum(["hero", "text", "services", "cta", "faq"]),
  title: z.string().max(160),
  body: z.string().max(10000),
  visible: z.boolean().default(true),
});
export const siteSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z][a-z0-9-]{2,48}$/)
    .refine(
      (v) => !["www", "app", "admin", "api", "mail", "omnyvox"].includes(v),
    ),
  category: z.enum(["corporate", "commerce"]),
  tier: z.enum(tiers),
  template: z.enum(["studio", "atelier", "horizon"]).default("studio"),
});
export const brandSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  font: z.enum(["sans", "serif"]),
  email: z.union([z.email(), z.literal("")]),
  categoryUrls: z.boolean(),
  logo: z
    .string()
    .regex(/^\/api\/media\/[a-f0-9-]+$/)
    .or(z.literal(""))
    .default(""),
});
export type Brand = z.infer<typeof brandSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Site = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  category: "corporate" | "commerce";
  tier: Tier;
  status: string;
  subscription: string;
  paid_until?: string;
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
