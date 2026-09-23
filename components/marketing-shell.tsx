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
          <SocialLinks links={settings.socials} businessName="Omnyvox" />
        </div>
        <div>
          <strong>Explore Omnyvox</strong>
          <Link href="/templates">Find your template</Link>
          <Link href="/pricing">Compare plans</Link>
          <Link href="/insights">Insights & guides</Link>
          <Link href="/contact">Contact our team</Link>
        </div>
        <div>
          <strong>Your account</strong>
          <Link href="/register">Create an account</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/onboarding">Business verification</Link>
          {legal.map((l) => (
            <Link key={l.id} href={"/legal/" + l.data.slug}>
              {l.data.title}
            </Link>
          ))}
        </div>
        <small>
          © {new Date().getFullYear()} Nexoris Technologies Ltd. All rights
          reserved.
        </small>
      </footer>
    </div>
  );
}
