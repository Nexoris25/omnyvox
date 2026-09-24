import { SitePageHeader } from "@/components/site-page-header";
import { safeHtml, plainText } from "@/lib/content";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getSite,
  publicContent,
  contentPath,
  siteBase,
} from "@/lib/public-site";
import { jsonLd, entitled } from "@/lib/model";
import { SiteRenderer, RenderSections } from "@/components/site-renderer";
import {
  CartLink,
  CartPage,
  CheckoutPage,
  ProductPurchase,
  StoreCheckout,
} from "@/components/checkout";
import { storeFulfilment } from "@/lib/commerce";
import {
  deliveryOptions,
  priceRange,
  totalStock,
  type StoreProduct,
} from "@/lib/store";
import { query } from "@/lib/db";
import { industryFor } from "@/lib/industry";
import { EnquiryForm } from "@/components/enquiry-form";
import {
  ArticleGrid,
  AuthorCard,
  CategoryFilter,
  categoryName,
} from "@/components/site-insights";
type Props = {
  params: Promise<{ slug: string; path?: string[] }>;
  searchParams: Promise<{ preview?: string; category?: string }>;
};
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug, path = [] } = await params;
  const preview = (await searchParams).preview === "1";
  const site = await getSite(slug, preview);
  if (!site) return { title: "Website unavailable", robots: { index: false } };
  const base = await siteBase(site);
  const content = await publicContent(site, preview);
  const record = content.find(
    (r) =>
      contentPath(r, site.view.brand.categoryUrls) === "/" + path.join("/"),
  );
  const storePage =
    site.category === "commerce" &&
    path.length === 1 &&
    ["cart", "checkout"].includes(path[0]);
  const title = storePage
    ? `${path[0] === "cart" ? "Your cart" : "Checkout"} · ${site.view.brand.name}`
    : record?.data.seoTitle || record?.data.title || site.view.brand.name;
  const description = record
    ? record.data.description || plainText(record.data.body).slice(0, 160)
    : site.view.brand.description;
  const url =
    base +
    (record
      ? contentPath(record, site.view.brand.categoryUrls)
      : path.length
        ? "/" + path.join("/")
        : "");
  const image =
    record?.data.socialImage ||
    record?.data.image ||
    site.view.brand.logo ||
    "/social.webp";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: {
      index:
        !preview &&
        !storePage &&
        site.view.brand.robots?.index !== false &&
        record?.data.indexing?.index !== false,
      follow:
        !preview &&
        site.view.brand.robots?.follow !== false &&
        record?.data.indexing?.follow !== false,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: site.view.brand.name,
      type: record?.kind === "articles" ? "article" : "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    icons: {
      icon:
        site.view.brand.favicon || site.view.brand.logo || "/brand-icon.webp",
    },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { slug, path = [] } = await params;
  const query_ = await searchParams;
  const preview = query_.preview === "1";
  const site = await getSite(slug, preview);
  if (!site) notFound();
  const base = await siteBase(site);
  const content = await publicContent(site, preview);
  const [contactForm] = await query<{ id: string }>(
    "SELECT id FROM site_forms WHERE site_id=$1 AND active_email IS NOT NULL AND verified_at IS NOT NULL",
    [site.id],
  );
  const pathname = "/" + path.join("/");
  const legalHref = (type: string) => {
    const r = content.find(
      (c) => c.kind === "legal" && c.data.policyType === type,
    );
    return r
      ? base +
          contentPath(r, site.view.brand.categoryUrls) +
          (preview ? "?preview=1" : "")
      : undefined;
  };
  const privacyHref = legalHref("privacy");
  const link = (r: (typeof content)[number]) =>
    base +
    contentPath(r, site.view.brand.categoryUrls) +
    (preview ? "?preview=1" : "");
  const blog = entitled(site.tier, "blog");
  const articles = content
    .filter((r) => r.kind === "articles")
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const authors = content.filter((r) => r.kind === "authors");
  const categories = content.filter((r) => r.kind === "categories");
  const authorLinks = entitled(site.tier, "authorLinks");
  const insightsHref = (category?: string) =>
    base +
    "/insights" +
    (category || preview
      ? "?" +
        new URLSearchParams({
          ...(category ? { category } : {}),
          ...(preview ? { preview: "1" } : {}),
        })
      : "");
  // Every blog-enabled homepage shows the latest articles, unless the owner
  // has placed (or hidden) an Insights section themselves.
  const homeView =
    blog &&
    articles.length &&
    !site.view.sections.some((s) => s.type === "insights")
      ? (() => {
          const sections = [...site.view.sections];
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
            ctas: [{ label: "View all insights", href: "/insights" }],
          });
          return { ...site.view, sections };
        })()
      : site.view;
  const [kyb] = await query<{ cac_number: string }>(
    "SELECT b.cac_number FROM business_verifications b JOIN sites s ON s.owner_id=b.user_id WHERE s.id=$1 AND b.status='verified'",
    [site.id],
  );
  const videoEnabled = entitled(site.tier, "video");
  const industry = await industryFor(site);
  const indexKinds: Record<string, string> = {
    ...(site.tier !== "basic" ? { insights: "articles" } : {}),
    ...(site.category === "commerce" ? { shop: "products" } : {}),
    ...Object.fromEntries(
      Object.keys(industry?.collections || {}).map((k) => [k, k]),
    ),
  };
  const record = content.find(
    (r) => contentPath(r, site.view.brand.categoryUrls) === pathname,
  );
  const storePage =
    site.category === "commerce" &&
    path.length === 1 &&
    (path[0] === "cart" || path[0] === "checkout")
      ? path[0]
      : null;
  if (
    !record &&
    path.length &&
    !storePage &&
    !Object.keys(indexKinds).includes(pathname.slice(1))
  ) {
    const alternate = content.find(
      (r) =>
        r.kind === "articles" &&
        r.data.slug === path.at(-1) &&
        path[0] === "insights" &&
        (path.length === 2 ||
          (path.length === 3 && path[1] === r.data.category)),
    );
    if (alternate)
      permanentRedirect(
        base + contentPath(alternate, site.view.brand.categoryUrls),
      );
    notFound();
  }
  const [merchant] =
    site.category === "commerce"
      ? await query<{ delivery: number }>(
          "SELECT delivery FROM merchant_accounts WHERE site_id=$1 AND verified=true",
          [site.id],
        )
      : [];
  const products = content.filter(
    (r) => r.kind === "products",
  ) as unknown as (StoreProduct & { data: { body: string } })[];
  const fulfilmentOptions =
    storePage === "checkout"
      ? deliveryOptions(await storeFulfilment(site.id), merchant?.delivery || 0)
      : null;
  const [businessProfile] = await query<{
    data: {
      address: string;
      showAddress: boolean;
      phone: string;
      hours: string;
      city: string;
    };
  }>("SELECT data FROM business_profiles WHERE site_id=$1", [site.id]);
  const organisation = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": base + "/#organization",
    name: site.view.brand.name,
    url: base,
    description: site.view.brand.description,
    ...(site.view.brand.logo
      ? { logo: new URL(site.view.brand.logo, process.env.APP_URL).href }
      : {}),
  };
  const facts = businessProfile?.data;
  const contact = {
    phone: facts?.phone || undefined,
    address: facts?.showAddress ? facts.address || undefined : undefined,
    hours: facts?.hours || undefined,
  };
  const localBusiness =
    site.category === "corporate" && facts?.showAddress && facts.address
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": base + "/#localbusiness",
          name: site.view.brand.name,
          url: base,
          address: { "@type": "PostalAddress", streetAddress: facts.address },
          ...(facts.city ? { areaServed: facts.city } : {}),
          ...(facts.phone ? { telephone: facts.phone } : {}),
          ...(facts.hours ? { openingHours: facts.hours } : {}),
        }
      : null;
  // FAQ rich results are an Advanced feature; built from the page's own
  // visible FAQ sections so the markup always matches what visitors see.
  const faqItems = entitled(site.tier, "faqPage")
    ? (record
        ? record.data.sections || []
        : !path.length
          ? site.view.sections
          : []
      )
        .filter((s) => s.visible && s.type === "faq")
        .flatMap((s) => s.faqs || [])
        .filter((f) => f.question?.trim() && f.answer?.trim())
    : [];
  const faqSchema = faqItems.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: plainText(f.answer) },
        })),
      }
    : null;
  const serviceSchema =
    site.category === "corporate" && record?.kind === "offerings"
      ? {
          "@context": "https://schema.org",
          "@type": "Service",
          name: record.data.title,
          description: plainText(record.data.body).slice(0, 300),
          provider: { "@id": base + "/#organization" },
          ...(facts?.city ? { areaServed: facts.city } : {}),
        }
      : null;
  const schema =
    record?.kind === "articles"
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: record.data.title,
          description: plainText(record.data.body).slice(0, 160),
          datePublished: record.created_at,
          dateModified: record.data.updatedAt,
          author: { "@type": "Person", name: record.data.author },
          publisher: { "@id": base + "/#organization" },
          mainEntityOfPage: base + pathname,
        }
      : record?.kind === "products"
        ? {
            "@context": "https://schema.org",
            "@type": "Product",
            name: record.data.title,
            description: record.data.body,
            ...(record.data.image
              ? { image: new URL(record.data.image, process.env.APP_URL).href }
              : {}),
            offers: {
              "@type": "Offer",
              url: base + pathname,
              price: (
                priceRange(record as unknown as StoreProduct)[0] / 100
              ).toFixed(2),
              priceCurrency: "NGN",
              availability:
                totalStock(record as unknown as StoreProduct) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              seller: { "@id": base + "/#organization" },
            },
          }
        : null;
  return (
    <main id="main">
      {preview && (
        <div className="notice" style={{ margin: 0, borderRadius: 0 }}>
          Private draft preview ·{" "}
          <Link href="/dashboard/editor">Back to your editor →</Link>
        </div>
      )}
      <SiteRenderer
        currentPath={base + pathname}
        preview={preview}
        videoEnabled={videoEnabled}
        contact={contact}
        data={homeView}
        base={base}
        footerLinks={
          blog && articles.length
            ? [{ label: "Insights", href: "/insights" }]
            : []
        }
        registration={kyb?.cac_number}
        platformUrl={process.env.APP_URL || "https://omnyvox.com"}
        headerExtra={
          site.category === "commerce" ? (
            <CartLink site={site.id} base={base} />
          ) : undefined
        }
        navigationPages={content.map((r) => ({
          id: r.id,
          href:
            base +
            contentPath(r, site.view.brand.categoryUrls) +
            (preview ? "?preview=1" : ""),
        }))}
        legal={content
          .filter((r) => r.kind === "legal")
          .map((r) => ({
            title: r.data.title,
            href:
              base +
              contentPath(r, site.view.brand.categoryUrls) +
              (preview ? "?preview=1" : ""),
          }))}
        insights={
          articles.length ? (
            <ArticleGrid
              articles={articles.slice(0, 3)}
              authors={authors}
              categories={categories}
              href={link}
            />
          ) : (
            <p>New articles will appear here soon.</p>
          )
        }

        after={
          !path.length && (
            <>
              {site.category === "commerce" && (
                <StoreCheckout
                  preview={preview}
                  site={site.id}
                  base={base}
                  products={products}
                />
              )}
              {!preview && contactForm && (
                <EnquiryForm
                  site={site.id}
                  formId={contactForm.id}
                  privacyHref={privacyHref}
                />
              )}
            </>
          )
        }
      >
        {record ? (
          <article
            className={`rendered-section record-page record-${record.kind}`}
          >
            {record.kind === "pages" ? (
              <SitePageHeader
                title={record.data.title}
                home={base + (preview ? "?preview=1" : "")}
                eyebrow={site.view.brand.name}
              />
            ) : (
              <nav className="site-breadcrumbs" aria-label="Breadcrumb">
                <a href={base + (preview ? "?preview=1" : "")}>Home</a>
                {record.kind === "articles" && (
                  <a href={insightsHref()}>Insights</a>
                )}
                {record.kind === "products" && (
                  <a href={base + "/shop" + (preview ? "?preview=1" : "")}>
                    Shop
                  </a>
                )}
                {industry?.collections[record.kind] && (
                  <a
                    href={
                      base + "/" + record.kind + (preview ? "?preview=1" : "")
                    }
                  >
                    {industry.collections[record.kind]}
                  </a>
                )}
                <span aria-current="page">{record.data.title}</span>
              </nav>
            )}
            {record.kind === "articles" &&
              record.data.category &&
              record.data.category !== "general" && (
                <a
                  className="site-article-category"
                  href={insightsHref(record.data.category)}
                >
                  {categoryName(record.data.category, categories)}
                </a>
              )}
            {record.kind !== "pages" && <h1>{record.data.title}</h1>}
            {!!record.data.details?.length && (
              <dl className="record-facts">
                {record.data.details.map((d, i) => (
                  <div key={i}>
                    <dt>{d.label}</dt>
                    <dd>{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {record.kind === "articles" && (
              <p className="site-article-byline">
                By{" "}
                {(() => {
                  const a = authors.find((p) => p.id === record.data.authorId);
                  return a ? (
                    <a href={link(a)}>{a.data.title}</a>
                  ) : (
                    record.data.author
                  );
                })()}{" "}
                ·{" "}
                <time dateTime={record.created_at}>
                  {new Date(record.created_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </p>
            )}
            {record.kind === "authors" ? (
              <AuthorCard author={record} showLinks={authorLinks} />
            ) : (
              record.data.image && (
                <img
                  className="record-image"
                  src={record.data.image}
                  alt={record.data.imageAlt || ""}
                  width={900}
                  height={600}
                />
              )
            )}
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{
                __html: safeHtml(record.data.body, { video: videoEnabled }),
              }}
            />
            {record.data.sections && (
              <RenderSections
                base={base}
                preview={preview}
                videoEnabled={videoEnabled}
                contact={contact}
                whatsapp={site.view.brand.socials?.whatsapp}
                sections={record.data.sections}
                email={site.view.brand.email}
              />
            )}
            {record.kind === "articles" &&
              (() => {
                const a = authors.find((p) => p.id === record.data.authorId);
                return a ? (
                  <AuthorCard
                    author={a}
                    href={link(a)}
                    showLinks={authorLinks}
                    compact
                  />
                ) : null;
              })()}
            {record.kind === "authors" && (
              <>
                <h2 className="record-subheading">
                  Articles by {record.data.title}
                </h2>
                {articles.some((a) => a.data.authorId === record.id) ? (
                  <ArticleGrid
                    articles={articles.filter(
                      (a) => a.data.authorId === record.id,
                    )}
                    authors={authors}
                    categories={categories}
                    href={link}
                  />
                ) : (
                  <p>No published articles yet.</p>
                )}
              </>
            )}
            {record.data.slug === "contact" && !preview && contactForm && (
              <EnquiryForm
                site={site.id}
                formId={contactForm.id}
                privacyHref={privacyHref}
              />
            )}
            {record.kind === "products" && (
              <ProductPurchase
                site={site.id}
                base={base}
                product={products.find((p) => p.id === record.id)!}
              />
            )}
          </article>
        ) : storePage === "cart" ? (
          <CartPage site={site.id} base={base} products={products} />
        ) : storePage === "checkout" && fulfilmentOptions ? (
          <CheckoutPage
            site={site.id}
            base={base}
            products={products}
            options={fulfilmentOptions}
            payments={!!merchant}
            preview={preview}
            policies={{
              terms: legalHref("terms"),
              refund: legalHref("refund"),
              privacy: privacyHref,
            }}
          />
        ) : path[0] === "shop" ? (
          <StoreCheckout
            preview={preview}
            site={site.id}
            base={base}
            products={products}
            page
          />
        ) : path.length === 1 && path[0] === "insights" ? (
          (() => {
            const active = articles.some(
              (a) => a.data.category === query_.category,
            )
              ? query_.category
              : undefined;
            const counts: Record<string, number> = {};
            for (const a of articles)
              counts[a.data.category] = (counts[a.data.category] || 0) + 1;
            const used = Object.keys(counts).filter((c) => c !== "general");
            const filterList = [
              ...categories
                .filter((c) => used.includes(c.data.slug))
                .map((c) => ({ slug: c.data.slug, title: c.data.title })),
              ...used
                .filter((c) => !categories.some((x) => x.data.slug === c))
                .map((c) => ({ slug: c, title: categoryName(c, categories) })),
            ];
            const shown = articles.filter(
              (a) => !active || a.data.category === active,
            );
            return (
              <section className="rendered-section site-insights-page">
                <nav className="site-breadcrumbs" aria-label="Breadcrumb">
                  <a href={base + (preview ? "?preview=1" : "")}>Home</a>
                  <span aria-current="page">Insights</span>
                </nav>
                <h1>
                  {active ? categoryName(active, categories) : "Insights"}
                </h1>
                <p className="site-page-lead">
                  News, guidance and updates from {site.view.brand.name}.
                </p>
                <CategoryFilter
                  categories={filterList}
                  active={active}
                  counts={counts}
                  href={insightsHref}
                />
                {shown.length ? (
                  <ArticleGrid
                    articles={shown}
                    authors={authors}
                    categories={categories}
                    href={link}
                  />
                ) : (
                  <p className="site-empty">
                    No articles have been published yet. Please check back soon.
                  </p>
                )}
              </section>
            );
          })()
        ) : path.length ? (
          <section className="rendered-section site-collection-page">
            <nav className="site-breadcrumbs" aria-label="Breadcrumb">
              <a href={base + (preview ? "?preview=1" : "")}>Home</a>
              <span aria-current="page">
                {industry?.collections[path[0]] || "Insights"}
              </span>
            </nav>
            <h1>{industry?.collections[path[0]] || "Insights"}</h1>
            <div className="site-collection-grid">
              {content
                .filter(
                  (r) => path[0] !== "shop" && r.kind === indexKinds[path[0]],
                )
                .map((r) => (
                  <a className="site-collection-card" href={link(r)} key={r.id}>
                    {r.data.image && (
                      <img
                        src={r.data.image}
                        alt=""
                        width={640}
                        height={420}
                        loading="lazy"
                      />
                    )}
                    <span>
                      <b>{r.data.title}</b>
                      <small>{plainText(r.data.body).slice(0, 140)}</small>
                      <em>View details →</em>
                    </span>
                  </a>
                ))}
            </div>
          </section>
        ) : undefined}
      </SiteRenderer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organisation) }}
      />
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      )}
      {localBusiness && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(localBusiness) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
        />
      )}
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(serviceSchema) }}
        />
      )}
      {record && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: base },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: record.data.title,
                  item: base + pathname,
                },
              ],
            }),
          }}
        />
      )}
    </main>
  );
}
