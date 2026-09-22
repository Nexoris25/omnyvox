import type { PoolClient } from "pg";
import type { Site, Brand } from "./model";
import { reservedSlugs } from "./industry";
export async function provisionBlueprint(client: PoolClient, site: Site) {
  const {
    rows: [industry],
  } = await client.query("SELECT * FROM industries WHERE id=$1", [
    site.industry_id,
  ]);
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
          body: `[Required: add your verified ${title.toLowerCase()} information before publishing.]`,
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
  for (const [type, title, slug] of [
    ["terms", "Terms of use", "terms"],
    ["privacy", "Privacy policy", "privacy"],
    ["cookies", "Cookie policy", "cookies"],
    ...(site.category === "commerce"
      ? [
          ["refund", "Refund & returns policy", "refund-policy"],
          ["shipping", "Shipping & delivery", "shipping-delivery"],
        ]
      : []),
  ]) {
    await client.query(
      "INSERT INTO records(site_id,kind,data) VALUES($1,'legal',$2)",
      [
        site.id,
        JSON.stringify({
          title,
          slug,
          body: `<h2>Owner review required</h2><p>[Required: describe your actual ${title.toLowerCase()}, contact information, effective date and applicable terms. Review with your legal adviser before publication.]</p>`,
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
