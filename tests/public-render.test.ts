import test from "node:test";
import assert from "node:assert/strict";
import { plainText } from "../lib/content";
import { categoryName } from "../components/site-insights";

// Records written outside the API (imports, older data, fixtures) can lack
// fields the API would default. Public pages must render them, not crash.
test("Insights cards tolerate articles without a category", () => {
  assert.equal(categoryName(undefined, []), "Insights");
  assert.equal(categoryName("", []), "Insights");
  assert.equal(categoryName("tax-advice", []), "Tax advice");
});
test("Plain-text excerpts tolerate a missing body", () => {
  assert.equal(plainText(undefined), "");
  assert.equal(plainText("<p>Hello &amp; welcome</p>"), "Hello & welcome");
});
