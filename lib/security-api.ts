import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool, query } from "./db";
import { hashPassword, verifyPassword, rateLimit, session } from "./auth";
import { encrypt, decrypt } from "./commerce";
import { newTotpSecret, verifyTotp, recoveryCodes, recoveryHash } from "./totp";
import { consumeSecondFactor } from "./mfa";
import { passwordSchema } from "./password";
type User = {
  id: string;
  email: string;
  role: string;
  session_id: string;
  mfa_enabled: boolean;
  mfa_verified: boolean;
};
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function securityApi(req: NextRequest, u: User, action?: string) {
  if (req.method === "GET")
    return json({
      mfaEnabled: u.mfa_enabled,
      adminRequiresMfa: u.role === "super_admin",
      currentSession: u.session_id,
      sessions: await query(
        "SELECT id,created_at,expires,mfa_verified FROM sessions WHERE user_id=$1 AND expires>now() ORDER BY created_at DESC",
        [u.id],
      ),
    });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  await rateLimit("security:" + u.id);
  const b = z
    .object({
      password: z.string().max(128),
      code: z.string().max(32).default(""),
      newPassword: z.string().max(128).optional(),
      confirmPassword: z.string().max(128).optional(),
      sessionId: z.uuid().optional(),
    })
    .parse(await req.json());
  const [account] = await query<{ password: string }>(
    "SELECT password FROM users WHERE id=$1",
    [u.id],
  );
  if (!account || !verifyPassword(b.password, account.password))
    return json({ error: "Your current password is incorrect." }, 403);
  if (u.mfa_enabled && !(await consumeSecondFactor(u.id, b.code)))
    return json(
      { error: "Enter a fresh authenticator code or unused recovery code." },
      403,
    );
  if (action === "setup") {
    if (u.mfa_enabled)
      return json(
        { error: "Two-factor authentication is already enabled." },
        409,
      );
    const secret = newTotpSecret();
    await query(
      "UPDATE users SET mfa_pending=$2,mfa_pending_until=now()+interval '10 minutes' WHERE id=$1 AND mfa_secret IS NULL",
      [u.id, encrypt(secret)],
    );
    return json({
      secret,
      uri: `otpauth://totp/${encodeURIComponent("Omnyvox:" + u.email)}?secret=${secret}&issuer=Omnyvox&algorithm=SHA1&digits=6&period=30`,
    });
  }
  const client = await pool.connect();
  let codes: string[] | undefined;
  let rotated = false;
  try {
    await client.query("BEGIN");
    const {
      rows: [current],
    } = await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [
      u.id,
    ]);
    if (
      current.password !== account.password ||
      !!current.mfa_secret !== u.mfa_enabled
    ) {
      await client.query("ROLLBACK");
      return json({ error: "Security settings changed. Sign in again." }, 409);
    }
    if (action === "enable") {
      if (
        current.mfa_secret ||
        !current.mfa_pending ||
        new Date(current.mfa_pending_until) <= new Date()
      ) {
        await client.query("ROLLBACK");
        return json({ error: "Start authenticator setup again." }, 409);
      }
      const counter = verifyTotp(decrypt(current.mfa_pending), b.code);
      if (counter === null) {
        await client.query("ROLLBACK");
        return json({ error: "Incorrect authenticator code." }, 400);
      }
      codes = recoveryCodes();
      await client.query(
        "UPDATE users SET mfa_secret=mfa_pending,mfa_pending=NULL,mfa_pending_until=NULL,mfa_last_counter=$2,recovery_hashes=$3 WHERE id=$1",
        [u.id, counter, JSON.stringify(codes.map(recoveryHash))],
      );
      rotated = true;
    } else if (action === "recovery-codes") {
      if (!current.mfa_secret) {
        await client.query("ROLLBACK");
        return json({ error: "Enable two-factor authentication first." }, 409);
      }
      codes = recoveryCodes();
      await client.query("UPDATE users SET recovery_hashes=$2 WHERE id=$1", [
        u.id,
        JSON.stringify(codes.map(recoveryHash)),
      ]);
      rotated = true;
    } else if (action === "disable") {
      if (u.role === "super_admin") {
        await client.query("ROLLBACK");
        return json(
          {
            error:
              "Administrators must keep two-factor authentication enabled.",
          },
          403,
        );
      }
      await client.query(
        "UPDATE users SET mfa_secret=NULL,mfa_pending=NULL,recovery_hashes='[]',mfa_last_counter=-1 WHERE id=$1",
        [u.id],
      );
      rotated = true;
    } else if (action === "password") {
      const next = passwordSchema.parse(b.newPassword);
      if (next !== b.confirmPassword) {
        await client.query("ROLLBACK");
        return json({ error: "Passwords must match." }, 400);
      }
      await client.query("UPDATE users SET password=$2 WHERE id=$1", [
        u.id,
        hashPassword(next),
      ]);
      rotated = true;
    } else if (action === "revoke") {
      if (!b.sessionId) {
        await client.query("ROLLBACK");
        return json({ error: "Choose a session." }, 400);
      }
      await client.query("DELETE FROM sessions WHERE id=$1 AND user_id=$2", [
        b.sessionId,
        u.id,
      ]);
    } else if (action === "revoke-others") {
      await client.query("DELETE FROM sessions WHERE user_id=$1 AND id<>$2", [
        u.id,
        u.session_id,
      ]);
    } else {
      await client.query("ROLLBACK");
      return json({ error: "Not found" }, 404);
    }
    if (rotated)
      await client.query("DELETE FROM sessions WHERE user_id=$1", [u.id]);
    await client.query(
      "INSERT INTO audit(actor,action,target) VALUES($1,$2,$1)",
      [u.id, "security." + action],
    );
    await client.query(
      "INSERT INTO email_outbox(recipient,subject,body) VALUES($1,'Your Omnyvox security settings changed',$2)",
      [
        u.email,
        `Account security action: ${action}. If this was not you, reset your password and contact Omnyvox support.`,
      ],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  if (rotated)
    await session(
      u.id,
      action === "enable" || (u.mfa_enabled && action !== "disable"),
    );
  return json({ success: true, recoveryCodes: codes });
}
