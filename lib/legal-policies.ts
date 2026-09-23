/**
 * Legal pages each industry needs, with fill-in drafts.
 *
 * Drafts are structured starting points, not legal advice. Every fact only
 * the business can confirm is a "[Required: …]" marker, and the API refuses
 * to publish a page that still contains one. Owners must also tick
 * "reviewed" (policyReviewed) before a policy counts as published.
 */
export const policyTypes = [
  "terms",
  "privacy",
  "cookies",
  "refund",
  "shipping",
  "fulfilment",
  "returns",
  "disclaimer",
  "medical-disclaimer",
  "cancellation",
  "booking",
  "warranty",
  "carriage",
  "safeguarding",
  "donations",
  "admissions",
  "listing-disclaimer",
  "allergens",
  "product-safety",
  "quotation",
  "copyright",
  "other",
] as const;
export type PolicyType = (typeof policyTypes)[number];

type Policy = { title: string; slug: string; reason: string; body: string };

const REVIEW = `<div class="callout"><p><strong>Draft for your review — not legal advice.</strong> Replace every highlighted placeholder with your actual practices, remove anything that does not apply, and have this page reviewed by a qualified adviser before publishing.</p></div>`;
const R = (text: string) => `[Required: ${text}]`;
const contact = `<h2>Contact us</h2><p>Questions about this policy can be sent to ${R("contact email")} or ${R("postal address")}.</p><p>Last updated: ${R("date")}</p>`;

export const policies: Record<Exclude<PolicyType, "other">, Policy> = {
  terms: {
    title: "Terms & conditions",
    slug: "terms",
    reason: "Every website needs terms governing how visitors use it.",
    body: `${REVIEW}<h2>About these terms</h2><p>These terms apply when you use this website operated by ${R("registered business name and RC number")}. By using the website you agree to them.</p><h2>Using this website</h2><ul><li>Use the website lawfully and do not attempt to disrupt or misuse it.</li><li>Information on this website is provided for general purposes and may change without notice.</li></ul><h2>Intellectual property</h2><p>Content on this website belongs to us or our licensors unless stated otherwise.</p><h2>Liability</h2><p>${R("describe the limits of your liability as advised by your legal adviser")}</p><h2>Governing law</h2><p>These terms are governed by the laws of ${R("jurisdiction, e.g. the Federal Republic of Nigeria")}.</p>${contact}`,
  },
  privacy: {
    title: "Privacy policy",
    slug: "privacy",
    reason: "Required wherever personal data is collected, including contact forms.",
    body: `${REVIEW}<h2>Who we are</h2><p>${R("registered business name")} is responsible for personal data collected through this website.</p><h2>What we collect</h2><ul><li>Details you send through our forms, such as your name, email address and message.</li><li>${R("any other data you collect, e.g. order, payment or appointment details")}</li></ul><h2>Why we use it</h2><p>We use your data to respond to enquiries and provide our services. ${R("list any other purposes and the lawful basis for each")}</p><h2>Sharing</h2><p>${R("name the categories of service providers you share data with, e.g. email or payment providers")}</p><h2>How long we keep it</h2><p>${R("retention period")}</p><h2>Your rights</h2><p>You may request access to, correction of or deletion of your personal data, and you may complain to the Nigeria Data Protection Commission. ${R("confirm the rights and regulator that apply to you")}</p>${contact}`,
  },
  cookies: {
    title: "Cookie policy",
    slug: "cookies",
    reason: "Explains the cookies and similar technologies the website uses.",
    body: `${REVIEW}<h2>What cookies are</h2><p>Cookies are small files stored on your device to make a website work or to understand how it is used.</p><h2>Cookies we use</h2><ul><li><strong>Essential:</strong> needed for the website to function, for example to remember your cart.</li><li>${R("list any analytics, embedded video or marketing cookies you enable")}</li></ul><h2>Managing cookies</h2><p>You can block or delete cookies in your browser settings. Blocking essential cookies may affect how the website works.</p>${contact}`,
  },
  refund: {
    title: "Refund & returns policy",
    slug: "refund-policy",
    reason: "Customers must know how refunds and returns work before they buy.",
    body: `${REVIEW}<h2>Returns</h2><p>You may return eligible items within ${R("number of days")} of delivery. ${R("list conditions, e.g. unused, original packaging, proof of purchase")}</p><h2>Items that cannot be returned</h2><p>${R("list exclusions, e.g. perishable, personalised or hygiene items")}</p><h2>How to request a return</h2><p>Contact us at ${R("email or phone")} with your order reference.</p><h2>Refunds</h2><p>Approved refunds are made to your original payment method within ${R("timeframe")}. ${R("state who pays return delivery costs")}</p><h2>Damaged or incorrect items</h2><p>Tell us within ${R("number of days")} of delivery and we will arrange a replacement or refund.</p>${contact}`,
  },
  shipping: {
    title: "Shipping & delivery policy",
    slug: "shipping-delivery",
    reason: "Required when you deliver physical products.",
    body: `${REVIEW}<h2>Where we deliver</h2><p>${R("list delivery areas")}</p><h2>Delivery times and fees</h2><p>${R("expected delivery times and fees by area")}</p><h2>Pickup</h2><p>${R("describe pickup availability, location and hours, or remove this section")}</p><h2>Failed deliveries</h2><p>${R("explain what happens if nobody is available to receive an order")}</p>${contact}`,
  },
  fulfilment: {
    title: "Fulfilment policy",
    slug: "fulfilment",
    reason: "Explains how digital products or services are delivered.",
    body: `${REVIEW}<h2>How you receive your purchase</h2><p>${R("describe how digital products or services are delivered and when")}</p><h2>Access problems</h2><p>If you cannot access your purchase, contact ${R("support email")}.</p>${contact}`,
  },
  returns: {
    title: "Returns & exchanges",
    slug: "returns-exchanges",
    reason: "Explains exchanges separately where they differ from refunds.",
    body: `${REVIEW}<h2>Exchanges</h2><p>${R("explain your exchange process, timeframe and conditions")}</p>${contact}`,
  },
  disclaimer: {
    title: "Legal disclaimer",
    slug: "disclaimer",
    reason: "Professional-services websites must not be mistaken for advice given to the reader.",
    body: `${REVIEW}<h2>No professional advice</h2><p>Content on this website is general information only. It is not legal, financial or other professional advice and should not be relied on for any specific matter.</p><h2>No client relationship</h2><p>Contacting us through this website does not create a ${R("lawyer–client or adviser–client")} relationship. A relationship begins only when we confirm an engagement in writing.</p><h2>Confidentiality of enquiries</h2><p>Please do not send confidential information until we have confirmed that we can act for you.</p><h2>Regulation</h2><p>${R("state your regulatory body and registration details, if applicable")}</p>${contact}`,
  },
  "medical-disclaimer": {
    title: "Medical disclaimer",
    slug: "medical-disclaimer",
    reason: "Health websites must make clear that online content is not a diagnosis.",
    body: `${REVIEW}<h2>Not a substitute for medical advice</h2><p>Information on this website is general and does not replace a consultation, diagnosis or treatment by a qualified health professional.</p><h2>Emergencies</h2><p>In a medical emergency, call ${R("local emergency number")} or go to the nearest emergency department. Do not use this website’s forms for urgent care.</p><h2>Appointment requests</h2><p>Submitting a request does not confirm an appointment. Our team will contact you to confirm.</p><h2>Registration</h2><p>${R("facility registration or licence details")}</p>${contact}`,
  },
  cancellation: {
    title: "Booking & cancellation policy",
    slug: "cancellation-policy",
    reason: "Sets expectations for appointments, bookings and missed sessions.",
    body: `${REVIEW}<h2>Making a booking</h2><p>A booking is confirmed only when we confirm it in writing. ${R("describe any deposit required")}</p><h2>Cancelling or rescheduling</h2><p>Please give at least ${R("notice period")} notice. ${R("explain any cancellation fees or forfeited deposits")}</p><h2>If we need to cancel</h2><p>${R("explain what you offer if you cancel, e.g. a new date or a full refund")}</p>${contact}`,
  },
  booking: {
    title: "Reservation & cancellation policy",
    slug: "reservation-policy",
    reason: "Guests need clear check-in, deposit and cancellation terms.",
    body: `${REVIEW}<h2>Reservations</h2><p>A reservation is confirmed only after we confirm availability and ${R("deposit or payment terms")}.</p><h2>Check-in and check-out</h2><p>Check-in from ${R("time")}; check-out by ${R("time")}. Valid identification is required at check-in.</p><h2>Cancellations and no-shows</h2><p>${R("cancellation deadlines, charges and no-show policy")}</p><h2>House rules</h2><p>${R("e.g. smoking, visitors, pets and damage")}</p>${contact}`,
  },
  warranty: {
    title: "Warranty policy",
    slug: "warranty",
    reason: "Customers must know what is covered before they buy equipment or products.",
    body: `${REVIEW}<h2>What is covered</h2><p>${R("state the warranty period and what it covers, per product or brand")}</p><h2>What is not covered</h2><p>${R("e.g. misuse, accidental damage, unauthorised repairs, normal wear")}</p><h2>How to make a claim</h2><p>Contact ${R("email or phone")} with your order reference and a description of the fault.</p><h2>Installation and service</h2><p>${R("explain installation and after-sales service, or remove this section")}</p>${contact}`,
  },
  carriage: {
    title: "Conditions of carriage",
    slug: "conditions-of-carriage",
    reason: "Delivery businesses must set out liability, prohibited items and claims.",
    body: `${REVIEW}<h2>Accepting shipments</h2><p>We may inspect, refuse or return any shipment that does not meet these conditions.</p><h2>Prohibited and restricted items</h2><p>${R("list items you will not carry, e.g. cash, hazardous goods, illegal items")}</p><h2>Liability</h2><p>${R("state the limit of your liability and any insurance options")}</p><h2>Delays</h2><p>Delivery times are estimates. ${R("describe how delays are handled")}</p><h2>Claims</h2><p>Report loss or damage within ${R("number of days")} to ${R("email or phone")}.</p>${contact}`,
  },
  safeguarding: {
    title: "Safeguarding policy",
    slug: "safeguarding",
    reason: "Organisations working with children or vulnerable people need a published safeguarding commitment.",
    body: `${REVIEW}<h2>Our commitment</h2><p>We are committed to protecting the children and vulnerable people we work with from harm.</p><h2>Designated safeguarding lead</h2><p>${R("name, role and contact details")}</p><h2>Reporting a concern</h2><p>Anyone with a concern should contact our safeguarding lead immediately. ${R("describe your reporting and escalation procedure")}</p><h2>Safer recruitment</h2><p>${R("describe your checks for staff and volunteers")}</p>${contact}`,
  },
  donations: {
    title: "Donations policy",
    slug: "donations",
    reason: "Donors need to know how gifts are received, used and refunded.",
    body: `${REVIEW}<h2>How we accept donations</h2><p>${R("list approved donation channels; only list channels that are active")}</p><h2>How donations are used</h2><p>${R("explain how funds are allocated and reported")}</p><h2>Refunds</h2><p>${R("explain whether and how donation refunds are handled")}</p><h2>Registration</h2><p>${R("CAC incorporated trustees registration or equivalent")}</p>${contact}`,
  },
  admissions: {
    title: "Admissions & fees policy",
    slug: "admissions-policy",
    reason: "Families need clear admission criteria, fees and refund terms.",
    body: `${REVIEW}<h2>Admissions</h2><p>${R("admission criteria, assessments and required documents")}</p><h2>Fees</h2><p>${R("fee schedule or how families can request it; payment deadlines")}</p><h2>Withdrawals and refunds</h2><p>${R("notice required and refund terms")}</p>${contact}`,
  },
  "listing-disclaimer": {
    title: "Property listing disclaimer",
    slug: "listing-disclaimer",
    reason: "Listings must make clear that details should be verified before any commitment.",
    body: `${REVIEW}<h2>Accuracy of listings</h2><p>Property details, prices and availability are provided in good faith but may change and should be verified during an inspection.</p><h2>Authority to market</h2><p>We list only properties we are authorised to market. ${R("state your agency registration details, if applicable")}</p><h2>Fees</h2><p>${R("state agency, legal and inspection fees clearly")}</p><h2>Payments</h2><p>Make payments only to ${R("official account details or process")}. We will never ask you to pay into a personal account.</p>${contact}`,
  },
  allergens: {
    title: "Food safety & allergen information",
    slug: "allergens",
    reason: "Food sellers must tell customers how to check ingredients and allergens.",
    body: `${REVIEW}<h2>Allergen information</h2><p>Ingredient and allergen details are shown as supplied by manufacturers. Always check the product label before consuming.</p><h2>Cross-contamination</h2><p>${R("describe how products are stored and handled")}</p><h2>Fresh and perishable items</h2><p>${R("explain storage, freshness and substitution policies")}</p><h2>Registration</h2><p>${R("NAFDAC or other regulatory details, where applicable")}</p>${contact}`,
  },
  "product-safety": {
    title: "Product use & safety",
    slug: "product-safety",
    reason: "Beauty products need usage guidance and a clear line against medical claims.",
    body: `${REVIEW}<h2>Using our products</h2><p>Follow the directions on each product. Perform a patch test before first use and stop using any product that causes irritation.</p><h2>No medical claims</h2><p>Our products are not intended to diagnose, treat or cure any condition.</p><h2>Ingredients</h2><p>Ingredients are listed as provided by the manufacturer. ${R("state regulatory registration, e.g. NAFDAC numbers, where applicable")}</p>${contact}`,
  },
  quotation: {
    title: "Quotation & service terms",
    slug: "service-terms",
    reason: "Project businesses need clear terms for quotes, variations and payment.",
    body: `${REVIEW}<h2>Quotations</h2><p>Quotations are valid for ${R("number of days")} and are based on the information available at the time.</p><h2>Variations</h2><p>Changes to the agreed scope are priced and approved in writing before work proceeds.</p><h2>Payments</h2><p>${R("deposit, stage payments and payment terms")}</p><h2>Workmanship and defects</h2><p>${R("defects liability period and how to report issues")}</p><h2>Health and safety</h2><p>${R("summarise your site safety commitments")}</p>${contact}`,
  },
  copyright: {
    title: "Image use & copyright",
    slug: "copyright",
    reason: "Creative work shown online needs clear usage and licensing terms.",
    body: `${REVIEW}<h2>Ownership</h2><p>Photographs, designs and other work shown on this website remain our property unless otherwise agreed in writing.</p><h2>Permitted use</h2><p>${R("explain what clients may do with delivered work")}</p><h2>Portfolio use</h2><p>${R("explain whether you may show client work in your portfolio, and how clients can opt out")}</p>${contact}`,
  },
};

const industryExtras: Record<string, PolicyType[]> = {
  creative: ["cancellation", "copyright"],
  consulting: ["disclaimer"],
  legal: ["disclaimer"],
  healthcare: ["medical-disclaimer", "cancellation"],
  property: ["listing-disclaimer"],
  construction: ["quotation"],
  solar: ["quotation", "warranty"],
  logistics: ["carriage"],
  education: ["admissions", "safeguarding"],
  community: ["donations", "safeguarding"],
  hospitality: ["booking"],
  general: ["cancellation"],
  beauty: ["product-safety"],
  electronics: ["warranty"],
  furniture: ["warranty"],
  food: ["allergens"],
};

/** The legal pages a site must publish, in footer order. */
export function legalSetFor(
  industry: string | undefined,
  category: string,
  fulfilment: "physical" | "digital" | "services" = "physical",
): Exclude<PolicyType, "other">[] {
  const commerce =
    category === "commerce"
      ? (["refund", fulfilment === "physical" ? "shipping" : "fulfilment"] as const)
      : [];
  const extras = (industryExtras[industry || ""] || []).filter(
    (t): t is Exclude<PolicyType, "other"> => t !== "other",
  );
  return [...new Set(["terms", "privacy", "cookies", ...commerce, ...extras])] as Exclude<
    PolicyType,
    "other"
  >[];
}
