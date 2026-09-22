import { pool } from "../lib/db";
import { aiSettingsSchema, generateLocal, aiEnabled } from "../lib/local-ai";
const client = await pool.connect();
try {
  const {
    rows: [lock],
  } = await client.query("SELECT pg_try_advisory_lock(730221) AS locked");
  if (lock.locked) {
    await client.query(
      "UPDATE ai_jobs SET state='failed',error='Worker interrupted. Your website was not changed.',finished_at=now() WHERE state='running' AND started_at<now()-interval '5 minutes'",
    );
    const {
      rows: [config],
    } = await client.query("SELECT data FROM ai_settings WHERE id=true");
    const settings = aiSettingsSchema.parse(config.data);
    if (aiEnabled(settings)) {
      const {
        rows: [job],
      } = await client.query(
        "UPDATE ai_jobs SET state='running',started_at=now() WHERE id=(SELECT id FROM ai_jobs WHERE state='queued' ORDER BY created_at LIMIT 1) RETURNING *",
      );
      if (job) {
        try {
          const {
            rows: [site],
          } = await client.query(
            "SELECT s.name,s.industry_id,p.data FROM sites s JOIN business_profiles p ON p.site_id=s.id WHERE s.id=$1 AND s.owner_id=$2 AND s.status<>'suspended'",
            [job.site_id, job.actor],
          );
          if (!site?.data.factsConfirmed)
            throw Error("Business facts are not confirmed");
          // Only factual writing inputs; no private routing addresses or arbitrary prompts.
          const facts = {
            name: site.name,
            industry: site.industry_id,
            summary: site.data.summary,
            services: site.data.services,
            audience: site.data.audience,
            city: site.data.city,
          };
          const result = await generateLocal(settings, facts, job.slot);
          await client.query(
            "UPDATE ai_jobs SET state='completed',result=$1,model_digest=$2,finished_at=now() WHERE id=$3 AND state='running'",
            [JSON.stringify(result), settings.digest, job.id],
          );
        } catch {
          await client.query(
            "UPDATE ai_jobs SET state='failed',error='Draft generation unavailable or output failed review checks. Your website was not changed. Retry or edit manually.',finished_at=now() WHERE id=$1 AND state='running'",
            [job.id],
          );
        }
      }
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(730221)");
  client.release();
  await pool.end();
}
