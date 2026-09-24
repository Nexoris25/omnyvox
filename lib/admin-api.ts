import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, pool, audit } from "./db";
import { storageAdmin } from "./storage-admin";
import { aiSettingsSchema } from "./local-ai";
import { canInternal, staffRoles } from "./permissions";
import { verifyPassword, rateLimit } from "./auth";
import { consumeSecondFactor } from "./mfa";
import { queueOtp } from "./otp";
import { reviewRecovery } from './account-recovery';
export async function platformAdmin(
  req: NextRequest,
  u: { id: string; role: string },
  path: string[],
) {
  if (path[0] !== "platform-admin") return null;
  const response = (b: unknown, status = 200) =>
    NextResponse.json(b, { status });
  if (!canInternal(u.role,path,req.method))
    return response({ error: "Administrator access required" }, 403);
  const [, kind, id] = path;
  if(kind==='recovery')return await reviewRecovery(req,u);
  if(kind === 'staff') {
    if(u.role !== 'super_admin') return response({error:'Super-admin access required'},403);
    if(req.method === 'GET') return response(await query("SELECT id,name,email,role,email_verified,mfa_secret IS NOT NULL AS mfa_enabled FROM users ORDER BY created_at DESC LIMIT 500"));
    if(req.method === 'POST') {
      await rateLimit('staff:'+u.id);
      const b=z.object({userId:z.uuid(),role:z.enum(['owner',...staffRoles]),password:z.string().max(128),code:z.string().max(32)}).parse(await req.json());
      const [actor]=await query<{password:string}>('SELECT password FROM users WHERE id=$1',[u.id]);
      if(!verifyPassword(b.password,actor.password)||!await consumeSecondFactor(u.id,b.code)) return response({error:'Confirm your password and a fresh authenticator or recovery code.'},403);
      const client=await pool.connect();
      try {
        await client.query('BEGIN');
        const {rows:[target]}=await client.query("UPDATE users SET role=$2 WHERE id=$1 AND id<>$3 AND role<>'super_admin' AND email_verified=true RETURNING email",[b.userId,b.role,u.id]);
        if(!target){await client.query('ROLLBACK');return response({error:'Choose a verified account other than yourself or a super-admin.'},409);}
        await client.query('DELETE FROM sessions WHERE user_id=$1',[b.userId]);
        await client.query("UPDATE account_recovery_cases SET status='cancelled',pending_secret=NULL,token_hash=NULL WHERE user_id=$1 AND status IN ('requested','cooldown','ready')",[b.userId]);
        await client.query("INSERT INTO audit(actor,action,target) VALUES($1,$2,$3)",[u.id,'staff.role.'+b.role,b.userId]);
        await client.query("INSERT INTO email_outbox(recipient,subject,body) VALUES($1,'Your Omnyvox access changed',$2)",[target.email,`Your platform role is now ${b.role}. Sign in again. Staff roles require two-factor authentication.`]);
        await client.query('COMMIT');return response({success:true});
      }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
    }
    return response({error:'Method not allowed'},405);
  }
  if (kind === "storage") return storageAdmin(req, u.id, id);
  if (kind === "ai") {
    if (req.method === "GET") {
      const [s] = await query("SELECT data FROM ai_settings WHERE id=true");
      return response({
        settings: s.data,
        environmentEnabled:
          process.env.AI_ENABLED === "true" &&
          process.env.OLLAMA_NO_CLOUD === "1",
        jobs: await query(
          "SELECT state,count(*)::int AS count FROM ai_jobs GROUP BY state",
        ),
      });
    }
    if (req.method === "PATCH") {
      const data = aiSettingsSchema.parse(await req.json());
      if (
        data.enabled &&
        (!data.readinessApproved ||
          !data.digest ||
          !data.licence ||
          data.readinessNotes.length < 30)
      )
        return response(
          {
            error:
              "Record readiness, model digest and licence before enabling AI.",
          },
          400,
        );
      await query("UPDATE ai_settings SET data=$1 WHERE id=true", [
        JSON.stringify(data),
      ]);
      await audit(u.id, "ai.settings.updated", "platform");
      return response({ success: true });
    }
  }
  if (req.method === "GET") {
    if (kind === "support")
      return response(
        await query(
          "SELECT * FROM platform_tickets ORDER BY created_at DESC LIMIT 500",
        ),
      );
    if (kind === "users")
      return response(
        await query(
          "SELECT u.id,u.name,u.email,u.role,u.email_verified,u.mfa_secret IS NOT NULL AS two_factor,u.disabled_at,u.disabled_reason,u.created_at,(SELECT max(a.created_at) FROM audit a WHERE a.actor=u.id::text AND a.action='account.login') AS last_sign_in FROM users u ORDER BY u.created_at DESC",
        ),
      );
    if (kind === "emails")
      // Message bodies may contain codes or personal data and are never listed.
      return response(
        await query(
          "SELECT e.id,e.recipient,e.subject,e.created_at,e.sent_at,e.attempts,e.last_error,e.next_attempt_at,e.provider_id,s.name AS site,CASE WHEN e.sent_at IS NOT NULL THEN 'sent' WHEN e.attempts>=5 THEN 'failed' WHEN e.attempts>0 THEN 'retrying' ELSE 'queued' END AS status FROM email_outbox e LEFT JOIN sites s ON s.id=e.site_id ORDER BY (e.sent_at IS NULL AND e.attempts>=5) DESC, e.created_at DESC LIMIT 1000",
        ),
      );
    if (kind === "merchants")
      return response(
        await query(
          "SELECT m.site_id,m.verified,m.delivery,s.name,b.status AS kyb_status FROM merchant_accounts m JOIN sites s ON s.id=m.site_id LEFT JOIN business_verifications b ON b.user_id=s.owner_id",
        ),
      );
    if (kind === "domains")
      return response(
        await query(
          "SELECT d.*,s.name FROM domains d JOIN sites s ON s.id=d.site_id",
        ),
      );
    if (kind === "subscriptions")
      return response(
        await query(
          "SELECT s.id,s.name,u.email,s.tier,s.subscription,s.paid_until,s.service_until,s.billing_interval,s.subscription_site_id FROM effective_sites s JOIN users u ON u.id=s.owner_id ORDER BY s.created_at DESC",
        ),
      );
    if (kind === "payments")
      return response(
        await query(
          "SELECT o.id,s.name,u.email,o.reference,o.payment_status,o.amount,o.review_reason,o.review_opened_at,o.reconcile_attempts,o.reconcile_error,o.created_at FROM orders o JOIN sites s ON s.id=o.site_id JOIN users u ON u.id=s.owner_id WHERE o.payment_status IN ('verification_required','review_required') OR (o.payment_status='pending' AND o.reconcile_attempts>0) ORDER BY o.review_opened_at NULLS LAST,o.created_at LIMIT 500",
        ),
      );
    if (kind === "requests")
      return response(
        await query(
          "SELECT r.*,s.name,u.email FROM records r JOIN sites s ON s.id=r.site_id JOIN users u ON u.id=s.owner_id WHERE r.kind IN ('support','services') ORDER BY r.created_at DESC",
        ),
      );
  }
  if (req.method === "PATCH" && kind === "emails" && id) {
    const rows = await query(
      "UPDATE email_outbox SET attempts=0,last_error=NULL,next_attempt_at=now() WHERE id=$1 AND sent_at IS NULL RETURNING id",
      [id],
    );
    if (!rows.length) return response({ error: "This message was already delivered." }, 409);
    await audit(u.id, "email.retry", id);
    return response({ success: true, message: "Queued for another delivery attempt." });
  }
  if (req.method === "PATCH" && kind === "users" && id) {
    const b = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("disable"), reason: z.string().trim().min(10).max(500) }),
        z.object({ action: z.literal("enable") }),
        z.object({ action: z.literal("resend-verification") }),
      ])
      .parse(await req.json());
    const [target] = await query<{ id: string; email: string; role: string; email_verified: boolean; disabled_at: string | null }>(
      "SELECT id,email,role,email_verified,disabled_at FROM users WHERE id=$1",
      [id],
    );
    if (!target) return response({ error: "Account not found" }, 404);
    if (b.action === "resend-verification") {
      if (target.email_verified) return response({ error: "This email address is already verified." }, 409);
      if (!(await queueOtp(target.id, target.email)))
        return response({ error: "A code was sent less than a minute ago. Try again shortly." }, 429);
      await audit(u.id, "account.verification.resent", target.id);
      return response({ success: true, message: "A new verification code was sent." });
    }
    if (b.action === "disable") {
      if (target.id === u.id) return response({ error: "You cannot disable your own account." }, 409);
      if (target.role === "super_admin" && u.role !== "super_admin")
        return response({ error: "Only a super administrator can disable this account." }, 403);
      await query("UPDATE users SET disabled_at=now(),disabled_reason=$2 WHERE id=$1", [target.id, b.reason]);
      await query("DELETE FROM sessions WHERE user_id=$1", [target.id]);
      await audit(u.id, "account.disabled", target.id);
      return response({ success: true, message: "Sign-in disabled and all sessions ended." });
    }
    await query("UPDATE users SET disabled_at=NULL,disabled_reason=NULL WHERE id=$1", [target.id]);
    await audit(u.id, "account.enabled", target.id);
    return response({ success: true, message: "Sign-in restored." });
  }
  if (req.method === "PATCH") {
    if (kind === "offers") {
      const b = z
        .object({
          id: z.string(),
          annualDiscount: z.number().int().min(0).max(90),
          bonusMonths: z.number().int().min(0).max(12),
        })
        .parse(await req.json());
      await query(
        "UPDATE plans SET annual_discount=$1,bonus_months=$2 WHERE id=$3",
        [b.annualDiscount, b.bonusMonths, b.id],
      );
      await audit(u.id, "plan.offer.updated", b.id);
      return response({ success: true });
    }
    if (kind === "support") {
      const b = z
        .object({
          status: z.enum(["new", "in_progress", "resolved"]),
          reply: z.string().max(10000).default(""),
        })
        .parse(await req.json());
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const {
          rows: [t],
        } = await c.query(
          "SELECT * FROM platform_tickets WHERE id=$1 FOR UPDATE",
          [id],
        );
        if (!t) {
          await c.query("ROLLBACK");
          return response({ error: "Ticket not found" }, 404);
        }
        if (b.reply && b.reply !== t.reply)
          await c.query(
            "INSERT INTO email_outbox(recipient,subject,body) VALUES($1,$2,$3)",
            [t.email, "Re: " + t.topic, b.reply],
          );
        await c.query(
          "UPDATE platform_tickets SET status=$1,reply=$2,updated_at=now() WHERE id=$3",
          [b.status, b.reply, id],
        );
        await c.query("COMMIT");
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
      await audit(u.id, "support.updated", id);
      return response({ success: true });
    }
    if (kind === "requests") {
      const b = z
        .object({
          status: z.enum(["new", "in_progress", "resolved"]),
          reply: z.string().max(10000).default(""),
        })
        .parse(await req.json());
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const {
          rows: [r],
        } = await c.query(
          "SELECT r.*,u.email FROM records r JOIN sites s ON s.id=r.site_id JOIN users u ON u.id=s.owner_id WHERE r.id=$1 AND r.kind IN ('support','services') FOR UPDATE OF r",
          [id],
        );
        if (!r) {
          await c.query("ROLLBACK");
          return response({ error: "Request not found" }, 404);
        }
        if (b.reply && b.reply !== r.data.reply)
          await c.query(
            "INSERT INTO email_outbox(recipient,subject,body) VALUES($1,$2,$3)",
            [r.email, "Re: " + r.data.title, b.reply],
          );
        await c.query("UPDATE records SET data=data||$1::jsonb WHERE id=$2", [
          JSON.stringify(b),
          id,
        ]);
        await c.query("COMMIT");
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
      await audit(u.id, "request.updated", id);
      return response({ success: true });
    }
    if (kind === "merchants") {
      const b = z.object({ verified: z.boolean() }).parse(await req.json());
      const rows = await query(
        "UPDATE merchant_accounts m SET verified=$1 FROM sites s WHERE m.site_id=s.id AND m.site_id=$2 AND ($1=false OR EXISTS(SELECT 1 FROM business_verifications b WHERE b.user_id=s.owner_id AND b.status='verified')) RETURNING m.site_id",
        [b.verified, id],
      );
      if (!rows.length)
        return response(
          {
            error: "Approve the business verification before enabling payments",
          },
          409,
        );
      await audit(u.id, "merchant.approval.updated", id);
      return response({ success: true });
    }
    if (kind === "domains") {
      const b = z
        .object({ active: z.boolean(), sslConfirmed: z.literal(true) })
        .parse(await req.json());
      const rows = await query(
        "UPDATE domains SET active=$1 WHERE id=$2 AND verified_at IS NOT NULL RETURNING id",
        [b.active, id],
      );
      if (!rows.length)
        return response({ error: "Verify domain ownership first" }, 409);
      await audit(u.id, "domain.activation.updated", id);
      return response({ success: true });
    }
  }
  return response({ error: "Not found" }, 404);
}
