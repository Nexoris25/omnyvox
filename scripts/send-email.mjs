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
      "SELECT * FROM email_outbox WHERE sent_at IS NULL AND attempts<5 AND next_attempt_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
    );
    if (!email) {
      await client.query("COMMIT");
      break;
    }
    let response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
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
          ...(email.reply_to ? { reply_to: email.reply_to } : {}),
        }),
      });
    } catch {
      /* Persist a redacted retry state, never email or credentials. */
    }
    if (!response?.ok) {
      await client.query(
        "UPDATE email_outbox SET attempts=attempts+1,last_error=$2,next_attempt_at=now()+make_interval(secs=>LEAST(3600,60*power(2,attempts)::int)) WHERE id=$1",
        [
          email.id,
          response
            ? `Provider returned ${response.status}`
            : "Mail provider timeout or connection failure",
        ],
      );
      await client.query("COMMIT");
      continue;
    }
    await client.query(
      "UPDATE email_outbox SET sent_at=now(),body=$2,attempts=attempts+1,last_error=NULL,provider_id=$3 WHERE id=$1",
      [
        email.id,
        "[accepted by email provider]",
        (await response.json()).id || null,
      ],
    );
    await client.query("COMMIT");
  }
  console.log("Pending transactional emails processed.");
} finally {
  client.release();
  await pool.end();
}
