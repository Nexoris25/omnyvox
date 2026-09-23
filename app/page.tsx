import { InsightCard } from "@/components/insight-card";
import { marketingMetadata, marketingContent } from "@/lib/marketing";
import { MarketingShell } from "@/components/marketing-shell";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Globe2,
  MousePointer2,
  Palette,
  ShieldCheck,
  Zap,
  LayoutTemplate,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { PlanPrice } from "@/components/plan-price";
import { Brand } from "@/components/brand";
import { jsonLd } from "@/lib/model";
import { BrandHero } from "@/components/brand-hero";
import {
  starterImage,
  templateIndustry,
  photoSourceSet,
} from "@/lib/brand-assets";
export async function generateMetadata() {
  return marketingMetadata(
    "Business websites. Fully managed.",
    "Build and manage a business website or online store with your own brand, content and payments.",
  );
}
export default async function Home() {
  const authors = await marketingContent("authors");
  const articles = (await marketingContent("articles")).slice(0, 3);
  return (
    <MarketingShell>
      <main id="main">
        <BrandHero />
        <section className="trust-strip">
          <p>One platform. Everything behind your website.</p>
          <div>
            <span>
              <Globe2 /> Managed hosting
            </span>
            <span>
              <ShieldCheck /> SSL included
            </span>
            <span>
              <Zap /> Built for speed
            </span>
            <span>
              <Palette /> Entirely your brand
            </span>
          </div>
        </section>
        <section className="section" id="solutions">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BUILT FOR YOUR KIND OF BUSINESS</span>
              <h2>
                Different ambitions.
                <br />
                One place to start.
              </h2>
            </div>
            <p>
              Whether you’re building credibility or your next best seller,
              there’s a home for your business here.
            </p>
          </div>
          <div className="solution-grid">
            <article className="solution-card">
              <span className="icon-tile">
                <Globe2 />
              </span>
              <h3>
                Make your business
                <br />
                the one they remember.
              </h3>
              <p>
                Bring your services, projects, and story together in a
                professional corporate website.
              </p>
              <Link href="/register?category=corporate">
                Explore corporate websites <ArrowUpRight size={18} />
              </Link>
              <div className="solution-tags">
                <span>Consultants</span>
                <span>Agencies</span>
                <span>Organisations</span>
              </div>
              <img
                className="solution-photo"
                src="/marketing-corporate-v2.webp"
                srcSet="/marketing-corporate-v2-small.webp 640w, /marketing-corporate-v2.webp 1440w"
                sizes="(max-width:680px) 100vw, 50vw"
                alt="Consultant discussing a project with a small business team"
                width={1440}
                height={960}
                loading="lazy"
              />
            </article>
            <article className="solution-card dark">
              <span className="icon-tile">
                <ShoppingBag />
              </span>
              <h3>
                Turn “I love it”
                <br />
                into “I’ll take it”.
              </h3>
              <p>
                Your own branded storefront, with products, inventory, and
                orders together in one workspace.
              </p>
              <Link href="/register?category=commerce">
                Start your online store <ArrowUpRight size={18} />
              </Link>
              <div className="solution-tags">
                <span>Fashion</span>
                <span>Beauty</span>
                <span>Home & lifestyle</span>
              </div>
              <img
                className="solution-photo"
                src="/marketing-commerce-v2.webp"
                srcSet="/marketing-commerce-v2-small.webp 640w, /marketing-commerce-v2.webp 1440w"
                sizes="(max-width:680px) 100vw, 50vw"
                alt="Online store owner packing a ceramic mug for delivery"
                width={1440}
                height={960}
                loading="lazy"
              />
            </article>
          </div>
        </section>
        <section className="section templates-section" id="templates">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A HEAD START, NOT A BLANK PAGE</span>
              <h2>
                Find your starting point.
                <br />
                Make it unmistakably you.
              </h2>
            </div>
            <Link href="/templates" className="button secondary">
              Browse templates <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="template-grid">
            {[
              [
                "Business Studio",
                "For bold ideas and creative businesses.",
                "studio",
              ],
              [
                "Boutique Store",
                "For carefully curated online stores.",
                "atelier",
              ],
              [
                "Modern Company",
                "For expertise that speaks for itself.",
                "horizon",
              ],
            ].map(([name, desc, style]) => (
              <Link
                className="template-card"
                href={`/templates/${style}`}
                key={name}
              >
                <div className={`template-art ${style}`}>
                  <div className="tiny-nav">
                    {name.toLowerCase()}. <span>Menu ↗</span>
                  </div>
                  <h3>
                    {style === "studio"
                      ? "Ideas worth bringing to life."
                      : style === "atelier"
                        ? "Objects for everyday living."
                        : "A clearer view of what’s next."}
                  </h3>
                  <span className="template-line" />
                  <span className="template-line short" />
                  <div className="template-button">Discover more ↗</div>
                  <img
                    className="template-cover"
                    src={starterImage(templateIndustry[style], "hero")}
                    srcSet={photoSourceSet(
                      starterImage(templateIndustry[style], "hero"),
                    )}
                    sizes="(max-width:680px) 100vw, 33vw"
                    alt=""
                    width={640}
                    height={427}
                    loading="lazy"
                  />
                </div>
                <div className="template-meta">
                  <div>
                    <h3>{name}</h3>
                    <p>{desc}</p>
                  </div>
                  <ArrowUpRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="section how-section" id="how-it-works">
          <div>
            <span className="eyebrow">LESS SETUP. MORE POSSIBILITY.</span>
            <h2>
              Your website.
              <br />
              Without the
              <br />
              <span className="purple">workaround.</span>
            </h2>
            <p>
              You know your business. We handle the infrastructure.
              <br />
              Go from starting point to something you’re proud of.
            </p>
            <Link href="/register" className="button">
              Get started <ArrowRight size={17} />
            </Link>
          </div>
          <div className="steps">
            <img
              className="brand-process-photo"
              src="/marketing-setup-v2.webp"
              srcSet="/marketing-setup-v2-small.webp 640w, /marketing-setup-v2.webp 1440w"
              sizes="(max-width:680px) 100vw, 50vw"
              alt="Business owner planning website content at a laptop"
              width={1440}
              height={960}
              loading="lazy"
            />
            {[
              [
                "01",
                "Pick your foundation",
                "Choose a corporate website or online store, a plan, and a template that feels right.",
              ],
              [
                "02",
                "Make yourself at home",
                "Add your content, change your colours, and bring your brand to every page.",
              ],
              [
                "03",
                "Put it out into the world",
                "Preview, publish, and keep growing. Hosting and platform maintenance are on us.",
              ],
            ].map(([n, t, d]) => (
              <div className="step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="section pricing-section">
          <div className="section-heading">
            <span className="eyebrow">A PLAN FOR YOUR NEXT STEP</span>
            <h2>
              One website or room for three.
              <br />
              Choose the right fit.
            </h2>
            <p>
              Compare business website and online store plans, with monthly and
              annual options.
            </p>
            <Link href="/pricing" className="button">
              Explore plans & compare features →
            </Link>
          </div>
        </section>
        <section className="assistance section">
          <div>
            <span className="eyebrow">A LITTLE HELP GOES A LONG WAY</span>
            <h2>
              Your vision.
              <br />
              Our hands-on help.
            </h2>
            <p>
              Prefer to leave the setup to someone else? Nexoris can help with
              your content, branding, and website configuration.
            </p>
            <Link href="/contact" className="button">
              Explore professional setup <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="assistance-note">
            <MousePointer2 size={30} />
            <h3>
              Made for you.
              <br />
              Ready for your next move.
            </h3>
            <p>
              Professional setup is an optional service,
              <br />
              separate from your subscription.
            </p>
          </div>
        </section>
        <section className="section">
          <div className="section-heading">
            <span className="eyebrow">INSIGHTS & GUIDES</span>
            <h2>Make your next step a clearer one.</h2>
            <Link href="/insights" className="button secondary">
              Explore the journal →
            </Link>
          </div>
          <div className="insights-grid">
            {articles.map((a) => (
              <InsightCard
                key={a.id}
                article={a}
                author={authors.find((author) => author.id === a.data.authorId)}
              />
            ))}
          </div>
        </section>
        <section className="section faq">
          <div>
            <span className="eyebrow">GOOD QUESTIONS</span>
            <h2>A little more clarity.</h2>
          </div>
          <div>
            {[
              [
                "Do I need to know how to code?",
                "No. Manage your website through a structured editor. Change your text, colours, images, and sections without touching code.",
              ],
              [
                "Can I use my own domain?",
                "Yes, on Growth and Advanced. Basic includes an Omnyvox subdomain. Domain registration is separate.",
              ],
              [
                "Can I change my brand colours?",
                "Yes. Every plan includes editable primary, secondary, background, and text colours, along with typography and logo settings.",
              ],
              [
                "What happens when I update my website?",
                "Save changes as a draft, preview them, and publish when you are ready. Your existing published design stays live until you publish again.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronRight size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="founder-story">
          <img
            src="/marketing-founders.webp"
            alt="Entrepreneurs planning their business at a studio desk"
            width={1440}
            height={960}
          />
          <div>
            <span className="eyebrow">MORE TIME FOR YOUR BUSINESS</span>
            <h2>
              Bring your ambition.
              <br />
              We’ll help you put it online.
            </h2>
            <p>
              Explain what you do, share your expertise and give customers a
              clear way to buy or get in touch. Keep your website and content
              together in one workspace.
            </p>
            <Link href="/contact" className="button secondary">
              Talk about your website →
            </Link>
          </div>
        </section>
        <section className="final-cta">
          <span className="eyebrow">YOUR BUSINESS BELONGS HERE</span>
          <h2>
            Make your next move
            <br />a website worth sharing.
          </h2>
          <Link href="/register" className="button white">
            Create your website <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Omnyvox",
            parentOrganization: {
              "@type": "Organization",
              name: "Nexoris Technologies Ltd",
            },
            url: process.env.APP_URL || "http://localhost:3000",
            logo: `${process.env.APP_URL || "http://localhost:3000"}/brand-icon.webp`,
          }),
        }}
      />
    </MarketingShell>
  );
}
