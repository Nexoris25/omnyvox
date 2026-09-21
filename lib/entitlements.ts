import { query } from "./db";
import { limits, entitled, Site } from "./model";
export async function siteEntitlements(site: Site) {
  const [plan] = await query<{
    entitlements: {
      pages?: number;
      products?: number;
      articles?: number;
      team?: number;
    } | null;
  }>("SELECT entitlements FROM plans WHERE id=$1", [
    `${site.category}-${site.tier}`,
  ]);
  return {
    limits: { ...limits[site.tier], ...plan?.entitlements },
    blog: entitled(site.tier, "blog"),
    domains: entitled(site.tier, "domains"),
  };
}
