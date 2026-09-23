import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { plainText } from "@/lib/content";
import type { MarketingRecord } from "@/lib/marketing";

export function AuthorAvatar({
  author,
  name,
}: {
  author?: MarketingRecord;
  name: string;
}) {
  return author?.data.image ? (
    <img
      className="author-avatar"
      src={author.data.image}
      alt=""
      width={40}
      height={40}
      loading="lazy"
    />
  ) : (
    <span className="author-avatar author-initials" aria-hidden="true">
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")}
    </span>
  );
}
export function InsightCard({
  article,
  author,
}: {
  article: MarketingRecord;
  author?: MarketingRecord;
}) {
  const name = author?.data.title || article.data.author || "Omnyvox Editorial";
  return (
    <article className="insight-card">
      <Link
        href={"/insights/" + article.data.slug}
        className="insight-cover"
        aria-label={article.data.title}
      >
        {article.data.image ? (
          <img
            src={article.data.image}
            alt={article.data.imageAlt || ""}
            width={720}
            height={480}
            loading="lazy"
          />
        ) : (
          <span className="insight-cover-placeholder">
            <span>OMNYVOX / INSIGHTS</span>
            <strong>{article.data.title}</strong>
          </span>
        )}
      </Link>
      <div className="insight-content">
        <span className="eyebrow">
          {article.data.category.replaceAll("-", " ")}
        </span>
        <h2>
          <Link href={"/insights/" + article.data.slug}>
            {article.data.title}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </h2>
        <p>{plainText(article.data.body).slice(0, 135)}…</p>
        <div className="insight-byline">
          <AuthorAvatar author={author} name={name} />
          <div>
            {author ? (
              <Link href={"/authors/" + author.id}>{name}</Link>
            ) : (
              <strong>{name}</strong>
            )}
            <time dateTime={article.created_at}>
              {new Date(article.created_at).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
}
