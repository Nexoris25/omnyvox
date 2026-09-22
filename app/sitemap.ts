import { marketingContent, marketingSettings } from "@/lib/marketing";
import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { Site } from "@/lib/model";
import { publicContent, contentPath, siteBase } from "@/lib/public-site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://localhost:3000";
  const result: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
  ];
  if (!process.env.DATABASE_URL) return result;
  const settings = await marketingSettings();
  if (settings.index === false) result.length = 0;
  else {
    for (const path of ["/pricing", "/templates", "/contact", "/insights"])
      result.push({ url: base + path });
    for (const r of await marketingContent())
      if (
        ["articles", "legal"].includes(r.kind) &&
        r.data.indexing?.index !== false
      )
        result.push({
          url:
            base +
            (r.kind === "articles" ? "/insights/" : "/legal/") +
            r.data.slug,
        });
  }
  const sites = await query<Site>(
    "SELECT * FROM effective_sites WHERE status='published' AND subscription='active' AND service_until>now()",
  );
  for (const site of sites) {
    if (site.published?.brand.robots?.index === false) continue;
    const url = await siteBase(site);
    result.push({ url });
    for (const r of (await publicContent(site)).filter(
      (r) => r.data.indexing?.index !== false,
    ))
      result.push({
        url: url + contentPath(r, site.published?.brand.categoryUrls || false),
        lastModified: r.data.updatedAt || r.created_at,
      });
  }
  return result;
}
