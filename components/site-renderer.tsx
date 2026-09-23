import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  ChevronDown,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Clock,
  Check,
} from "lucide-react";
import type { Site, Section, Brand } from "@/lib/model";
import { safeHtml } from "@/lib/content";
import { SocialLinks } from "./social-links";
import { foreground } from "@/lib/theme";
import { parseVideoUrl } from "@/lib/video";

export type SiteContact = {
  phone?: string;
  address?: string;
  hours?: string;
};

function localHref(base: string, path: string, preview: boolean) {
  const [pathname, hash] = path.split("#", 2);
  return (
    base +
    pathname +
    (preview ? (pathname.includes("?") ? "&" : "?") + "preview=1" : "") +
    (hash === undefined ? "" : "#" + hash)
  );
}
function resolve(href: string, base: string, preview: boolean) {
  return href.startsWith("/") ? localHref(base, href, preview) : href;
}
const tel = (phone: string) => "tel:" + phone.replace(/[^\d+]/g, "");
const hasText = (html: string) => html.replace(/<[^>]*>/g, "").trim() !== "";

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

function Media({
  s,
  videoEnabled,
}: {
  s: Section;
  videoEnabled: boolean;
}) {
  if (videoEnabled && s.video && parseVideoUrl(s.video))
    return <SectionVideo url={s.video} title={s.videoTitle} />;
  if (!s.image) return null;
  return (
    <img
      className="section-image"
      src={s.image}
      alt={s.imageAlt || ""}
      loading={s.type === "hero" ? "eager" : "lazy"}
      width={1200}
      height={900}
    />
  );
}

function Ctas({
  s,
  email,
  base,
  preview,
}: {
  s: Section;
  email: string;
  base: string;
  preview: boolean;
}) {
  const ctas = s.ctas?.length
    ? s.ctas
    : s.type === "cta"
      ? [{ label: "Contact us", href: email ? `mailto:${email}` : "#contact" }]
      : [];
  if (!ctas.length) return null;
  return (
    <div className="section-ctas">
      {ctas.map((c, i) => (
        <a
          key={i}
          href={resolve(c.href, base, preview)}
          className={i === 0 ? "button" : "button button-outline"}
        >
          {c.label}
          {i === 0 && <ArrowRight size={16} aria-hidden="true" />}
        </a>
      ))}
    </div>
  );
}

function Intro({
  s,
  videoEnabled,
  heading = "h2",
}: {
  s: Section;
  videoEnabled: boolean;
  heading?: "h1" | "h2";
}) {
  const Heading = heading;
  return (
    <>
      {s.eyebrow && <p className="section-eyebrow">{s.eyebrow}</p>}
      <Heading>{s.title}</Heading>
      {hasText(s.body) && (
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{
            __html: safeHtml(s.body, { video: videoEnabled }),
          }}
        />
      )}
    </>
  );
}

function ItemsGrid({
  s,
  base,
  preview,
}: {
  s: Section;
  base: string;
  preview: boolean;
}) {
  const items = s.items || [];
  const variant = s.type;
  return (
    <div className={`item-grid item-grid-${variant}`} data-count={items.length}>
      {items.map((item, i) => {
        const inner = (
          <>
            {item.image && variant !== "features" && variant !== "steps" && (
              <img
                className="item-image"
                src={item.image}
                alt={item.imageAlt || ""}
                loading="lazy"
                width={variant === "team" ? 600 : 800}
                height={variant === "team" ? 750 : 600}
              />
            )}
            <div className="item-body">
              {variant === "steps" && (
                <span className="step-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              {variant === "features" && (
                <span className="feature-mark" aria-hidden="true">
                  <Check size={16} />
                </span>
              )}
              {item.title && <h3>{item.title}</h3>}
              {item.text && <p>{item.text}</p>}
              {item.href && (
                <span className="item-link">
                  Learn more <ArrowRight size={14} aria-hidden="true" />
                </span>
              )}
            </div>
          </>
        );
        return item.href ? (
          <a
            key={i}
            className="item-card"
            href={resolve(item.href, base, preview)}
          >
            {inner}
          </a>
        ) : (
          <div key={i} className="item-card">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function ContactBlock({
  s,
  email,
  contact,
  whatsapp,
  videoEnabled,
}: {
  s: Section;
  email: string;
  contact?: SiteContact;
  whatsapp?: string;
  videoEnabled: boolean;
}) {
  const rows: { icon: ReactNode; label: string; value: string; href?: string }[] =
    [];
  if (contact?.phone)
    rows.push({
      icon: <Phone size={18} />,
      label: "Phone",
      value: contact.phone,
      href: tel(contact.phone),
    });
  if (email)
    rows.push({
      icon: <Mail size={18} />,
      label: "Email",
      value: email,
      href: `mailto:${email}`,
    });
  if (whatsapp)
    rows.push({
      icon: <MessageCircle size={18} />,
      label: "WhatsApp",
      value: "Chat with us",
      href: whatsapp,
    });
  if (contact?.address)
    rows.push({
      icon: <MapPin size={18} />,
      label: "Address",
      value: contact.address,
    });
  if (contact?.hours)
    rows.push({ icon: <Clock size={18} />, label: "Hours", value: contact.hours });
  return (
    <div className="contact-block">
      <div className="section-copy">
        <Intro s={s} videoEnabled={videoEnabled} />
      </div>
      <ul className="contact-list">
        {rows.map((r) => (
          <li key={r.label}>
            <span className="contact-icon" aria-hidden="true">
              {r.icon}
            </span>
            <span>
              <small>{r.label}</small>
              {r.href ? (
                <a
                  href={r.href}
                  {...(r.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {r.value}
                </a>
              ) : (
                <span>{r.value}</span>
              )}
            </span>
          </li>
        ))}
        {!rows.length && (
          <li className="muted">
            Add your phone number, address and opening hours in Business
            information.
          </li>
        )}
      </ul>
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
  contact,
  whatsapp,
}: {
  sections: Section[];
  email: string;
  insights?: ReactNode;
  base?: string;
  preview?: boolean;
  videoEnabled?: boolean;
  contact?: SiteContact;
  whatsapp?: string;
}) {
  return (
    <>
      {sections
        .filter((s) => s.visible)
        .map((s) => {
          const itemBased =
            ["services", "features", "steps", "team", "gallery"].includes(
              s.type,
            ) && !!s.items?.length;
          const id =
            s.type === "services"
              ? "services"
              : s.type === "contact" || s.type === "cta"
                ? s.type === "contact"
                  ? "contact"
                  : "get-started"
                : s.id;
          return (
            <section
              id={id}
              className={`rendered-section section-${s.type} ${s.type === "hero" ? "hero-section" : ""}`}
              key={s.id}
            >
              {s.type === "contact" ? (
                <ContactBlock
                  s={s}
                  email={email}
                  contact={contact}
                  whatsapp={whatsapp}
                  videoEnabled={videoEnabled}
                />
              ) : itemBased ? (
                <>
                  <div className="section-intro">
                    <Intro s={s} videoEnabled={videoEnabled} />
                  </div>
                  <ItemsGrid s={s} base={base} preview={preview} />
                  <Ctas s={s} email={email} base={base} preview={preview} />
                </>
              ) : (
                <div
                  className={"section-layout layout-" + (s.layout || "column")}
                >
                  <div className="section-copy">
                    <Intro
                      s={s}
                      videoEnabled={videoEnabled}
                      heading={s.type === "hero" ? "h1" : "h2"}
                    />
                    {s.type === "faq" && !!s.faqs?.length && (
                      <div className="faq-list">
                        {s.faqs.map((f, i) => (
                          <details key={i}>
                            <summary>
                              {f.question}
                              <ChevronDown size={18} aria-hidden="true" />
                            </summary>
                            <p>{f.answer}</p>
                          </details>
                        ))}
                      </div>
                    )}
                    {s.type === "insights" && insights}
                    <Ctas s={s} email={email} base={base} preview={preview} />
                  </div>
                  <Media s={s} videoEnabled={videoEnabled} />
                </div>
              )}
            </section>
          );
        })}
    </>
  );
}

type NavEntry = NonNullable<Brand["navigation"]>[number];

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
  contact,
}: {
  data: Site["data"];
  children?: ReactNode;
  after?: ReactNode;
  base?: string;
  legal?: { title: string; href: string }[];
  insights?: ReactNode;
  navigationPages?: { id: string; href: string }[];
  preview?: boolean;
  videoEnabled?: boolean;
  contact?: SiteContact;
}) {
  const { brand, sections, template } = data;
  function href(n: { pageId?: string; href: string }) {
    return n.pageId
      ? navigationPages.find((p) => p.id === n.pageId)?.href
      : n.href.startsWith("/") || n.href.startsWith("#")
        ? localHref(base, n.href, preview)
        : n.href;
  }
  const entries: NavEntry[] =
    brand.navigation === undefined
      ? [
          { label: "Services", href: "#services", footer: false },
          { label: "About", href: "#about", footer: false },
          { label: "Contact", href: "#contact", footer: false },
        ]
      : brand.navigation;
  const primary = entries.filter((n) => !n.footer);
  const footerLinks = entries.filter((n) => n.footer);
  const explore = (footerLinks.length ? footerLinks : primary).flatMap((n) => [
    n,
    ...(n.children || []).map((c) => ({ ...c, footer: true })),
  ]);
  function menu(mobile: boolean) {
    return primary.map((n, i) => {
      const url = href(n);
      const kids = (n.children || []).filter((c) => href(c));
      if (kids.length)
        return (
          <details className="site-dropdown" key={i}>
            <summary>
              {n.label}
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div className="site-dropdown-panel">
              {url && url !== "#" && (
                <a href={url}>{mobile ? `All ${n.label}` : `${n.label} overview`}</a>
              )}
              {kids.map((c, j) => (
                <a key={j} href={href(c)}>
                  {c.label}
                </a>
              ))}
            </div>
          </details>
        );
      return url ? (
        <a key={i} href={url}>
          {n.label}
        </a>
      ) : null;
    });
  }
  const cta =
    brand.navCta?.label && brand.navCta.href
      ? { label: brand.navCta.label, url: href({ href: brand.navCta.href }) }
      : null;
  const whatsapp = brand.socials?.whatsapp;
  return (
    <div
      className={`rendered-site ${template}`}
      style={
        {
          "--site-primary": brand.primary,
          "--site-primary-fg": foreground(brand.primary),
          "--site-secondary": brand.secondary,
          "--site-secondary-fg": foreground(brand.secondary),
          "--site-bg": brand.background,
          "--site-text": brand.text,
          "--site-font":
            brand.font === "serif" ? "Georgia, serif" : "Arial, sans-serif",
        } as CSSProperties
      }
    >
      <header className="rendered-nav">
        <a className="site-logo" href={base || "#"}>
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} width={130} height={50} />
          ) : (
            <b>{brand.name}</b>
          )}
        </a>
        <nav className="site-desktop-menu" aria-label="Website navigation">
          {menu(false)}
        </nav>
        {cta && (
          <a className="button site-nav-cta" href={cta.url}>
            {cta.label}
          </a>
        )}
        <details className="site-mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile website navigation">
            {menu(true)}
            {cta && (
              <a className="button" href={cta.url}>
                {cta.label}
              </a>
            )}
          </nav>
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
          contact={contact}
          whatsapp={whatsapp}
        />
      )}
      {after}
      <footer className="rendered-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} width={130} height={50} />
            ) : (
              <b>{brand.name}</b>
            )}
            {brand.description && <p>{brand.description}</p>}
            <SocialLinks links={brand.socials} />
          </div>
          {!!explore.length && (
            <nav aria-label="Footer navigation" className="footer-col">
              <h2>Explore</h2>
              {explore.map((n, i) =>
                href(n) ? (
                  <a key={i} href={href(n)}>
                    {n.label}
                  </a>
                ) : null,
              )}
            </nav>
          )}
          {!!legal.length && (
            <nav aria-label="Legal information" className="footer-col">
              <h2>Legal</h2>
              {legal.map((l, i) => (
                <a key={i} href={l.href}>
                  {l.title}
                </a>
              ))}
            </nav>
          )}
          <div className="footer-col">
            <h2>Contact</h2>
            {contact?.phone && <a href={tel(contact.phone)}>{contact.phone}</a>}
            {brand.email && (
              <a href={`mailto:${brand.email}`}>{brand.email}</a>
            )}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            )}
            {contact?.address && <span>{contact.address}</span>}
            {contact?.hours && <span>{contact.hours}</span>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </span>
          <a href="/">Website by Omnyvox</a>
        </div>
      </footer>
    </div>
  );
}
