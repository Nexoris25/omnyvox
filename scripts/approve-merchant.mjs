import pg from "pg";
const site = process.argv[2],
  reason = process.argv[3];
if (!site || !reason || !process.env.DATABASE_URL)
  throw new Error(
    'Usage: node scripts/approve-merchant.mjs WEBSITE_UUID "verification evidence reference"',
  );
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(
  "UPDATE merchant_accounts SET verified=true WHERE site_id=$1 RETURNING site_id",
  [site],
);
if (!rows.length) throw new Error("Connect the merchant account first.");
await pool.query(
  "INSERT INTO audit(actor,action,target) VALUES('operator',$1,$2)",
  ["merchant.approved: " + reason, site],
);
console.log("Merchant review approval recorded.");
await pool.end();
