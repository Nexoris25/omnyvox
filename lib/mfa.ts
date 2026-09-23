import { pool } from "./db";
import { decrypt } from "./commerce";
import { recoveryHash, verifyTotp } from "./totp";
/** Locked row makes each TOTP time step and recovery code usable only once. */
export async function consumeSecondFactor(id: string, code: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      rows: [u],
    } = await client.query(
      "SELECT mfa_secret,mfa_last_counter,recovery_hashes FROM users WHERE id=$1 FOR UPDATE",
      [id],
    );
    if (!u?.mfa_secret) {
      await client.query("ROLLBACK");
      return false;
    }
    const counter = verifyTotp(
      decrypt(u.mfa_secret),
      code,
      Number(u.mfa_last_counter),
    );
    const hash = recoveryHash(code);
    if (counter !== null)
      await client.query("UPDATE users SET mfa_last_counter=$2 WHERE id=$1", [
        id,
        counter,
      ]);
    else if (u.recovery_hashes.includes(hash))
      await client.query(
        "UPDATE users SET recovery_hashes=recovery_hashes-$2 WHERE id=$1",
        [id, hash],
      );
    else {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
