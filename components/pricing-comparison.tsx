"use client";
import { useState } from "react";
import Link from "next/link";
import { billingQuote } from "@/lib/billing-quote";
import { limits, tiers } from "@/lib/model";
export type PricingPlan = {
  id: string;
  category: string;
  tier: string;
  monthly: number | null;
  annual: number | null;
  annual_discount: number;
  bonus_months: number;
  entitlements?: { pages?: number; articles?: number; products?: number };
};
export function PricingComparison({
  plans,
  initialCategory = "corporate",
}: {
  plans: PricingPlan[];
  initialCategory?: string;
}) {
  const [category, setCategory] = useState(initialCategory),
    [annual, setAnnual] = useState(false);
  return (
    <>
      <div className="pricing-controls">
        <div role="group" aria-label="Website type">
          <button
            className={category === "corporate" ? "active" : ""}
            onClick={() => setCategory("corporate")}
          >
            Business website
          </button>
          <button
            className={category === "commerce" ? "active" : ""}
            onClick={() => setCategory("commerce")}
          >
            Online store
          </button>
        </div>
        <label>
          <input
            type="checkbox"
            checked={annual}
            onChange={(e) => setAnnual(e.target.checked)}
          />{" "}
          Pay yearly
        </label>
      </div>
      <div className="pricing-cards">
        {tiers.map((tier, i) => {
          const p = plans.find(
            (p) => p.category === category && p.tier === tier,
          );
          const amount = p
            ? billingQuote(p, annual ? "annual" : "monthly").amount
            : null;
          const cap = { ...limits[tier], ...p?.entitlements };
          return (
            <article
              key={tier}
              className={"plan-card " + (i === 1 ? "recommended" : "")}
            >
              <span className="eyebrow">
                {i === 1
                  ? "ROOM TO GROW"
                  : i === 0
                    ? "GET ESTABLISHED"
                    : "BUILD FURTHER"}
              </span>
              <h2>{tier[0].toUpperCase() + tier.slice(1)}</h2>
              <p>
                {
                  [
                    "For a focused introduction to your business.",
                    "For businesses publishing content and growing their reach.",
                    "For businesses managing several websites and larger catalogues.",
                  ][i]
                }
              </p>
              <div className="plan-price">
                {amount
                  ? new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(amount / 100)
                  : "Contact us"}
                {amount && <small> / {annual ? "year" : "month"}</small>}
              </div>
              {annual && p && (
                <p>
                  {p.annual_discount > 0
                    ? `${p.annual_discount}% off the monthly rate when billed yearly. `
                    : ""}
                  {p.bonus_months > 0
                    ? `Pay for 12 months and receive ${p.bonus_months} extra ${p.bonus_months === 1 ? "month" : "months"}.`
                    : ""}
                </p>
              )}
              <ul>
                <li>
                  {cap.websites} {tier === "advanced" ? "websites" : "website"}
                </li>
                <li>Up to {cap.pages} pages per website</li>
                <li>
                  {tier === "basic"
                    ? "Omnyvox subdomain"
                    : "Connect your own domain"}
                </li>
                <li>
                  {cap.articles
                    ? `${cap.articles} insights per website`
                    : "Pages, forms and media library"}
                </li>
                {category === "commerce" && (
                  <li>{cap.products} products per store</li>
                )}
                <li>Brand colours, hosting and SSL</li>
              </ul>
              <Link
                className={"button " + (i === 1 ? "" : "secondary")}
                href={
                  amount
                    ? `/register?tier=${tier}&category=${category}`
                    : "/contact"
                }
              >
                {amount ? "Choose " + tier : "Discuss " + tier} →
              </Link>
            </article>
          );
        })}
      </div>
      <section className="comparison" id="compare">
        <h2>Compare the details.</h2>
        <div className="table-scroll">
          <table>
            <caption>
              Included in each{" "}
              {category === "commerce" ? "online store" : "business website"}{" "}
              plan
            </caption>
            <thead>
              <tr>
                <th>Feature</th>
                {tiers.map((t) => (
                  <th key={t}>{t[0].toUpperCase() + t.slice(1)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Websites", "1", "1", "3"],
                [
                  "Pages per website",
                  ...tiers.map((t) =>
                    String(
                      plans.find((p) => p.category === category && p.tier === t)
                        ?.entitlements?.pages ?? limits[t].pages,
                    ),
                  ),
                ],
                [
                  "Insights per website",
                  ...tiers.map((t) =>
                    String(
                      plans.find((p) => p.category === category && p.tier === t)
                        ?.entitlements?.articles ?? limits[t].articles,
                    ),
                  ),
                ],
                ...(category === "commerce"
                  ? [
                      [
                        "Products per store",
                        ...tiers.map((t) =>
                          String(
                            plans.find(
                              (p) => p.category === category && p.tier === t,
                            )?.entitlements?.products ?? limits[t].products,
                          ),
                        ),
                      ],
                    ]
                  : []),
                ["Custom domain", "—", "Included", "Included"],
                [
                  "YouTube, Vimeo & Cloudinary video embeds",
                  "—",
                  "Included",
                  "Included",
                ],
                ["Sections per page", "15", "15", "15"],
                [
                  "Media library & rich text editor",
                  "Included",
                  "Included",
                  "Included",
                ],
                [
                  "Brand colours & social links",
                  "Included",
                  "Included",
                  "Included",
                ],
                [
                  "Legal pages & contact forms",
                  "Included",
                  "Included",
                  "Included",
                ],
                [
                  "Search & sharing settings",
                  "Included",
                  "Included",
                  "Included",
                ],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((c, i) =>
                    i ? (
                      <td key={i}>{c}</td>
                    ) : (
                      <th key={i} scope="row">
                        {c}
                      </th>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
