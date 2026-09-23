import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, query } from "../lib/db";
import {
  confirmSubscriptionPayment,
  setRenewal,
  billingLifecycle,
  processRenewals,
} from "../lib/subscription-billing";
if (!/\/omnyvox_test(?:\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Use only omnyvox_test");
process.env.PAYSTACK_SECRET_KEY = "sk_test_isolated_transport";
let count = 0;
const check = (value: unknown, label: string) => {
  assert.ok(value, label);
  count++;
  console.log("PASS", label);
};
try {
  const email = `billing-${randomUUID()}@example.test`;
  const [u] = await query<{ id: string }>(
    "INSERT INTO users(name,email,password) VALUES('Billing QA',$1,'not-a-login-password') RETURNING id",
    [email],
  );
  const [s] = await query<{ id: string }>(
    "INSERT INTO sites(owner_id,name,slug,category,tier,data) VALUES($1,'Billing QA',$2,'corporate','growth','{}') RETURNING id",
    [u.id, "bill-" + randomUUID().slice(0, 8)],
  );
  const ref = "sub_" + randomUUID();
  await query(
    "INSERT INTO billing(reference,site_id,amount,interval,bonus_months,payer_email) VALUES($1,$2,120000,'annual',1,$3)",
    [ref, s.id, email],
  );
  const payment = {
    reference: ref,
    status: "success",
    amount: 120000,
    currency: "NGN",
    customer: { email },
    authorization: {
      reusable: true,
      authorization_code: "AUTH_TEST_ONLY",
      last4: "1234",
      brand: "Visa",
    },
  };
  await assert.rejects(() =>
    confirmSubscriptionPayment({ ...payment, amount: 1 }),
  );
  check(true, "mismatched subscription payment rejected");
  await Promise.all([
    confirmSubscriptionPayment(payment),
    confirmSubscriptionPayment(payment),
  ]);
  let history = await billingLifecycle(s.id);
  check(
    history.invoices.length === 1,
    "duplicate payment creates exactly one invoice",
  );
  check(
    history.settings.auto_renew === false,
    "successful payment never opts subscriber into recurring billing",
  );
  check(
    history.settings.payment_available === true,
    "reusable authorization available without exposing credentials",
  );
  check(
    !JSON.stringify(history).includes("AUTH_TEST_ONLY"),
    "billing history excludes authorization secret",
  );
  const invoice = history.invoices[0] as any;
  check(
    new Date(invoice.period_end).getTime() -
      new Date(invoice.period_start).getTime() >
      390 * 86400000,
    "annual offer extends service by bonus month",
  );
  await assert.rejects(() => setRenewal(s.id, randomUUID(), true));
  check(true, "another account cannot authorize this subscription");
  await setRenewal(s.id, u.id, true);
  history = await billingLifecycle(s.id);
  check(
    history.settings.auto_renew === true,
    "explicit consent enables saved renewal terms",
  );
  await query(
    "UPDATE sites SET paid_until=now()-interval '1 minute' WHERE id=$1",
    [s.id],
  );
  let charges = 0;
  const transport = (async (_url: unknown, options: RequestInit) => {
    charges++;
    const b = JSON.parse(String(options.body));
    return new Response(
      JSON.stringify({
        status: true,
        data: {
          reference: b.reference,
          status: "success",
          amount: b.amount,
          currency: b.currency,
        },
      }),
    );
  }) as typeof fetch;
  await processRenewals(transport);
  check(charges === 1, "due subscription submits one authorised renewal");
  history = await billingLifecycle(s.id);
  check(
    history.invoices.length === 2,
    "renewal creates invoice and extends subscription",
  );
  await processRenewals(transport);
  check(charges === 1, "already renewed period is not charged again");
  await setRenewal(s.id, u.id, false);
  const [before] = await query<{ paid_until: string }>(
    "SELECT paid_until FROM sites WHERE id=$1",
    [s.id],
  );
  await processRenewals(transport);
  const [after] = await query<{ paid_until: string }>(
    "SELECT paid_until FROM sites WHERE id=$1",
    [s.id],
  );
  check(
    String(before.paid_until) === String(after.paid_until) && charges === 1,
    "cancellation preserves paid access and prevents future charges",
  );
  await setRenewal(s.id, u.id, true);
  await query(
    "UPDATE sites SET paid_until=now()-interval '1 minute' WHERE id=$1",
    [s.id],
  );
  let submits = 0,
    verifies = 0;
  const timeout = (async (url: unknown) => {
    if (String(url).includes("charge_authorization")) submits++;
    else verifies++;
    throw Error("uncertain provider response");
  }) as typeof fetch;
  await processRenewals(timeout);
  await query(
    "UPDATE subscription_preferences SET next_attempt_at=now() WHERE site_id=$1",
    [s.id],
  );
  await processRenewals(timeout);
  check(
    submits === 1 && verifies === 1,
    "uncertain charge is verified using the same reference instead of charged twice",
  );
  await setRenewal(s.id, u.id, false);
  console.log(`${count} billing lifecycle checks passed`);
} finally {
  await pool.end();
}
