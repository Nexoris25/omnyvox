import type { PoolClient } from "pg";
import { pool, query } from "./db";
import { billingQuote } from "./billing-quote";
import { entitled, limits, tiers, type Tier } from "./model";

/** Custom domains each plan may keep active (Advanced: primary + 2 aliases). */
export const domainAllowance: Record<Tier, number> = { basic: 0, growth: 1, advanced: 3 };
const DAY = 86_400_000;
/** Below this, an upgrade is applied without collecting a payment. */
export const MIN_CHARGE = 10_000;

export class PlanChangeError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

type Root = {
  id: string;
  owner_id: string;
  category: "corporate" | "commerce";
  tier: Tier;
  subscription: string;
  paid_until: string | null;
  billing_interval: "monthly" | "annual";
  pending_tier: Tier | null;
  pending_tier_at: string | null;
};
export type Conflict = {
  key: string;
  label: string;
  current: number;
  limit: number;
  blocking: boolean;
  resolution: string;
};

async function planLimits(category: string, tier: Tier) {
  const [plan] = await query<{
    entitlements: Record<string, number> | null;
    monthly: number | null;
    annual: number | null;
    annual_discount: number;
    bonus_months: number;
  }>(
    "SELECT entitlements,monthly,annual,COALESCE(annual_discount,0) AS annual_discount,COALESCE(bonus_months,0) AS bonus_months FROM plans WHERE id=$1",
    [`${category}-${tier}`],
  );
  return {
    limits: { ...limits[tier], ...(plan?.entitlements || {}) } as typeof limits.basic & {
      storageBytes?: number;
    },
    plan,
  };
}

/** The subscription root: linked Advanced websites share their root's plan. */
export async function subscriptionRoot(siteId: string) {
  const [root] = await query<Root>(
    "SELECT r.id,r.owner_id,r.category,r.tier,r.subscription,r.paid_until,r.billing_interval,r.pending_tier,r.pending_tier_at FROM sites s JOIN sites r ON r.id=COALESCE(s.subscription_site_id,s.id) WHERE s.id=$1",
    [siteId],
  );
  if (!root) throw new PlanChangeError("Website not found", 404);
  return root;
}

const paidPeriodActive = (root: Root) =>
  root.subscription === "active" &&
  !!root.paid_until &&
  new Date(root.paid_until).getTime() > Date.now();

/** Upgrade cost for the rest of the paid period: the daily price difference
 * between plans on the same billing interval, times the days remaining. */
export async function upgradeCharge(root: Root, target: Tier) {
  if (!paidPeriodActive(root)) return { amount: 0, remainingDays: 0 };
  const [from, to] = await Promise.all([
    planLimits(root.category, root.tier),
    planLimits(root.category, target),
  ]);
  if (!from.plan || !to.plan) throw new PlanChangeError("Plan pricing is not configured.", 503);
  const a = billingQuote(from.plan, root.billing_interval);
  const b = billingQuote(to.plan, root.billing_interval);
  if (!a.amount || !b.amount)
    throw new PlanChangeError("Plan pricing is not configured yet. Contact Nexoris to change plans.", 503);
  const periodDays = a.months * 30.4375;
  const remainingDays = Math.ceil((new Date(root.paid_until!).getTime() - Date.now()) / DAY);
  const daily = (b.amount / (b.months * 30.4375)) - (a.amount / periodDays);
  return {
    amount: Math.max(0, Math.round(daily * Math.min(remainingDays, b.months * 30.4375))),
    remainingDays,
  };
}

/** Everything that exceeds the target plan across the subscription group. */
export async function downgradeConflicts(root: Root, target: Tier): Promise<Conflict[]> {
  const { limits: to } = await planLimits(root.category, target);
  const [counts] = await query<{
    sites: number;
    pages: number;
    products: number;
    articles: number;
    domains: number;
    recipients: number;
    storage: string;
    members: number;
    video: number;
  }>(
    `WITH g AS (SELECT id FROM sites WHERE id=$1 OR subscription_site_id=$1)
     SELECT (SELECT count(*)::int FROM g) AS sites,
      (SELECT COALESCE(max(n),0)::int FROM (SELECT count(*) AS n FROM records WHERE site_id IN (SELECT id FROM g) AND kind='pages' AND data->>'status'='published' GROUP BY site_id) x) AS pages,
      (SELECT COALESCE(max(n),0)::int FROM (SELECT count(*) AS n FROM records WHERE site_id IN (SELECT id FROM g) AND kind='products' AND data->>'status'='published' GROUP BY site_id) x) AS products,
      (SELECT count(*)::int FROM records WHERE site_id IN (SELECT id FROM g) AND kind='articles' AND data->>'status'='published') AS articles,
      (SELECT count(*)::int FROM domains WHERE site_id IN (SELECT id FROM g) AND active) AS domains,
      (SELECT COALESCE(max(n),0)::int FROM (SELECT count(*) AS n FROM form_recipients WHERE site_id IN (SELECT id FROM g) GROUP BY site_id) x) AS recipients,
      (SELECT COALESCE(sum(size),0) FROM media WHERE site_id IN (SELECT id FROM g)) AS storage,
      (SELECT count(*)::int FROM organisation_members m JOIN organisations o ON o.id=m.organisation_id WHERE o.owner_id=$2) AS members,
      (SELECT count(*)::int FROM sites WHERE id IN (SELECT id FROM g) AND (data::text ~ '"video":"https' OR data::text ~ '<iframe|<video')) AS video`,
    [root.id, root.owner_id],
  );
  const conflicts: Conflict[] = [];
  const add = (c: Conflict) => c.current > c.limit && conflicts.push(c);
  add({
    key: "websites",
    label: "Websites",
    current: counts.sites,
    limit: to.websites,
    blocking: false,
    resolution: `The most recently created ${counts.sites - to.websites === 1 ? "website is" : "websites are"} taken offline at the change. Content is kept and returns if you upgrade again.`,
  });
  add({
    key: "pages",
    label: "Published pages on your busiest website (including the homepage)",
    current: counts.pages + 1,
    limit: to.pages,
    blocking: false,
    resolution: "Newest pages over the allowance return to drafts. Nothing is deleted.",
  });
  if (root.category === "commerce")
    add({
      key: "products",
      label: "Published products on your busiest store",
      current: counts.products,
      limit: to.products,
      blocking: false,
      resolution: "Newest products over the allowance return to drafts and stop selling. Nothing is deleted.",
    });
  if (!entitled(target, "blog"))
    add({
      key: "articles",
      label: "Published Insights articles",
      current: counts.articles,
      limit: 0,
      blocking: false,
      resolution: "Insights is hidden from your website. Articles are kept for when you upgrade.",
    });
  add({
    key: "domains",
    label: "Active custom domains",
    current: counts.domains,
    limit: domainAllowance[target],
    blocking: false,
    resolution:
      domainAllowance[target] === 0
        ? "Custom domains are deactivated; your website stays available on its Omnyvox address."
        : "The newest extra domains are deactivated.",
  });
  add({
    key: "recipients",
    label: "Additional enquiry recipients",
    current: counts.recipients,
    limit: to.recipients,
    blocking: false,
    resolution: "Only the earliest verified recipients within the allowance receive enquiries. Your primary inbox is unaffected.",
  });
  if (!entitled(target, "video"))
    add({
      key: "video",
      label: "Websites showing embedded video",
      current: counts.video,
      limit: 0,
      blocking: false,
      resolution: "Videos stop showing. Links are kept. Remove them before editing, or upgrade to show them again.",
    });
  if (to.storageBytes)
    add({
      key: "storage",
      label: "Media storage (MB)",
      current: Math.ceil(Number(counts.storage) / 1_048_576),
      limit: Math.floor(to.storageBytes / 1_048_576),
      blocking: false,
      resolution: "Existing images stay. New uploads pause until usage is below the allowance.",
    });
  add({
    key: "members",
    label: "Team members (including you)",
    current: counts.members,
    limit: to.team,
    blocking: true,
    resolution: "Remove team members in Team settings before scheduling this change.",
  });
  return conflicts;
}

export async function planChangePreview(siteId: string, target: Tier) {
  const root = await subscriptionRoot(siteId);
  if (target === root.tier) throw new PlanChangeError("You are already on this plan.");
  const upgrade = tiers.indexOf(target) > tiers.indexOf(root.tier);
  const effectiveAt = upgrade || !paidPeriodActive(root) ? new Date() : new Date(root.paid_until!);
  const { plan } = await planLimits(root.category, target);
  const renewal = plan ? billingQuote(plan, root.billing_interval).amount : null;
  return {
    current: root.tier,
    target,
    direction: upgrade ? "upgrade" : "downgrade",
    effectiveAt: effectiveAt.toISOString(),
    immediate: upgrade || !paidPeriodActive(root),
    charge: upgrade ? await upgradeCharge(root, target) : { amount: 0, remainingDays: 0 },
    renewalAmount: renewal,
    interval: root.billing_interval,
    conflicts: upgrade ? [] : await downgradeConflicts(root, target),
    scheduled: root.pending_tier ? { tier: root.pending_tier, at: root.pending_tier_at } : null,
  };
}

/** Sets the price future renewals charge after a plan change. */
async function syncRenewalAmount(client: PoolClient, root: Root, tier: Tier) {
  const { rows: [plan] } = await client.query(
    "SELECT monthly,annual,COALESCE(annual_discount,0) AS annual_discount,COALESCE(bonus_months,0) AS bonus_months FROM plans WHERE id=$1",
    [`${root.category}-${tier}`],
  );
  const quote = plan ? billingQuote(plan, root.billing_interval) : null;
  if (quote?.amount)
    await client.query(
      "UPDATE subscription_preferences SET amount=$2,bonus_months=$3 WHERE site_id=$1",
      [root.id, quote.amount, quote.bonusMonths],
    );
}

/** Applies a tier to a subscription group, enforcing the new allowances
 * without deleting anything. Returns what changed, for the record. */
export async function applyTier(client: PoolClient, rootId: string, tier: Tier, actor: string) {
  const { rows: [root] } = await client.query<Root>("SELECT * FROM sites WHERE id=$1 FOR UPDATE", [rootId]);
  const { limits: to } = await planLimits(root.category, tier);
  const effects: string[] = [];
  const group = "(SELECT id FROM sites WHERE id=$1 OR subscription_site_id=$1)";
  const online = async () =>
    Number(
      (
        await client.query(
          "SELECT count(*) AS n FROM sites WHERE (id=$1 OR subscription_site_id=$1) AND status<>'suspended'",
          [rootId],
        )
      ).rows[0].n,
    );
  const { rows: offline } = await client.query(
    "UPDATE sites SET suspended_reason='plan_limit:'||status,status='suspended' WHERE id IN (SELECT id FROM sites WHERE subscription_site_id=$1 AND status<>'suspended' ORDER BY created_at DESC LIMIT $2) RETURNING name",
    [rootId, Math.max(0, (await online()) - to.websites)],
  );
  if (offline.length) effects.push(`Took ${offline.map((s) => s.name).join(", ")} offline`);
  for (const [kind, allowance] of [
    ["pages", to.pages - 1],
    ...(root.category === "commerce" ? [["products", to.products] as const] : []),
  ] as const) {
    const { rowCount } = await client.query(
      `UPDATE records SET data=data||'{"status":"draft","unpublishedByPlan":true}' WHERE id IN (SELECT id FROM (SELECT id,row_number() OVER (PARTITION BY site_id ORDER BY created_at) AS n FROM records WHERE site_id IN ${group} AND kind=$2 AND data->>'status'='published') x WHERE n>$3)`,
      [rootId, kind, Math.max(0, allowance)],
    );
    if (rowCount) effects.push(`Returned ${rowCount} ${kind} to draft`);
  }
  const { rowCount: domains } = await client.query(
    `UPDATE domains SET active=false WHERE id IN (SELECT id FROM (SELECT id,row_number() OVER (ORDER BY verified_at) AS n FROM domains WHERE site_id IN ${group} AND active) x WHERE n>$2)`,
    [rootId, domainAllowance[tier]],
  );
  if (domains) effects.push(`Deactivated ${domains} custom domain(s)`);
  // Restore websites the plan now allows again.
  const { rows: restored } = await client.query(
    "UPDATE sites SET status=split_part(suspended_reason,':',2),suspended_reason=NULL WHERE id IN (SELECT id FROM sites WHERE subscription_site_id=$1 AND suspended_reason LIKE 'plan_limit:%' ORDER BY created_at LIMIT $2) RETURNING name",
    [rootId, Math.max(0, to.websites - (await online()))],
  );
  if (restored.length) effects.push(`Brought ${restored.map((s) => s.name).join(", ")} back online`);
  const kind = tiers.indexOf(tier) > tiers.indexOf(root.tier) ? "upgrade" : "downgrade";
  await client.query(
    "UPDATE sites SET tier=$2,pending_tier=NULL,pending_tier_at=NULL,pending_tier_by=NULL WHERE id=$1",
    [rootId, tier],
  );
  await syncRenewalAmount(client, root, tier);
  await client.query(
    "INSERT INTO plan_changes(site_id,from_tier,to_tier,kind,effects,actor) VALUES($1,$2,$3,$4,$5,$6)",
    [rootId, root.tier, tier, kind, JSON.stringify(effects), actor],
  );
  await client.query("INSERT INTO audit(actor,action,target) VALUES($1,$2,$3)", [
    actor,
    `subscription.${kind}.${tier}`,
    rootId,
  ]);
  return effects;
}

/** Owner confirms a change. Upgrades needing payment return a charge for
 * checkout; everything else is applied or scheduled here. */
export async function requestPlanChange(siteId: string, actor: string, target: Tier) {
  const preview = await planChangePreview(siteId, target);
  const root = await subscriptionRoot(siteId);
  if (root.owner_id !== actor)
    throw new PlanChangeError("Only the account owner can change the plan.", 403);
  const blocking = preview.conflicts.filter((c) => c.blocking);
  if (blocking.length)
    throw new PlanChangeError(`Resolve first: ${blocking.map((c) => c.resolution).join(" ")}`);
  if (preview.direction === "upgrade" && preview.charge.amount >= MIN_CHARGE)
    return { ...preview, status: "payment_required" as const };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (preview.immediate) {
      const effects = await applyTier(client, root.id, target, actor);
      await client.query("COMMIT");
      return { ...preview, status: "applied" as const, effects };
    }
    await client.query(
      "UPDATE sites SET pending_tier=$2,pending_tier_at=$3,pending_tier_by=$4 WHERE id=$1",
      [root.id, target, preview.effectiveAt, actor],
    );
    await client.query(
      "INSERT INTO email_outbox(recipient,subject,body,site_id) SELECT email,'Your plan change is scheduled',$2,$1 FROM users WHERE id=$3",
      [
        root.id,
        `Your website will move to the ${target[0].toUpperCase() + target.slice(1)} plan on ${preview.effectiveAt.slice(0, 10)}, when your current paid period ends. You keep your current features until then, and you can cancel the change any time before that date in Subscription & billing.`,
        actor,
      ],
    );
    await client.query("INSERT INTO audit(actor,action,target) VALUES($1,$2,$3)", [
      actor,
      `subscription.downgrade_scheduled.${target}`,
      root.id,
    ]);
    await client.query("COMMIT");
    return { ...preview, status: "scheduled" as const };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function cancelScheduledChange(siteId: string, actor: string) {
  const root = await subscriptionRoot(siteId);
  if (root.owner_id !== actor) throw new PlanChangeError("Only the account owner can change the plan.", 403);
  if (!root.pending_tier) throw new PlanChangeError("No plan change is scheduled.");
  await query("UPDATE sites SET pending_tier=NULL,pending_tier_at=NULL,pending_tier_by=NULL WHERE id=$1", [root.id]);
  await query(
    "INSERT INTO plan_changes(site_id,from_tier,to_tier,kind,actor) VALUES($1,$2,$3,'cancelled',$4)",
    [root.id, root.tier, root.pending_tier, actor],
  );
  return { success: true };
}

/** Maintenance: apply downgrades whose date has arrived, before renewals run
 * so the next charge uses the new plan's price. */
export async function applyScheduledPlanChanges(limit = 25) {
  let applied = 0;
  for (let i = 0; i < limit; i++) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: [due] } = await client.query(
        "SELECT id,pending_tier FROM sites WHERE pending_tier IS NOT NULL AND pending_tier_at<=now() ORDER BY pending_tier_at FOR UPDATE SKIP LOCKED LIMIT 1",
      );
      if (!due) {
        await client.query("COMMIT");
        break;
      }
      const effects = await applyTier(client, due.id, due.pending_tier, "system");
      await client.query(
        "INSERT INTO email_outbox(recipient,subject,body,site_id) SELECT u.email,'Your plan has changed',$2,s.id FROM sites s JOIN users u ON u.id=s.owner_id WHERE s.id=$1",
        [
          due.id,
          `Your website is now on the ${due.pending_tier} plan.${effects.length ? " Changes made: " + effects.join("; ") + "." : ""} Nothing was deleted; upgrading restores these features.`,
        ],
      );
      await client.query("COMMIT");
      applied++;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  return applied;
}
