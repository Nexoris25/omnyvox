import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  industryKits,
  pageSections,
  previewSite,
  templatePreviewIndustry,
} from "../lib/industry-kits";
import { templateManifests, templateIds } from "../lib/templates";
import { brandSchema, sectionSchema, isSampleImage } from "../lib/model";
import { contrast, foreground } from "../lib/theme";
import { safeHtml } from "../lib/content";
import { reservedSlugs } from "../lib/industry-routes";
import { legalSetFor, policies } from "../lib/legal-policies";

/** Enabled industries as seeded by the migrations, so link checks use real pages. */
const rows = (file: string) =>
  [
    ...readFileSync(`infrastructure/migrations/${file}`, "utf8").matchAll(
      /\('([a-z]+)','[^']+','(corporate|commerce)','[^']*','(\[[^\]]*\])'\)/g,
    ),
  ].map((m) => ({ id: m[1], category: m[2], pages: JSON.parse(m[3]) as string[] }));
const disabled = new Set(
  [...readFileSync("infrastructure/migrations/006-creative-industry.sql", "utf8")
    .matchAll(/enabled=false WHERE id='([a-z]+)'/g)].map((m) => m[1]),
);
const seeded = [
  ...rows("003-context-and-forms.sql"),
  ...rows("006-creative-industry.sql"),
].filter((i) => !disabled.has(i.id));
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

test("every seeded industry has a kit", () => {
  assert.equal(seeded.length, 19);
  for (const i of seeded) assert.ok(industryKits[i.id], i.id);
});

test("kit templates match the industry's website type", () => {
  for (const i of seeded)
    assert.equal(
      templateManifests[industryKits[i.id].template].category,
      i.category,
      i.id,
    );
});

test("kit palettes meet WCAG contrast for text, buttons and controls", () => {
  for (const [id, { palette: p }] of Object.entries(industryKits)) {
    assert.ok(contrast(p.text, p.background) >= 4.5, `${id} text`);
    assert.ok(contrast(p.primary, foreground(p.primary)) >= 4.5, `${id} button`);
    assert.ok(contrast(p.primary, p.background) >= 3, `${id} control`);
    assert.ok(
      contrast(p.secondary, foreground(p.secondary)) >= 4.5,
      `${id} CTA band`,
    );
  }
});

test("kit sections validate, are flagged sample and use bundled artwork", () => {
  for (const [id, kit] of Object.entries(industryKits)) {
    assert.ok(kit.sections.length >= 8, id);
    for (const s of kit.sections) {
      assert.ok(sectionSchema.safeParse(s).success, `${id}/${s.id}`);
      assert.equal(s.sample, true, `${id}/${s.id}`);
      for (const src of [s.image, ...(s.items || []).map((i) => i.image)])
        if (src) {
          assert.ok(isSampleImage(src), src);
          assert.ok(existsSync("public" + src), `missing ${src}`);
        }
    }
  }
});

test("kit links only point to pages or routes the site will have", () => {
  for (const i of seeded) {
    const kit = industryKits[i.id];
    const routes = new Set([
      "/",
      ...i.pages.map((p) => "/" + slug(p)),
      ...(i.category === "commerce" ? ["/shop"] : []),
      ...[...reservedSlugs].map((r) => "/" + r),
    ]);
    const hrefs = [
      kit.navCta.href,
      ...kit.sections.flatMap((s) => [
        ...(s.ctas || []).map((c) => c.href),
        ...(s.items || []).flatMap((it) => (it.href ? [it.href] : [])),
      ]),
    ];
    for (const href of hrefs)
      assert.ok(routes.has(href), `${i.id}: ${href} has no destination`);
  }
});

test("inner pages get relevant starter sections", () => {
  const kit = industryKits.legal;
  assert.deepEqual(
    pageSections(kit, "Contact").map((s) => s.type),
    ["contact", "faq"],
  );
  assert.equal(pageSections(kit, "Practice Areas")[0].type, "services");
  assert.ok(pageSections(kit, "About").some((s) => s.type === "team"));
  const ids = pageSections(kit, "About").map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("template previews build a valid brand for every template", () => {
  for (const t of templateIds) {
    const industry = templatePreviewIndustry[t];
    const category = templateManifests[t].category as "corporate" | "commerce";
    const p = previewSite(industry, category, { name: "Sample Co" });
    assert.ok(brandSchema.safeParse(p.data.brand).success, t);
    assert.equal(p.data.template, industryKits[industry].template, t);
    assert.ok(p.legal.length >= 3);
  }
});

test("sanitiser keeps bundled sample images and rejects others", () => {
  const html = safeHtml(
    '<img src="/samples/legal-hero.svg" alt="a"><img src="/evil.svg" alt="b">',
  );
  assert.match(html, /samples\/legal-hero\.svg/);
  assert.doesNotMatch(html, /evil/);
});

test("software businesses are no longer offered; creative is", () => {
  assert.ok(!seeded.some((i) => i.id === "technology"));
  assert.ok(seeded.some((i) => i.id === "creative"));
  assert.ok(!("technology" in industryKits));
  assert.equal(templatePreviewIndustry.studio, "creative");
});

test("each industry gets the legal pages its activities require", () => {
  const set = (i: string, c = "corporate", f?: "physical" | "digital" | "services") =>
    legalSetFor(i, c, f);
  for (const i of seeded)
    assert.deepEqual(set(i.id, i.category).slice(0, 3), ["terms", "privacy", "cookies"], i.id);
  assert.ok(set("legal").includes("disclaimer"));
  assert.ok(set("healthcare").includes("medical-disclaimer"));
  assert.ok(set("education").includes("safeguarding"));
  assert.ok(set("community").includes("donations"));
  assert.ok(set("logistics").includes("carriage"));
  assert.ok(set("hospitality").includes("booking"));
  assert.ok(set("property").includes("listing-disclaimer"));
  assert.ok(set("food", "commerce").includes("allergens"));
  assert.ok(set("electronics", "commerce").includes("warranty"));
  assert.deepEqual(set("fashion", "commerce").slice(3), ["refund", "shipping"]);
  assert.ok(set("books", "commerce", "digital").includes("fulfilment"));
  assert.ok(!set("books", "commerce", "digital").includes("shipping"));
  assert.ok(!set("legal").includes("refund"));
});

test("legal drafts are complete, sanitiser-safe and blocked until filled in", () => {
  const slugs = new Set<string>();
  for (const [type, p] of Object.entries(policies)) {
    assert.ok(p.title && p.reason, type);
    assert.ok(!slugs.has(p.slug), `duplicate slug ${p.slug}`);
    slugs.add(p.slug);
    assert.ok(!reservedSlugs.has(p.slug), `${type} slug is reserved`);
    assert.match(p.body, /\[Required:/, `${type} must require owner input`);
    assert.match(p.body, /not legal advice/, `${type} must carry the review notice`);
    assert.match(safeHtml(p.body), /class="callout"/, `${type} callout survives sanitising`);
  }
});
