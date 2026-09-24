import type { PoolClient } from "pg";
import { entitled, type Site, type Brand } from "./model";
import { reservedSlugs } from "./industry";
import { kitFor, pageSections } from "./industry-kits";
import { legalSetFor, policies } from "./legal-policies";
export async function provisionBlueprint(client: PoolClient, site: Site) {
  const {
    rows: [industry],
  } = await client.query("SELECT * FROM industries WHERE id=$1", [
    site.industry_id,
  ]);
  const kit = kitFor(site.industry_id, site.category);
  const navigation: NonNullable<Brand["navigation"]> = [
    { label: "Home", href: "/", footer: false },
  ];
  for (const title of industry?.core_pages || ["About", "Contact"]) {
    const slug = String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    if (reservedSlugs.has(slug)) {
      navigation.push({ label: title, href: "/" + slug, footer: false });
      continue;
    }
    const {
      rows: [page],
    } = await client.query(
      "INSERT INTO records(site_id,kind,data) VALUES($1,'pages',$2) RETURNING id",
      [
        site.id,
        JSON.stringify({
          title,
          slug,
          body: "",
          sections: pageSections(kit, title),
          status: "draft",
          category: "general",
          pageClass: "CORE_CONTENT",
        }),
      ],
    );
    navigation.push({
      label: title,
      href: "/" + slug,
      pageId: page.id,
      footer: false,
    });
  }
  const [profile] = (
    await client.query("SELECT data FROM business_profiles WHERE site_id=$1", [
      site.id,
    ])
  ).rows;
  for (const type of legalSetFor(
    site.industry_id,
    site.category,
    profile?.data?.fulfilment,
  )) {
    const policy = policies[type];
    await client.query(
      "INSERT INTO records(site_id,kind,data) VALUES($1,'legal',$2)",
      [
        site.id,
        JSON.stringify({
          title: policy.title,
          slug: policy.slug,
          body: policy.body,
          status: "draft",
          category: "general",
          policyType: type,
          policyReviewed: false,
          pageClass: "POLICY_SYSTEM",
        }),
      ],
    );
  }
  if (site.category === "commerce")
    navigation.splice(1, 0, { label: "Shop", href: "/shop", footer: false });
  if (entitled(site.tier, "blog")) {
    const contact = navigation.findIndex((n) => /contact/i.test(n.label));
    navigation.splice(contact < 0 ? navigation.length : contact, 0, {
      label: "Insights",
      href: "/insights",
      footer: false,
    });
  }
  site.data.brand.navigation = navigation;
  await client.query("UPDATE sites SET data=$1 WHERE id=$2", [
    JSON.stringify(site.data),
    site.id,
  ]);
  await client.query(
    "INSERT INTO site_forms(site_id) VALUES($1) ON CONFLICT DO NOTHING",
    [site.id],
  );
}
