export const templates = [
  {
    id: "studio",
    name: "Business Studio",
    description:
      "A bold, portfolio-led home for photographers, event planners, designers and creative studios. Confident type, a clear process and work-first presentation.",
    color: "#e7eadd",
    headline: "Good ideas. Thoughtfully delivered.",
    business: "FORM & CO.",
    type: "Creative studios & events",
  },
  {
    id: "trust",
    name: "Trust & Advisory",
    description:
      "A disciplined, credentials-forward home for law, accounting and consulting practices. Reserved type, structured practice areas and people profiles.",
    color: "#e9e4da",
    headline: "Considered advice. Dependable outcomes.",
    business: "ASHFORD & PARTNERS",
    type: "Law, accounting & consulting",
  },
  {
    id: "care",
    name: "Care & Wellness",
    description:
      "A calm, accessible home for clinics and diagnostic centres. Readable service discovery, warm colour and clear patient enquiry actions.",
    color: "#e3eee8",
    headline: "Care that puts you first.",
    business: "MERIDIAN HEALTH CLINIC",
    type: "Clinics, diagnostics & healthcare",
  },
  {
    id: "build",
    name: "Build & Industry",
    description:
      "A strong, project-led home for construction, energy and logistics firms. Heavy type, proof of delivery up front and a clear route to a quote or site visit.",
    color: "#e6e4df",
    headline: "Built right. Delivered on time.",
    business: "IRONBRIDGE CONSTRUCTION",
    type: "Construction, energy & logistics",
  },
  {
    id: "haven",
    name: "Hospitality & Stays",
    description:
      "An immersive, image-first home for hotels, restaurants, short-lets and property. Full-bleed photography, refined type and booking or viewing requests in one tap.",
    color: "#ece5da",
    headline: "Stay a while. We’ll take care of the rest.",
    business: "THE PALM COURT LEKKI",
    type: "Hotels, restaurants & property",
  },
  {
    id: "horizon",
    name: "Modern Company",
    description:
      "A structured introduction for growing companies of every kind. Share your expertise, publish insights and make it easy to get in touch.",
    color: "#dce8f3",
    headline: "A fresh perspective on what’s next.",
    business: "HORIZON PARTNERS",
    type: "Companies, projects & teams",
  },
  {
    id: "atelier",
    name: "Boutique Store",
    description:
      "An editorial storefront for independent brands. Put your products in focus with warm colours, expressive type and straightforward shopping.",
    color: "#f2e5d5",
    headline: "Everyday things. Exceptionally made.",
    business: "THE EVERYDAY EDIT",
    type: "Fashion, beauty & home",
  },
  {
    id: "glow",
    name: "Beauty Counter",
    description:
      "A soft, confident storefront for skincare, haircare and cosmetics brands. Arch-framed imagery, gentle colour and product benefits people can scan before they buy.",
    color: "#f6e7e4",
    headline: "Skin you love, every single day.",
    business: "SHEA & BLOOM",
    type: "Beauty & personal care",
  },
  {
    id: "catalogue",
    name: "Everyday Store",
    description:
      "A search-first shop for electronics, books and general retail. Clear categories, readable product information and a direct path to checkout.",
    color: "#f4f6fa",
    headline: "Find what you need. Make it yours.",
    business: "EVERYDAY SUPPLY — SAMPLE STORE",
    type: "Electronics, books & general retail",
  },
  {
    id: "essentials",
    name: "Everyday Essentials",
    description:
      "A fast, practical shop for groceries and household goods. Compact category shortcuts, pack sizes and stock status built for repeat purchases.",
    color: "#eef3e2",
    headline: "Everything you need, close to home.",
    business: "GREENBASKET GROCERS",
    type: "Grocery & household goods",
  },
];
export const templateIds = [
  "studio",
  "trust",
  "care",
  "build",
  "haven",
  "horizon",
  "atelier",
  "glow",
  "catalogue",
  "essentials",
] as const;
export function compatibleTemplate(
  id: string,
  category: string,
  industry?: string,
) {
  const manifest = templateManifests[id as keyof typeof templateManifests];
  return (
    !!manifest &&
    manifest.category === category &&
    (!industry || (manifest.industries as readonly string[]).includes(industry))
  );
}
/** Sections each template family is designed and styled for. The editor only
 * offers these, and the API refuses anything else. Every template in a
 * category supports the same set, so switching template never strands
 * content. */
const CORPORATE_SECTIONS = [
  "hero",
  "text",
  "services",
  "features",
  "steps",
  "team",
  "gallery",
  "faq",
  "cta",
  "contact",
  "insights",
] as const;
// Storefronts are product-led; a team grid is not part of these designs.
const COMMERCE_SECTIONS = [
  "hero",
  "text",
  "services",
  "features",
  "steps",
  "gallery",
  "faq",
  "cta",
  "contact",
  "insights",
] as const;
export function allowedSections(template: string | undefined): readonly string[] {
  const manifest = templateManifests[template as keyof typeof templateManifests];
  return manifest ? manifest.sections : CORPORATE_SECTIONS;
}
/** Section types in `sections` that the template does not support. */
export function ineligibleSections(template: string | undefined, sections: { type: string }[] = []) {
  const allowed = allowedSections(template);
  return [...new Set(sections.map((s) => s.type).filter((t) => !allowed.includes(t)))];
}
export const templateManifests = {
  studio: {
    version: "1.1.0",
    category: "corporate",
    industries: ["creative"],
    sections: CORPORATE_SECTIONS,
    references: [
      "https://thewheatbakerlagos.com/",
      "https://kilentar.com/collections",
    ],
  },
  trust: {
    version: "1.0.0",
    category: "corporate",
    industries: ["consulting", "legal"],
    sections: CORPORATE_SECTIONS,
    references: [
      "https://www.banwo-ighodalo.com/practices/",
      "https://www.templars-law.com/",
    ],
  },
  care: {
    version: "1.0.0",
    category: "corporate",
    industries: ["healthcare"],
    sections: CORPORATE_SECTIONS,
    references: ["https://www.evercare.ng/", "https://mecure.com.ng/"],
  },
  build: {
    version: "1.0.0",
    category: "corporate",
    industries: ["construction", "solar", "logistics"],
    sections: CORPORATE_SECTIONS,
    references: ["https://www.julius-berger.com/", "https://www.arnergy.com/"],
  },
  haven: {
    version: "1.0.0",
    category: "corporate",
    industries: ["hospitality", "property"],
    sections: CORPORATE_SECTIONS,
    references: ["https://www.eko-hotels.com/", "https://www.landmarkafrica.com/"],
  },
  horizon: {
    version: "1.2.0",
    category: "corporate",
    industries: [
      "general",
      "construction",
      "solar",
      "logistics",
      "education",
      "community",
      "property",
      "hospitality",
    ],
    sections: CORPORATE_SECTIONS,
    references: [
      "https://mintyn.com/",
      "https://mintyn.com/bank-account/business-account/",
    ],
  },
  atelier: {
    version: "1.0.0",
    category: "commerce",
    industries: ["fashion", "beauty", "furniture"],
    sections: COMMERCE_SECTIONS,
    references: [
      "https://kilentar.com/collections",
      "https://orangeculture.com.ng/",
    ],
  },
  glow: {
    version: "1.0.0",
    category: "commerce",
    industries: ["beauty"],
    sections: COMMERCE_SECTIONS,
    references: ["https://www.arami-essentials.com/", "https://nuban.ng/"],
  },
  catalogue: {
    version: "1.0.0",
    category: "commerce",
    industries: ["electronics", "retail", "books"],
    sections: COMMERCE_SECTIONS,
    references: [
      "https://www.konga.com/category/mobile-phones-5297",
      "https://kara.com.ng/",
    ],
  },
  essentials: {
    version: "1.0.0",
    category: "commerce",
    industries: ["food"],
    sections: COMMERCE_SECTIONS,
    references: ["https://www.supermart.ng/", "https://www.konga.com/"],
  },
} as const;
