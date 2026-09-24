import { notFound } from "next/navigation";
import { TemplatePreview } from "@/components/template-preview";
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
  return <TemplatePreview id={template} />;
}
