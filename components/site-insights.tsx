import { Globe, Link2 } from "lucide-react";
import { faLinkedinIn, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { plainText } from "@/lib/content";
import { BrandIcon } from "./social-links";
import type { Content } from "@/lib/public-site";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const categoryName = (slug: string | undefined, categories: Content[]) =>
  !slug
    ? "Insights"
    : categories.find((c) => c.data.slug === slug)?.data.title ||
      slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Article cards shared by the homepage section and the Insights page. */
export function ArticleGrid({
  articles,
  authors,
  categories,
  href,
}: {
  articles: Content[];
  authors: Content[];
  categories: Content[];
  href: (r: Content) => string;
}) {
  return (
    <div className="site-article-grid">
      {articles.map((a) => {
        const author = authors.find((p) => p.id === a.data.authorId);
        return (
          <article className="site-article-card" key={a.id}>
            <a href={href(a)} className="site-article-media" tabIndex={-1} aria-hidden="true">
              {a.data.image ? (
                <img src={a.data.image} alt="" width={640} height={400} loading="lazy" />
              ) : (
                <span className="site-article-placeholder">{categoryName(a.data.category, categories)}</span>
              )}
            </a>
            <div className="site-article-body">
              <span className="site-article-meta">
                {a.data.category && a.data.category !== "general" && (
                  <b>{categoryName(a.data.category, categories)}</b>
                )}
                <time dateTime={a.created_at}>{date(a.created_at)}</time>
              </span>
              <h3>
                <a href={href(a)}>{a.data.title}</a>
              </h3>
              <p>{a.data.description || plainText(a.data.body).slice(0, 150)}</p>
              {(author || a.data.author) && (
                <span className="site-article-author">
                  {author?.data.image ? (
                    <img src={author.data.image} alt="" width={28} height={28} />
                  ) : (
                    <span className="site-avatar" aria-hidden="true">
                      {initials(author?.data.title || a.data.author)}
                    </span>
                  )}
                  {author?.data.title || a.data.author}
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Category chips from the subscriber's own categories. */
export function CategoryFilter({
  categories,
  active,
  href,
  counts,
}: {
  categories: { slug: string; title: string }[];
  active?: string;
  href: (slug?: string) => string;
  counts: Record<string, number>;
}) {
  if (!categories.length) return null;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <nav className="site-category-filter" aria-label="Filter articles by category">
      <a href={href()} aria-current={!active ? "page" : undefined}>
        All <span>{total}</span>
      </a>
      {categories.map((c) => (
        <a key={c.slug} href={href(c.slug)} aria-current={active === c.slug ? "page" : undefined}>
          {c.title} <span>{counts[c.slug] || 0}</span>
        </a>
      ))}
    </nav>
  );
}

/** Author byline card; social links only when the plan includes them. */
export function AuthorCard({
  author,
  href,
  showLinks,
  compact = false,
}: {
  author: Content;
  href?: string;
  showLinks: boolean;
  compact?: boolean;
}) {
  const links = showLinks ? author.data.links || {} : {};
  const Name = href ? "a" : "span";
  return (
    <div className={`site-author-card${compact ? " compact" : ""}`}>
      {author.data.image ? (
        <img src={author.data.image} alt={author.data.imageAlt || author.data.title} width={96} height={96} />
      ) : (
        <span className="site-avatar large" aria-hidden="true">
          {initials(author.data.title)}
        </span>
      )}
      <div>
        {compact && <span className="site-author-label">About the author</span>}
        <Name className="site-author-name" {...(href ? { href } : {})}>
          {author.data.title}
        </Name>
        {author.data.role && <span className="site-author-role">{author.data.role}</span>}
        {compact && author.data.body && <p>{plainText(author.data.body).slice(0, 220)}</p>}
        {!!(links.website || links.linkedin || links.x) && (
          <span className="site-author-links">
            {links.website && (
              <a href={links.website} target="_blank" rel="noopener noreferrer" aria-label={`${author.data.title} website`}>
                <Globe size={16} />
              </a>
            )}
            {links.linkedin && (
              <a href={links.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${author.data.title} on LinkedIn`}>
                <BrandIcon icon={faLinkedinIn} size={16} />
              </a>
            )}
            {links.x && (
              <a href={links.x} target="_blank" rel="noopener noreferrer" aria-label={`${author.data.title} on X`}>
                <BrandIcon icon={faXTwitter} size={16} />
              </a>
            )}
          </span>
        )}
        {compact && href && (
          <a className="site-author-more" href={href}>
            <Link2 size={14} /> More from {author.data.title.split(" ")[0]}
          </a>
        )}
      </div>
    </div>
  );
}
