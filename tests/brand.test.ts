import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { industryKits } from "../lib/industry-kits";
import { photoIndustries, starterImage, webpSource } from "../lib/brand-assets";
import { palettes, contrast, foreground } from "../lib/theme";
import { imagePath, isSampleImage } from "../lib/model";

test("Every starter image exists as WebP and remains marked as sample", async () => {
  for (const kit of Object.values(industryKits))
    for (const section of kit.sections) {
      const images = [
        section.image,
        ...(section.items || []).map((i) => i.image),
      ].filter(Boolean) as string[];
      for (const src of images) {
        assert.ok(src.endsWith(".webp"));
        assert.ok(isSampleImage(src));
        assert.ok(imagePath.safeParse(src).success);
        assert.ok((await stat("public" + src)).size > 0);
      }
    }
});
test("Original photos are distinct, compressed WebP with smaller mobile variants", async () => {
  const assets = JSON.parse(
    await readFile("docs/brand-assets.json", "utf8"),
  ) as { url: string }[];
  const hashes = new Set<string>();
  for (const { url } of assets) {
    const bytes = await readFile("public" + url);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 1440);
    assert.ok(bytes.length < 250000, url);
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.ok(!hashes.has(hash), "Photograph reused: " + url);
    hashes.add(hash);
    const small = await readFile(
      "public" + url.replace(".webp", "-small.webp"),
    );
    assert.equal((await sharp(small).metadata()).width, 640);
    assert.ok(small.length < bytes.length);
  }
  assert.equal(hashes.size, 18);
});
test("Template hero and About images never share the same photograph", () => {
  for (const industry of photoIndustries)
    assert.notEqual(
      starterImage(industry, "hero"),
      starterImage(industry, "about"),
    );
  assert.equal(
    webpSource("/samples/legal-hero.svg"),
    "/samples/legal-hero-photo.webp",
  );
  assert.equal(webpSource("/api/media/123"), "/api/media/123");
});
test("Brand presets have readable text and automatically selected button labels", () => {
  for (const p of palettes) {
    assert.ok(contrast(p.text, p.background) >= 4.5);
    assert.ok(contrast(p.primary, foreground(p.primary)) >= 4.5);
  }
  assert.ok(contrast("#FFFFFF", "#540CDA") >= 4.5);
  assert.ok(contrast("#d2c8df", "#171329") >= 4.5);
});
