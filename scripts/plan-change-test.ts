import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, query } from "../lib/db";
import {
  applyScheduledPlanChanges,
  cancelScheduledChange,
  planChangePreview,
  requestPlanChange,
  PlanChangeError,
} from "../lib/plan-change";
import { confirmSubscriptionPayment } from "../lib/subscription-billing";

if (!/\/omnyvox_test(\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Run against the isolated omnyvox_test database only.");

let passes = 0;
const check = (v: unknown, label: string) => {
  assert.ok(v, label);
  passes++;
  console.log("PASS", label);
};
const rejects = async (fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
    return false;
  } catch (e) {
    return e instanceof PlanChangeError && pattern.test(e.message);
  }
};
const prices = { basic: 500_000, growth: 1_500_000, advanced: 4_000_000 };
const originalPlans = await query("SELECT id,monthly,annual FROM plans WHERE category='corporate'");

async function owner() {
  const [u] = await query<{ id: string }>(
    "INSERT INTO users(name,email,password,email_verified) VALUES('Plan QA',$1,'x',true) RETURNING id",
    [`plan-${randomUUID()}@example.test`],
  );
  return u.id;
}
async function site(ownerId: string, tier: string, paid: boolean, root?: string) {
  const [s] = await query<{ id: string }>(
    `INSERT INTO sites(owner_id,name,slug,category,tier,status,subscription,paid_until,billing_interval,data,subscription_site_id)
     VALUES($1,$2,$3,'corporate',$4,'published',$5,$6,'monthly','{"brand":{},"sections":[]}',$7) RETURNING id`,
    [
      ownerId,
      `Site ${randomUUID().slice(0, 4)}`,
      `plan-${randomUUID().slice(0, 8)}`,
      tier,
      paid ? "active" : "pending",
      paid ? new Date(Date.now() + 15 * 86_400_000) : null,
      root || null,
    ],
  );
  return s.id;
}
const tierOf = async (id: string) =>
  (await query<{ tier: string; pending_tier: string | null; status: string; suspended_reason: string | null; paid_until: string }>(
    "SELECT tier,pending_tier,status,suspended_reason,paid_until FROM sites WHERE id=$1",
    [id],
  ))[0];

try {
  for (const [tier, amount] of Object.entries(prices))
    await query("UPDATE plans SET monthly=$2 WHERE id=$1", [`corporate-${tier}`, amount]);

  // Unpaid websites change immediately and free of charge.
  const a = await owner();
  const draft = await site(a, "basic", false);
  const free = await requestPlanChange(draft, a, "growth");
  check(free.status === "applied" && (await tierOf(draft)).tier === "growth", "an unpaid website changes plan immediately without charge");

  // Paid upgrade: prorated charge, applied only when payment is confirmed.
  const b = await owner();
  const paid = await site(b, "growth", true);
  await query("INSERT INTO subscription_preferences(site_id,amount,currency,interval,auto_renew) VALUES($1,$2,'NGN','monthly',true)", [paid, prices.growth]);
  const up = await planChangePreview(paid, "advanced");
  const expected = Math.round(((prices.advanced - prices.growth) / 30.4375) * up.charge.remainingDays);
  check(up.direction === "upgrade" && up.immediate && up.charge.amount === expected, "upgrade charges only the prorated difference");
  const upgrade = await requestPlanChange(paid, b, "advanced");
  check(upgrade.status === "payment_required" && (await tierOf(paid)).tier === "growth", "a paid upgrade waits for payment before changing plan");
  const before = (await tierOf(paid)).paid_until;
  const reference = `upg_${randomUUID()}`;
  await query("INSERT INTO billing(reference,site_id,amount,interval,bonus_months,payer_email,purpose,target_tier) VALUES($1,$2,$3,'monthly',0,'x@example.test','plan_change','advanced')", [reference, paid, upgrade.charge.amount]);
  await confirmSubscriptionPayment({ reference, status: "success", amount: upgrade.charge.amount, currency: "NGN" });
  const after = await tierOf(paid);
  check(after.tier === "advanced" && new Date(after.paid_until).getTime() === new Date(before).getTime(), "confirmed upgrade applies the plan without extending the paid period");
  check(
    (await query<{ amount: number }>("SELECT amount FROM subscription_preferences WHERE site_id=$1", [paid]))[0].amount === prices.advanced,
    "future renewals use the new plan's price",
  );
  check(
    (await query("SELECT number FROM invoices WHERE reference=$1 AND description LIKE 'Upgrade from growth to advanced%'", [reference])).length === 1,
    "the prorated upgrade is invoiced",
  );

  // Downgrade: impact report, scheduling, cancellation, application.
  const c = await owner();
  const root = await site(c, "advanced", true);
  const second = await site(c, "advanced", false, root);
  const third = await site(c, "advanced", false, root);
  await query("INSERT INTO subscription_preferences(site_id,amount,currency,interval) VALUES($1,$2,'NGN','monthly')", [root, prices.advanced]);
  for (let i = 0; i < 20; i++)
    await query("INSERT INTO records(site_id,kind,data,created_at) VALUES($1,'pages',$2,now()+$3*interval '1 second')", [
      root,
      JSON.stringify({ title: `Page ${i}`, slug: `page-${i}`, status: "published" }),
      i,
    ]);
  for (const [i, host] of ["a", "b", "c"].entries())
    await query("INSERT INTO domains(site_id,hostname,token,verified_at,active) VALUES($1,$2,'t',now()+$3*interval '1 second',true)", [root, `${host}-${randomUUID().slice(0, 6)}.test`, i]);
  const down = await planChangePreview(second, "growth");
  const keys = down.conflicts.map((x) => x.key).sort();
  check(down.direction === "downgrade" && !down.immediate, "a paid downgrade waits for the end of the paid period");
  check(JSON.stringify(keys) === JSON.stringify(["domains", "pages", "websites"]), "the impact report lists websites, pages and domains over the new allowance");
  check(down.conflicts.every((x) => !x.blocking), "content limits never block a downgrade");

  const intruder = await owner();
  check(await rejects(() => requestPlanChange(root, intruder, "growth"), /Only the account owner/), "only the account owner can change the plan");

  const [org] = await query<{ id: string }>("SELECT id FROM organisations WHERE owner_id=$1", [c]);
  const members = [await owner(), await owner(), await owner()];
  for (const m of members)
    await query("INSERT INTO organisation_members(organisation_id,user_id,role) VALUES($1,$2,'editor')", [org.id, m]);
  check(await rejects(() => requestPlanChange(root, c, "growth"), /Remove team members/), "extra team members block a downgrade until removed");
  await query("DELETE FROM organisation_members WHERE organisation_id=$1 AND role='editor'", [org.id]);

  const scheduled = await requestPlanChange(root, c, "growth");
  const pending = await tierOf(root);
  check(scheduled.status === "scheduled" && pending.tier === "advanced" && pending.pending_tier === "growth", "a downgrade is scheduled and current features are kept");
  await cancelScheduledChange(root, c);
  check((await tierOf(root)).pending_tier === null, "a scheduled downgrade can be cancelled");
  await requestPlanChange(root, c, "growth");
  await query("UPDATE sites SET pending_tier_at=now()-interval '1 minute' WHERE id=$1", [root]);
  check((await applyScheduledPlanChanges()) >= 1 && (await tierOf(root)).tier === "growth", "maintenance applies a due downgrade");
  const [s2, s3] = [await tierOf(second), await tierOf(third)];
  check(s2.status === "suspended" && s3.status === "suspended" && s3.suspended_reason === "plan_limit:published", "extra websites go offline and remember their status");
  const pages = await query<{ status: string; flag: boolean | null }>("SELECT data->>'status' AS status,(data->>'unpublishedByPlan')::boolean AS flag FROM records WHERE site_id=$1 AND kind='pages' ORDER BY created_at", [root]);
  check(
    pages.slice(0, 14).every((p) => p.status === "published") && pages.slice(14).every((p) => p.status === "draft" && p.flag),
    "the newest pages over the allowance return to draft, none are deleted",
  );
  check((await query("SELECT id FROM domains WHERE site_id=$1 AND active", [root])).length === 1, "domains beyond the allowance are deactivated");
  check(
    (await query<{ amount: number }>("SELECT amount FROM subscription_preferences WHERE site_id=$1", [root]))[0].amount === prices.growth,
    "renewal price follows the downgrade",
  );
  check(
    (await query("SELECT id FROM email_outbox WHERE site_id=$1 AND subject='Your plan has changed'", [root])).length === 1,
    "the owner is told what changed",
  );

  await query("UPDATE sites SET subscription='pending',paid_until=NULL WHERE id=$1", [root]);
  await requestPlanChange(root, c, "advanced");
  check((await tierOf(second)).status === "published" && (await tierOf(third)).status === "published", "upgrading again brings suspended websites back as they were");
  console.log(`${passes} plan change checks passed`);
} finally {
  for (const p of originalPlans as { id: string; monthly: number | null; annual: number | null }[])
    await query("UPDATE plans SET monthly=$2,annual=$3 WHERE id=$1", [p.id, p.monthly, p.annual]);
  await pool.end();
}
