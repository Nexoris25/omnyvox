import { cache } from "react";
import { headers } from "next/headers";
import { query } from "./db";
import { user } from "./auth";
import { Site, articlePath, entitled } from "./model";
export type Content = {
  id: string;
  kind: string;
  created_at: string;
  data: {
    title: string;
    slug: string;
    body: string;
    category: string;
    author: string;
    updatedAt: string;
    image?: string;
    price?: number;
    stock?: number;
  };
};
export const getSite = cache(async (slug: string, preview = false) => {
  const [site] = await query<Site>("SELECT * FROM sites WHERE slug=$1", [slug]);
  if (!site) return null;
  if (preview) {
    const u = await user();
    if (!u || site.owner_id !== u.id) return null;
    return { ...site, view: site.data };
  }
  if (
    site.status !== "published" ||
    site.subscription !== "active" ||
    !site.paid_until ||
    new Date(site.paid_until) <= new Date() ||
    !site.published
  )
    return null;
  return { ...site, view: site.published };
});
export async function publicContent(site: Site) {
  return query<Content>(
    "SELECT * FROM records WHERE site_id=$1 AND data->>'status'='published' AND kind=ANY($2)",
    [
      site.id,
      entitled(site.tier, "blog")
        ? ["pages", "articles", "products"]
        : ["pages", "products"],
    ],
  );
}
export async function siteBase(site: Site) {
  const [domain] =
    site.tier !== "basic"
      ? await query<{ hostname: string }>(
          "SELECT hostname FROM domains WHERE site_id=$1 AND active=true AND verified_at IS NOT NULL ORDER BY hostname LIMIT 1",
          [site.id],
        )
      : [];
  if (domain) return `https://${domain.hostname}`;
  const platform = process.env.PLATFORM_DOMAIN;
  if (platform && platform !== "localhost")
    return `https://${site.slug}.${platform}`;
  return `${process.env.APP_URL || "http://localhost:3000"}/sites/${site.slug}`;
}
export function contentPath(record: Content, categoryUrls: boolean) {
  return record.kind === "articles"
    ? articlePath(record.data.slug, record.data.category, categoryUrls)
    : record.kind === "products"
      ? `/shop/${record.data.slug}`
      : `/${record.data.slug}`;
}
