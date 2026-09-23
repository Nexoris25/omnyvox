import type { CSSProperties } from "react";
import type { Site, Section } from "@/lib/model";
import { safeHtml } from "@/lib/content";
import { SocialLinks } from "./social-links";
import { foreground } from "@/lib/theme";
import { parseVideoUrl } from "@/lib/video";
function localHref(base: string, path: string, preview: boolean) {
  const [pathname, hash] = path.split("#", 2);
  return (
    base +
    pathname +
    (preview ? (pathname.includes("?") ? "&" : "?") + "preview=1" : "") +
    (hash === undefined ? "" : "#" + hash)
  );
}
function SectionVideo({ url, title }: { url: string; title?: string }) {
  const video = parseVideoUrl(url);
  if (!video) return null;
  const label = title || "Video";
  return (
    <div className="section-video">
      {video.kind === "file" ? (
        <video
          src={video.src}
          controls
          preload="metadata"
          playsInline
          title={label}
          aria-label={label}
        />
      ) : (
        <iframe
          src={video.src}
          title={label}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
export function RenderSections({
  sections,
  email,
  insights,
  base = "",
  preview = false,
  videoEnabled = false,
}: {
  sections: Section[];
  email: string;
  insights?: React.ReactNode;
  base?: string;
  preview?: boolean;
  videoEnabled?: boolean;
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
            className={`rendered-section section-${s.type} ${s.type === "hero" ? "hero-section" : ""}`}
            key={s.id}
          >
            <div className={"section-layout layout-" + (s.layout || "column")}>
              <div className="section-copy">
                {s.type === "hero" ? <h1>{s.title}</h1> : <h2>{s.title}</h2>}
                <div
                  className="rich-content"
                  dangerouslySetInnerHTML={{
                    __html: safeHtml(s.body, { video: videoEnabled }),
                  }}
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
                    <a
                      key={i}
                      href={
                        c.href.startsWith("/")
                          ? localHref(base, c.href, preview)
                          : c.href
                      }
                      className="button"
                    >
                      {c.label} ↗
                    </a>
                  ))}
                </div>
              </div>
              {videoEnabled && s.video && parseVideoUrl(s.video) ? (
                <SectionVideo url={s.video} title={s.videoTitle} />
              ) : (
                s.image && (
                <img
                  className="section-image"
                  src={s.image}
                  alt={s.imageAlt || ""}
                  loading={s.type === "hero" ? "eager" : "lazy"}
                  width={1000}
                  height={750}
                />
                )
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
  navigationPages = [],
  preview = false,
  videoEnabled = false,
}: {
  data: Site["data"];
  children?: React.ReactNode;
  after?: React.ReactNode;
  base?: string;
  legal?: { title: string; href: string }[];
  insights?: React.ReactNode;
  navigationPages?: { id: string; href: string }[];
  preview?: boolean;
  videoEnabled?: boolean;
}) {
  const { brand, sections, template } = data;
  function href(n: { pageId?: string; href: string }) {
    return n.pageId
      ? navigationPages.find((p) => p.id === n.pageId)?.href
      : n.href.startsWith("/") || n.href.startsWith("#")
        ? localHref(base, n.href, preview)
        : n.href;
  }
  function links(footer: boolean) {
    const entries =
      brand.navigation === undefined
        ? [
            { label: "What we do", href: "#services", footer: false },
            { label: "Our story", href: "#about", footer: false },
            { label: "Get in touch", href: "#contact", footer: false },
          ]
        : brand.navigation;
    return entries
      .filter((n) => n.footer === footer)
      .map((n, i) => {
        const url = href(n);
        if (!url) return null;
        const children = "children" in n ? n.children : undefined;
        return children?.length ? (
          <details className="site-dropdown" key={i}>
            <summary>{n.label}</summary>
            <div>
              <a href={url}>{n.label}</a>
              {children.map((c, j) =>
                href(c) ? (
                  <a key={j} href={href(c)}>
                    {c.label}
                  </a>
                ) : null,
              )}
            </div>
          </details>
        ) : (
          <a key={i} href={url}>
            {n.label}
          </a>
        );
      });
  }
  return (
    <div
      className={`rendered-site ${template}`}
      style={
        {
          "--site-primary": brand.primary,
          "--site-primary-fg": foreground(brand.primary),
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
        <nav className="site-desktop-menu" aria-label="Website navigation">
          {links(false)}
        </nav>
        <details className="site-mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile website navigation">{links(false)}</nav>
        </details>
      </header>
      {children || (
        <RenderSections
          sections={sections}
          email={brand.email}
          insights={insights}
          base={base}
          preview={preview}
          videoEnabled={videoEnabled}
        />
      )}
      {after}
      <footer className="rendered-footer">
        <nav aria-label="Footer navigation">{links(true)}</nav>
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
