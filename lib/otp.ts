import {
  randomInt,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { pool } from "./db";
export async function queueOtp(id: string, email: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [id]);
    const {
      rows: [previous],
    } = await client.query("SELECT sent_at FROM email_otps WHERE user_id=$1", [
      id,
    ]);
    if (previous && Date.now() - new Date(previous.sent_at).getTime() < 60000) {
      await client.query("ROLLBACK");
      return false;
    }
    const code = randomInt(0, 1000000).toString().padStart(6, "0"),
      salt = randomBytes(16).toString("hex");
    const hash = scryptSync(code, salt, 32).toString("hex");
    await client.query(
      "INSERT INTO email_otps(user_id,hash,salt,expires) VALUES($1,$2,$3,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET hash=$2,salt=$3,expires=now()+interval '10 minutes',attempts=0,sent_at=now()",
      [id, hash, salt],
    );
    await client.query(
      "INSERT INTO email_outbox(recipient,subject,body) VALUES($1,$2,$3)",
      [
        email,
        "Your Omnyvox verification code",
        `Your verification code is ${code}. It expires in 10 minutes. Never share this code with anyone. If you did not request it, ignore this email.`,
      ],
    );
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function verifyOtp(id: string, code: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [otp],
    } = await client.query(
      "SELECT * FROM email_otps WHERE user_id=$1 FOR UPDATE",
      [id],
    );
    if (!otp || new Date(otp.expires) < new Date() || otp.attempts >= 5) {
      await client.query("ROLLBACK");
      return false;
    }
    if (
      !timingSafeEqual(
        Buffer.from(otp.hash, "hex"),
        scryptSync(code, otp.salt, 32),
      )
    ) {
      await client.query(
        "UPDATE email_otps SET attempts=attempts+1 WHERE user_id=$1",
        [id],
      );
      await client.query("COMMIT");
      return false;
    }
    await client.query("DELETE FROM email_otps WHERE user_id=$1", [id]);
    await client.query("UPDATE users SET email_verified=true WHERE id=$1", [
      id,
    ]);
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
