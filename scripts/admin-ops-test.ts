import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID, scryptSync } from "node:crypto";
import { pool, query } from "../lib/db";

if (!/\/omnyvox_test(\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Run against the isolated omnyvox_test database only.");
const base = process.env.TEST_BASE_URL || "http://localhost:3010";

let passes = 0;
const check = (v: unknown, label: string) => {
  assert.ok(v, label);
  passes++;
  console.log("PASS", label);
};
async function account(role = "owner", verified = true, password = "correct horse battery") {
  const salt = randomBytes(16).toString("hex");
  const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  const email = `ops-${randomUUID()}@example.test`;
  const [u] = await query<{ id: string }>(
    "INSERT INTO users(name,email,password,email_verified,role,mfa_secret) VALUES('Ops QA',$1,$2,$3,$4,$5) RETURNING id",
    [email, hash, verified, role, role === "owner" ? null : "qa-test-only"],
  );
  const token = randomBytes(32).toString("hex");
  await query("INSERT INTO sessions(token,user_id,expires,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)", [
    createHash("sha256").update(token).digest("hex"),
    u.id,
  ]);
  return { id: u.id, email, password, cookie: `omnyvox_session=${token}` };
}
async function call(path: string, method = "GET", body?: unknown, cookie?: string) {
  const r = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      Origin: base,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  return { status: r.status, data: await r.json().catch(() => null) };
}
const html = async (path: string) => (await fetch(base + path)).text();

try {
  const admin = await account("super_admin");
  const ops = await account("operations");
  const content = await account("content");
  const owner = await account("owner");

  // Account controls
  check((await call("auth/login", "POST", { email: owner.email, password: owner.password })).status === 200, "An active account can sign in");
  check(
    (await call(`platform-admin/users/${owner.id}`, "PATCH", { action: "disable", reason: "short" }, ops.cookie)).status === 400,
    "Disabling needs a recorded reason",
  );
  check(
    (await call(`platform-admin/users/${owner.id}`, "PATCH", { action: "disable", reason: "Reported for phishing; investigating." }, content.cookie)).status === 403,
    "Content staff cannot disable accounts",
  );
  const disabled = await call(`platform-admin/users/${owner.id}`, "PATCH", { action: "disable", reason: "Reported for phishing; investigating." }, ops.cookie);
  check(disabled.status === 200, "Operations staff can disable sign-in");
  check((await call("onboarding", "GET", undefined, owner.cookie)).status === 401, "A disabled account's existing sessions stop working");
  const blocked = await call("auth/login", "POST", { email: owner.email, password: owner.password });
  check(blocked.status === 403 && /disabled/.test(blocked.data?.error), "A disabled account cannot sign in and is told why");
  check(
    (await call(`platform-admin/users/${ops.id}`, "PATCH", { action: "disable", reason: "Trying to disable myself here." }, ops.cookie)).status === 409,
    "Staff cannot disable their own account",
  );
  check(
    (await call(`platform-admin/users/${admin.id}`, "PATCH", { action: "disable", reason: "Operations trying a super admin." }, ops.cookie)).status === 403,
    "Only a super administrator can disable a super administrator",
  );
  check((await call(`platform-admin/users/${owner.id}`, "PATCH", { action: "enable" }, ops.cookie)).status === 200, "Sign-in can be restored");
  check((await call("auth/login", "POST", { email: owner.email, password: owner.password })).status === 200, "A restored account can sign in again");
  const audit = await query("SELECT action FROM audit WHERE target=$1 AND action IN ('account.disabled','account.enabled')", [owner.id]);
  check(audit.length === 2, "Disabling and restoring are audited");

  const unverified = await account("owner", false);
  await query("DELETE FROM email_outbox WHERE recipient=$1", [unverified.email]);
  check(
    (await call(`platform-admin/users/${unverified.id}`, "PATCH", { action: "resend-verification" }, ops.cookie)).status === 200 &&
      (await query("SELECT id FROM email_outbox WHERE recipient=$1", [unverified.email])).length === 1,
    "Staff can resend a verification code",
  );
  check(
    (await call(`platform-admin/users/${owner.id}`, "PATCH", { action: "resend-verification" }, ops.cookie)).status === 409,
    "Verified accounts need no new code",
  );
  const users = await call("platform-admin/users", "GET", undefined, ops.cookie);
  check(
    users.data.some((u: { id: string; last_sign_in: string | null }) => u.id === owner.id && u.last_sign_in),
    "The accounts list shows the last sign-in",
  );

  // Email delivery monitor
  const [failed] = await query<{ id: string }>(
    "INSERT INTO email_outbox(recipient,subject,body,attempts,last_error) VALUES($1,'Monitor test','SECRET-BODY-123',5,'Provider returned 500') RETURNING id",
    [`mon-${randomUUID()}@example.test`],
  );
  const emails = await call("platform-admin/emails", "GET", undefined, ops.cookie);
  const row = emails.data.find((e: { id: string }) => e.id === failed.id);
  check(row?.status === "failed" && row.last_error === "Provider returned 500", "The email monitor shows failed deliveries and the error");
  check(!JSON.stringify(emails.data).includes("SECRET-BODY-123"), "Email bodies are never exposed to staff");
  const customer = await account("owner");
  check((await call("platform-admin/emails", "GET", undefined, customer.cookie)).status === 403, "Customers cannot see the email monitor");
  check((await call(`platform-admin/emails/${failed.id}`, "PATCH", {}, content.cookie)).status === 403, "Content staff cannot retry deliveries");
  check((await call(`platform-admin/emails/${failed.id}`, "PATCH", {}, ops.cookie)).status === 200, "A failed email can be retried");
  const [reset] = await query<{ attempts: number }>("SELECT attempts FROM email_outbox WHERE id=$1", [failed.id]);
  check(reset.attempts === 0, "Retrying resets the delivery attempts");
  await query("UPDATE email_outbox SET sent_at=now() WHERE id=$1", [failed.id]);
  check((await call(`platform-admin/emails/${failed.id}`, "PATCH", {}, ops.cookie)).status === 409, "Delivered emails cannot be retried");

  // Testimonials need confirmed consent
  const name = `Adaeze ${randomUUID().slice(0, 6)}`;
  const draft = { title: name, slug: `t-${randomUUID().slice(0, 8)}`, body: "<p>Our orders doubled after launch.</p>", role: "Founder, Adaeze Fabrics", status: "published" };
  check((await call("marketing/testimonials", "POST", draft, content.cookie)).status === 400, "A testimonial cannot be published without consent");
  check([200, 201].includes((await call("marketing/testimonials", "POST", { ...draft, consentConfirmed: true }, content.cookie)).status), "Content staff can publish a consented testimonial");
  const home = await html("/");
  check(home.includes(name) && home.includes("Founder, Adaeze Fabrics"), "Consented testimonials appear on the homepage");

  // Homepage templates and pricing
  const { templates } = await import("../lib/templates");
  check(templates.every((t) => home.includes(`/templates/${t.id}`)), "The homepage shows every template");
  check(home.includes("Online stores") && home.includes("Business websites"), "Templates can be filtered by website type");
  const pricing = await html("/pricing");
  check(pricing.includes('href="#compare"') && pricing.includes('id="compare"'), "Pricing links to the feature comparison");
  check(pricing.includes("Before you choose.") && pricing.includes("/legal/refunds"), "Pricing answers billing questions and links the refund policy");
  console.log(`${passes} admin and marketing checks passed`);
} finally {
  await pool.end();
}
