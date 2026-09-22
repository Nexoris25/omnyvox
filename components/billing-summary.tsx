"use client";
import { useEffect, useState } from "react";
import { billingQuote } from "@/lib/billing-quote";
import { PricingPlan } from "./pricing-comparison";
export function BillingSummary({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<PricingPlan>();
  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p)) setPlan(p.find((p) => p.id === planId));
      });
  }, [planId]);
  if (!plan) return null;
  const money = (v: number | null) =>
    v
      ? new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: "NGN",
        }).format(v / 100)
      : "Not configured";
  const annual = billingQuote(plan, "annual").amount;
  return (
    <div className="notice">
      <p>
        Monthly: <strong>{money(plan.monthly)}</strong>
      </p>
      <p>
        Yearly: <strong>{money(annual)}</strong>
        {plan.annual_discount > 0
          ? ` · ${plan.annual_discount}% off 12 monthly payments`
          : ""}
      </p>
      {plan.bonus_months > 0 && (
        <p>
          Yearly offer: pay for 12 months and receive {plan.bonus_months} extra{" "}
          {plan.bonus_months === 1 ? "month" : "months"}.
        </p>
      )}
      <small>
        Your chosen amount and offer are fixed when checkout starts.
      </small>
    </div>
  );
}
