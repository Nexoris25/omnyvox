import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { pool, query } from "../lib/db";
import { formRecipients, submitEnquiry } from "../lib/forms";
import { readiness } from "../lib/readiness";
import { initialSections, type Site } from "../lib/model";

if (!/\/omnyvox_test(\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Run against the isolated omnyvox_test database only.");

const prefix = "rcpt" + Date.now();
let passes = 0;
function check(value: unknown, label: string) {
  assert.ok(value, label);
  passes++;
  console.log("PASS", label);
}
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function req(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/test", {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function makeSite(tier: "basic" | "growth" | "advanced") {
  const [u] = await query<{ id: string }>(
    "INSERT INTO users(name,email,password) VALUES('QA',$1,'x') RETURNING id",
    [`${prefix}${randomUUID()}@example.test`],
  );
  const [site] = await query<Site>(
    "INSERT INTO sites(owner_id,name,slug,category,tier,status,subscription,paid_until,data) VALUES($1,'QA',$2,'corporate',$3,'published','active',now()+interval '30 days',$4) RETURNING *",
    [
      u.id,
      `${prefix}-${tier}-${randomUUID().slice(0, 6)}`,
      tier,
      JSON.stringify({ brand: {}, sections: initialSections, template: "studio" }),
    ],
  );
  const [form] = await query<{ id: string }>(
    "INSERT INTO site_forms(site_id,active_email,verified_at) VALUES($1,'primary@example.test',now()) RETURNING id",
    [site.id],
  );
  return { site, actor: u.id, formId: form.id };
}
async function addAndVerify(site: Site, actor: string, email: string) {
  const r = await formRecipients(req("POST", { email }), site, actor);
  const b = await r.json();
  if (r.status !== 200) return { status: r.status, body: b };
  // The code is only emailed, so set a known one the way a user would receive it.
  await query(
    "UPDATE form_recipients SET verification_hash=$1 WHERE id=$2",
    [hash(email + ":123456"), b.id],
  );
  const v = await formRecipients(
    req("POST", { id: b.id, code: "123456" }),
    site,
    actor,
    "verify",
  );
  return { status: v.status, id: b.id };
}

try {
  const basic = await makeSite("basic");
  const blocked = await formRecipients(
    req("POST", { email: "extra@example.test" }),
    basic.site,
    basic.actor,
  );
  check(blocked.status === 403, "Basic cannot add additional recipients");
  const listed = await (
    await formRecipients(req("GET"), basic.site, basic.actor)
  ).json();
  check(listed.limit === 0, "Basic reports a zero additional-recipient limit");

  const growth = await makeSite("growth");
  const first = await addAndVerify(growth.site, growth.actor, "sales@example.test");
  check(first.status === 200, "Growth verifies an additional recipient");

  const wrong = await formRecipients(
    req("POST", { email: "support@example.test" }),
    growth.site,
    growth.actor,
  );
  const wrongId = (await wrong.json()).id;
  const bad = await formRecipients(
    req("POST", { id: wrongId, code: "000000" }),
    growth.site,
    growth.actor,
    "verify",
  );
  check(bad.status === 400, "Wrong verification code is rejected");

  const third = await formRecipients(
    req("POST", { email: "third@example.test" }),
    growth.site,
    growth.actor,
  );
  check(third.status === 403, "Growth limit of two additional recipients is enforced");

  const other = await makeSite("growth");
  const cross = await formRecipients(
    req("POST", { id: first.id, code: "123456" }),
    other.site,
    other.actor,
    "verify",
  );
  check(cross.status === 400, "Another tenant cannot verify this site's recipient");
  await formRecipients(req("DELETE"), other.site, other.actor, first.id);
  const [still] = await query("SELECT id FROM form_recipients WHERE id=$1", [
    first.id,
  ]);
  check(still, "Another tenant cannot delete this site's recipient");

  const enquiry = await submitEnquiry(
    req("POST", {
      site: growth.site.id,
      formId: growth.formId,
      name: "Visitor",
      email: `${prefix}@visitor.test`,
      message: "Hello, I would like a quote.",
      website: "",
      consent: "on",
    }),
  );
  check(enquiry.status === 201, "Enquiry is accepted");
  const outbox = await query<{ recipient: string; reply_to: string }>(
    "SELECT recipient,reply_to FROM email_outbox WHERE site_id=$1 AND enquiry_id IS NOT NULL",
    [growth.site.id],
  );
  const recipients = outbox.map((o) => o.recipient).sort();
  check(
    JSON.stringify(recipients) ===
      JSON.stringify(["primary@example.test", "sales@example.test"]),
    "Enquiry goes to the primary and verified additional recipient only",
  );
  check(
    outbox.every((o) => o.reply_to === `${prefix}@visitor.test`),
    "Visitor address is Reply-To, never the sender",
  );

  const removed = await formRecipients(
    req("DELETE"),
    growth.site,
    growth.actor,
    first.id,
  );
  check(removed.status === 200, "Owner can remove an additional recipient");

  const r = await readiness(growth.site);
  check(
    r.issues.some((i) => /instructional template text/.test(i)),
    "Readiness flags unchanged stock sections before publishing",
  );
  console.log(`${passes} recipient checks passed`);
} finally {
  await pool.end();
}
