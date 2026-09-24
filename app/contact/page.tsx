import { marketingMetadata } from "@/lib/marketing";
import { MarketingShell } from "@/components/marketing-shell";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { marketingSettings } from "@/lib/marketing";
export async function generateMetadata() {
  return marketingMetadata(
    "Contact Omnyvox",
    "Get help choosing a website plan, setting up your store, or managing your Omnyvox account.",
  );
}
export default async function Page() {
  const contact = (await marketingSettings()).contact || {};
  return (
    <MarketingShell>
      <main id="main" className="marketing-page">
        <div className="contact-grid">
          <div>
            <span className="eyebrow">LET’S TALK</span>
            <h1>Talk to a real person.</h1>
            <p>
              Whether you’re choosing a plan, setting up your store or stuck on
              something, send us a message and our team will reply by email;
              we aim to reply within one working day.
            </p>
            {(contact.email || contact.phone || contact.address || contact.hours) && (
              <ul className="contact-details">
                {contact.email && (
                  <li>
                    <Mail size={18} aria-hidden="true" />
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </li>
                )}
                {contact.phone && (
                  <li>
                    <Phone size={18} aria-hidden="true" />
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a>
                  </li>
                )}
                {contact.address && (
                  <li>
                    <MapPin size={18} aria-hidden="true" />
                    <span>{contact.address}</span>
                  </li>
                )}
                {contact.hours && (
                  <li>
                    <Clock size={18} aria-hidden="true" />
                    <span>{contact.hours}</span>
                  </li>
                )}
              </ul>
            )}
            <p className="contact-selfhelp">
              Looking for a quick answer? Try the <Link href="/help">Help centre</Link>{" "}
              or <Link href="/faq">FAQs</Link>.
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
