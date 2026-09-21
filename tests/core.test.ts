import test from "node:test";
import assert from "node:assert/strict";
import {
  articlePath,
  brandSchema,
  entitled,
  jsonLd,
  siteSchema,
} from "../lib/model";
test("Basic blocks blogs and custom domains while all plans can edit branding", () => {
  assert.equal(entitled("basic", "blog"), false);
  assert.equal(entitled("basic", "domains"), false);
  assert.equal(entitled("basic", "branding"), true);
  assert.equal(entitled("growth", "blog"), true);
  assert.equal(entitled("growth", "domains"), true);
});
test("Category URL policy generates consistent paths", () => {
  assert.equal(articlePath("hello", "news", false), "/insights/hello");
  assert.equal(articlePath("hello", "news", true), "/insights/news/hello");
});
test("JSON-LD cannot break out of its script element", () => {
  assert.ok(
    !jsonLd({ name: "</script><script>alert(1)</script>" }).includes("<"),
  );
});
test("Website identifiers reject reserved names and path traversal", () => {
  for (const slug of ["admin", "../other", "www", "a", "a/b", "hello.world"])
    assert.equal(
      siteSchema.safeParse({
        name: "Test",
        slug,
        category: "corporate",
        tier: "basic",
      }).success,
      false,
    );
});
test("Theme colours and uploaded logo URLs reject injected markup and external resources", () => {
  const brand = {
    name: "Business",
    description: "Hello",
    primary: "#540CDA",
    secondary: "#111111",
    background: "#ffffff",
    text: "#111111",
    font: "sans",
    email: "test@example.com",
    categoryUrls: false,
    logo: "",
  };
  assert.equal(brandSchema.safeParse(brand).success, true);
  assert.equal(
    brandSchema.safeParse({ ...brand, primary: "red; background:url(evil)" })
      .success,
    false,
  );
  assert.equal(
    brandSchema.safeParse({
      ...brand,
      logo: "https://external.example/tracker",
    }).success,
    false,
  );
});
