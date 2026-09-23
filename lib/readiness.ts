import { query } from "./db";
import { initialSections, usesSampleImage, type Site } from "./model";
import { siteEntitlements } from "./entitlements";
import { legalSetFor, policies } from "./legal-policies";
export async function readiness(site: Site) {
  const issues: string[] = [];
  const [profile] = await query<{
    data: {
      summary?: string;
      phone?: string;
      factsConfirmed?: boolean;
      fulfilment?: "physical" | "digital" | "services";
    };
  }>("SELECT data FROM business_profiles WHERE site_id=$1", [site.id]);
  if (
    !profile?.data.factsConfirmed ||
    !profile.data.summary?.trim() ||
    !profile.data.phone?.trim()
  )
    issues.push(
      "Complete and confirm your business summary and contact phone in Business information.",
    );
  const [form] = await query<{ active_email: string }>(
    "SELECT active_email FROM site_forms WHERE site_id=$1 AND verified_at IS NOT NULL",
    [site.id],
  );
  if (!form?.active_email)
    issues.push("Verify your enquiry recipient in Forms & enquiries.");
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    issues.push("The platform administrator must configure email delivery.");
  const policy = await query<{
    data: { policyType?: string; policyReviewed?: boolean };
  }>(
    "SELECT data FROM records WHERE site_id=$1 AND kind='legal' AND data->>'status'='published'",
    [site.id],
  );
  const required = legalSetFor(
    site.industry_id,
    site.category,
    profile?.data.fulfilment,
  );
  for (const type of required)
    if (
      !policy.some((p) => p.data.policyType === type && p.data.policyReviewed)
    )
      issues.push(`Review and publish your ${policies[type].title.toLowerCase()}.`);
  if (site.category === "commerce") {
    if (
      !(
        await query(
          "SELECT site_id FROM merchant_accounts WHERE site_id=$1 AND verified=true",
          [site.id],
        )
      ).length
    )
      issues.push("Complete merchant payment approval.");
    if (
      !(
        await query(
          "SELECT id FROM records WHERE site_id=$1 AND kind='products' AND data->>'status'='published' LIMIT 1",
          [site.id],
        )
      ).length
    )
      issues.push("Add at least one real published product.");
  }
  const [count] = await query<{ total: number }>(
    "SELECT count(*)::int AS total FROM records WHERE site_id=$1 AND kind='pages' AND data->>'status'='published'",
    [site.id],
  );
  if (count.total + 1 > (await siteEntitlements(site)).limits.pages)
    issues.push(
      "The homepage and published custom pages exceed your plan allowance.",
    );
  const visible = site.data.sections.filter((s) => s.visible);
  const unreviewed = visible.filter(
    (s) =>
      s.sample ||
      /tell your customers|share your story|lorem ipsum|your (first|second|third) service/i.test(
        s.body,
      ) ||
      initialSections.some(
        (d) => d.id === s.id && d.title === s.title && d.body === s.body,
      ),
  );
  if (unreviewed.length)
    issues.push(
      `Review the starter content in: ${unreviewed.map((s) => s.title || s.type).join(", ")}.`,
    );
  if (visible.some(usesSampleImage))
    issues.push("Replace the sample images on your homepage with your own photographs.");
  return { ready: issues.length === 0, issues, contentPages: count.total + 1 };
}
