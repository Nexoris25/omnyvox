"use client";
import { Check } from "lucide-react";
import {
  templates,
  templateManifests,
  compatibleTemplate,
} from "@/lib/templates";
import { starterImage, templateIndustry } from "@/lib/brand-assets";
export function TemplateCard({
  id,
  selected,
  onSelect,
  selectedLabel = "Selected template",
  actionLabel = "Use this template",
  compact = false,
}: {
  id: string;
  selected?: boolean;
  onSelect: () => void;
  selectedLabel?: string;
  actionLabel?: string;
  compact?: boolean;
}) {
  const t = templates.find((p) => p.id === id);
  if (!t) return null;
  if (compact)
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`template-card-compact${selected ? " template-card-selected" : ""}`}
        aria-pressed={selected}
      >
        <span className={`template-art template-art-compact ${id}`}>
          <span className="tiny-nav">
            {t.name}. <span>Menu ↗</span>
          </span>
          <span className="template-check" aria-hidden="true">
            <Check size={13} />
          </span>
          <img
            className="template-cover"
            src={starterImage(templateIndustry[id], "hero").replace(
              ".webp",
              "-small.webp",
            )}
            alt=""
            width={320}
            height={213}
            loading="lazy"
          />
        </span>
        <span className="template-compact-name">{t.name}</span>
        <span className="template-compact-type">{t.type}</span>
      </button>
    );
  return (
    <article
      className={`template-card panel${selected ? " template-card-selected" : ""}`}
    >
      <div className={`template-art ${id}`}>
        <div className="tiny-nav">
          {t.name}. <span>Menu ↗</span>
        </div>
        <h3>{t.headline}</h3>
        <span className="template-line" />
        <span className="template-line short" />
        <img
          className="template-cover"
          src={starterImage(templateIndustry[id], "hero").replace(
            ".webp",
            "-small.webp",
          )}
          alt=""
          width={640}
          height={427}
          loading="lazy"
        />
      </div>
      <div className="panel-body">
        <h3 style={{ fontSize: 18 }}>{t.name}</h3>
        <span className="muted" style={{ fontSize: 11 }}>
          {t.type}
        </span>
        <p className="muted" style={{ fontSize: 12 }}>
          {t.description}
        </p>
        <button type="button" className="button small" onClick={onSelect}>
          {selected ? selectedLabel : actionLabel} <Check size={13} />
        </button>
      </div>
    </article>
  );
}
export function templateOptions(
  category: "corporate" | "commerce",
  industry?: string,
) {
  return templates
    .filter((t) => compatibleTemplate(t.id, category, industry))
    .sort((a, b) => {
      const matches = (id: string) =>
        industry
          ? Number(
              (
                templateManifests[id as keyof typeof templateManifests]
                  .industries as readonly string[]
              ).includes(industry),
            )
          : 0;
      // Specialised families (fewer industries) come before general ones,
      // so construction starts on Build & Industry, not Modern Company.
      const breadth = (id: string) =>
        templateManifests[id as keyof typeof templateManifests].industries.length;
      return matches(b.id) - matches(a.id) || breadth(a.id) - breadth(b.id);
    });
}
/** A compact grid of template cards for choosing a starting template,
 * filtered by category and sorted so families matching the chosen
 * industry come first. */
export function TemplatePickerGrid({
  category,
  industry,
  value,
  onChange,
}: {
  category: "corporate" | "commerce";
  industry?: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const options = templateOptions(category, industry);
  return (
    <div className="template-picker-grid">
      {options.map((t) => (
        <TemplateCard
          key={t.id}
          id={t.id}
          compact
          selected={value === t.id}
          onSelect={() => onChange(t.id)}
        />
      ))}
    </div>
  );
}
