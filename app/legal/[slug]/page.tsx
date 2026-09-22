import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing-shell";
import { marketingContent, marketingSettings } from "@/lib/marketing";
import { safeHtml } from "@/lib/content";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = (await marketingContent("legal")).find((a) => a.data.slug === slug);
  const settings = await marketingSettings();
  return {
    title: a?.data.title || "Page not found",
    robots: {
      index: settings.index !== false && a?.data.indexing?.index !== false,
      follow: settings.follow !== false && a?.data.indexing?.follow !== false,
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = (await marketingContent("legal")).find((a) => a.data.slug === slug);
  if (!a) notFound();
  return (
    <MarketingShell>
      <main id="main" className="article-page">
        <h1>{a.data.title}</h1>
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: safeHtml(a.data.body) }}
        />
      </main>
    </MarketingShell>
  );
}
