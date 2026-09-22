import { marketingMetadata } from "@/lib/marketing";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { templates } from "@/lib/templates";
export async function generateMetadata() {
  return marketingMetadata(
    "Website templates | Omnyvox",
    "Explore flexible templates for services, companies and online stores. Make every colour, image and section your own.",
  );
}
export default function Page() {
  return (
    <MarketingShell>
      <main id="main" className="marketing-page">
        <header className="page-intro">
          <span className="eyebrow">YOUR STARTING POINT</span>
          <h1>
            A strong first impression.
            <br />A style that’s yours.
          </h1>
          <p>
            Start with a considered layout, then change the colours, content and
            images to suit your business. Every template adapts to mobile.
          </p>
        </header>
        <div className="template-gallery">
          {templates.map((t) => (
            <article key={t.id} className="template-card">
              <div
                className={"template-snapshot " + t.id}
                style={{ background: t.color }}
              >
                <div>
                  <b>{t.business}</b>
                  <span>About · Services · Contact</span>
                </div>
                <h2>{t.headline}</h2>
                <p>Built around people. Designed to make a difference.</p>
                <span className="snapshot-cta">Discover our work ↗</span>
                <div className="snapshot-blocks">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className="template-description">
                <span className="eyebrow">{t.type}</span>
                <h2>{t.name}</h2>
                <p>{t.description}</p>
                <Link
                  className="template-preview-link"
                  href={"/templates/" + t.id}
                >
                  Preview template ↗
                </Link>
                <Link
                  href={"/register?template=" + t.id}
                  className="button secondary"
                >
                  Start with {t.name} →
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="muted">
          Illustrative template snapshots. Your published website uses your own
          content and branding.
        </p>
      </main>
    </MarketingShell>
  );
}
