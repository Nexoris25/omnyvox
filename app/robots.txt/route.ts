import { marketingSettings } from "@/lib/marketing";
export const dynamic = "force-dynamic";
export async function GET() {
  const settings = await marketingSettings();
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /api/\nDisallow: /login\nDisallow: /register\nDisallow: /onboarding\nDisallow: /*?preview=1\nSitemap: ${process.env.APP_URL || "http://localhost:3000"}/sitemap.xml\n${settings.robots || ""}\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}
