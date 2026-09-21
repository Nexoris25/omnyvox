import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/api",
        "/login",
        "/register",
        "/*?preview=1",
      ],
    },
    sitemap: `${process.env.APP_URL || "http://localhost:3000"}/sitemap.xml`,
  };
}
