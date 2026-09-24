import { connection } from "next/server";
import Link from "next/link";
import { MarketingHeader } from "./marketing-header";
import { Brand } from "./brand";
import { SocialLinks } from "./social-links";
import { marketingContent, marketingSettings } from "@/lib/marketing";
export async function MarketingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const [legal, settings] = await Promise.all([
    marketingContent("legal"),
    marketingSettings(),
  ]);
  const order = ["terms", "privacy", "cookies", "acceptable-use", "refunds"];
  const rank = (slug: string) =>
    order.includes(slug) ? order.indexOf(slug) : order.length;
  const orderedLegal = [...legal].sort(
    (a, b) => rank(a.data.slug) - rank(b.data.slug),
  );
  return (
    <div className="marketing-site">
      <MarketingHeader />
      {children}
      <footer className="marketing-footer">
        <div className="footer-intro">
          <Brand />
          <p className="footer-description">
            Professionally designed websites and online stores for Nigerian
            businesses, with hosting, security and support included.
          </p>
          <SocialLinks links={settings.socials} businessName="Omnyvox" />
          <Link href="/register" className="button small footer-cta">
            Start your website
          </Link>
        </div>
        <nav aria-label="Product">
          <strong>Product</strong>
          <Link href="/corporate-websites">Business websites</Link>
          <Link href="/ecommerce-websites">Online stores</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <nav aria-label="Resources">
          <strong>Resources</strong>
          <Link href="/insights">Insights & guides</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/help">Help centre</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/website-setup">Website setup</Link>
        </nav>
        <nav aria-label="Company">
          <strong>Company</strong>
          <Link href="/about">About Omnyvox</Link>
          <Link href="/professional-services">Professional services</Link>
          <Link href="/contact">Contact us</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create an account</Link>
        </nav>
        <nav aria-label="Legal">
          <strong>Legal</strong>
          {orderedLegal.map((l) => (
            <Link key={l.id} href={"/legal/" + l.data.slug}>
              {l.data.title}
            </Link>
          ))}
        </nav>
        <div className="footer-bottom">
          <small>
            © {new Date().getFullYear()} Omnyvox, a product of Nexoris
            Technologies Ltd, Nigeria. All rights reserved.
          </small>
          <nav aria-label="Legal shortcuts">
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/cookies">Cookies</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
