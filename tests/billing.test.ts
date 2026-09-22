import test from "node:test";
import assert from "node:assert/strict";
import { billingQuote } from "../lib/billing-quote";
test("Annual discount uses twelve monthly payments and bonus extends duration", () => {
  assert.deepEqual(
    billingQuote(
      {
        monthly: 100000,
        annual: 1100000,
        annual_discount: 15,
        bonus_months: 1,
      },
      "annual",
    ),
    { amount: 1020000, bonusMonths: 1, months: 13 },
  );
});
test("No annual discount preserves explicit annual price; monthly excludes annual bonuses", () => {
  const p = {
    monthly: 100000,
    annual: 1100000,
    annual_discount: 0,
    bonus_months: 2,
  };
  assert.equal(billingQuote(p, "annual").amount, 1100000);
  assert.deepEqual(billingQuote(p, "monthly"), {
    amount: 100000,
    months: 1,
    bonusMonths: 0,
  });
});
