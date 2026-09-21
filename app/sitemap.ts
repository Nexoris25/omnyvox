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
  const sites = await query<Site>(
    "SELECT * FROM sites WHERE status='published' AND subscription='active' AND paid_until>now()",
  );
  for (const site of sites) {
    const url = await siteBase(site);
    result.push({ url });
    for (const r of await publicContent(site))
      result.push({
        url: url + contentPath(r, site.published?.brand.categoryUrls || false),
        lastModified: r.data.updatedAt || r.created_at,
      });
  }
  return result;
}
