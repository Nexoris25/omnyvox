"use client";
import { useEffect, useState } from "react";
export function PlanPrice({ tier }: { tier: string }) {
  const [price, setPrice] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((plans) => {
        if (Array.isArray(plans))
          setPrice(
            plans.find((p) => p.id === `corporate-${tier}`)?.monthly || null,
          );
      })
      .catch(() => {});
  }, [tier]);
  return (
    <div className="price-pending">
      {price
        ? new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0,
          }).format(price / 100)
        : "Launch pricing"}
      <span>{price ? "per month · corporate website" : "Available soon"}</span>
    </div>
  );
}
