import { Pool } from "pg";
const globalDb = globalThis as unknown as { pool?: Pool };
export const pool =
  globalDb.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== "production") globalDb.pool = pool;
export async function query<T = Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  return (await pool.query(sql, values)).rows;
}
export async function audit(actor: string, action: string, target: string) {
  await query("INSERT INTO audit(actor,action,target) VALUES($1,$2,$3)", [
    actor,
    action,
    target,
  ]);
}
