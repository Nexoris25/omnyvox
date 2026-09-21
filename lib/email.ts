import { randomBytes, createHash } from "node:crypto";
import { query } from "./db";
export async function queueAccountEmail(
  id: string,
  email: string,
  purpose: "verify" | "reset",
) {
  const token = randomBytes(32).toString("hex");
  await query(
    "INSERT INTO auth_tokens(token,user_id,purpose,expires) VALUES($1,$2,$3,now()+interval '1 hour')",
    [createHash("sha256").update(token).digest("hex"), id, purpose],
  );
  const url = `${process.env.APP_URL}/${purpose === "verify" ? "verify" : "reset-password"}?token=${token}`;
  await query(
    "INSERT INTO email_outbox(recipient,subject,body) VALUES($1,$2,$3)",
    [
      email,
      purpose === "verify"
        ? "Verify your Omnyvox email"
        : "Reset your Omnyvox password",
      `Use this link within one hour to ${purpose === "verify" ? "verify your email address" : "reset your password"}:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
    ],
  );
}
