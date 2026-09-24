import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { marketingPages } from "@/lib/marketing-pages";
import { MarketingShell } from "@/components/marketing-shell";
import { marketingMetadata } from "@/lib/marketing";
import { query } from "@/lib/db";
import { safeHtml } from "@/lib/content";
type Props = { params: Promise<{ marketing: string[] }> };
const eyebrows: Record<string, string> = {
  "corporate-websites": "Business websites",
  "ecommerce-websites": "Online stores",
  features: "Features",
  "how-it-works": "How it works",
  "website-setup": "Website setup",
  "professional-services": "Professional services",
  about: "About us",
  help: "Help centre",
  guides: "Guides",
  faq: "FAQs",
  security: "Security & privacy",
};
export async function generateMetadata({ params }: Props) {
  const key = (await params).marketing.join("/");
  const page = marketingPages[key];
  if (!page) return { robots: { index: false } };
  const [override] = await query<{
    data: {
      title: string;
      seoTitle?: string;
      description?: string;
      socialImage?: string;
      indexing?: { index: boolean; follow: boolean };
    };
  }>(
    "SELECT data FROM marketing_records WHERE kind='pages' AND data->>'slug'=$1 AND data->>'status'='published'",
    [key.replaceAll("/", "-")],
  );
  const title = override?.data.seoTitle || override?.data.title || page.title;
  const description = override?.data.description || page.description;
  const metadata = await marketingMetadata(title, description);
  return {
    ...metadata,
    robots: {
      index: metadata.robots.index && override?.data.indexing?.index !== false,
      follow:
        metadata.robots.follow && override?.data.indexing?.follow !== false,
    },
    openGraph: {
      ...metadata.openGraph,
      images: [override?.data.socialImage || "/social.webp"],
    },
  };
}
export default async function Page({ params }: Props) {
  const key = (await params).marketing.join("/"),
    page = marketingPages[key];
  if (!page) notFound();
  const [override] = await query<{
    data: { title: string; description?: string; body: string };
  }>(
    "SELECT data FROM marketing_records WHERE kind='pages' AND data->>'slug'=$1 AND data->>'status'='published'",
    [key.replaceAll("/", "-")],
  );
  const secondary: [string, string] | undefined = page.cta
    ? page.cta.secondary
    : ["Compare plans", "/pricing"];
  return (
    <MarketingShell>
      <main id="main" className="marketing-page">
        <header className="page-intro">
          <span className="eyebrow">{eyebrows[key.split("/")[0]] || "Omnyvox"}</span>
          <h1>{override?.data.title || page.title}</h1>
          <p>{override?.data.description || page.description}</p>
        </header>
        {override ? (
          <article
            className="rich-content panel panel-body"
            dangerouslySetInnerHTML={{ __html: safeHtml(override.data.body) }}
          />
        ) : (
          <div className="feature-editorial">
            {page.sections.map((sec, i) => (
              <section key={sec.title}>
                <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
                <h2>{sec.title}</h2>
                {sec.body && <p>{sec.body}</p>}
                {sec.points && (
                  <ul className="feature-points">
                    {sec.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
        {!!page.links?.length && (
          <nav className="marketing-related" aria-label="Related pages">
            {page.links.map((l) => (
              <Link key={l.href} href={l.href}>
                <b>{l.label}</b>
                <span>{l.text}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        )}
        <section className="marketing-cta">
          <h2>{page.cta?.title || "Find the right starting point."}</h2>
          <p>{page.cta?.body || "Explore the templates, compare plans or talk to our team."}</p>
          <div className="section-ctas">
            <Link className="button" href={page.cta?.primary[1] || "/templates"}>
              {page.cta?.primary[0] || "Explore templates"}
            </Link>
            {secondary && (
              <Link className="button secondary" href={secondary[1]}>
                {secondary[0]}
              </Link>
            )}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
