import { cache } from "react";
import { headers } from "next/headers";
import { query } from "./db";
import { user } from "./auth";
import { Site, articlePath, entitled } from "./model";
import { industryFor, collectionKinds } from "./industry";
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
    sections?: import("./model").Section[];
    indexing?: { index: boolean; follow: boolean };
    imageAlt?: string;
    seoTitle?: string;
    description?: string;
    socialImage?: string;
    details?: { label: string; value: string }[];
    policyType?: string;
    authorId?: string;
    role?: string;
    links?: { website?: string; linkedin?: string; x?: string };
  };
};
export const getSite = cache(async (slug: string, preview = false) => {
  const [site] = await query<Site>(
    "SELECT * FROM effective_sites WHERE slug=$1",
    [slug],
  );
  if (!site) return null;
  if (preview) {
    const u = await user();
    if (!u || site.owner_id !== u.id) return null;
    return { ...site, view: site.data };
  }
  if (
    site.status !== "published" ||
    site.subscription !== "active" ||
    !site.service_until ||
    new Date(site.service_until) <= new Date() ||
    !site.published
  )
    return null;
  return { ...site, view: site.published };
});
export async function publicContent(site: Site, preview = false) {
  const industry = await industryFor(site);
  return query<Content>(
    "SELECT * FROM records WHERE site_id=$1 AND (data->>'status'='published' OR ($3::boolean AND data->>'status'<>'archived')) AND kind=ANY($2)",
    [
      site.id,
      [
        "pages",
        "legal",
        ...(site.category === "commerce" ? ["products"] : []),
        ...(site.category === "commerce" || entitled(site.tier, "blog")
          ? ["categories"]
          : []),
        ...(entitled(site.tier, "blog") ? ["articles", "authors"] : []),
        ...Object.keys(industry?.collections || {}),
      ],
      preview,
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
  if (
    collectionKinds.includes(record.kind) ||
    ["authors", "categories"].includes(record.kind)
  )
    return `/${record.kind}/${record.data.slug}`;
  return record.kind === "articles"
    ? articlePath(record.data.slug, record.data.category, categoryUrls)
    : record.kind === "products"
      ? `/shop/${record.data.slug}`
      : `/${record.data.slug}`;
}
