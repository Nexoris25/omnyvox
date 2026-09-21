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
export default function Home() {
  return (
    <>
      <header className="marketing-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#solutions">Solutions</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="nav-actions">
          <Link href="/login" className="login-link">
            Log in
          </Link>
          <Link href="/register" className="button small">
            Create your website <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div className="eyebrow">
            <span className="pulse" /> YOUR NEXT CHAPTER STARTS HERE
          </div>
          <h1>
            Your business.
            <br />A bigger <span>possibility.</span>
          </h1>
          <p>
            A website you’re proud to share. An online store ready to grow.
            <br className="desktop" /> All the tools you need, with the
            technical work taken care of.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="button">
              Let’s build your website <ArrowUpRight size={18} />
            </Link>
            <a href="#templates" className="button secondary">
              Explore templates <ArrowRight size={18} />
            </a>
          </div>
          <div className="hero-notes">
            <span>
              <Check size={14} /> Your brand, your way
            </span>
            <span>
              <Check size={14} /> No coding needed
            </span>
            <span>
              <Check size={14} /> Hosting included
            </span>
          </div>
          <div className="showcase">
            <div className="showcase-caption">
              <span>FROM AN IDEA TO YOUR OWN CORNER OF THE INTERNET</span>
              <span>Made with Omnyvox ↗</span>
            </div>
            <div className="site-mock corporate-mock">
              <div className="mock-browser">
                <i />
                <i />
                <i />
                <span>studio.omnyvox.com</span>
              </div>
              <div className="mock-nav">
                <b>
                  forma<span>®</span>
                </b>
                <span>Our studio　 Work　 Contact ↗</span>
              </div>
              <div className="forma-body">
                <span className="mini-label">INDEPENDENT DESIGN STUDIO</span>
                <h2>
                  Good ideas.
                  <br />
                  Extraordinary
                  <br />
                  <em>possibilities.</em>
                </h2>
                <p>
                  We help ambitious brands find their voice
                  <br />
                  and make their mark.
                </p>
                <span className="mock-cta">Discover our work ↗</span>
                <div className="architectural">
                  <div />
                  <div />
                  <div />
                </div>
              </div>
              <div className="mock-bottom">
                STRATEGY　 •　 DESIGN　 •　 DIGITAL EXPERIENCES
              </div>
            </div>
            <div className="site-mock shop-mock">
              <div className="mock-browser">
                <i />
                <i />
                <i />
                <span>theeveryday.omnyvox.com</span>
              </div>
              <div className="mock-nav">
                <b>the everyday.</b>
                <ShoppingBag size={15} />
              </div>
              <div className="shop-body">
                <span>LESS, BUT BETTER</span>
                <h3>
                  Everyday things.
                  <br />
                  Beautifully considered.
                </h3>
                <div className="product-display">
                  <div className="product-block">
                    every
                    <br />
                    day<span>ESSENTIALS / 01</span>
                  </div>
                </div>
                <div className="product-caption">
                  <span>The essentials collection</span>
                  <ArrowUpRight size={18} />
                </div>
              </div>
            </div>
            <div className="floating-label">
              <span className="success-icon">
                <Check size={17} />
              </span>
              <div>
                <b>That’s your website. Live.</b>
                <small>Your next chapter looks good.</small>
              </div>
            </div>
          </div>
        </section>
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
            <Link href="/dashboard/templates" className="button secondary">
              Browse templates <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="template-grid">
            {[
              ["Studio", "For bold ideas and creative businesses.", "studio"],
              ["Atelier", "For carefully curated online stores.", "atelier"],
              ["Horizon", "For expertise that speaks for itself.", "horizon"],
            ].map(([name, desc, style]) => (
              <Link
                className="template-card"
                href={`/register?template=${style}`}
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
        <section className="section pricing-section" id="pricing">
          <span className="eyebrow">ROOM FOR WHAT COMES NEXT</span>
          <h2>A plan for every chapter.</h2>
          <p>
            Choose your website category when you sign up. All plans include
            hosting, SSL, and your own content manager.
          </p>
          <div className="pricing-grid">
            {[
              [
                "Basic",
                "A confident first step.",
                "5 content pages",
                "Omnyvox subdomain",
                "25 store products",
              ],
              [
                "Growth",
                "More room. More opportunity.",
                "15 content pages",
                "Connect your own domain",
                "250 store products",
              ],
              [
                "Advanced",
                "Built for bigger ambitions.",
                "100 content pages",
                "Advanced team capabilities",
                "2,000 store products",
              ],
            ].map(([name, desc, ...features]) => (
              <article
                className={`price-card ${name === "Growth" ? "featured" : ""}`}
                key={name}
              >
                {name === "Growth" && (
                  <span className="popular">ROOM TO GROW</span>
                )}
                <h3>{name}</h3>
                <p>{desc}</p>
                <PlanPrice tier={name.toLowerCase()} />
                <Link
                  href={`/register?plan=${name.toLowerCase()}`}
                  className={`button ${name === "Growth" ? "" : "secondary"}`}
                >
                  Choose {name} <ArrowUpRight size={16} />
                </Link>
                <ul>
                  {features.map((f) => (
                    <li key={f}>
                      <Check size={16} />
                      {f}
                    </li>
                  ))}
                  <li>
                    <Check size={16} />
                    Editable brand colours
                  </li>
                  <li>
                    <Check size={16} />
                    {name === "Basic"
                      ? "Essential SEO tools"
                      : "Blog & enhanced SEO"}
                  </li>
                </ul>
              </article>
            ))}
          </div>
          <small>
            Product limits apply to e-Commerce websites. Commercial pricing will
            be published before paid subscriptions open.
          </small>
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
            <Link href="/dashboard/services" className="button">
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
      <footer className="footer">
        <div>
          <Brand />
          <p>Business websites. Fully managed.</p>
          <small>© {new Date().getFullYear()} Nexoris Technologies Ltd.</small>
        </div>
        <div>
          <a href="#solutions">Solutions</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Plans</a>
        </div>
        <div>
          <Link href="/dashboard/support">Get support</Link>
          <Link href="/login">Your workspace</Link>
          <Link href="/register">Get started</Link>
        </div>
      </footer>
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
    </>
  );
}
