import { manageMedia } from "./media-management";
import { createMedia } from "./media-storage";
import { platformAdmin } from "./admin-api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sharp from "sharp";
import { query, audit } from "./db";
import { queueOtp, verifyOtp } from "./otp";
import { contentSchema } from "./cms-schema";
import { safeHtml, referencedMediaIds } from "./content";
import { imagePath, safeLink } from "./model";
import { canInternal } from "./permissions";
import { rateLimit } from "./auth";
import { cacInput, lookupCac, needsReview, type CacRecord } from "./kyb";
type Account = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  role: string;
};
const response = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });
export async function extensionsApi(
  req: NextRequest,
  u: Account,
  path: string[],
): Promise<Response | null> {
  const admin = await platformAdmin(req, u, path);
  if (admin) return admin;
  const [area, kind, id] = path;
  if (area === "onboarding") {
    if (req.method === "GET") {
      const [business] = await query(
        "SELECT business_name,cac_number,company_type,status,registered_name,review_note,verified_via,registry,submitted_at FROM business_verifications WHERE user_id=$1",
        [u.id],
      );
      return response({
        email: u.email,
        emailVerified: u.email_verified,
        business: business || null,
      });
    }
    if (kind === "otp" && req.method === "POST") {
      const { code } = z
        .object({ code: z.string().regex(/^\d{6}$/) })
        .parse(await req.json());
      return (await verifyOtp(u.id, code))
        ? response({ success: true })
        : response(
            {
              error:
                "Invalid or expired code. A code allows five attempts; request a new one if needed.",
            },
            400,
          );
    }
    if (kind === "resend" && req.method === "POST") {
      if (u.email_verified) return response({ success: true });
      return (await queueOtp(u.id, u.email))
        ? response({ success: true })
        : response(
            { error: "Wait 60 seconds before requesting another code." },
            429,
          );
    }
    if (kind === "cac-lookup" && req.method === "POST") {
      const b = cacInput.parse(await req.json());
      if (!u.email_verified)
        return response(
          { error: "Verify your email before verifying your business." },
          403,
        );
      await rateLimit(`cac-lookup:${u.id}`);
      const result = await lookupCac(b);
      if (result.status === "found") {
        await query(
          "INSERT INTO kyb_lookups(user_id,reference,record,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes') ON CONFLICT(user_id) DO UPDATE SET reference=$2,record=$3,expires_at=now()+interval '30 minutes'",
          [u.id, b.reference, JSON.stringify(result.record)],
        );
        await audit(u.id, "kyb.lookup.found", u.id);
      }
      return response(
        result.status === "found"
          ? { status: "found", record: result.record }
          : result.status === "not_found"
            ? { status: "not_found" }
            : { status: "unavailable" },
      );
    }
    if (kind === "business" && req.method === "POST") {
      const raw = await req.json();
      const b = cacInput.parse(raw);
      const { consent, manual } = z
        .object({ consent: z.literal(true), manual: z.boolean().default(false) })
        .parse(raw);
      if (!u.email_verified)
        return response(
          { error: "Verify your email before submitting business details." },
          403,
        );
      const [existing] = await query<{ status: string }>(
        "SELECT status FROM business_verifications WHERE user_id=$1",
        [u.id],
      );
      if (existing?.status === "verified")
        return response(
          {
            error:
              "Verified business details cannot be changed without a new review. Contact support.",
          },
          409,
        );
      void consent;
      // The registered name only ever comes from a registry lookup made by
      // this server for this account and CAC number.
      const [lookup] = await query<{ record: CacRecord }>(
        "SELECT record FROM kyb_lookups WHERE user_id=$1 AND reference=$2 AND expires_at>now()",
        [u.id, b.reference],
      );
      if (!lookup && !manual)
        return response(
          { error: "Look up your CAC number and confirm the registered name first." },
          409,
        );
      if (lookup) {
        const review = needsReview(lookup.record);
        await query(
          "INSERT INTO business_verifications(user_id,business_name,cac_number,company_type,status,registered_name,review_note,verified_via,registry,reviewed_at) VALUES($1,$2,$3,$4,$5,$2,$6,'registry',$7,CASE WHEN $5='verified' THEN now() END) ON CONFLICT(user_id) DO UPDATE SET business_name=$2,cac_number=$3,company_type=$4,status=$5,registered_name=$2,review_note=$6,verified_via='registry',registry=$7,reviewed_by=NULL,reviewed_at=CASE WHEN $5='verified' THEN now() END,submitted_at=now()",
          [
            u.id,
            lookup.record.name,
            b.reference,
            b.companyType,
            review ? "pending" : "verified",
            review
              ? `The CAC registry lists this entity as "${lookup.record.entityStatus}". Our compliance team will review it.`
              : `Matched on the CAC registry (${lookup.record.provider}) on ${new Date().toISOString().slice(0, 10)}.`,
            JSON.stringify(lookup.record),
          ],
        );
        await query("DELETE FROM kyb_lookups WHERE user_id=$1", [u.id]);
        await audit(u.id, review ? "kyb.submitted" : "kyb.verified.registry", u.id);
        return response({ success: true, status: review ? "pending" : "verified" });
      }
      // Registry unavailable: staff confirm the registered name manually.
      await query(
        "INSERT INTO business_verifications(user_id,business_name,cac_number,company_type,status,verified_via) VALUES($1,NULL,$2,$3,'pending','manual') ON CONFLICT(user_id) DO UPDATE SET business_name=NULL,cac_number=$2,company_type=$3,status='pending',registered_name=NULL,review_note=NULL,reviewed_by=NULL,reviewed_at=NULL,verified_via='manual',registry=NULL,submitted_at=now()",
        [u.id, b.reference, b.companyType],
      );
      await audit(u.id, "kyb.submitted.manual", u.id);
      return response({ success: true, status: "pending" });
    }
    return response({ error: "Not found" }, 404);
  }
  if (area === "kyb-admin") {
    if (!canInternal(u.role,path,req.method))
      return response({ error: "Administrator access required" }, 403);
    if (req.method === "GET")
      return response(
        await query(
          "SELECT b.*,u.email FROM business_verifications b JOIN users u ON u.id=b.user_id ORDER BY submitted_at DESC",
        ),
      );
    if (req.method === "PATCH") {
      const b = z
        .object({
          userId: z.uuid(),
          status: z.enum(["verified", "rejected"]),
          registeredName: z.string().min(2).max(160),
          note: z.string().min(10).max(2000),
        })
        .parse(await req.json());
      const rows = await query(
        "UPDATE business_verifications SET status=$1,registered_name=$2,business_name=COALESCE(business_name,$2),review_note=$3,reviewed_by=$4,reviewed_at=now() WHERE user_id=$5 AND status='pending' RETURNING user_id",
        [b.status, b.registeredName, b.note, u.id, b.userId],
      );
      if (!rows.length)
        return response({ error: "No pending submission to review" }, 409);
      await audit(u.id, "kyb." + b.status, b.userId);
      return response({ success: true });
    }
  }
  if (area === "marketing") {
    if (!canInternal(u.role,path,req.method))
      return response({ error: "Administrator access required" }, 403);
    if (kind === "settings") {
      if (req.method === "GET") {
        const [s] = await query<{ data: unknown }>(
          "SELECT data FROM marketing_settings WHERE id=true",
        );
        return response(s?.data || {});
      }
      if (req.method === "PATCH") {
        const b = z
          .object({
            socials: z
              .record(
                z.enum([
                  "facebook",
                  "instagram",
                  "linkedin",
                  "x",
                  "youtube",
                  "tiktok",
                  "whatsapp",
                ]),
                safeLink,
              )
              .optional(),
            index: z.boolean().default(true),
            follow: z.boolean().default(true),
            robots: z.string().max(4000).default(""),
          })
          .parse(await req.json());
        await query("UPDATE marketing_settings SET data=$1 WHERE id=true", [
          JSON.stringify(b),
        ]);
        await audit(u.id, "marketing.settings.saved", "marketing");
        return response({ success: true });
      }
    }
    if (kind === "media" && ["PATCH", "DELETE"].includes(req.method))
      return manageMedia(req, id, null, u.id);
    if (kind === "media") {
      if (req.method === "GET")
        return response(
          await query(
            "SELECT id,alt,size,name,folder FROM media WHERE site_id IS NULL ORDER BY created_at DESC",
          ),
        );
      if (req.method === "POST") {
        const f = await req.formData(),
          file = f.get("file");
        if (
          !(file instanceof File) ||
          file.size > 5 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        )
          return response(
            { error: "Choose a JPEG, PNG or WebP image under 5 MB" },
            400,
          );
        const bytes = await sharp(Buffer.from(await file.arrayBuffer()), {
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
        const m = await createMedia(
          null,
          bytes,
          String(f.get("alt") || "").slice(0, 300),
          file.name,
        );
        await audit(u.id, "marketing.media.uploaded", m.id);
        return response({ url: `/api/media/${m.id}` }, 201);
      }
    }
    if (!["pages", "articles", "categories", "authors", "legal", "testimonials"].includes(kind))
      return response({ error: "Not found" }, 404);
    if (req.method === "GET")
      return response(
        await query(
          "SELECT * FROM marketing_records WHERE kind=$1 ORDER BY created_at DESC",
          [kind],
        ),
      );
    if (req.method === "DELETE") {
      const used = await query(
        "SELECT id FROM marketing_records WHERE data->>'authorId'=$1",
        [id],
      );
      if (kind === "authors" && used.length)
        return response({ error: "This author is used by an article." }, 409);
      await query("DELETE FROM marketing_records WHERE id=$1 AND kind=$2", [
        id,
        kind,
      ]);
      await audit(u.id, "marketing." + kind + ".deleted", id);
      return response({ success: true });
    }
    if (req.method === "POST" || req.method === "PATCH") {
      const b = contentSchema
        .extend({
          image: imagePath
            .or(
              z.enum([
                "/marketing-homepage-guide.webp",
                "/marketing-store-guide.webp",
                "/marketing-insights-guide.webp",
                "/marketing-contact.webp",
                "/marketing-founders.webp",
              ]),
            )
            .default(""),
        })
        .parse(await req.json());
      if (kind === "testimonials") {
        // Only real, consented testimonials may appear on the website.
        if (b.status === "published" && !b.consentConfirmed)
          return response(
            { error: "Confirm the customer agreed to be quoted before publishing." },
            400,
          );
        b.category = "general";
      } else delete b.consentConfirmed;
      let author = u.name;
      if (b.authorId) {
        const [a] = await query<{ data: { title: string } }>(
          "SELECT data FROM marketing_records WHERE id=$1 AND kind='authors'",
          [b.authorId],
        );
        if (!a) return response({ error: "Choose an existing author" }, 400);
        author = a.data.title;
      }
      for (const assetId of referencedMediaIds(b)) {
        if (
          !(
            await query(
              "SELECT id FROM media WHERE id=$1 AND site_id IS NULL",
              [assetId],
            )
          ).length
        )
          return response(
            { error: "Choose an image from the marketing library" },
            403,
          );
      }
      const data = {
        ...b,
        body: safeHtml(b.body),
        author,
        updatedAt: new Date().toISOString(),
      };
      if (req.method === "POST")
        await query("INSERT INTO marketing_records(kind,data) VALUES($1,$2)", [
          kind,
          JSON.stringify(data),
        ]);
      else
        await query(
          "UPDATE marketing_records SET data=$1 WHERE id=$2 AND kind=$3",
          [JSON.stringify(data), id, kind],
        );
      await audit(u.id, "marketing." + kind + ".saved", id || "new");
      return response({ success: true });
    }
  }
  return null;
}
