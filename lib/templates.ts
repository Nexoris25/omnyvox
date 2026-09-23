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
  "horizon",
  "atelier",
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
export const templateManifests = {
  studio: {
    version: "1.1.0",
    category: "corporate",
    industries: ["creative"],
    sections: ["hero", "services", "text", "cta", "faq", "insights"],
    references: [
      "https://thewheatbakerlagos.com/",
      "https://kilentar.com/collections",
    ],
  },
  trust: {
    version: "1.0.0",
    category: "corporate",
    industries: ["consulting", "legal"],
    sections: ["hero", "services", "text", "cta", "faq", "insights"],
    references: [
      "https://www.banwo-ighodalo.com/practices/",
      "https://www.templars-law.com/",
    ],
  },
  care: {
    version: "1.0.0",
    category: "corporate",
    industries: ["healthcare"],
    sections: ["hero", "services", "text", "cta", "faq", "insights"],
    references: ["https://www.evercare.ng/", "https://mecure.com.ng/"],
  },
  horizon: {
    version: "1.1.0",
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
    sections: ["hero", "services", "text", "cta", "faq", "insights"],
    references: [
      "https://mintyn.com/",
      "https://mintyn.com/bank-account/business-account/",
    ],
  },
  atelier: {
    version: "1.0.0",
    category: "commerce",
    industries: ["fashion", "beauty", "furniture"],
    sections: ["hero", "text", "cta", "faq", "insights"],
    references: [
      "https://kilentar.com/collections",
      "https://orangeculture.com.ng/",
    ],
  },
  catalogue: {
    version: "1.0.0",
    category: "commerce",
    industries: ["electronics", "retail", "books"],
    sections: ["hero", "text", "cta", "faq", "insights"],
    references: [
      "https://www.konga.com/category/mobile-phones-5297",
      "https://kara.com.ng/",
    ],
  },
  essentials: {
    version: "1.0.0",
    category: "commerce",
    industries: ["food"],
    sections: ["hero", "text", "cta", "faq", "insights"],
    references: ["https://www.supermart.ng/", "https://www.konga.com/"],
  },
} as const;
