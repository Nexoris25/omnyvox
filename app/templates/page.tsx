import { marketingMetadata } from "@/lib/marketing";
import Link from "next/link";
import { ArrowUpRight, Eye } from "lucide-react";
import { MarketingShell } from "@/components/marketing-shell";
import { templates, templateManifests } from "@/lib/templates";
import { starterImage, templateIndustry, photoSourceSet } from "@/lib/brand-assets";
import { query } from "@/lib/db";

export async function generateMetadata() {
  return marketingMetadata(
    "Website templates | Omnyvox",
    "Ten professionally designed templates for Nigerian businesses and online stores. Preview every page, then make it yours.",
  );
}

const groups = [
  {
    key: "corporate",
    title: "Business websites",
    intro: "For firms, clinics, studios and companies that win work through trust and a clear first impression.",
  },
  {
    key: "commerce",
    title: "Online stores",
    intro: "For brands that sell online, with product pages, cart, checkout, delivery options and Paystack payments built in.",
  },
] as const;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const active = type === "ecommerce" || type === "commerce" ? "commerce" : type === "corporate" ? "corporate" : "all";
  const industries = await query<{ id: string; label: string }>("SELECT id,label FROM industries WHERE enabled");
  const label = (id: string) => industries.find((i) => i.id === id)?.label || id;
  const categoryOf = (id: string) => templateManifests[id as keyof typeof templateManifests].category;
  return (
    <MarketingShell>
      <main id="main" className="marketing-page templates-page">
        <header className="page-intro">
          <span className="eyebrow">TEMPLATES</span>
          <h1>Start with a design made for your kind of business.</h1>
          <p>
            Every template comes with the pages, sections and starter wording your
            industry needs. Preview any of them page by page, then change the colours,
            photos and words to make it yours. All of them work beautifully on phones.
          </p>
        </header>
        <nav className="template-tabs" aria-label="Filter templates">
          {[
            ["all", "All templates", templates.length, "/templates"],
            ["corporate", "Business websites", templates.filter((t) => categoryOf(t.id) === "corporate").length, "/templates?type=corporate"],
            ["commerce", "Online stores", templates.filter((t) => categoryOf(t.id) === "commerce").length, "/templates?type=ecommerce"],
          ].map(([key, text, count, href]) => (
            <Link key={String(key)} href={String(href)} aria-current={active === key ? "page" : undefined}>
              {text} <span>{count}</span>
            </Link>
          ))}
        </nav>
        {groups
          .filter((g) => active === "all" || active === g.key)
          .map((g) => (
            <section className="template-group" key={g.key} aria-labelledby={`group-${g.key}`}>
              <div className="template-group-head">
                <h2 id={`group-${g.key}`}>{g.title}</h2>
                <p>{g.intro}</p>
              </div>
              <div className="template-cards">
                {templates
                  .filter((t) => categoryOf(t.id) === g.key)
                  .map((t) => {
                    const image = starterImage(templateIndustry[t.id], "hero");
                    const manifest = templateManifests[t.id as keyof typeof templateManifests];
                    return (
                      <article key={t.id} className="template-tile">
                        <Link href={`/templates/${t.id}`} className="template-frame" aria-label={`Preview ${t.name}`}>
                          <span className="template-frame-bar" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                            <em>{t.business.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com.ng</em>
                          </span>
                          <span className={`template-frame-view template-snapshot ${t.id}`} style={{ background: t.color }}>
                            <span className="template-frame-copy">
                              <b>{t.business}</b>
                              <strong>{t.headline}</strong>
                            </span>
                            <img
                              src={image}
                              srcSet={photoSourceSet(image)}
                              sizes="(max-width: 700px) 100vw, 420px"
                              alt=""
                              width={640}
                              height={427}
                              loading="lazy"
                            />
                          </span>
                          <span className="template-frame-hover">
                            <Eye size={18} /> Preview all pages
                          </span>
                        </Link>
                        <div className="template-tile-body">
                          <span className="eyebrow">{t.type}</span>
                          <h3>{t.name}</h3>
                          <p>{t.description}</p>
                          <p className="template-fit">
                            <span>Best for:</span>{" "}
                            {(manifest.industries as readonly string[]).map(label).join(", ")}
                          </p>
                          <div className="template-tile-actions">
                            <Link className="button secondary small" href={`/templates/${t.id}`}>
                              Preview
                            </Link>
                            <Link className="button small" href={`/register?template=${t.id}&category=${manifest.category}`}>
                              Use this template <ArrowUpRight size={15} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          ))}
        <p className="templates-note">
          Previews use sample wording and photos for fictitious businesses. Your
          website uses your own business details, which you can change at any time.
        </p>
      </main>
    </MarketingShell>
  );
}
