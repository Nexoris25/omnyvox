import { pool } from "../lib/db";
import { publishScheduled } from "../lib/publishing";
import { cleanupStorage } from "../lib/media-storage";
try {
  console.log({
    published: await publishScheduled(),
    storage: await cleanupStorage(),
  });
} finally {
  await pool.end();
}
