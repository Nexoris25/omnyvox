import { notFound } from "next/navigation";
import { InsightCard, AuthorAvatar } from "@/components/insight-card";
import { MarketingShell } from "@/components/marketing-shell";
import { marketingContent } from "@/lib/marketing";
import { safeHtml } from "@/lib/content";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const all = await marketingContent();
  const author = all.find((a) => a.kind === "authors" && a.id === id);
  if (!author) notFound();
  return (
    <MarketingShell>
      <main id="main" className="article-page">
        <span className="eyebrow">CONTRIBUTOR</span>
        <AuthorAvatar author={author} name={author.data.title} />
        <h1>{author.data.title}</h1>
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: safeHtml(author.data.body) }}
        />
        <h2>Latest insights</h2>
        <div className="insights-grid">
          {all
            .filter((a) => a.kind === "articles" && a.data.authorId === id)
            .map((a) => (
              <InsightCard key={a.id} article={a} author={author} />
            ))}
        </div>
      </main>
    </MarketingShell>
  );
}
