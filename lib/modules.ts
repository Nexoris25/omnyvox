import { canSite } from "./permissions";

/**
 * The dashboard modules a website gets, decided in one place by:
 * - website type: stores get products, orders, delivery and payments;
 *   business websites get their industry collections instead;
 * - plan: Insights, authors and custom domains need Growth or Advanced;
 * - team role: members only see what the API lets them use.
 * Used by the server (/api/sites/:id/modules) and by the dashboard demo.
 */
export type Module = {
  key: string;
  label: string;
  group: "Website" | "Content" | "Store" | "Customers" | "Account";
  state: "enabled" | "upgrade";
  requiredPlan?: string;
};

/** API area each module needs; null means website settings (owner/admin). */
const moduleKind: Record<string, string | null> = {
  editor: null,
  branding: null,
  seo: null,
  templates: null,
  business: "business",
  billing: "billing",
  merchant: "merchant",
  domains: "domains",
};

export function buildModules(
  site: { category: string; tier: string; role?: string },
  collections: Record<string, string> = {},
): Module[] {
  const m = (
    key: string,
    label: string,
    group: Module["group"],
    upgrade = false,
  ): Module => ({
    key,
    label,
    group,
    state: upgrade ? "upgrade" : "enabled",
    ...(upgrade ? { requiredPlan: "growth" } : {}),
  });
  const basic = site.tier === "basic";
  const store = site.category === "commerce";
  const list: Module[] = [
    m("overview", "Overview", "Website"),
    m("websites", "My websites", "Website"),
    m("editor", "Edit homepage", "Website"),
    m("pages", "Pages", "Website"),
    m("branding", "Brand & navigation", "Website"),
    m("media", "Media library", "Website"),
    m("legal", "Legal pages", "Website"),
    m("seo", "SEO settings", "Website"),
    m("templates", "Templates", "Website"),
    m("articles", "Insights", "Content", basic),
    m("authors", "Authors", "Content", basic),
    ...(store
      ? []
      : [
          ...(basic ? [] : [m("categories", "Insight categories", "Content")]),
          ...Object.entries(collections).map(([key, label]) => m(key, label, "Content")),
        ]),
    ...(store
      ? [
          m("products", "Products", "Store"),
          m("categories", "Categories", "Store"),
          m("orders", "Orders", "Store"),
          m("fulfilment", "Delivery & pickup", "Store"),
          m("merchant", "Store payments", "Store"),
        ]
      : []),
    m("enquiries", "Forms & enquiries", "Customers"),
    m("business", "Business information", "Account"),
    m("domains", "Domain", "Account", basic),
    m("billing", "Subscription & billing", "Account"),
  ];
  const role = site.role || "owner";
  if (role === "owner") return list;
  return list.filter((mod) => {
    if (mod.key === "overview" || mod.key === "websites") return true;
    const kind = mod.key in moduleKind ? moduleKind[mod.key] : mod.key;
    return kind === null ? canSite(role, undefined, "PATCH") : canSite(role, kind, "GET");
  });
}

/** What a workspace without a website yet can use. */
export const noSiteModules: Module[] = [
  { key: "overview", label: "Overview", group: "Website", state: "enabled" },
  { key: "websites", label: "My websites", group: "Website", state: "enabled" },
  { key: "templates", label: "Templates", group: "Website", state: "enabled" },
  { key: "billing", label: "Subscription & billing", group: "Account", state: "enabled" },
];
