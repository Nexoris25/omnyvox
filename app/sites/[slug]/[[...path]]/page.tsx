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
import { jsonLd } from "@/lib/model";
import { SiteRenderer, RenderSections } from "@/components/site-renderer";
import { StoreCheckout } from "@/components/checkout";
import { query } from "@/lib/db";
import { industryFor } from "@/lib/industry";
import { EnquiryForm } from "@/components/enquiry-form";
type Props = {
  params: Promise<{ slug: string; path?: string[] }>;
  searchParams: Promise<{ preview?: string }>;
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
  const title =
    record?.data.seoTitle || record?.data.title || site.view.brand.name;
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
  const preview = (await searchParams).preview === "1";
  const site = await getSite(slug, preview);
  if (!site) notFound();
  const base = await siteBase(site);
  const content = await publicContent(site, preview);
  const [contactForm] = await query<{ id: string }>(
    "SELECT id FROM site_forms WHERE site_id=$1 AND active_email IS NOT NULL AND verified_at IS NOT NULL",
    [site.id],
  );
  const pathname = "/" + path.join("/");
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
  if (
    !record &&
    path.length &&
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
              price: ((record.data.price || 0) / 100).toFixed(2),
              priceCurrency: "NGN",
              availability:
                (record.data.stock || 0) > 0
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
        preview={preview}
        data={site.view}
        base={base}
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
          <div className="template-grid">
            {content
              .filter((r) => r.kind === "articles")
              .slice(0, 6)
              .map((r) => (
                <a
                  key={r.id}
                  href={
                    base +
                    contentPath(r, site.view.brand.categoryUrls) +
                    (preview ? "?preview=1" : "")
                  }
                >
                  <h3>{r.data.title}</h3>
                  <p>{plainText(r.data.body).slice(0, 120)}</p>
                </a>
              ))}
          </div>
        }

        after={
          !path.length && (
            <>
              {site.category === "commerce" && (
                <StoreCheckout
                  preview={preview}
                  site={site.id}
                  base={base}
                  products={content.filter((r) => r.kind === "products")}
                  delivery={merchant?.delivery || 0}
                />
              )}
              <section className="rendered-section">
                <div className="template-grid">
                  {content
                    .filter((r) => r.kind === "pages")
                    .map((r) => (
                      <Link
                        className="panel panel-body"
                        href={
                          base +
                          contentPath(r, site.view.brand.categoryUrls) +
                          (preview ? "?preview=1" : "")
                        }
                        key={r.id}
                      >
                        <small>
                          {r.kind === "articles"
                            ? "INSIGHTS"
                            : r.kind === "products"
                              ? "SHOP"
                              : "EXPLORE"}
                        </small>
                        <h2 style={{ fontSize: 24, marginTop: 16 }}>
                          {r.data.title}
                        </h2>
                        <p>{plainText(r.data.body).slice(0, 100)}</p>
                        <span>Discover more ↗</span>
                      </Link>
                    ))}
                </div>
              </section>
              {!preview && contactForm && (
                <EnquiryForm site={site.id} formId={contactForm.id} />
              )}
            </>
          )
        }
      >
        {record ? (
          <article className="rendered-section">
            <Link href={base + (preview ? "?preview=1" : "")}>Home</Link>
            <h1 style={{ marginTop: 25 }}>{record.data.title}</h1>
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
              <p>
                By {record.data.author} ·{" "}
                {new Date(record.created_at).toLocaleDateString("en-NG")}
              </p>
            )}
            {record.data.image && (
              <img
                src={record.data.image}
                alt={record.data.title}
                width={900}
                height={600}
              />
            )}
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: safeHtml(record.data.body) }}
            />
            {record.data.sections && (
              <RenderSections
                base={base}
                preview={preview}
                sections={record.data.sections}
                email={site.view.brand.email}
              />
            )}
            {record.data.slug === "contact" && !preview && contactForm && (
              <EnquiryForm site={site.id} formId={contactForm.id} />
            )}
            {record.kind === "products" && (
              <>
                <h2>
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format((record.data.price || 0) / 100)}
                </h2>
                <p>{record.data.stock ? "In stock" : "Out of stock"}</p>
                <StoreCheckout
                  preview={preview}
                  site={site.id}
                  base={base}
                  products={[record]}
                  hideImages
                  delivery={merchant?.delivery || 0}
                />
              </>
            )}
          </article>
        ) : path.length ? (
          <section className="rendered-section">
            <h1>
              {industry?.collections[path[0]] ||
                (path[0] === "shop" ? "Shop" : "Insights")}
            </h1>
            {path[0] === "shop" && (
              <StoreCheckout
                preview={preview}
                site={site.id}
                base={base}
                products={content.filter((r) => r.kind === "products")}
                delivery={merchant?.delivery || 0}
              />
            )}
            <div className="template-grid">
              {content
                .filter(
                  (r) => path[0] !== "shop" && r.kind === indexKinds[path[0]],
                )
                .map((r) => (
                  <Link
                    className="panel panel-body"
                    href={
                      base +
                      contentPath(r, site.view.brand.categoryUrls) +
                      (preview ? "?preview=1" : "")
                    }
                    key={r.id}
                  >
                    <h2>{r.data.title}</h2>
                    <p>{r.data.body.slice(0, 150)}</p>
                    <span>Read more →</span>
                  </Link>
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
