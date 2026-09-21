import pg from "pg";
if (
  !process.env.RESEND_API_KEY ||
  !process.env.EMAIL_FROM ||
  !process.env.DATABASE_URL
)
  throw new Error(
    "Set DATABASE_URL, RESEND_API_KEY, and EMAIL_FROM before running the email worker.",
  );
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  for (let i = 0; i < 100; i++) {
    await client.query("BEGIN");
    const {
      rows: [email],
    } = await client.query(
      "SELECT * FROM email_outbox WHERE sent_at IS NULL ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
    );
    if (!email) {
      await client.query("COMMIT");
      break;
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": email.id,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      }),
    });
    if (!response.ok) {
      await client.query("ROLLBACK");
      throw new Error(
        `Email delivery failed with status ${response.status}; retry this worker later.`,
      );
    }
    await client.query(
      "UPDATE email_outbox SET sent_at=now(),body=$2 WHERE id=$1",
      [email.id, "[delivered]"],
    );
    await client.query("COMMIT");
  }
  console.log("Pending transactional emails processed.");
} finally {
  client.release();
  await pool.end();
}
