import { ChevronRight } from "lucide-react";

/** Billing answers that match how plans actually behave in the product. */
const questions: [string, string][] = [
  [
    "Can I pay monthly or yearly?",
    "Yes. Choose monthly or annual billing at checkout. Annual payments may include a discount or bonus months; any offer is shown before you pay.",
  ],
  [
    "What happens if I upgrade?",
    "Upgrades take effect immediately. You pay only the difference for the rest of your current billing period, and your renewal moves to the new plan’s price.",
  ],
  [
    "And if I downgrade?",
    "Downgrades take effect at the end of the period you have already paid for, so you keep everything until then. Content over the new plan’s limits returns to draft; nothing is deleted.",
  ],
  [
    "Can I cancel at any time?",
    "Yes. Turn off automatic renewal from Subscription & billing. Your website stays online until the end of the paid period, and your content stays in your workspace.",
  ],
  [
    "Do you take a commission on store sales?",
    "No. Store payments go straight to your own Paystack account. Omnyvox adds no commission; Paystack’s standard processing fees apply.",
  ],
  [
    "Is a domain name included?",
    "Every plan includes an Omnyvox web address. Growth and Advanced let you connect your own domain; the domain itself is bought separately from a registrar.",
  ],
  [
    "How do I pay?",
    "Subscriptions are paid securely through Paystack, using the methods its checkout offers, such as card, bank transfer and USSD. You receive an invoice for every payment in your workspace.",
  ],
];

export function PricingFaq() {
  return (
    <section className="section faq pricing-faq" aria-labelledby="pricing-faq-title">
      <div>
        <span className="eyebrow">BILLING QUESTIONS</span>
        <h2 id="pricing-faq-title">Before you choose.</h2>
        <p>
          More detail is in our{" "}
          <a href="/legal/refunds">Refund &amp; cancellation policy</a>.
        </p>
      </div>
      <div>
        {questions.map(([q, a]) => (
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
  );
}
