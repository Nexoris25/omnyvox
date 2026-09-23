import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, query } from "../lib/db";
import { provisionBlueprint } from "../lib/blueprints";
import { kitFor } from "../lib/industry-kits";
import { readiness } from "../lib/readiness";
import { sectionSchema, brandSchema, type Site } from "../lib/model";

if (!/\/omnyvox_test(\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Run against the isolated omnyvox_test database only.");

let passes = 0;
const check = (v: unknown, label: string) => {
  assert.ok(v, label);
  passes++;
  console.log("PASS", label);
};

async function create(industry: string, category: "corporate" | "commerce") {
  const [u] = await query<{ id: string }>(
    "INSERT INTO users(name,email,password) VALUES('QA',$1,'x') RETURNING id",
    [`prov-${randomUUID()}@example.test`],
  );
  const kit = kitFor(industry, category);
  const brand = {
    name: "QA Business",
    description: kit.description,
    ...kit.palette,
    email: "owner@example.test",
    categoryUrls: false,
    logo: "",
    navCta: kit.navCta,
  };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [site],
    } = await client.query<Site>(
      "INSERT INTO sites(owner_id,name,slug,category,tier,data,industry_id) VALUES($1,'QA',$2,$3,'growth',$4,$5) RETURNING *",
      [
        u.id,
        `prov-${industry}-${randomUUID().slice(0, 6)}`,
        category,
        JSON.stringify({
          brand,
          sections: structuredClone(kit.sections),
          template: kit.template,
        }),
        industry,
      ],
    );
    await provisionBlueprint(client, site);
    await client.query("COMMIT");
    const [fresh] = await query<Site>("SELECT * FROM sites WHERE id=$1", [
      site.id,
    ]);
    return fresh;
  } finally {
    client.release();
  }
}

try {
  for (const [industry, category] of [
    ["legal", "corporate"],
    ["healthcare", "corporate"],
    ["fashion", "commerce"],
  ] as const) {
    const site = await create(industry, category);
    check(
      brandSchema.safeParse(site.data.brand).success,
      `${industry}: provisioned brand validates`,
    );
    check(
      site.data.sections.every((s) => sectionSchema.safeParse(s).success),
      `${industry}: homepage sections validate`,
    );
    const nav = site.data.brand.navigation || [];
    check(nav[0]?.href === "/" && nav.length >= 3, `${industry}: navigation built`);
    const pages = await query<{ data: { title: string; sections?: unknown[]; body: string } }>(
      "SELECT data FROM records WHERE site_id=$1 AND kind='pages'",
      [site.id],
    );
    check(
      pages.length > 0 &&
        pages.every(
          (p) => (p.data.sections?.length || 0) > 0 && !/\[Required/.test(p.data.body),
        ),
      `${industry}: every inner page has starter sections`,
    );
    const contact = pages.find((p) => p.data.title === "Contact");
    check(
      (contact?.data.sections as { type: string }[] | undefined)?.[0]?.type ===
        "contact",
      `${industry}: contact page leads with contact details`,
    );
    const legal = await query<{ data: { policyType: string } }>(
      "SELECT data FROM records WHERE site_id=$1 AND kind='legal'",
      [site.id],
    );
    check(
      legal.length === (category === "commerce" ? 5 : 3),
      `${industry}: legal drafts provisioned for the footer`,
    );
    const r = await readiness(site);
    check(
      r.issues.some((i) => i.startsWith("Review the starter content")) &&
        r.issues.some((i) => i.includes("sample images")),
      `${industry}: publishing blocked until starter content and images are replaced`,
    );
  }
  console.log(`${passes} provisioning checks passed`);
} finally {
  await pool.end();
}
