import { query } from "./db";
export type MarketingRecord = {
  id: string;
  kind: string;
  created_at: string;
  data: {
    title: string;
    slug: string;
    body: string;
    category: string;
    author: string;
    authorId?: string;
    image?: string;
    imageAlt?: string;
    updatedAt?: string;
    indexing?: { index: boolean; follow: boolean };
  };
};
export async function marketingContent(kind?: string) {
  return query<MarketingRecord>(
    "SELECT * FROM marketing_records WHERE data->>'status'='published' AND ($1::text IS NULL OR kind=$1) ORDER BY created_at DESC",
    [kind || null],
  );
}
export async function marketingSettings() {
  const [s] = await query<{
    data: {
      socials?: Record<string, string>;
      index?: boolean;
      follow?: boolean;
      robots?: string;
    };
  }>("SELECT data FROM marketing_settings WHERE id=true");
  return s?.data || {};
}

export async function marketingMetadata(title: string, description: string) {
  const settings = await marketingSettings();
  return {
    // The root layout's "%s | Omnyvox" template would otherwise duplicate the brand.
    title: /omnyvox/i.test(title) ? { absolute: title } : title,
    description,
    robots: {
      index: settings.index !== false,
      follow: settings.follow !== false,
    },
    openGraph: { title, description, images: ["/social.webp"] },
  };
}
