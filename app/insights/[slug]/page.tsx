import { notFound } from "next/navigation";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { marketingContent, marketingSettings } from "@/lib/marketing";
import { safeHtml, plainText } from "@/lib/content";
import { jsonLd } from "@/lib/model";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = (await marketingContent("articles")).find(
    (a) => a.data.slug === slug,
  );
  if (!a) return {};
  const settings = await marketingSettings();
  return {
    title: a.data.title,
    description: plainText(a.data.body).slice(0, 160),
    robots: {
      index: settings.index !== false && a.data.indexing?.index !== false,
      follow: settings.follow !== false && a.data.indexing?.follow !== false,
    },
    alternates: { canonical: "/insights/" + slug },
    openGraph: {
      type: "article",
      title: a.data.title,
      description: plainText(a.data.body).slice(0, 160),
      images: a.data.image ? [a.data.image] : [],
      authors: [a.data.author],
      publishedTime: a.created_at,
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = (await marketingContent("articles")).find(
    (a) => a.data.slug === slug,
  );
  if (!a) notFound();
  return (
    <MarketingShell>
      <main id="main" className="article-page">
        <Link href="/insights">← All insights</Link>
        <span className="eyebrow">{a.data.category}</span>
        <h1>{a.data.title}</h1>
        <p>
          By{" "}
          {a.data.authorId ? (
            <Link href={"/authors/" + a.data.authorId}>{a.data.author}</Link>
          ) : (
            a.data.author
          )}{" "}
          · {new Date(a.created_at).toLocaleDateString("en-NG")}
        </p>
        {a.data.image && (
          <img
            className="editorial-photo"
            src={a.data.image}
            alt={a.data.imageAlt || ""}
            width={1440}
            height={960}
          />
        )}
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: safeHtml(a.data.body) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: a.data.title,
              datePublished: a.created_at,
              dateModified: a.data.updatedAt || a.created_at,
              author: { "@type": "Person", name: a.data.author },
              publisher: {
                "@type": "Organization",
                name: "Omnyvox",
                url: process.env.APP_URL,
              },
              mainEntityOfPage: `${process.env.APP_URL}/insights/${slug}`,
              ...(a.data.image
                ? { image: new URL(a.data.image, process.env.APP_URL).href }
                : {}),
            }),
          }}
        />
      </main>
    </MarketingShell>
  );
}
