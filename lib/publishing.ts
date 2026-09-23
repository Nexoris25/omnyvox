import { pool, query } from "./db";
import { limits } from "./model";
export async function publishScheduled() {
  let published = 0;
  const sites = await query<{ site_id: string }>(
    "SELECT DISTINCT site_id FROM records WHERE data->>'status'='scheduled' AND (data->>'publishAt')::timestamptz<=now() LIMIT 50",
  );
  for (const item of sites) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const locked = await client.query(
        "SELECT id FROM sites WHERE id=$1 FOR UPDATE SKIP LOCKED",
        [item.site_id],
      );
      if (!locked.rowCount) {
        await client.query("ROLLBACK");
        continue;
      }
      const {
        rows: [site],
      } = await client.query(
        "SELECT s.*,p.entitlements FROM effective_sites s LEFT JOIN plans p ON p.id=s.category||'-'||s.tier WHERE s.id=$1",
        [item.site_id],
      );
      if (
        !site ||
        site.tier === "basic" ||
        site.subscription !== "active" ||
        site.status === "suspended" ||
        new Date(site.service_until) <= new Date()
      ) {
        await client.query("ROLLBACK");
        continue;
      }
      const { rows } = await client.query(
        "SELECT * FROM records WHERE site_id=$1 AND data->>'status'='scheduled' AND (data->>'publishAt')::timestamptz<=now() AND kind IN ('pages','articles','legal') ORDER BY created_at FOR UPDATE",
        [item.site_id],
      );
      for (const r of rows) {
        const cap =
          site.entitlements?.[r.kind] ??
          limits[site.tier as keyof typeof limits][
            r.kind as "pages" | "articles"
          ];
        const {
          rows: [count],
        } = await client.query(
          "SELECT count(*)::int AS total FROM records WHERE site_id=$1 AND kind=$2 AND data->>'status'='published'",
          [item.site_id, r.kind],
        );
        if (
          (cap !== undefined &&
            count.total + (r.kind === "pages" ? 1 : 0) >= cap) ||
          (r.kind === "legal" && !r.data.policyReviewed)
        )
          continue;
        await client.query(
          "UPDATE records SET data=data||jsonb_build_object('status','published','updatedAt',now()::text,'revision',COALESCE((data->>'revision')::int,0)+1) WHERE id=$1",
          [r.id],
        );
        await client.query(
          "INSERT INTO audit(actor,action,target) VALUES('system','content.scheduled.published',$1)",
          [r.id],
        );
        published++;
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  return published;
}
