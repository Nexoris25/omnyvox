import { marketingMetadata } from "@/lib/marketing";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { marketingContent } from "@/lib/marketing";
import { InsightCard } from "@/components/insight-card";
export async function generateMetadata() {
  return marketingMetadata(
    "Insights & guides",
    "Practical advice for building a clearer business website and a more useful online store.",
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const category = (await searchParams).category;
  const [all, authors, defined] = await Promise.all([
    marketingContent("articles"),
    marketingContent("authors"),
    marketingContent("categories"),
  ]);
  const counts: Record<string, number> = {};
  for (const a of all) counts[a.data.category] = (counts[a.data.category] || 0) + 1;
  // Only categories defined in the CMS that have published articles.
  const categories = defined.filter((c) => counts[c.data.slug]);
  const active = categories.some((c) => c.data.slug === category) ? category : undefined;
  const articles = all.filter((a) => !active || a.data.category === active);
  return (
    <MarketingShell>
      <main id="main" className="marketing-page">
        <header className="page-intro">
          <span className="eyebrow">THE OMNYVOX JOURNAL</span>
          <h1>
            A little clarity.
            <br />A better next step.
          </h1>
          <p>
            Practical guides to telling your story, running your website and
            making it easier for customers to choose you.
          </p>
        </header>
        <nav className="category-links" aria-label="Filter insights by category">
          <Link href="/insights" aria-current={!active ? "page" : undefined}>
            All insights <span>{all.length}</span>
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={"/insights?category=" + encodeURIComponent(c.data.slug)}
              aria-current={active === c.data.slug ? "page" : undefined}
            >
              {c.data.title} <span>{counts[c.data.slug]}</span>
            </Link>
          ))}
        </nav>
        <div className="insights-grid">
          {articles.map((a) => (
            <InsightCard
              key={a.id}
              article={a}
              author={authors.find((author) => author.id === a.data.authorId)}
            />
          ))}
        </div>
        {!articles.length && (
          <p>There are no published guides in this category yet.</p>
        )}
      </main>
    </MarketingShell>
  );
}
