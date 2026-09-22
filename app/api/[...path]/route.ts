import { billingQuote } from "@/lib/billing-quote";
import { manageMedia } from "@/lib/media-management";
import { passwordSchema } from "@/lib/password";
import { queueOtp } from "@/lib/otp";
import { extensionsApi } from "@/lib/extensions-api";
import { contentSchema } from "@/lib/cms-schema";
import { safeHtml, referencedMediaIds } from "@/lib/content";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  randomUUID,
  createHmac,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import sharp from "sharp";
import { resolveTxt } from "node:dns/promises";
import { queueAccountEmail } from "@/lib/email";
import { siteEntitlements } from "@/lib/entitlements";
import { checkout, encrypt, merchantWebhook } from "@/lib/commerce";
import { z } from "zod";
import { query, pool, audit } from "@/lib/db";
import {
  user,
  session,
  hashPassword,
  verifyPassword,
  rateLimit,
} from "@/lib/auth";
import {
  siteSchema,
  brandSchema,
  sectionSchema,
  initialSections,
  limits,
  entitled,
  Site,
} from "@/lib/model";
export const runtime = "nodejs";
const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
const fail = (message: string, status = 400) => ok({ error: message }, status);
type Context = { params: Promise<{ path: string[] }> };
async function handle(req: NextRequest, ctx: Context): Promise<Response> {
  try {
    const { path } = await ctx.params;
    const [area, id, kind, recordId] = path;
    const method = req.method;
    if (
      method !== "GET" &&
      area !== "webhooks" &&
      req.headers.get("origin") !==
        new URL(process.env.APP_URL || req.url).origin &&
      req.headers.get("origin") !== new URL(req.url).origin
    )
      return fail("Invalid request origin", 403);
    if (area === "checkout" && method === "POST") {
      const body = await req.json();
      await rateLimit(`checkout:${String(body.email).slice(0, 254)}`);
      return ok(await checkout(body));
    }
    if (area === "webhooks" && id === "store" && kind && method === "POST") {
      await merchantWebhook(
        kind,
        await req.text(),
        req.headers.get("x-paystack-signature") || "",
      );
      return ok({ received: true });
    }
    if (area === "contact" && method === "POST") {
      const b = z
        .object({
          name: z.string().min(2).max(100),
          email: z.email(),
          topic: z.string().min(2).max(120),
          message: z.string().min(10).max(5000),
          website: z.string().max(0),
        })
        .parse(await req.json());
      await rateLimit("contact:" + b.email.toLowerCase());
      await query(
        "INSERT INTO platform_tickets(name,email,topic,message) VALUES($1,$2,$3,$4)",
        [b.name, b.email, b.topic, b.message],
      );
      return ok({ success: true }, 201);
    }
    if (area === "health") {
      await query("SELECT 1");
      return ok({ status: "ready" });
    }
    if (area === "plans" && method === "GET")
      return ok(
        await query("SELECT * FROM plans ORDER BY category,monthly NULLS LAST"),
      );
    if (area === "auth") {
      if (id === "logout") {
        if (method !== "POST") return fail("Method not allowed", 405);
        const token = (await cookies()).get("omnyvox_session")?.value;
        if (token)
          await query("DELETE FROM sessions WHERE token=$1", [
            createHash("sha256").update(token).digest("hex"),
          ]);
        (await cookies()).delete("omnyvox_session");
        return ok({ success: true });
      }
      if (method !== "POST") return fail("Method not allowed", 405);
      if (id === "resend-verification") {
        const account = await user();
        if (!account) return fail("Please sign in", 401);
        await rateLimit(`verification:${account.id}`);
        if (
          !account.email_verified &&
          !(await queueOtp(account.id, account.email))
        )
          return fail("Wait 60 seconds before requesting a new code", 429);
        return ok({
          message: "A verification email has been queued for delivery.",
        });
      }
      if (id === "forgot") {
        const { email } = z
          .object({ email: z.email().transform((v) => v.toLowerCase()) })
          .parse(await req.json());
        await rateLimit("reset:" + email);
        const [account] = await query<{ id: string; email: string }>(
          "SELECT id,email FROM users WHERE email=$1",
          [email],
        );
        if (account)
          await queueAccountEmail(account.id, account.email, "reset");
        return ok({
          message:
            "If this account exists, a reset link will be sent to its email address.",
        });
      }
      if (id === "verify" || id === "reset") {
        const b = z
          .object({
            token: z.string().regex(/^[a-f0-9]{64}$/),
            password: passwordSchema.optional(),
            confirmPassword: z.string().optional(),
          })
          .parse(await req.json());
        if (id === "reset" && (!b.password || b.password !== b.confirmPassword))
          return fail("A new password is required");
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const {
            rows: [token],
          } = await client.query(
            "DELETE FROM auth_tokens WHERE token=$1 AND purpose=$2 AND expires>now() RETURNING user_id",
            [createHash("sha256").update(b.token).digest("hex"), id],
          );
          if (!token) {
            await client.query("ROLLBACK");
            return fail("This link is invalid or expired.");
          }
          if (id === "verify")
            await client.query(
              "UPDATE users SET email_verified=true WHERE id=$1",
              [token.user_id],
            );
          else {
            await client.query("UPDATE users SET password=$1 WHERE id=$2", [
              hashPassword(b.password!),
              token.user_id,
            ]);
            await client.query("DELETE FROM sessions WHERE user_id=$1", [
              token.user_id,
            ]);
            await client.query(
              "DELETE FROM auth_tokens WHERE user_id=$1 AND purpose='reset'",
              [token.user_id],
            );
          }
          await client.query("COMMIT");
          return ok({
            message:
              id === "verify"
                ? "Your email is verified. You can return to your workspace."
                : "Your password was reset and existing sessions were signed out. Please log in.",
          });
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      }
      const body = z
        .object({
          email: z.email().transform((v) => v.toLowerCase().trim()),
          password: z.string().min(1).max(128),
          confirmPassword: z.string().optional(),
          name: z.string().min(2).max(100).optional(),
        })
        .parse(await req.json());
      await rateLimit(`auth:${body.email}`);
      if (id === "register") {
        if (!body.name) return fail("Your name is required");
        passwordSchema.parse(body.password);
        if (body.password !== body.confirmPassword)
          return fail("Passwords must match");
        const [u] = await query<{ id: string }>(
          "INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) RETURNING id",
          [body.name, body.email, hashPassword(body.password), "owner"],
        );
        await queueOtp(u.id, body.email);
        await session(u.id);
        await audit(u.id, "account.created", u.id);
        return ok({ success: true }, 201);
      }
      if (id === "login") {
        const [u] = await query<{ id: string; password: string }>(
          "SELECT id,password FROM users WHERE email=$1",
          [body.email],
        );
        if (!u || !verifyPassword(body.password, u.password))
          return fail("Email or password is incorrect", 401);
        await session(u.id);
        return ok({ success: true });
      }
      return fail("Not found", 404);
    }
    if (area === "webhooks" && id === "paystack" && method === "POST") {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) return fail("Billing not configured", 503);
      const raw = await req.text();
      const signature = req.headers.get("x-paystack-signature") || "";
      const expected = createHmac("sha512", secret).update(raw).digest("hex");
      if (
        signature.length !== expected.length ||
        !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      )
        return fail("Invalid signature", 401);
      const event = JSON.parse(raw);
      if (event.event !== "charge.success") return ok({ received: true });
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const {
          rows: [payment],
        } = await client.query(
          "SELECT * FROM billing WHERE reference=$1 FOR UPDATE",
          [event.data.reference],
        );
        if (
          !payment ||
          payment.amount !== event.data.amount ||
          payment.currency !== event.data.currency ||
          event.data.status !== "success"
        ) {
          await client.query("ROLLBACK");
          return fail("Payment does not match", 400);
        }
        if (payment.status !== "paid") {
          await client.query(
            "UPDATE billing SET status='paid' WHERE reference=$1",
            [payment.reference],
          );
          await client.query(
            "UPDATE sites SET subscription='active',billing_interval=$2,paid_until=GREATEST(COALESCE(paid_until,now()),now())+CASE WHEN $2='annual' THEN interval '1 year'+$3*interval '1 month' ELSE interval '1 month' END WHERE id=$1",
            [payment.site_id, payment.interval, payment.bonus_months],
          );
          await client.query(
            "INSERT INTO audit(actor,action,target) VALUES($1,$2,$3)",
            ["paystack", "subscription.activated", payment.site_id],
          );
        }
        await client.query("COMMIT");
        return ok({ received: true });
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    }
    if (area === "media" && method === "GET") {
      if (!z.uuid().safeParse(id).success) return fail("Not found", 404);
      const [marketingImage] = await query<{ bytes: Buffer }>(
        "SELECT m.bytes FROM media m WHERE m.id=$1 AND m.site_id IS NULL AND EXISTS(SELECT 1 FROM marketing_records r WHERE r.data->>'status'='published' AND r.data::text LIKE '%' || m.id::text || '%')",
        [id],
      );
      if (marketingImage)
        return new Response(new Uint8Array(marketingImage.bytes), {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public,max-age=3600",
          },
        });

      const [m] = await query<{ bytes: Buffer }>(
        "SELECT m.bytes FROM media m JOIN effective_sites s ON s.id=m.site_id WHERE m.id=$1 AND s.status=$2 AND s.subscription=$3 AND s.service_until>now() AND (s.published::text LIKE '%'||m.id::text||'%' OR EXISTS(SELECT 1 FROM records r WHERE r.site_id=s.id AND r.data->>'status'='published' AND r.kind IN ('pages','articles','products','legal') AND r.data::text LIKE '%'||m.id::text||'%'))",
        [id, "published", "active"],
      );
      if (m)
        return new Response(new Uint8Array(m.bytes), {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=3600",
          },
        });
      const u = await user();
      if (!u) return fail("Not found", 404);
      const [privateMedia] = await query<{ bytes: Buffer }>(
        "SELECT m.bytes FROM media m LEFT JOIN sites s ON s.id=m.site_id WHERE m.id=$1 AND (s.owner_id=$2 OR (m.site_id IS NULL AND $3=\'super_admin\'))",
        [id, u.id, u.role],
      );
      return privateMedia
        ? new Response(new Uint8Array(privateMedia.bytes), {
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": "private, no-store",
            },
          })
        : fail("Not found", 404);
    }
    if (area === "enquiries" && method === "POST") {
      const b = z
        .object({
          site: z.uuid(),
          name: z.string().min(2).max(100),
          email: z.email(),
          message: z.string().min(5).max(4000),
          website: z.string().max(0),
        })
        .parse(await req.json());
      await rateLimit(`enquiry:${b.email}`);
      const [s] = await query(
        "SELECT id,published FROM effective_sites WHERE id=$1 AND status='published' AND subscription='active' AND service_until>now()",
        [b.site],
      );
      if (!s) return fail("Website unavailable", 404);
      const recipient = (
        s as {
          published?: {
            brand?: { notificationEmail?: string; email?: string };
          };
        }
      ).published?.brand;
      if (recipient?.notificationEmail || recipient?.email)
        await query(
          "INSERT INTO email_outbox(recipient,subject,body) VALUES($1,$2,$3)",
          [
            recipient.notificationEmail || recipient.email,
            "New website enquiry",
            `${b.name} (${b.email})\n\n${b.message}`,
          ],
        );
      await query(
        "INSERT INTO records(site_id,kind,data) VALUES($1,'enquiries',$2)",
        [b.site, JSON.stringify({ ...b, status: "new" })],
      );
      return ok({ success: true }, 201);
    }
    const u = await user();
    if (!u) return fail("Please sign in", 401);
    const extension = await extensionsApi(req, u, path);
    if (extension) return extension;
    if (area === "me") return ok(u);
    if (area === "admin") {
      if (u.role !== "super_admin")
        return fail("Administrator access required", 403);
      if (method === "GET")
        return ok({
          sites: await query(
            "SELECT id,name,slug,category,tier,status,subscription FROM sites ORDER BY created_at DESC",
          ),
          plans: await query("SELECT * FROM plans ORDER BY id"),
          audit: await query(
            "SELECT * FROM audit ORDER BY created_at DESC LIMIT 100",
          ),
        });
      if (method === "PATCH" && id === "plans") {
        const b = z
          .object({
            id: z.string(),
            monthly: z.number().int().positive(),
            annual: z.number().int().positive(),
            entitlements: z
              .object({
                pages: z.number().int().min(1).max(10000),
                products: z.number().int().min(0).max(100000),
                articles: z.number().int().min(0).max(100000),
                team: z.number().int().min(1).max(1000),
              })
              .optional(),
          })
          .parse(await req.json());
        await query(
          "UPDATE plans SET monthly=$1,annual=$2,entitlements=COALESCE($4,entitlements) WHERE id=$3",
          [
            b.monthly,
            b.annual,
            b.id,
            b.entitlements ? JSON.stringify(b.entitlements) : null,
          ],
        );
        await audit(u.id, "plan.price.updated", b.id);
        return ok({ success: true });
      }
      if (method === "PATCH" && id === "sites") {
        const b = z
          .object({ id: z.uuid(), status: z.enum(["draft", "suspended"]) })
          .parse(await req.json());
        await query("UPDATE sites SET status=$1 WHERE id=$2", [b.status, b.id]);
        await audit(u.id, "site." + b.status, b.id);
        return ok({ success: true });
      }
      return fail("Not found", 404);
    }
    if (area !== "sites") return fail("Not found", 404);
    if (!id && method === "GET")
      return ok(
        await query(
          "SELECT * FROM effective_sites WHERE owner_id=$1 ORDER BY created_at",
          [u.id],
        ),
      );
    if (!id && method === "POST") {
      const b = siteSchema.parse(await req.json());
      const brand = {
        name: b.name,
        businessNature: b.category === "commerce" ? "commerce" : "general",
        description: "Your business, beautifully online.",
        primary: "#540CDA",
        secondary: "#111827",
        background: "#ffffff",
        text: "#172033",
        font: "sans",
        email: u.email,
        categoryUrls: false,
        logo: "",
      };
      const client = await pool.connect();
      let s: Site;
      try {
        await client.query("BEGIN");
        await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
          u.id,
        ]);
        const { rows: owned } = await client.query(
          "SELECT * FROM sites WHERE owner_id=$1 ORDER BY created_at",
          [u.id],
        );
        const root = owned[0];
        const tier = root?.tier || b.tier;
        if (owned.length >= limits[tier as keyof typeof limits].websites) {
          await client.query("ROLLBACK");
          return fail(
            `Your ${tier} plan allows ${limits[tier as keyof typeof limits].websites} website(s).`,
            403,
          );
        }
        const result = await client.query(
          "INSERT INTO sites(owner_id,name,slug,category,tier,data,subscription_site_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
          [
            u.id,
            b.name,
            b.slug,
            root?.category || b.category,
            tier,
            JSON.stringify({
              brand,
              sections: initialSections,
              template: b.template,
            }),
            root?.id || null,
          ],
        );
        s = result.rows[0];
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      await audit(u.id, "site.created", s.id);
      return ok(s, 201);
    }
    if (!z.uuid().safeParse(id).success) return fail("Website not found", 404);
    const [site] = await query<Site>(
      "SELECT * FROM effective_sites WHERE id=$1 AND owner_id=$2",
      [id, u.id],
    );
    if (!site) return fail("Website not found", 404);
    if (!kind && method === "GET") return ok(site);
    if (!kind && method === "PATCH") {
      const b = z
        .object({
          brand: brandSchema,
          sections: z.array(sectionSchema).max(15),
          template: z.enum(["studio", "atelier", "horizon"]),
        })
        .parse(await req.json());
      b.sections?.forEach((section) => {
        section.body = safeHtml(section.body);
      });
      for (const assetId of referencedMediaIds(b)) {
        if (
          !(
            await query("SELECT id FROM media WHERE id=$1 AND site_id=$2", [
              assetId,
              id,
            ])
          ).length
        )
          return fail("Choose images from this website’s media library", 403);
      }
      await query(
        "UPDATE sites SET data=$1,name=$2 WHERE id=$3 AND owner_id=$4",
        [JSON.stringify(b), b.brand.name, id, u.id],
      );
      await audit(u.id, "site.draft.saved", id);
      return ok({ success: true });
    }
    if (kind === "publish" && method === "POST") {
      if (!u.email_verified)
        return fail("Verify your email address before publishing.", 403);
      if (
        site.subscription !== "active" ||
        !site.service_until ||
        new Date(site.service_until) <= new Date()
      )
        return fail("Activate your subscription before publishing.", 403);
      if (site.status === "suspended")
        return fail("This website is suspended. Contact support.", 403);
      await query(
        "UPDATE sites SET published=data,status='published' WHERE id=$1",
        [id],
      );
      await audit(u.id, "site.published", id);
      return ok({ success: true });
    }
    if (kind === "billing" && method === "POST") {
      const { interval } = z
        .object({ interval: z.enum(["monthly", "annual"]) })
        .parse(await req.json());
      const [plan] = await query<{
        monthly: number;
        annual: number;
        annual_discount: number;
        bonus_months: number;
      }>(
        "SELECT monthly,annual,annual_discount,bonus_months FROM plans WHERE id=$1",
        [`${site.category}-${site.tier}`],
      );
      const amount = plan ? billingQuote(plan, interval).amount : null;
      if (!amount || !process.env.PAYSTACK_SECRET_KEY)
        return fail(
          "Subscriptions are not open yet. Contact Nexoris for launch pricing.",
          503,
        );
      const reference = `sub_${randomUUID()}`;
      await query(
        "INSERT INTO billing(reference,site_id,amount,interval,bonus_months) VALUES($1,$2,$3,$4,$5)",
        [
          reference,
          site.subscription_site_id || id,
          amount,
          interval,
          interval === "annual" ? plan.bonus_months : 0,
        ],
      );
      const r = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: u.email,
          amount,
          currency: "NGN",
          reference,
          callback_url: `${process.env.APP_URL}/dashboard/billing`,
        }),
      });
      const result = await r.json();
      if (!r.ok || !result.status)
        return fail("Payment provider is unavailable", 502);
      return ok({ url: result.data.authorization_url });
    }
    if (kind === "media" && ["PATCH", "DELETE"].includes(method))
      return manageMedia(req, recordId, id, u.id);
    if (kind === "media" && method === "GET")
      return ok(
        await query(
          "SELECT id,alt,octet_length(bytes) AS size FROM media WHERE site_id=$1 ORDER BY created_at DESC",
          [id],
        ),
      );
    if (kind === "media" && method === "POST") {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
        return fail("Choose an image smaller than 5 MB");
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
        return fail("Use PNG, JPEG or WebP");
      const buffer = await sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 40000000,
      })
        .rotate()
        .resize({
          width: 1920,
          height: 1920,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
      const [m] = await query<{ id: string }>(
        "INSERT INTO media(site_id,bytes,alt) VALUES($1,$2,$3) RETURNING id",
        [id, buffer, String(form.get("alt") || "").slice(0, 300)],
      );
      return ok({ url: `/api/media/${m.id}` }, 201);
    }
    if (kind === "domains") {
      if (!entitled(site.tier, "domains"))
        return fail("Custom domains require Growth or Advanced.", 403);
      if (method === "GET")
        return ok(
          await query(
            "SELECT id,hostname,token,verified_at,active FROM domains WHERE site_id=$1",
            [id],
          ),
        );
      if (method === "POST") {
        const { hostname } = z
          .object({
            hostname: z
              .string()
              .toLowerCase()
              .regex(
                /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
              ),
          })
          .parse(await req.json());
        const reserved = process.env.PLATFORM_DOMAIN || "omnyvox.com";
        if (hostname === reserved || hostname.endsWith("." + reserved))
          return fail("Use a domain you own outside the Omnyvox platform.");
        const rows = await query("SELECT id FROM domains WHERE site_id=$1", [
          id,
        ]);
        if (rows.length >= (site.tier === "advanced" ? 3 : 1))
          return fail("Your domain limit has been reached.", 403);
        const [domain] = await query(
          "INSERT INTO domains(site_id,hostname,token) VALUES($1,$2,$3) RETURNING id,hostname,token,verified_at,active",
          [id, hostname, randomUUID()],
        );
        await audit(u.id, "domain.added", id);
        return ok(domain, 201);
      }
      if (method === "PATCH") {
        const [domain] = await query<{ hostname: string; token: string }>(
          "SELECT hostname,token FROM domains WHERE id=$1 AND site_id=$2",
          [recordId, id],
        );
        if (!domain) return fail("Domain not found", 404);
        let records: string[][] = [];
        try {
          records = await resolveTxt("_omnyvox." + domain.hostname);
        } catch {
          return fail(
            "DNS record not found yet. DNS changes can take time to propagate.",
          );
        }
        if (!records.some((r) => r.join("") === domain.token))
          return fail("Ownership verification record does not match.");
        await query("UPDATE domains SET verified_at=now() WHERE id=$1", [
          recordId,
        ]);
        await audit(u.id, "domain.verified", id);
        return ok({
          success: true,
          message:
            "Ownership verified. Nexoris must provision SSL before this domain can be activated.",
        });
      }
      if (method === "DELETE") {
        await query("DELETE FROM domains WHERE id=$1 AND site_id=$2", [
          recordId,
          id,
        ]);
        await audit(u.id, "domain.removed", id);
        return ok({ success: true });
      }
    }
    if (kind === "merchant") {
      if (site.category !== "commerce")
        return fail("An online store is required", 403);
      if (method === "GET") {
        const [m] = await query(
          "SELECT verified,delivery FROM merchant_accounts WHERE site_id=$1",
          [id],
        );
        return ok(m || { verified: false, delivery: 0 });
      }
      if (method === "POST") {
        const b = z
          .object({
            secret: z.string().regex(/^sk_(test|live)_[a-zA-Z0-9]+$/),
            delivery: z.number().int().nonnegative(),
          })
          .parse(await req.json());
        const check = await fetch(
          "https://api.paystack.co/integration/payment_session_timeout",
          { headers: { Authorization: `Bearer ${b.secret}` } },
        );
        if (!check.ok)
          return fail("Paystack could not verify these credentials.");
        await query(
          "INSERT INTO merchant_accounts(site_id,secret,delivery) VALUES($1,$2,$3) ON CONFLICT(site_id) DO UPDATE SET secret=$2,delivery=$3,verified=false",
          [id, encrypt(b.secret), b.delivery],
        );
        await audit(u.id, "merchant.connected", id);
        return ok({
          success: true,
          message:
            "Connection saved. Nexoris must approve merchant verification before live checkout.",
        });
      }
    }
    if (kind === "orders") {
      if (method === "GET")
        return ok(
          await query(
            "SELECT id,reference,customer,items,amount,payment_status,fulfilment_status,created_at FROM orders WHERE site_id=$1 ORDER BY created_at DESC",
            [id],
          ),
        );
      if (method === "PATCH") {
        const b = z
          .object({
            status: z.enum([
              "processing",
              "ready_for_pickup",
              "shipped",
              "delivered",
              "completed",
            ]),
          })
          .parse(await req.json());
        const rows = await query(
          "UPDATE orders SET fulfilment_status=$1 WHERE id=$2 AND site_id=$3 AND payment_status='paid' RETURNING id",
          [b.status, recordId, id],
        );
        if (!rows.length) return fail("Only paid orders can be fulfilled.");
        await audit(u.id, "order." + b.status, recordId);
        return ok({ success: true });
      }
    }
    if (kind === "export" && method === "GET")
      return ok({
        site,
        records: await query(
          "SELECT kind,data,created_at FROM records WHERE site_id=$1",
          [id],
        ),
      });
    const kinds = [
      "pages",
      "articles",
      "products",
      "enquiries",
      "support",
      "services",
      "legal",
      "authors",
      "categories",
    ];
    if (!kinds.includes(kind)) return fail("Not found", 404);
    if (kind === "articles" && !entitled(site.tier, "blog"))
      return fail("Blog publishing is available on Growth and Advanced.", 403);
    if (kind === "products" && site.category !== "commerce")
      return fail("Products require an e-Commerce website.", 403);
    if (method === "GET")
      return ok(
        await query(
          "SELECT * FROM records WHERE site_id=$1 AND kind=$2 ORDER BY created_at DESC",
          [id, kind],
        ),
      );
    if (method === "DELETE" && recordId) {
      if (kind === "enquiries")
        return fail("Enquiries cannot be deleted through this endpoint", 403);
      await query(
        "DELETE FROM records WHERE id=$1 AND site_id=$2 AND kind=$3",
        [recordId, id, kind],
      );
      await audit(u.id, `${kind}.deleted`, id);
      return ok({ success: true });
    }
    if (method === "POST" || method === "PATCH") {
      if (kind === "enquiries") return fail("Read only", 403);
      const b = contentSchema.parse(await req.json());
      b.sections?.forEach((section) => {
        section.body = safeHtml(section.body);
      });
      for (const assetId of referencedMediaIds(b)) {
        if (
          !(
            await query("SELECT id FROM media WHERE id=$1 AND site_id=$2", [
              assetId,
              id,
            ])
          ).length
        )
          return fail("Choose images from this website’s media library", 403);
      }
      let author = u.name;
      if (b.authorId) {
        const [a] = await query<{ data: { title: string } }>(
          "SELECT data FROM records WHERE id=$1 AND site_id=$2 AND kind='authors'",
          [b.authorId, id],
        );
        if (!a) return fail("Choose an author from this website", 403);
        author = a.data.title;
      }
      const data = {
        ...b,
        body: safeHtml(b.body),
        author,
        updatedAt: new Date().toISOString(),
      };
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT id FROM sites WHERE id=$1 FOR UPDATE", [id]);
        if (method === "POST") {
          const cap = (await siteEntitlements(site)).limits[
            kind as "pages" | "articles" | "products"
          ];
          const {
            rows: [count],
          } = await client.query(
            "SELECT count(*)::int AS total FROM records WHERE site_id=$1 AND kind=$2",
            [id, kind],
          );
          if (cap !== undefined && count.total >= cap) {
            await client.query("ROLLBACK");
            return fail(`Your ${site.tier} plan allows ${cap} ${kind}.`, 403);
          }
          await client.query(
            "INSERT INTO records(site_id,kind,data) VALUES($1,$2,$3)",
            [id, kind, JSON.stringify(data)],
          );
        } else {
          const result = await client.query(
            "UPDATE records SET data=$1 WHERE id=$2 AND site_id=$3 AND kind=$4",
            [JSON.stringify(data), recordId, id, kind],
          );
          if (!result.rowCount) {
            await client.query("ROLLBACK");
            return fail("Record not found", 404);
          }
        }
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      await audit(u.id, `${kind}.saved`, id);
      return ok({ success: true });
    }
    return fail("Method not allowed", 405);
  } catch (error) {
    if (error instanceof z.ZodError)
      return fail(error.issues[0]?.message || "Invalid input");
    if ((error as { code?: string }).code === "23505")
      return fail("This email or website address is already in use.", 409);
    console.error(
      "API request failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return fail(
      process.env.DATABASE_URL
        ? "Unable to complete this request. Please try again."
        : "Database is not configured. Follow the README setup steps.",
      503,
    );
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
