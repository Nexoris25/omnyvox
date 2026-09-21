import pg from "pg";
const hostname = process.argv[2];
if (!hostname || !process.env.DATABASE_URL)
  throw new Error(
    "Usage: node scripts/activate-domain.mjs verified.example.com. Run only after configuring HTTPS and host routing.",
  );
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(
  "UPDATE domains SET active=true WHERE hostname=$1 AND verified_at IS NOT NULL RETURNING id",
  [hostname],
);
if (!rows.length)
  throw new Error(
    "The domain must have verified DNS ownership before activation.",
  );
await pool.query(
  "INSERT INTO audit(actor,action,target) VALUES('operator','domain.activated',$1)",
  [rows[0].id],
);
console.log("Verified domain activated.");
await pool.end();
