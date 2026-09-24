import { marketingMetadata } from "@/lib/marketing";
import { MarketingShell } from "@/components/marketing-shell";
import { PricingFaq } from "@/components/pricing-faq";
import {
  PricingComparison,
  PricingPlan,
} from "@/components/pricing-comparison";
import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return marketingMetadata(
    "Compare website plans | Omnyvox",
    "Choose the right Omnyvox plan for your business website or online store. Compare features and monthly or yearly billing.",
  );
}
export default async function Page() {
  const plans = await query<PricingPlan>("SELECT * FROM plans ORDER BY id");
  return (
    <MarketingShell>
      <main id="main" className="marketing-page">
        <header className="page-intro">
          <span className="eyebrow">PLANS THAT MAKE SENSE</span>
          <h1>
            Choose what you need.
            <br />
            Leave room for what’s next.
          </h1>
          <p>
            Start with your website type, choose how you’d like to pay, then
            compare the features that matter to your business.
          </p>
          <a className="compare-jump" href="#compare">
            Compare all features ↓
          </a>
        </header>
        <PricingComparison plans={plans} />
        <PricingFaq />
      </main>
    </MarketingShell>
  );
}
