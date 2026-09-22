import {
  getSite,
  publicContent,
  contentPath,
  siteBase,
} from "@/lib/public-site";
export const dynamic = "force-dynamic";
function xml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
}
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const site = await getSite((await params).slug);
  if (!site) return new Response("Not found", { status: 404 });
  const base = await siteBase(site);
  const records = await publicContent(site);
  const urls =
    site.view.brand.robots?.index === false
      ? []
      : [
          base,
          ...records
            .filter((r) => r.data.indexing?.index !== false)
            .map((r) => base + contentPath(r, site.view.brand.categoryUrls)),
        ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${xml(url)}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
