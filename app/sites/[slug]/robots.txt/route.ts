import { getSite, siteBase } from "@/lib/public-site";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const site = await getSite((await params).slug);
  if (!site)
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain" },
    });
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /*?preview=1\nDisallow: /order/\nSitemap: ${await siteBase(site)}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}
