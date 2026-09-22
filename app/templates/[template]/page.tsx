import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteRenderer } from "@/components/site-renderer";
import { templates, templateManifests } from "@/lib/templates";
import { initialSections } from "@/lib/model";
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
      <SiteRenderer
        data={{
          template: t.id,
          brand: {
            name: t.business,
            description: t.description,
            primary: "#540CDA",
            secondary: "#182820",
            background: t.color,
            text: "#172033",
            font: t.id === "atelier" ? "serif" : "sans",
            email: "hello@example.com",
            categoryUrls: false,
            logo: "",
          },
          sections: initialSections.map((s, i) =>
            i === 0 ? { ...s, title: t.headline, body: t.description } : s,
          ),
        }}
      />
    </main>
  );
}
