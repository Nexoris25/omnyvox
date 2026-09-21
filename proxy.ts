import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
export async function proxy(req: NextRequest) {
  const incoming = new Headers(req.headers);
  incoming.delete("x-omnyvox-host");
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  const platform = process.env.PLATFORM_DOMAIN || "localhost";
  if (
    host === platform ||
    host === `www.${platform}` ||
    host === "localhost" ||
    host === "127.0.0.1"
  )
    return NextResponse.next({ request: { headers: incoming } });
  let slug: string | undefined;
  if (host === `app.${platform}` || host === `admin.${platform}`) {
    const target = req.nextUrl.clone();
    if (target.pathname === "/")
      target.pathname = host.startsWith("admin.") ? "/admin" : "/dashboard";
    return NextResponse.rewrite(target, { request: { headers: incoming } });
  }
  if (
    host.endsWith(`.${platform}`) &&
    host.split(".").length === platform.split(".").length + 1
  )
    slug = host.slice(0, -platform.length - 1);
  else {
    const [domain] = await query<{ slug: string }>(
      "SELECT s.slug FROM domains d JOIN sites s ON s.id=d.site_id WHERE d.hostname=$1 AND d.verified_at IS NOT NULL AND d.active=true AND s.tier<>$2",
      [host, "basic"],
    );
    slug = domain?.slug;
  }
  if (!slug) return new NextResponse("Website unavailable", { status: 404 });
  incoming.set("x-omnyvox-host", host);
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith("/api/"))
    return NextResponse.next({ request: { headers: incoming } });
  url.pathname = `/sites/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url, { request: { headers: incoming } });
}
export const config = {
  matcher: [
    "/((?!_next|brand-icon.webp|wordmark.webp|social.webp|favicon.ico).*)",
  ],
};
