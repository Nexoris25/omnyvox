import { migrate } from "./migrate";
import { pool } from "../lib/db";
try {
  await migrate();
} finally {
  await pool.end();
}
