import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers";
import { query } from "./db";
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || !/^[a-f0-9]{128}$/i.test(hash)) return false;
  return timingSafeEqual(
    Buffer.from(hash, "hex"),
    scryptSync(password, salt, 64),
  );
}
export async function user() {
  const token = (await cookies()).get("omnyvox_session")?.value;
  if (!token) return null;
  const [u] = await query<{
    id: string;
    name: string;
    email: string;
    role: string;
    email_verified: boolean;
    mfa_enabled: boolean;
    mfa_verified: boolean;
    session_id: string;
  }>(
    "SELECT u.id,u.name,u.email,u.role,u.email_verified,u.mfa_secret IS NOT NULL AS mfa_enabled,s.mfa_verified,s.id AS session_id FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=$1 AND s.expires>now()",
    [createHash("sha256").update(token).digest("hex")],
  );
  return u ?? null;
}
export async function session(id: string, mfaVerified = false) {
  const token = randomBytes(32).toString("hex");
  await query(
    "INSERT INTO sessions(token,user_id,expires,mfa_verified) VALUES($1,$2,now()+interval '7 days',$3)",
    [createHash("sha256").update(token).digest("hex"), id, mfaVerified],
  );
  (await cookies()).set("omnyvox_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}
export async function rateLimit(key: string) {
  const [r] = await query<{ count: number }>(
    "INSERT INTO rate_limits(key,count,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.count+1 END, reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.reset_at END RETURNING count",
    [key],
  );
  if (r.count > 30)
    throw new Error("Too many attempts. Please try again in 15 minutes.");
}
