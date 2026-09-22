import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing-shell";
import {
  PricingComparison,
  type PricingPlan,
} from "@/components/pricing-comparison";
import { query } from "@/lib/db";
export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!["corporate", "ecommerce"].includes(category)) notFound();
  return (
    <MarketingShell>
      <main id="main" className="marketing-page">
        <header className="page-intro">
          <span className="eyebrow">COMPARE PLANS</span>
          <h1>
            {category === "corporate"
              ? "A plan for your business website."
              : "A plan for your online store."}
          </h1>
          <p>
            Compare published content allowances, website features and billing
            options.
          </p>
        </header>
        <PricingComparison
          plans={await query<PricingPlan>("SELECT * FROM plans ORDER BY id")}
          initialCategory={category === "ecommerce" ? "commerce" : "corporate"}
        />
      </main>
    </MarketingShell>
  );
}
