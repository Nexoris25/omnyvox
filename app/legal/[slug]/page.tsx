import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing-shell";
import { marketingContent, marketingSettings } from "@/lib/marketing";
import { safeHtml } from "@/lib/content";
import { query } from '@/lib/db';
import { z } from 'zod';
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams:Promise<{version?:string}>;
}) {
  const { slug } = await params;
  const {version}=await searchParams;
  if(version&&!z.uuid().safeParse(version).success)notFound();
  const archived=version?(await query<{title:string;body:string;created_at:string}>('SELECT title,body,created_at FROM platform_policy_versions WHERE id=$1 AND slug=$2',[version,slug]))[0]:undefined;
  const a = version ? archived ? {data:archived} : undefined : (await marketingContent("legal")).find((a) => a.data.slug === slug);
  if (!a) notFound();
  return (
    <MarketingShell>
      <main id="main" className="article-page">
        <h1>{a.data.title}</h1>
        {archived&&<p>Archived policy version published {new Date(archived.created_at).toLocaleDateString('en-NG')}. <a href={'/legal/'+slug}>Read the current version</a>.</p>}
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: safeHtml(a.data.body) }}
        />
      </main>
    </MarketingShell>
  );
}
