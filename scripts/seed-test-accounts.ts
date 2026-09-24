/**
 * Seeds two sign-in accounts for manual testing:
 *   - a platform super administrator
 *   - a subscriber with a verified business and an active Advanced website
 * The password comes from SEED_PASSWORD so it is never stored in the repo.
 *
 *   SEED_PASSWORD=... npm run db:seed-test-accounts
 *
 * Refuses to run when NODE_ENV=production.
 */
import { pool, query } from "../lib/db";
import { hashPassword } from "../lib/auth";
import { kitFor } from "../lib/industry-kits";
import { provisionBlueprint } from "../lib/blueprints";
import type { Site } from "../lib/model";

const ADMIN = process.env.SEED_ADMIN_EMAIL || "chinedu@omnyvox.com";
const SUBSCRIBER = process.env.SEED_SUBSCRIBER_EMAIL || "chinedu@nexoristech.com";
const password = process.env.SEED_PASSWORD;
if (!password || password.length < 8) throw Error("Set SEED_PASSWORD (at least 8 characters).");
if (process.env.NODE_ENV === "production") throw Error("Test accounts are never seeded in production.");

async function upsertUser(email: string, name: string, role: string) {
  const [u] = await query<{ id: string }>(
    `INSERT INTO users(name,email,password,phone,role,email_verified)
     VALUES($1,$2,$3,'+2348000000000',$4,true)
     ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,role=EXCLUDED.role,email_verified=true,disabled_at=NULL,disabled_reason=NULL
     RETURNING id`,
    [name, email, hashPassword(password!), role],
  );
  const versions = await query<{ id: string }>(
    "SELECT DISTINCT ON (slug) id FROM platform_policy_versions WHERE slug IN ('terms','privacy') ORDER BY slug,sequence DESC",
  );
  for (const v of versions)
    await query(
      "INSERT INTO account_consents(user_id,policy_version) SELECT $1,$2 WHERE NOT EXISTS(SELECT 1 FROM account_consents WHERE user_id=$1 AND policy_version=$2)",
      [u.id, v.id],
    );
  return u.id;
}

try {
  const adminId = await upsertUser(ADMIN, "Chinedu (Omnyvox admin)", "super_admin");
  console.log(`Super admin ready: ${ADMIN} (${adminId})`);

  const ownerId = await upsertUser(SUBSCRIBER, "Chinedu", "owner");
  await query(
    `INSERT INTO business_verifications(user_id,business_name,cac_number,company_type,status,registered_name,review_note,verified_via,reviewed_at)
     VALUES($1,'NEXORIS TECHNOLOGIES LTD','RC0000000','RC','verified','NEXORIS TECHNOLOGIES LTD','Seeded test account for QA.','manual',now())
     ON CONFLICT(user_id) DO UPDATE SET status='verified'`,
    [ownerId],
  );
  const [existing] = await query<{ id: string }>("SELECT id FROM sites WHERE owner_id=$1 LIMIT 1", [ownerId]);
  if (existing) {
    await query(
      "UPDATE sites SET tier='advanced',subscription='active',paid_until=now()+interval '1 year',billing_interval='annual' WHERE owner_id=$1",
      [ownerId],
    );
    console.log(`Subscriber ready: ${SUBSCRIBER} (existing websites kept on Advanced, active for a year)`);
  } else {
    const kit = kitFor("consulting", "corporate");
    const brand = {
      name: "Nexoris Test Consulting",
      businessNature: "general",
      description: kit.description,
      ...kit.palette,
      email: SUBSCRIBER,
      categoryUrls: false,
      logo: "",
      navCta: kit.navCta,
    };
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const {
        rows: [site],
      } = await client.query<Site>(
        `INSERT INTO sites(owner_id,name,slug,category,tier,data,industry_id,subscription,paid_until,billing_interval)
         VALUES($1,$2,$3,'corporate','advanced',$4,'consulting','active',now()+interval '1 year','annual') RETURNING *`,
        [
          ownerId,
          brand.name,
          `nexoris-test-${Math.random().toString(36).slice(2, 6)}`,
          JSON.stringify({ brand, sections: structuredClone(kit.sections), template: kit.template }),
        ],
      );
      await provisionBlueprint(client, site);
      await client.query("COMMIT");
      console.log(`Subscriber ready: ${SUBSCRIBER} with website "${brand.name}" (/sites/${site.slug}), Advanced plan, active for a year`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
