import { randomUUID } from "node:crypto";
import { pool, query } from "./db";
import { encrypt, decrypt } from "./commerce";
import { applyTier } from "./plan-change";
export class BillingStateError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
type Payment = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  customer?: { email?: string };
  authorization?: {
    reusable?: boolean;
    authorization_code?: string;
    last4?: string;
    brand?: string;
    [key: string]: unknown;
  };
};
/** Called only with a signed webhook or authenticated verification response. */
export async function confirmSubscriptionPayment(event: Payment) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [payment],
    } = await client.query(
      "SELECT * FROM billing WHERE reference=$1 FOR UPDATE",
      [event.reference],
    );
    if (
      !payment ||
      payment.amount !== event.amount ||
      payment.currency !== event.currency ||
      event.status !== "success"
    )
      throw new BillingStateError("Payment does not match", 400);
    if (payment.status === "paid") {
      await client.query("COMMIT");
      return;
    }
    const {
      rows: [site],
    } = await client.query(
      "SELECT s.*,u.name AS buyer_name,u.email AS buyer_email FROM sites s JOIN users u ON u.id=s.owner_id WHERE s.id=$1 FOR UPDATE OF s",
      [payment.site_id],
    );
    if (payment.purpose === "plan_change" && payment.target_tier) {
      // A prorated upgrade: apply the plan now; the paid period is unchanged.
      await applyTier(client, site.id, payment.target_tier, "paystack");
      await client.query(
        "UPDATE billing SET status='paid',paid_at=now() WHERE reference=$1",
        [payment.reference],
      );
      await client.query(
        "INSERT INTO invoices(reference,site_id,buyer,description,amount,currency,period_start,period_end) VALUES($1,$2,$3,$4,$5,$6,now(),$7)",
        [
          payment.reference,
          site.id,
          JSON.stringify({ name: site.buyer_name, email: site.buyer_email, business: site.name }),
          `Upgrade from ${site.tier} to ${payment.target_tier} — prorated for the rest of the current period`,
          payment.amount,
          payment.currency,
          site.paid_until,
        ],
      );
      await client.query(
        "INSERT INTO email_outbox(recipient,subject,body,site_id) VALUES($1,'Your plan upgrade is active',$2,$3)",
        [
          site.buyer_email,
          `${site.name} is now on the ${payment.target_tier} plan. Your invoice is available in Subscription & billing, and future renewals use the new plan's price.`,
          site.id,
        ],
      );
      await client.query("COMMIT");
      return;
    }
    const {
      rows: [period],
    } = await client.query(
      "UPDATE sites SET subscription='active',billing_interval=$2,paid_until=GREATEST(COALESCE(paid_until,now()),now())+CASE WHEN $2='annual' THEN interval '1 year'+$3*interval '1 month' ELSE interval '1 month' END WHERE id=$1 RETURNING paid_until",
      [site.id, payment.interval, payment.bonus_months],
    );
    await client.query(
      "UPDATE billing SET status='paid',paid_at=now() WHERE reference=$1",
      [payment.reference],
    );
    await client.query(
      "INSERT INTO subscription_preferences(site_id,amount,currency,interval,bonus_months) VALUES($1,$2,$3,$4,$5) ON CONFLICT(site_id) DO UPDATE SET last_error=NULL,next_attempt_at=now(),amount=CASE WHEN subscription_preferences.auto_renew THEN subscription_preferences.amount ELSE EXCLUDED.amount END,interval=CASE WHEN subscription_preferences.auto_renew THEN subscription_preferences.interval ELSE EXCLUDED.interval END,bonus_months=CASE WHEN subscription_preferences.auto_renew THEN subscription_preferences.bonus_months ELSE EXCLUDED.bonus_months END",
      [
        site.id,
        payment.amount,
        payment.currency,
        payment.interval,
        payment.bonus_months,
      ],
    );
    if (
      event.authorization?.reusable === true &&
      event.authorization.authorization_code &&
      event.customer?.email &&
      event.customer.email.toLowerCase() ===
        (payment.payer_email || site.buyer_email).toLowerCase()
    ) {
      await client.query(
        "UPDATE subscription_preferences SET payment_authorization=$2,payment_label=$3 WHERE site_id=$1",
        [
          site.id,
          encrypt(
            JSON.stringify({
              email: event.customer.email,
              authorization: event.authorization,
            }),
          ),
          `${String(event.authorization.brand || "Saved payment method").slice(0, 40)} ending ${String(
            event.authorization.last4 || "",
          )
            .replace(/[^0-9]/g, "")
            .slice(-4)}`,
        ],
      );
    }
    const start =
      site.paid_until && new Date(site.paid_until) > new Date()
        ? site.paid_until
        : new Date();
    await client.query(
      "INSERT INTO invoices(reference,site_id,buyer,description,amount,currency,period_start,period_end) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        payment.reference,
        site.id,
        JSON.stringify({
          name: site.buyer_name,
          email: site.buyer_email,
          business: site.name,
        }),
        `${site.category} ${site.tier} — ${payment.interval} subscription`,
        payment.amount,
        payment.currency,
        start,
        period.paid_until,
      ],
    );
    await client.query(
      "INSERT INTO email_outbox(recipient,subject,body,site_id) VALUES($1,'Omnyvox payment received',$2,$3)",
      [
        site.buyer_email,
        `Payment received for ${site.name}. Your invoice is available in Subscription & billing. Paid access ends ${new Date(period.paid_until).toISOString().slice(0, 10)}.`,
        site.id,
      ],
    );
    await client.query(
      "INSERT INTO audit(actor,action,target) VALUES('paystack','subscription.activated',$1)",
      [site.id],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function billingLifecycle(siteId: string) {
  const [site] = await query<{ subscription_site_id: string | null }>(
    "SELECT subscription_site_id FROM sites WHERE id=$1",
    [siteId],
  );
  const root = site.subscription_site_id || siteId;
  const [settings] = await query(
    "SELECT auto_renew,cancelled_at,payment_label,payment_authorization IS NOT NULL AS payment_available,amount,currency,interval,bonus_months,consent_at,last_error FROM subscription_preferences WHERE site_id=$1",
    [root],
  );
  return {
    rootSiteId: root,
    settings: settings || { auto_renew: false, payment_available: false },
    payments: await query(
      "SELECT reference,amount,currency,interval,status,created_at,paid_at,purpose FROM billing WHERE site_id=$1 ORDER BY created_at DESC LIMIT 100",
      [root],
    ),
    invoices: await query(
      "SELECT * FROM invoices WHERE site_id=$1 ORDER BY issued_at DESC LIMIT 100",
      [root],
    ),
  };
}
export async function setRenewal(
  siteId: string,
  actor: string,
  enabled: boolean,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [site],
    } = await client.query(
      "SELECT s.*,u.email FROM sites s JOIN users u ON u.id=s.owner_id WHERE s.id=$1 AND s.owner_id=$2 FOR UPDATE OF s",
      [siteId, actor],
    );
    if (!site) throw new BillingStateError("Subscription not found", 404);
    const {
      rows: [settings],
    } = await client.query(
      "SELECT * FROM subscription_preferences WHERE site_id=$1 FOR UPDATE",
      [siteId],
    );
    if (
      enabled &&
      (!settings?.payment_authorization ||
        !settings.amount ||
        site.subscription !== "active")
    )
      throw new BillingStateError(
        "Complete a successful payment using a reusable payment method first.",
      );
    await client.query(
      "INSERT INTO subscription_preferences(site_id,auto_renew,cancelled_at,consent_at) VALUES($1,$2,CASE WHEN $2 THEN NULL ELSE now() END,CASE WHEN $2 THEN now() ELSE NULL END) ON CONFLICT(site_id) DO UPDATE SET auto_renew=$2,cancelled_at=CASE WHEN $2 THEN NULL ELSE now() END,consent_at=CASE WHEN $2 THEN now() ELSE subscription_preferences.consent_at END,next_attempt_at=now(),last_error=NULL",
      [siteId, enabled],
    );
    await client.query(
      "INSERT INTO audit(actor,action,target) VALUES($1,$2,$3)",
      [
        actor,
        enabled
          ? "subscription.renewal.authorized"
          : "subscription.renewal.cancelled",
        siteId,
      ],
    );
    await client.query(
      "INSERT INTO email_outbox(recipient,subject,body,site_id) VALUES($1,'Omnyvox renewal settings updated',$2,$3)",
      [
        site.email,
        enabled
          ? `Automatic renewal enabled for ${site.name} at the confirmed amount and interval. Manage or cancel it in Subscription & billing.`
          : `Automatic renewal cancelled for ${site.name}. Existing paid access remains available. An already submitted payment may still complete.`,
        siteId,
      ],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function provider(path: string, body: unknown, transport: typeof fetch) {
  const r = await transport("https://api.paystack.co/" + path, {
    method: body ? "POST" : "GET",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw Error("Payment provider unavailable");
  const result = await r.json();
  if (result.status !== true || !result.data)
    throw Error("Provider response needs verification");
  return result.data as Payment;
}
export async function processRenewals(transport: typeof fetch = fetch) {
  const worker = await pool.connect();
  let count = 0;
  try {
    const {
      rows: [lock],
    } = await worker.query("SELECT pg_try_advisory_lock(730225) AS acquired");
    if (!lock.acquired) return 0;
    // Reminder delivery is deduplicated per paid period, even with repeated worker runs.
    await worker.query(`WITH due AS (INSERT INTO billing_notifications(site_id,event_key) SELECT id,'renewal:'||paid_until::text FROM sites WHERE subscription_site_id IS NULL AND subscription='active' AND paid_until BETWEEN now() AND now()+interval '7 days' ON CONFLICT DO NOTHING RETURNING site_id)
   INSERT INTO email_outbox(recipient,subject,body,site_id) SELECT u.email,'Your Omnyvox renewal is approaching','Review your subscription, renewal preference and invoice history in Subscription & billing.',s.id FROM due JOIN sites s ON s.id=due.site_id JOIN users u ON u.id=s.owner_id`);
    if (!process.env.PAYSTACK_SECRET_KEY) return 0;
    const due = await query<{ id: string; paid_until: string }>(
      "SELECT s.id,s.paid_until FROM sites s JOIN subscription_preferences p ON p.site_id=s.id WHERE p.auto_renew=true AND p.payment_authorization IS NOT NULL AND p.next_attempt_at<=now() AND s.subscription_site_id IS NULL AND s.subscription='active' AND s.status<>'suspended' AND s.paid_until<=now() ORDER BY s.paid_until LIMIT 20",
    );
    for (const site of due) {
      const cycle = new Date(site.paid_until).toISOString();
      const client = await pool.connect();
      let payment: any;
      let credentials: any;
      try {
        await client.query("BEGIN");
        const {
          rows: [settings],
        } = await client.query(
          "SELECT p.*,s.subscription,s.status,s.paid_until FROM subscription_preferences p JOIN sites s ON s.id=p.site_id WHERE p.site_id=$1 FOR UPDATE OF p,s",
          [site.id],
        );
        if (
          !settings.auto_renew ||
          settings.status === "suspended" ||
          new Date(settings.paid_until) > new Date()
        ) {
          await client.query("ROLLBACK");
          continue;
        }
        const {
          rows: [last],
        } = await client.query(
          "SELECT * FROM billing WHERE site_id=$1 AND cycle_key=$2 ORDER BY attempt DESC LIMIT 1",
          [site.id, cycle],
        );
        if (
          last?.status === "paid" ||
          (last?.status === "failed" && last.attempt >= 3)
        ) {
          await client.query("ROLLBACK");
          continue;
        }
        payment = last?.status === "pending" ? last : null;
        if (!payment) {
          const ref = "renew_" + randomUUID();
          const { rows } = await client.query(
            "INSERT INTO billing(reference,site_id,amount,currency,interval,bonus_months,payer_email,purpose,cycle_key,attempt) VALUES($1,$2,$3,$4,$5,$6,$7,'renewal',$8,$9) RETURNING *",
            [
              ref,
              site.id,
              settings.amount,
              settings.currency,
              settings.interval,
              settings.bonus_months,
              JSON.parse(decrypt(settings.payment_authorization)).email,
              cycle,
              (last?.attempt || 0) + 1,
            ],
          );
          payment = { ...rows[0], submit: true };
        }
        credentials = JSON.parse(decrypt(settings.payment_authorization));
        await client.query(
          "UPDATE subscription_preferences SET next_attempt_at=now()+interval '15 minutes' WHERE site_id=$1",
          [site.id],
        );
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      try {
        const data = payment.submit
          ? await provider(
              "transaction/charge_authorization",
              {
                authorization_code:
                  credentials.authorization.authorization_code,
                email: credentials.email,
                amount: payment.amount,
                currency: payment.currency,
                reference: payment.reference,
              },
              transport,
            )
          : await provider(
              "transaction/verify/" + encodeURIComponent(payment.reference),
              null,
              transport,
            );
        if (
          data.reference !== payment.reference ||
          data.amount !== payment.amount ||
          data.currency !== payment.currency
        )
          throw Error("Payment mismatch");
        if (data.status === "success") {
          await confirmSubscriptionPayment(data);
          count++;
        } else if (["failed", "abandoned"].includes(data.status)) {
          const result = await query(
            "UPDATE billing SET status='failed' WHERE reference=$1 AND status='pending' RETURNING site_id",
            [payment.reference],
          );
          if (result.length) {
            await query(
              "UPDATE subscription_preferences SET next_attempt_at=now()+interval '1 day',last_error='Renewal payment failed. Update your payment method or pay manually.' WHERE site_id=$1",
              [site.id],
            );
            await query(
              "INSERT INTO email_outbox(recipient,subject,body,site_id) VALUES($1,'Omnyvox renewal payment failed','Open Subscription & billing to review your payment and renew manually or update your payment method.',$2)",
              [credentials.email, site.id],
            );
          }
        } else
          await query(
            "UPDATE subscription_preferences SET last_error='Payment is awaiting confirmation; no additional charge will be submitted.' WHERE site_id=$1",
            [site.id],
          );
      } catch {
        await query(
          "UPDATE subscription_preferences SET last_error='Payment verification is pending. The same payment reference will be checked before any retry.' WHERE site_id=$1",
          [site.id],
        );
      }
    }
    return count;
  } finally {
    await worker.query("SELECT pg_advisory_unlock(730225)");
    worker.release();
  }
}
