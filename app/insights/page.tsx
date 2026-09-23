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
  const [all, authors] = await Promise.all([
    marketingContent("articles"),
    marketingContent("authors"),
  ]);
  const articles = all.filter((a) => !category || a.data.category === category);
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
        <nav className="category-links" aria-label="Article categories">
          <Link href="/insights">All insights</Link>
          {[...new Set(all.map((a) => a.data.category))].map((c) => (
            <Link key={c} href={"/insights?category=" + encodeURIComponent(c)}>
              {c.replaceAll("-", " ")}
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
