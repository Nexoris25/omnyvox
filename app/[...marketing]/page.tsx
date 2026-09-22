import { notFound } from "next/navigation";
import Link from "next/link";
import { marketingPages } from "@/lib/marketing-pages";
import { MarketingShell } from "@/components/marketing-shell";
import { marketingMetadata } from "@/lib/marketing";
import { query } from "@/lib/db";
import { safeHtml } from "@/lib/content";
type Props = { params: Promise<{ marketing: string[] }> };
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
  return (
    <MarketingShell>
      <main id="main" className="marketing-page">
        <header className="page-intro">
          <span className="eyebrow">
            OMNYVOX / {key.split("/")[0].replaceAll("-", " ")}
          </span>
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
            {page.sections.map((s, i) => (
              <section key={s.title}>
                <span className="eyebrow">0{i + 1}</span>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
              </section>
            ))}
          </div>
        )}
        <section className="page-intro">
          <h2>Find the right starting point.</h2>
          <div className="section-ctas">
            <Link className="button" href="/templates">
              Explore templates
            </Link>
            <Link className="button secondary" href="/pricing">
              Compare plans
            </Link>
            <Link href="/contact">Talk to Nexoris →</Link>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
