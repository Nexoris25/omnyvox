import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool, query, audit } from "./db";
import {
  aiSettingsSchema,
  aiEnabled,
  contentHash,
  slotSchema,
} from "./local-ai";
import type { Site } from "./model";
import { rateLimit } from "./auth";
export async function aiApi(
  req: NextRequest,
  site: Site,
  actor: string,
  jobId?: string,
) {
  const [row] = await query<{ data: unknown }>(
    "SELECT data FROM ai_settings WHERE id=true",
  );
  const settings = aiSettingsSchema.parse(row.data);
  if (req.method === "GET")
    return NextResponse.json({
      available: aiEnabled(settings),
      jobs: await query(
        "SELECT id,slot,state,result,error,created_at FROM ai_jobs WHERE site_id=$1 ORDER BY created_at DESC LIMIT 20",
        [site.id],
      ),
    });
  if (req.method !== "POST")
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  await rateLimit("ai:" + actor);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(730220)");
    if (jobId) {
      const { action, reviewed } = z
        .object({
          action: z.enum(["cancel", "accept"]),
          reviewed: z.boolean().optional(),
        })
        .parse(await req.json());
      const {
        rows: [job],
      } = await client.query(
        "SELECT * FROM ai_jobs WHERE id=$1 AND site_id=$2 FOR UPDATE",
        [z.uuid().parse(jobId), site.id],
      );
      if (!job) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      }
      if (action === "cancel") {
        await client.query(
          "UPDATE ai_jobs SET state='cancelled',finished_at=now() WHERE id=$1 AND state IN ('queued','running','completed')",
          [jobId],
        );
      } else {
        if (job.state !== "completed" || !reviewed) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "Review the completed draft before accepting it" },
            { status: 409 },
          );
        }
        const {
          rows: [current],
        } = await client.query(
          "SELECT data FROM sites WHERE id=$1 AND owner_id=$2 FOR UPDATE",
          [site.id, actor],
        );
        if (!current || contentHash(current.data) !== job.base_hash) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              error:
                "Your website changed after this draft was requested. Generate another draft to preserve your edits.",
            },
            { status: 409 },
          );
        }
        const [section, field] = job.slot.split(".");
        await client.query(
          "INSERT INTO site_versions(site_id,data) VALUES($1,$2)",
          [site.id, JSON.stringify(current.data)],
        );
        const target = current.data.sections.find(
          (s: { id: string }) => s.id === section,
        );
        if (!target) throw Error("Target section no longer exists");
        target[field] = job.result.text;
        await client.query("UPDATE sites SET data=$1 WHERE id=$2", [
          JSON.stringify(current.data),
          site.id,
        ]);
        await client.query("UPDATE ai_jobs SET state='accepted' WHERE id=$1", [
          jobId,
        ]);
        await client.query(
          "INSERT INTO audit(actor,action,target) VALUES($1,'ai.draft.accepted',$2)",
          [actor, jobId],
        );
      }
    } else {
      const b = z
        .object({ slot: slotSchema, requestKey: z.uuid() })
        .parse(await req.json());
      const existing = await client.query(
        "SELECT id FROM ai_jobs WHERE site_id=$1 AND request_key=$2",
        [site.id, b.requestKey],
      );
      if (existing.rowCount) {
        await client.query("COMMIT");
        return NextResponse.json(existing.rows[0]);
      }
      if (!aiEnabled(settings)) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            error:
              "AI generation temporarily unavailable. Continue editing manually.",
          },
          { status: 503 },
        );
      }
      if (!site.data.sections.some((s) => s.id === b.slot.split(".")[0])) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "This template does not contain that content slot" },
          { status: 400 },
        );
      }
      const {
        rows: [profile],
      } = await client.query(
        "SELECT data FROM business_profiles WHERE site_id=$1",
        [site.id],
      );
      if (!profile?.data.factsConfirmed || !profile.data.summary) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Confirm your business facts before requesting a draft" },
          { status: 409 },
        );
      }
      const {
        rows: [usage],
      } = await client.query(
        "SELECT count(*) FILTER(WHERE site_id=$1 AND created_at>=date_trunc('month',now()) AND state IN ('queued','running','completed','accepted'))::int AS monthly,count(*) FILTER(WHERE state IN ('queued','running'))::int AS queued,count(*) FILTER(WHERE site_id=$1 AND created_at>=now()-interval '1 day')::int AS daily FROM ai_jobs",
        [site.id],
      );
      if (
        usage.monthly >= settings.monthly[site.tier] ||
        usage.queued >= 10 ||
        usage.daily >= 10
      ) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            error:
              "Generation allowance or queue limit reached. Manual editing remains available.",
            code: "RESOURCE_LIMIT_REACHED",
          },
          { status: 429 },
        );
      }
      const {
        rows: [job],
      } = await client.query(
        "INSERT INTO ai_jobs(site_id,actor,request_key,slot,base_hash) VALUES($1,$2,$3,$4,$5) RETURNING id",
        [site.id, actor, b.requestKey, b.slot, contentHash(site.data)],
      );
      await client.query("COMMIT");
      return NextResponse.json(job, { status: 202 });
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
