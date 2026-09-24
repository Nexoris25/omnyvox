import { query } from "./db";
import type { Site } from "./model";
import { buildModules } from "./modules";
export type Industry = {
  id: string;
  label: string;
  category: string;
  collections: Record<string, string>;
  core_pages: string[];
};
export { collectionKinds, reservedSlugs } from "./industry-routes";
export async function industryFor(site: Site) {
  const [industry] = await query<Industry>(
    "SELECT * FROM industries WHERE id=$1",
    [site.industry_id || (site.category === "commerce" ? "retail" : "general")],
  );
  return industry;
}
export type { Module } from "./modules";
export async function availableModules(site: Site & { member_role?: string }) {
  const industry = await industryFor(site);
  return {
    siteType: site.category,
    industry: industry?.id,
    plan: site.tier,
    modules: buildModules(
      { category: site.category, tier: site.tier, role: site.member_role },
      site.category === "commerce" ? {} : industry?.collections || {},
    ),
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
