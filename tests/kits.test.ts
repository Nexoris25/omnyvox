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

/** Industry rows as seeded by migration 003, so link checks use real pages. */
const seeded = [
  ...readFileSync("infrastructure/migrations/003-context-and-forms.sql", "utf8")
    .matchAll(/\('([a-z]+)','[^']+','(corporate|commerce)','[^']*','(\[[^\]]*\])'\)/g),
].map((m) => ({ id: m[1], category: m[2], pages: JSON.parse(m[3]) as string[] }));
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
