import { randomInt, createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, pool, audit } from "./db";
import { rateLimit } from "./auth";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export async function formSettings(
  req: NextRequest,
  siteId: string,
  actor: string,
  action?: string,
) {
  await query(
    "INSERT INTO site_forms(site_id) VALUES($1) ON CONFLICT DO NOTHING",
    [siteId],
  );
  if (req.method === "GET") {
    const [form] = await query(
      "SELECT id,active_email,pending_email,verified_at,sent_at FROM site_forms WHERE site_id=$1",
      [siteId],
    );
    const delivery = await query(
      "SELECT id,recipient,sent_at,attempts,next_attempt_at,last_error FROM email_outbox WHERE site_id=$1 ORDER BY created_at DESC LIMIT 30",
      [siteId],
    );
    return NextResponse.json({
      form,
      delivery,
      mailConfigured: !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM,
    });
  }
  if (req.method !== "POST")
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [form],
    } = await client.query(
      "SELECT * FROM site_forms WHERE site_id=$1 FOR UPDATE",
      [siteId],
    );
    if (action === "verify") {
      const { code } = z
        .object({ code: z.string().regex(/^\d{6}$/) })
        .parse(await req.json());
      if (
        !form.verification_hash ||
        form.attempts >= 5 ||
        new Date(form.expires_at) <= new Date()
      ) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "The code expired. Request another code." },
          { status: 400 },
        );
      }
      await client.query(
        "UPDATE site_forms SET attempts=attempts+1 WHERE site_id=$1",
        [siteId],
      );
      if (
        !timingSafeEqual(
          Buffer.from(form.verification_hash, "hex"),
          Buffer.from(hash(form.id + ":" + code), "hex"),
        )
      ) {
        await client.query("COMMIT");
        return NextResponse.json(
          { error: "Incorrect verification code" },
          { status: 400 },
        );
      }
      await client.query(
        "UPDATE site_forms SET active_email=pending_email,pending_email=NULL,verification_hash=NULL,verified_at=now() WHERE site_id=$1",
        [siteId],
      );
      await client.query(
        "INSERT INTO audit(actor,action,target) VALUES($1,'form.recipient.verified',$2)",
        [actor, siteId],
      );
    } else {
      const { email } = z
        .object({ email: z.email().max(254) })
        .parse(await req.json());
      await rateLimit("recipient:" + siteId);
      if (
        form.sent_at &&
        new Date(form.sent_at).getTime() > Date.now() - 60000
      ) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Wait one minute before requesting another code." },
          { status: 429 },
        );
      }
      const code = String(randomInt(100000, 1000000));
      await client.query(
        "UPDATE site_forms SET pending_email=$1,verification_hash=$2,expires_at=now()+interval '15 minutes',attempts=0,sent_at=now() WHERE site_id=$3",
        [email, hash(form.id + ":" + code), siteId],
      );
      await client.query(
        "INSERT INTO email_outbox(recipient,subject,body,site_id) VALUES($1,'Verify your website enquiry inbox',$2,$3)",
        [
          email,
          `Your Omnyvox verification code is ${code}. It expires in 15 minutes. Use it only in your website's Forms & enquiries settings. Ignore this email if you did not request this change.`,
          siteId,
        ],
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function submitEnquiry(req: NextRequest) {
  const b = z
    .object({
      site: z.uuid(),
      formId: z.uuid(),
      name: z.string().trim().min(2).max(100),
      email: z.email().max(254),
      message: z.string().trim().min(5).max(4000),
      website: z.literal(""),
      consent: z.literal("on"),
    })
    .parse(await req.json());
  await rateLimit(`enquiry:site:${b.site}`);
  await rateLimit(`enquiry:email:${hash(b.email.toLowerCase())}`);
  const [form] = await query<{ active_email: string; slug: string }>(
    "SELECT f.active_email,s.slug FROM site_forms f JOIN effective_sites s ON s.id=f.site_id WHERE f.id=$1 AND f.site_id=$2 AND f.verified_at IS NOT NULL AND s.status='published' AND s.subscription='active' AND s.service_until>now()",
    [b.formId, b.site],
  );
  if (!form?.active_email)
    return NextResponse.json(
      { error: "This contact form is not available yet." },
      { status: 404 },
    );
  const host = req.headers.get("x-omnyvox-host");
  if (host) {
    const domain = await query(
      "SELECT id FROM domains WHERE site_id=$1 AND hostname=$2 AND active=true AND verified_at IS NOT NULL",
      [b.site, host],
    );
    if (
      host !== `${form.slug}.${process.env.PLATFORM_DOMAIN}` &&
      !domain.length
    )
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [record],
    } = await client.query(
      "INSERT INTO records(site_id,kind,data) VALUES($1,'enquiries',$2) RETURNING id",
      [
        b.site,
        JSON.stringify({
          name: b.name,
          email: b.email,
          message: b.message,
          status: "new",
          formId: b.formId,
          consentedAt: new Date().toISOString(),
        }),
      ],
    );
    await client.query(
      "INSERT INTO email_outbox(recipient,subject,body,site_id,enquiry_id,reply_to) VALUES($1,'New website enquiry',$2,$3,$4,$5)",
      [
        form.active_email,
        `${b.name} (${b.email})\n\n${b.message}`,
        b.site,
        record.id,
        b.email,
      ],
    );
    await client.query("COMMIT");
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
