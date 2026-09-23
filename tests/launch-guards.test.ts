import test from "node:test";
import assert from "node:assert/strict";
import { base32, totp, verifyTotp } from "../lib/totp";
import { readCart } from "../lib/cart";
import { compatibleTemplate } from "../lib/templates";
import { pageReadiness } from "../lib/page-readiness";
import { kitFor } from "../lib/industry-kits";
import type { Site } from "../lib/model";
test("TOTP matches RFC 6238 SHA1 vectors, including timestamps beyond 2038", () => {
  const secret = base32(Buffer.from("12345678901234567890"));
  for (const [time, expected] of [
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ] as const)
    assert.equal(totp(secret, Math.floor(time / 30), 8), expected);
  const code = totp(secret, 100);
  assert.equal(verifyTotp(secret, code, 99, 3000000), 100);
  assert.equal(verifyTotp(secret, code, 100, 3000000), null);
  assert.equal(verifyTotp(secret, code, -1, 3090000), null);
});
test("Cart rejects corrupt storage and invalid or unbounded quantities", () => {
  const id = "12345678-1234-1234-1234-123456789abc";
  assert.deepEqual(readCart("invalid"), {});
  assert.deepEqual(readCart("null"), {});
  for (const n of [-1, 0, 51, 1.5, "2"])
    assert.deepEqual(readCart(JSON.stringify({ [id]: n })), {});
  assert.deepEqual(readCart(JSON.stringify({ [id]: 2, price: 1 })), {
    [id]: 2,
  });
});
test("Templates reject incompatible industries and website types", () => {
  assert.equal(compatibleTemplate("trust", "corporate", "legal"), true);
  assert.equal(compatibleTemplate("trust", "corporate", "healthcare"), false);
  assert.equal(compatibleTemplate("trust", "commerce", "fashion"), false);
});
test("Publishing readiness identifies absent core pages and broken homepage CTAs", () => {
  const kit = kitFor("legal", "corporate");
  const site = {
    category: "corporate",
    tier: "growth",
    data: {
      brand: { categoryUrls: false, navigation: [] },
      sections: [
        { ...kit.sections[0], ctas: [{ label: "Missing", href: "/missing" }] },
      ],
    },
  } as unknown as Site;
  const issues = pageReadiness(
    site,
    ["About", "Contact"],
    [],
    [{ id: "1", kind: "pages", data: { slug: "about", status: "published" } }],
  );
  assert.ok(issues.includes("Publish the required Contact page."));
  assert.ok(issues.some((x) => x.includes("Missing")));
  assert.ok(!issues.some((x) => x.includes("About")));
});
