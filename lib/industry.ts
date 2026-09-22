import { query } from "./db";
import type { Site } from "./model";
export type Industry = {
  id: string;
  label: string;
  category: string;
  collections: Record<string, string>;
  core_pages: string[];
};
export const collectionKinds = [
  "offerings",
  "projects",
  "people",
  "properties",
  "facilities",
  "programmes",
  "locations",
];
export async function industryFor(site: Site) {
  const [industry] = await query<Industry>(
    "SELECT * FROM industries WHERE id=$1",
    [site.industry_id || (site.category === "commerce" ? "retail" : "general")],
  );
  return industry;
}
export type Module = {
  key: string;
  label: string;
  state: "enabled" | "upgrade";
  requiredPlan?: string;
};
export async function availableModules(site: Site) {
  const industry = await industryFor(site);
  const common: Module[] = [
    ["overview", "Overview"],
    ["websites", "My websites"],
    ["editor", "Edit website"],
    ["pages", "Pages"],
    ["business", "Business information"],
    ["branding", "Brand & navigation"],
    ["media", "Media library"],
    ["enquiries", "Forms & enquiries"],
    ["legal", "Legal pages"],
    ["seo", "SEO settings"],
    ["templates", "Templates"],
    ["billing", "Subscription & billing"],
  ].map(([key, label]) => ({ key, label, state: "enabled" }));
  for (const key of ["articles", "authors"])
    common.push({
      key,
      label: key === "articles" ? "Blog / Insights" : "Authors",
      state: site.tier === "basic" ? "upgrade" : "enabled",
      requiredPlan: "growth",
    });
  common.push({
    key: "domains",
    label: "Domain",
    state: site.tier === "basic" ? "upgrade" : "enabled",
    requiredPlan: "growth",
  });
  if (site.category === "commerce")
    for (const [key, label] of [
      ["products", "Products"],
      ["categories", "Product categories"],
      ["orders", "Orders"],
      ["merchant", "Store payments"],
    ])
      common.push({ key, label, state: "enabled" });
  else {
    for (const [key, label] of Object.entries(industry?.collections || {}))
      common.push({ key, label, state: "enabled" });
    if (site.tier !== "basic")
      common.push({
        key: "categories",
        label: "Insight categories",
        state: "enabled",
      });
  }
  return {
    siteType: site.category,
    industry: industry?.id,
    plan: site.tier,
    modules: common,
  };
}
export function pageClass(kind: string) {
  return kind === "pages"
    ? "ADDITIONAL_CONTENT"
    : kind === "legal"
      ? "POLICY_SYSTEM"
      : kind === "articles"
        ? "BLOG_SYSTEM"
        : "COLLECTION_SYSTEM";
}
export const reservedSlugs = new Set([
  "shop",
  "cart",
  "checkout",
  "order",
  "account",
  "login",
  "register",
  "insights",
  "authors",
  "api",
  "admin",
  "dashboard",
  "sitemap",
  "robots",
  "offerings",
  "projects",
  "people",
  "properties",
  "facilities",
  "programmes",
  "locations",
]);
