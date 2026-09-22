import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, pool, audit } from "./db";
export async function platformAdmin(
  req: NextRequest,
  u: { id: string; role: string },
  path: string[],
) {
  if (path[0] !== "platform-admin") return null;
  const response = (b: unknown, status = 200) =>
    NextResponse.json(b, { status });
  if (u.role !== "super_admin")
    return response({ error: "Administrator access required" }, 403);
  const [, kind, id] = path;
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
          "SELECT id,name,email,role,email_verified,created_at FROM users ORDER BY created_at DESC",
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
    if (kind === "requests")
      return response(
        await query(
          "SELECT r.*,s.name,u.email FROM records r JOIN sites s ON s.id=r.site_id JOIN users u ON u.id=s.owner_id WHERE r.kind IN ('support','services') ORDER BY r.created_at DESC",
        ),
      );
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
