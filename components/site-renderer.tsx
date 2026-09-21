import type { CSSProperties } from "react";
import type { Site } from "@/lib/model";
export function SiteRenderer({
  data,
  children,
  after,
  base = "",
}: {
  data: Site["data"];
  children?: React.ReactNode;
  after?: React.ReactNode;
  base?: string;
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
      {children ||
        sections
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
              {s.type === "hero" ? <h1>{s.title}</h1> : <h2>{s.title}</h2>}
              {s.type === "services" ? (
                <div className="rendered-service-grid">
                  {s.body
                    .split("\n")
                    .filter(Boolean)
                    .map((v, i) => (
                      <div key={i}>{v}</div>
                    ))}
                </div>
              ) : (
                <p>{s.body}</p>
              )}
              {(s.type === "hero" || s.type === "cta") && (
                <a
                  className="button"
                  href={s.type === "cta" ? `mailto:${brand.email}` : "#contact"}
                >
                  {s.type === "cta" ? "Contact us" : "Let’s talk"} ↗
                </a>
              )}
            </section>
          ))}
      {after}
      <footer className="rendered-footer">
        <span>
          © {new Date().getFullYear()} {brand.name}
        </span>
        <a href="/">Website powered by Omnyvox</a>
      </footer>
    </div>
  );
}
