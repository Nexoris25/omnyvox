import { TemplatePreview } from "@/components/template-preview";
export const metadata = {
  title: "Template preview",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ template: string; page: string[] }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { template, page } = await params;
  const { category } = await searchParams;
  return <TemplatePreview id={template} page={page} category={category} />;
}
