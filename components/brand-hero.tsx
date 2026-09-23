import Link from "next/link";
import { ArrowUpRight, ArrowRight, Check, Globe2 } from "lucide-react";
export function BrandHero() {
  return (
    <section className="brand-hero">
      <div className="brand-hero-copy">
        <span className="eyebrow">YOUR BUSINESS. YOUR OWN SPACE ONLINE.</span>
        <h1>
          A business worth building.
          <br />
          <span>A website to match.</span>
        </h1>
        <p>
          Bring your services, story, or store online. Make it your own, keep it
          up to date, and manage it all in one place.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/register">
            Create your website <ArrowUpRight size={18} />
          </Link>
          <Link className="button secondary" href="/templates">
            Find your template <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-notes">
          <span>
            <Check size={14} /> Your colours & content
          </span>
          <span>
            <Check size={14} /> No coding needed
          </span>
          <span>
            <Check size={14} /> Managed hosting
          </span>
        </div>
      </div>
      <figure className="brand-hero-visual">
        <img
          src="/marketing-hero-v2.webp"
          srcSet="/marketing-hero-v2-small.webp 640w, /marketing-hero-v2.webp 1440w"
          sizes="(max-width:680px) 100vw, 50vw"
          width={1440}
          height={960}
          fetchPriority="high"
          alt="Fashion entrepreneur considering fabric samples in a sunlit studio"
        />
        <figcaption>
          <Globe2 size={28} />
          <div>
            <strong>Built around your business.</strong>
            <span>Your brand. Your content. Fully managed.</span>
          </div>
        </figcaption>
      </figure>
    </section>
  );
}
