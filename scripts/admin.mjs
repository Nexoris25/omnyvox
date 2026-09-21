import pg from "pg";
const email = process.argv[2];
if (!email || !process.env.DATABASE_URL)
  throw new Error(
    "Usage: DATABASE_URL=... node scripts/admin.mjs owner@example.com",
  );
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const result = await pool.query(
  "UPDATE users SET role='super_admin' WHERE email=$1 RETURNING id",
  [email.toLowerCase()],
);
if (!result.rowCount)
  throw new Error(
    "Register this account before assigning the administrator role.",
  );
await pool.query(
  "INSERT INTO audit(actor,action,target) VALUES('operator','admin.granted',$1)",
  [result.rows[0].id],
);
console.log("Administrator role assigned to the specified account.");
await pool.end();
