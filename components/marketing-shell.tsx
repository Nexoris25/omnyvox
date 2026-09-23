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
  return (
    <div className="marketing-site">
      <MarketingHeader />
      {children}
      <footer className="marketing-footer">
        <div>
          <Brand />
          <p>Business websites. Fully managed.</p>
          <p className="footer-description">
            Build your online presence, manage your content and serve your
            customers from one place.
          </p>
          <SocialLinks links={settings.socials} businessName="Omnyvox" />
        </div>
        <div>
          <strong>Product</strong>
          <Link href="/corporate-websites">Business websites</Link>
          <Link href="/ecommerce-websites">Online stores</Link>
          <Link href="/features">Features</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/pricing">Pricing</Link>
        </div>
        <div>
          <strong>Resources</strong>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/insights">Insights & guides</Link>
          <Link href="/help">Help centre</Link>
          <Link href="/website-setup">Website setup</Link>
          <Link href="/professional-services">Professional services</Link>
        </div>
        <div>
          <strong>Company</strong>
          <Link href="/about">About Omnyvox</Link>
          <Link href="/contact">Contact us</Link>
          <Link href="/faq">FAQs</Link>
        </div>
        <div>
          <strong>Your account</strong>
          <Link href="/register">Create an account</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/forgot-password">Account recovery</Link>
        </div>
        <div className="footer-bottom">
          <small>
            © {new Date().getFullYear()} Omnyvox. A product of Nexoris
            Technologies Ltd.
          </small>
          <nav aria-label="Legal">
            {legal.map((l) => (
              <Link key={l.id} href={"/legal/" + l.data.slug}>
                {l.data.title}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
