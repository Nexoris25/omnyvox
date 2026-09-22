import test from "node:test";
import assert from "node:assert/strict";
import { safeHtml } from "../lib/content";
import { contentSchema } from "../lib/cms-schema";
import { passwordSchema } from "../lib/password";
test("Rich content removes scripts, event handlers, unsafe links and remote images", () => {
  const html = safeHtml(
    '<p onclick="alert(1)">Hello</p><script>alert(2)</script><a href="javascript:alert(3)">bad</a><img src="https://evil.test/a.png"><img src="/api/media/12345678-1234-1234-1234-123456789abc" onerror="alert(4)">',
  );
  assert.ok(!/script|onclick|onerror|evil\.test/.test(html));
  assert.ok(html.includes("/api/media/"));
});
test("Rich content preserves lists, table structure and useful formatting", () => {
  const html = safeHtml(
    "<h2>Heading</h2><ul><li><strong>Item</strong></li></ul><table><tbody><tr><td>Cell</td></tr></tbody></table>",
  );
  assert.ok(html.includes("<strong>Item</strong>"));
  assert.ok(html.includes("<td>Cell</td>"));
});
test("Pages enforce the 15 section limit", () => {
  const section = { id: "x", type: "text", title: "Test", body: "" };
  assert.ok(
    contentSchema.safeParse({
      title: "Test",
      slug: "test",
      sections: Array(15).fill(section),
    }).success,
  );
  assert.equal(
    contentSchema.safeParse({
      title: "Test",
      slug: "test",
      sections: Array(16).fill(section),
    }).success,
    false,
  );
});
test("Password policy requires length, uppercase, number and symbol", () => {
  assert.ok(passwordSchema.safeParse("Secure1!").success);
  for (const p of ["Short1!", "lowercase1!", "NoNumbers!", "NoSymbol12"])
    assert.equal(passwordSchema.safeParse(p).success, false);
});
