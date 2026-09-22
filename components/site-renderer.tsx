import type { CSSProperties } from "react";
import type { Site, Section } from "@/lib/model";
import { safeHtml } from "@/lib/content";
import { SocialLinks } from "./social-links";
export function RenderSections({
  sections,
  email,
  insights,
}: {
  sections: Section[];
  email: string;
  insights?: React.ReactNode;
}) {
  return (
    <>
      {sections
        .filter((s) => s.visible)
        .map((s) => (
          <section
            id={
              s.type === "services"
                ? "services"
                : s.type === "cta"
                  ? "contact"
                  : s.id
            }
            className={`rendered-section ${s.type === "hero" ? "hero-section" : ""}`}
            key={s.id}
          >
            <div className={"section-layout layout-" + (s.layout || "column")}>
              <div className="section-copy">
                {s.type === "hero" ? <h1>{s.title}</h1> : <h2>{s.title}</h2>}
                <div
                  className="rich-content"
                  dangerouslySetInnerHTML={{ __html: safeHtml(s.body) }}
                />
                {s.type === "faq" &&
                  (s.faqs || []).map((f, i) => (
                    <details key={i}>
                      <summary>{f.question}</summary>
                      <p>{f.answer}</p>
                    </details>
                  ))}
                {s.type === "insights" && insights}
                <div className="section-ctas">
                  {(s.ctas?.length
                    ? s.ctas
                    : s.type === "hero" || s.type === "cta"
                      ? [
                          {
                            label:
                              s.type === "cta" ? "Contact us" : "Let’s talk",
                            href:
                              s.type === "cta" ? `mailto:${email}` : "#contact",
                          },
                        ]
                      : []
                  ).map((c, i) => (
                    <a key={i} href={c.href} className="button">
                      {c.label} ↗
                    </a>
                  ))}
                </div>
              </div>
              {s.image && (
                <img
                  className="section-image"
                  src={s.image}
                  alt={s.imageAlt || ""}
                  loading={s.type === "hero" ? "eager" : "lazy"}
                  width={1000}
                  height={750}
                />
              )}
            </div>
          </section>
        ))}
    </>
  );
}
export function SiteRenderer({
  data,
  children,
  after,
  base = "",
  legal = [],
  insights,
}: {
  data: Site["data"];
  children?: React.ReactNode;
  after?: React.ReactNode;
  base?: string;
  legal?: { title: string; href: string }[];
  insights?: React.ReactNode;
}) {
  const { brand, sections, template } = data;
  return (
    <div
      className={`rendered-site ${template}`}
      style={
        {
          "--site-primary": brand.primary,
          "--site-secondary": brand.secondary,
          "--site-bg": brand.background,
          "--site-text": brand.text,
          "--site-font":
            brand.font === "serif" ? "Georgia, serif" : "Arial, sans-serif",
        } as CSSProperties
      }
    >
      <header className="rendered-nav">
        <a href={base || "#"}>
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} width={130} height={50} />
          ) : (
            <b>{brand.name}</b>
          )}
        </a>
        <nav aria-label="Website navigation">
          <a href={`${base}#services`}>What we do</a>
          <a href={`${base}#about`}>Our story</a>
          <a href={`${base}#contact`}>Get in touch</a>
        </nav>
      </header>
      {children || (
        <RenderSections
          sections={sections}
          email={brand.email}
          insights={insights}
        />
      )}
      {after}
      <footer className="rendered-footer">
        <div>
          <span>
            © {new Date().getFullYear()} {brand.name}
          </span>
          <SocialLinks links={brand.socials} />
        </div>
        <nav aria-label="Legal information">
          {legal.map((l) => (
            <a key={l.href} href={l.href}>
              {l.title}
            </a>
          ))}
        </nav>
        <a href="/">Website powered by Omnyvox</a>
      </footer>
    </div>
  );
}
