import pg from "pg";
const site = process.argv[2],
  reason = process.argv[3];
if (!site || !reason || !process.env.DATABASE_URL)
  throw new Error(
    'Usage: node scripts/approve-merchant.mjs WEBSITE_UUID "verification evidence reference"',
  );
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(
  "UPDATE merchant_accounts m SET verified=true FROM sites s WHERE m.site_id=s.id AND m.site_id=$1 AND EXISTS(SELECT 1 FROM business_verifications b WHERE b.user_id=s.owner_id AND b.status='verified') RETURNING m.site_id",
  [site],
);
if (!rows.length)
  throw new Error(
    "Connect the merchant account and approve its business verification first.",
  );
await pool.query(
  "INSERT INTO audit(actor,action,target) VALUES('operator',$1,$2)",
  ["merchant.approved: " + reason, site],
);
console.log("Merchant review approval recorded.");
await pool.end();
