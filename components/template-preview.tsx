import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { SiteRenderer, RenderSections } from "./site-renderer";
import { templates, templateManifests } from "@/lib/templates";
import {
  pageSections,
  previewSite,
  sampleArticles,
  templatePreviewIndustry,
} from "@/lib/industry-kits";
import { policies } from "@/lib/legal-policies";
import { safeHtml } from "@/lib/content";
import { query } from "@/lib/db";
import { SitePageHeader } from "./site-page-header";
import { pagePurpose } from "@/lib/page-purpose";
import { photoSourceSet } from "@/lib/brand-assets";

const slugOf = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

/** A complete, navigable multi-page preview of a template, using the
 * industry kit's sample content. Nothing here is a real business. */
export async function TemplatePreview({
  id,
  page = [],
  category: filter,
}: {
  id: string;
  page?: string[];
  category?: string;
}) {
  const t = templates.find((x) => x.id === id);
  if (!t) notFound();
  const manifest = templateManifests[t.id as keyof typeof templateManifests];
  const category = manifest.category as "corporate" | "commerce";
  const industry =
    templatePreviewIndustry[t.id as keyof typeof templatePreviewIndustry];
  const [row] = await query<{ core_pages: string[] }>(
    "SELECT core_pages FROM industries WHERE id=$1",
    [industry],
  );
  const pages = row?.core_pages?.length
    ? row.core_pages
    : ["About", "Services", "Contact"];
  const base = `/templates/${t.id}`;
  const site = previewSite(
    industry,
    category,
    { name: t.business },
    { base, pages },
  );
  const articles = category === "corporate" ? sampleArticles(site.kit) : [];
  const products =
    category === "commerce"
      ? (site.kit.sections.find((s) => s.id === "services")?.items || [])
          .slice(0, 4)
          .map((item, i) => ({
            title: item.title,
            image: item.image,
            price: [18500, 42000, 9500, 26000][i % 4],
          }))
      : [];

  const [first, second] = page;
  let body: React.ReactNode = undefined;
  let title = "Home";
  const corePage = pages.find((p) => slugOf(p) === first);
  if (first === "legal" && second) {
    const policy = Object.values(policies).find((p) => p.slug === second);
    if (!policy) notFound();
    title = policy.title;
    body = (
      <article className="rendered-section record-page">
        <nav className="site-breadcrumbs" aria-label="Breadcrumb">
          <a href={base}>Home</a>
          <span aria-current="page">{policy.title}</span>
        </nav>
        <h1>{policy.title}</h1>
        <p className="template-legal-note">
          Sample policy. Each Omnyvox website starts with a draft for its
          industry that the owner completes and reviews before publishing.
        </p>
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: safeHtml(policy.body) }}
        />
      </article>
    );
  } else if (first === "insights" && articles.length) {
    const article = second && articles.find((a) => a.slug === second);
    if (second && !article) notFound();
    title = article ? article.title : "Insights";
    body = article ? (
      <article className="rendered-section record-page record-articles">
        <nav className="site-breadcrumbs" aria-label="Breadcrumb">
          <a href={base}>Home</a>
          <a href={`${base}/insights`}>Insights</a>
          <span aria-current="page">{article.title}</span>
        </nav>
        <span className="site-article-category">{article.category}</span>
        <h1>{article.title}</h1>
        <p className="site-article-byline">By the {t.business} team</p>
        {article.image && (
          <img
            className="record-image"
            src={article.image}
            alt=""
            width={900}
            height={600}
          />
        )}
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: safeHtml(article.body) }}
        />
      </article>
    ) : (
      <section className="rendered-section site-insights-page">
        <nav className="site-breadcrumbs" aria-label="Breadcrumb">
          <a href={base}>Home</a>
          <span aria-current="page">Insights</span>
        </nav>
        <h1>Insights</h1>
        <p className="site-page-lead">
          News, guidance and updates from {t.business}.
        </p>
        <nav
          className="site-category-filter"
          aria-label="Filter articles by category"
        >
          <a
            href={`${base}/insights`}
            aria-current={!filter ? "page" : undefined}
          >
            All <span>{articles.length}</span>
          </a>
          {articles.map((a) => (
            <a
              key={a.category}
              href={`${base}/insights?category=${a.category.toLowerCase()}`}
              aria-current={
                filter === a.category.toLowerCase() ? "page" : undefined
              }
            >
              {a.category} <span>1</span>
            </a>
          ))}
        </nav>
        <PreviewArticles
          articles={articles.filter(
            (a) => !filter || a.category.toLowerCase() === filter,
          )}
          base={base}
        />
      </section>
    );
  } else if (first === "shop" && products.length) {
    title = "Shop";
    body = (
      <section className="rendered-section storefront">
        <nav className="site-breadcrumbs" aria-label="Breadcrumb">
          <a href={base}>Home</a>
          <span aria-current="page">Shop</span>
        </nav>
        <h1>All products</h1>
        <PreviewProducts products={products} />
      </section>
    );
  } else if (corePage) {
    title = corePage;
    body = (
      <>
        <SitePageHeader
          title={corePage}
          description={pagePurpose(corePage)}
          home={base}
          eyebrow={t.business}
        />
        <RenderSections
          sections={pageSections(site.kit, corePage).map((s) => ({
            ...s,
            ctas: s.ctas?.map((c) => ({
              ...c,
              href: c.href.startsWith("/") ? "/contact" : c.href,
            })),
          }))}
          email={site.data.brand.email}
          base={base}
          contact={site.contact}
          videoEnabled
        />
      </>
    );
  } else if (page.length) notFound();

  const homeSections = articles.length
    ? (() => {
        const sections = [...site.data.sections];
        const at = sections.findIndex(
          (s) => s.type === "cta" || s.type === "contact",
        );
        sections.splice(at < 0 ? sections.length : at, 0, {
          id: "latest-insights",
          type: "insights",
          eyebrow: "Insights",
          title: "Latest insights",
          body: "",
          visible: true,
          items: undefined,
          ctas: [{ label: "View all insights", href: "/insights" }],
        });
        return sections;
      })()
    : site.data.sections;
  const navigation = [
    ...(site.data.brand.navigation || []).slice(0, 1),
    ...(products.length
      ? [{ label: "Shop", href: "/shop", footer: false }]
      : []),
    ...(site.data.brand.navigation || []).slice(1),
  ];
  return (
    <main id="main">
      <div className="template-preview-bar">
        <Link href="/templates">← All templates</Link>
        <strong>
          {t.name} preview{title !== "Home" ? ` · ${title}` : ""}
        </strong>
        <Link
          className="button small"
          href={`/register?template=${t.id}&category=${manifest.category}`}
        >
          Use this template
        </Link>
      </div>
      <p className="template-sample-note">
        Sample content for a fictitious business. Explore the pages using the
        menu. Your website uses your own verified details.
      </p>
      <SiteRenderer
        currentPath={base + (page.length ? "/" + page.join("/") : "")}
        data={{
          ...site.data,
          sections: homeSections,
          brand: { ...site.data.brand, navigation },
        }}
        contact={site.contact}
        legal={site.legal}
        base={base}
        videoEnabled
        footerLinks={
          articles.length ? [{ label: "Insights", href: "/insights" }] : []
        }
        insights={
          articles.length ? (
            <PreviewArticles articles={articles} base={base} />
          ) : undefined
        }
        after={
          !page.length && products.length ? (
            <section className="rendered-section storefront">
              <span className="eyebrow">Shop</span>
              <h2>Popular right now</h2>
              <PreviewProducts products={products} />
            </section>
          ) : undefined
        }
      >
        {body}
      </SiteRenderer>
    </main>
  );
}

function PreviewArticles({
  articles,
  base,
}: {
  articles: ReturnType<typeof sampleArticles>;
  base: string;
}) {
  return (
    <div className="site-article-grid">
      {articles.map((a) => (
        <article className="site-article-card" key={a.slug}>
          <a
            href={`${base}/insights/${a.slug}`}
            className="site-article-media"
            tabIndex={-1}
            aria-hidden="true"
          >
            {a.image && (
              <img
                src={a.image}
                srcSet={photoSourceSet(a.image)}
                sizes="(max-width:680px) 100vw, 33vw"
                alt=""
                width={640}
                height={400}
                loading="lazy"
              />
            )}
          </a>
          <div className="site-article-body">
            <span className="site-article-meta">
              <b>{a.category}</b>
            </span>
            <h3>
              <a href={`${base}/insights/${a.slug}`}>{a.title}</a>
            </h3>
            <p>{a.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function PreviewProducts({
  products,
}: {
  products: { title: string; image?: string; price: number }[];
}) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <article className="product-card" key={p.title}>
          <span className="product-card-media">
            {p.image ? (
              <img
                src={p.image}
                alt=""
                width={400}
                height={400}
                loading="lazy"
              />
            ) : (
              <span className="product-card-placeholder">
                <ShoppingBag size={32} />
              </span>
            )}
          </span>
          <div className="product-card-body">
            <h3>{p.title}</h3>
            <strong>{naira(p.price)}</strong>
          </div>
          <span
            className="button secondary"
            aria-disabled="true"
            title="Shopping works on published stores"
          >
            Sample product
          </span>
        </article>
      ))}
    </div>
  );
}
