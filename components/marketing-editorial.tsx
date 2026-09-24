import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Globe2,
  LayoutTemplate,
  MessagesSquare,
  Palette,
  Search,
  ShieldCheck,
  ShoppingBag,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { MarketingPage } from "@/lib/marketing-pages";

function sectionIcon(title: string): LucideIcon {
  if (/payment|checkout|order|product|deliver|sales|store/i.test(title))
    return ShoppingBag;
  if (/secur|trust|protect|verified|account|privacy/i.test(title))
    return ShieldCheck;
  if (/brand|design|photo|colour/i.test(title)) return Palette;
  if (/team|people|who|business/i.test(title)) return Users;
  if (/enquir|help|contact|question|reply/i.test(title)) return MessagesSquare;
  if (/search|found|seo/i.test(title)) return Search;
  if (/domain|address/i.test(title)) return Globe2;
  if (/step|start|publish|saved|work/i.test(title)) return Workflow;
  return LayoutTemplate;
}

export function MarketingEditorial({
  page,
  pageKey,
}: {
  page: MarketingPage;
  pageKey: string;
}) {
  const faq = pageKey === "faq";
  const steps = [
    "how-it-works",
    "website-setup",
    "guides",
    "professional-services/migration",
  ].includes(pageKey);
  return (
    <div className={`editorial-layout${faq ? " editorial-questions" : ""}`}>
      <aside className="editorial-index">
        <span className="eyebrow">
          {faq
            ? "Your questions, answered"
            : steps
              ? "A clear path forward"
              : "On this page"}
        </span>
        <nav aria-label="On this page">
          {page.sections.map((section, i) => (
            <a key={section.title} href={`#detail-${i + 1}`}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          ))}
        </nav>
        <Link className="editorial-help" href="/contact">
          <MessagesSquare size={20} aria-hidden="true" />
          <span>
            Need a hand?
            <b>
              Talk to our team <ArrowUpRight size={14} aria-hidden="true" />
            </b>
          </span>
        </Link>
      </aside>
      <div
        className={
          faq
            ? "editorial-faq"
            : `editorial-sections${steps ? " editorial-steps" : ""}`
        }
      >
        {page.sections.map((section, i) => {
          const Icon = sectionIcon(section.title);
          const content = (
            <>
              {section.body && <p>{section.body}</p>}
              {section.points && (
                <ul className="editorial-points">
                  {section.points.map((point) => (
                    <li key={point}>
                      <Check size={17} aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          );
          return faq ? (
            <details id={`detail-${i + 1}`} key={section.title} open={i === 0}>
              <summary>
                <h2>{section.title}</h2>
                <ChevronDown size={20} aria-hidden="true" />
              </summary>
              <div>{content}</div>
            </details>
          ) : (
            <section id={`detail-${i + 1}`} key={section.title}>
              <span className="editorial-icon" aria-hidden="true">
                {steps ? (
                  String(i + 1).padStart(2, "0")
                ) : (
                  <Icon size={25} strokeWidth={1.6} />
                )}
              </span>
              <div>
                <h2>{section.title}</h2>
                {content}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
