export function billingQuote(
  plan: {
    monthly: number | null;
    annual: number | null;
    annual_discount: number;
    bonus_months: number;
  },
  interval: "monthly" | "annual",
) {
  const amount =
    interval === "annual" && plan.annual_discount > 0 && plan.monthly
      ? Math.round(plan.monthly * 12 * (1 - plan.annual_discount / 100))
      : plan[interval];
  return {
    amount,
    bonusMonths: interval === "annual" ? plan.bonus_months : 0,
    months: interval === "annual" ? 12 + plan.bonus_months : 1,
  };
}
