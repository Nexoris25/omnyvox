import { articlePath, type Site } from "./model";
type Page = {
  id: string;
  kind: string;
  data: { slug: string; category?: string; status: string; body?: string };
};
export function pageReadiness(
  site: Site,
  corePages: string[],
  collections: string[],
  records: Page[],
) {
  const issues: string[] = [];
  const published = records.filter((r) => r.data.status === "published");
  const routes = new Set([
    "/",
    ...collections.map((k) => `/${k}`),
    ...(site.category === "commerce" ? ["/shop"] : []),
    ...(site.tier !== "basic" ? ["/insights"] : []),
  ]);
  for (const r of published)
    routes.add(
      r.kind === "articles"
        ? articlePath(
            r.data.slug,
            r.data.category || "general",
            site.data.brand.categoryUrls,
          )
        : r.kind === "products"
          ? `/shop/${r.data.slug}`
          : ["pages", "legal"].includes(r.kind)
            ? `/${r.data.slug}`
            : `/${r.kind}/${r.data.slug}`,
    );
  for (const title of corePages) {
    const path = "/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!routes.has(path)) issues.push(`Publish the required ${title} page.`);
  }
  const anchors = new Set(
    site.data.sections
      .filter((s) => s.visible)
      .map((s) =>
        s.type === "services"
          ? "services"
          : s.type === "cta"
            ? "get-started"
            : s.type === "contact"
              ? "contact"
              : s.id,
      ),
  );
  function check(href: string, label: string) {
    if (!href || (!href.startsWith("/") && !href.startsWith("#"))) return;
    const [path, hash] = href.split("?")[0].split("#");
    const normal = path.replace(/\/$/, "") || "/";
    if (!routes.has(normal) || (normal === "/" && hash && !anchors.has(hash)))
      issues.push(`Fix the internal link for ${label}.`);
  }
  for (const link of (site.data.brand.navigation || []).flatMap((n) => [
    n,
    ...(n.children || []),
  ])) {
    if (link.pageId) {
      if (!published.some((p) => p.id === link.pageId))
        issues.push(`Publish the page linked by ${link.label}.`);
    } else check(link.href, link.label);
  }
  if (site.data.brand.navCta)
    check(site.data.brand.navCta.href, site.data.brand.navCta.label);
  for (const section of site.data.sections.filter((s) => s.visible)) {
    for (const cta of section.ctas || []) check(cta.href, cta.label);
    for (const item of section.items || [])
      if (item.href) check(item.href, item.title);
  }
  return [...new Set(issues)];
}
