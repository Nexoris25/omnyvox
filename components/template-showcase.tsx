"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type ShowcaseTemplate = {
  id: string;
  name: string;
  type: string;
  headline: string;
  category: "corporate" | "commerce";
  image: string;
  srcSet?: string;
};

const filters = [
  ["all", "All templates"],
  ["corporate", "Business websites"],
  ["commerce", "Online stores"],
] as const;

/** Every template family on the homepage, filterable by website type. */
export function TemplateShowcase({ templates }: { templates: ShowcaseTemplate[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all");
  const shown = templates.filter((t) => filter === "all" || t.category === filter);
  return (
    <>
      <div className="template-filter" role="tablist" aria-label="Filter templates">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
            <span>{key === "all" ? templates.length : templates.filter((t) => t.category === key).length}</span>
          </button>
        ))}
      </div>
      <div className="template-grid template-showcase">
        {shown.map((t) => (
          <Link className="template-card" href={`/templates/${t.id}`} key={t.id}>
            <div className={`template-art ${t.id}`}>
              <div className="tiny-nav">
                {t.name.toLowerCase()}. <span>Menu ↗</span>
              </div>
              <h3>{t.headline}</h3>
              <span className="template-line" />
              <span className="template-line short" />
              <div className="template-button">Discover more ↗</div>
              <img
                className="template-cover"
                src={t.image}
                srcSet={t.srcSet}
                sizes="(max-width:680px) 100vw, 33vw"
                alt=""
                width={640}
                height={427}
                loading="lazy"
              />
            </div>
            <div className="template-meta">
              <div>
                <h3>{t.name}</h3>
                <p>{t.type}</p>
              </div>
              <ArrowUpRight size={20} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
