import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteRenderer } from "@/components/site-renderer";
import {
  templates,
  templateManifests,
  templateSamples,
} from "@/lib/templates";
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
  const sample = templateSamples[t.id as keyof typeof templateSamples];
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
        data={{
          template: t.id,
          brand: {
            name: t.business,
            description: t.description,
            primary: sample.primary,
            secondary: sample.secondary,
            background: t.color,
            text: sample.text,
            font: t.id === "atelier" || t.id === "trust" ? "serif" : "sans",
            email: "hello@example.com",
            categoryUrls: false,
            logo: "",
          },
          sections: [
            {
              id: "hero",
              type: "hero",
              title: t.headline,
              body: t.description,
              visible: true,
              ctas: [{ label: sample.cta[0], href: "#contact" }],
            },
            {
              id: "services",
              type: "services",
              title: "What we offer",
              body:
                "<ul>" +
                sample.services
                  .map(([name, text]) => `<li><strong>${name}</strong><br>${text}</li>`)
                  .join("") +
                "</ul>",
              visible: true,
            },
            {
              id: "about",
              type: "text",
              title: sample.about[0],
              body: sample.about[1],
              visible: true,
            },
            {
              id: "contact",
              type: "cta",
              title: sample.cta[0],
              body: sample.cta[1],
              visible: true,
              ctas: [{ label: "Get in touch", href: "#contact" }],
            },
          ],
        }}
      />
    </main>
  );
}
