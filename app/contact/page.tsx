import { marketingMetadata } from "@/lib/marketing";
import { MarketingShell } from "@/components/marketing-shell";
import { ContactForm } from "@/components/contact-form";
export async function generateMetadata() {
  return marketingMetadata(
    "Contact Omnyvox",
    "Get help choosing a website plan, setting up your store, or managing your Omnyvox account.",
  );
}
export default function Page() {
  return (
    <MarketingShell>
      <main id="main" className="marketing-page">
        <div className="contact-grid">
          <div>
            <span className="eyebrow">LET’S TALK</span>
            <h1>A good next step starts with a conversation.</h1>
            <p>
              Tell us what you’re building and where you need a hand. Your
              message goes straight to our support team.
            </p>
            <img
              className="editorial-photo"
              src="/marketing-contact.webp"
              alt="A business support specialist ready to help"
              width={1440}
              height={960}
            />
          </div>
          <ContactForm />
        </div>
      </main>
    </MarketingShell>
  );
}
