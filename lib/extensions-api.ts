import { manageMedia } from "./media-management";
import { platformAdmin } from "./admin-api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sharp from "sharp";
import { query, audit } from "./db";
import { queueOtp, verifyOtp } from "./otp";
import { contentSchema } from "./cms-schema";
import { safeHtml, referencedMediaIds } from "./content";
import { imagePath, safeLink } from "./model";
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
        "SELECT business_name,cac_number,status,registered_name,review_note,submitted_at FROM business_verifications WHERE user_id=$1",
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
    if (kind === "business" && req.method === "POST") {
      const b = z
        .object({
          businessName: z.string().min(2).max(160),
          cacNumber: z
            .string()
            .trim()
            .toUpperCase()
            .regex(
              /^(?:RC|BN|IT|LP|LLP)?\s?\d{4,10}$/,
              "Enter a valid CAC number, for example RC1234567",
            ),
          consent: z.literal(true),
        })
        .parse(await req.json());
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
      await query(
        "INSERT INTO business_verifications(user_id,business_name,cac_number) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET business_name=$2,cac_number=$3,status='pending',registered_name=NULL,review_note=NULL,reviewed_by=NULL,reviewed_at=NULL,submitted_at=now()",
        [u.id, b.businessName, b.cacNumber.replace(/\s/g, "")],
      );
      await audit(u.id, "kyb.submitted", u.id);
      return response({ success: true });
    }
    return response({ error: "Not found" }, 404);
  }
  if (area === "kyb-admin") {
    if (u.role !== "super_admin")
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
        "UPDATE business_verifications SET status=$1,registered_name=$2,review_note=$3,reviewed_by=$4,reviewed_at=now() WHERE user_id=$5 AND status='pending' RETURNING user_id",
        [b.status, b.registeredName, b.note, u.id, b.userId],
      );
      if (!rows.length)
        return response({ error: "No pending submission to review" }, 409);
      await audit(u.id, "kyb." + b.status, b.userId);
      return response({ success: true });
    }
  }
  if (area === "marketing") {
    if (u.role !== "super_admin")
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
            "SELECT id,alt,octet_length(bytes) AS size FROM media WHERE site_id IS NULL ORDER BY created_at DESC",
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
        const [m] = await query<{ id: string }>(
          "INSERT INTO media(bytes,alt) VALUES($1,$2) RETURNING id",
          [bytes, String(f.get("alt") || "").slice(0, 300)],
        );
        await audit(u.id, "marketing.media.uploaded", m.id);
        return response({ url: `/api/media/${m.id}` }, 201);
      }
    }
    if (!["articles", "categories", "authors", "legal"].includes(kind))
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
