import { pool } from "../lib/db";
import { publishScheduled } from "../lib/publishing";
import { cleanupStorage } from "../lib/media-storage";
import { reconcileOrders } from "../lib/payment-recovery";
import { processRenewals } from "../lib/subscription-billing";
import { dispatchRecoveryLinks } from '../lib/account-recovery';
try {
  console.log({
    published: await publishScheduled(),
    storage: await cleanupStorage(),
    payments: await reconcileOrders(),
    renewals: await processRenewals(),
    recoveryLinks:await dispatchRecoveryLinks(),
  });
} finally {
  await pool.end();
}
