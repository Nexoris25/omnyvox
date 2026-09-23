import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteRenderer } from "@/components/site-renderer";
import { templates, templateManifests } from "@/lib/templates";
import { previewSite, templatePreviewIndustry } from "@/lib/industry-kits";
import TemplateGallery from "../page";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;
  const gallery = ["corporate", "ecommerce"].includes(template);
  return {
    title: gallery
      ? `${template === "corporate" ? "Corporate" : "E-commerce"} website templates`
      : "Template preview",
    robots: { index: gallery, follow: gallery },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;
  if (["corporate", "ecommerce"].includes(template))
    return (
      <TemplateGallery searchParams={Promise.resolve({ type: template })} />
    );
  const t = templates.find((t) => t.id === template);
  if (!t) notFound();
  const category = templateManifests[t.id as keyof typeof templateManifests]
    .category as "corporate" | "commerce";
  const preview = previewSite(
    templatePreviewIndustry[t.id as keyof typeof templatePreviewIndustry],
    category,
    { name: t.business },
  );
  return (
    <main id="main">
      <div className="template-preview-bar">
        <Link href="/templates">← All templates</Link>
        <strong>{t.name} preview</strong>
        <Link
          className="button small"
          href={
            "/register?template=" +
            t.id +
            "&category=" +
            templateManifests[t.id as keyof typeof templateManifests].category
          }
        >
          Use this template
        </Link>
      </div>
      <p className="template-sample-note">
        Sample content for a fictitious business. Your website uses your own
        verified details.
      </p>
      <SiteRenderer
        data={preview.data}
        contact={preview.contact}
        legal={preview.legal}
        videoEnabled
      />
    </main>
  );
}
