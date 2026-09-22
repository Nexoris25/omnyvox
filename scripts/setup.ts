import { readFile } from "node:fs/promises";
import { pool } from "../lib/db";
import { migrate } from "./migrate";
await pool.query(await readFile("infrastructure/schema.sql", "utf8"));
await migrate();
console.log(
  "Database ready. Six unpriced plans created; configure commercial prices before billing.",
);
await pool.end();
