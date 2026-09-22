export const templates = [
  {
    id: "studio",
    name: "Business Studio",
    description:
      "A clear, confident home for consultants, agencies and professional services. Introduce your work, explain your services and invite enquiries.",
    color: "#e7eadd",
    headline: "Good ideas. Thoughtfully delivered.",
    business: "FORM & CO.",
    type: "Services & consulting",
  },
  {
    id: "atelier",
    name: "Boutique Store",
    description:
      "An editorial storefront for independent brands. Put your products in focus with warm colours, expressive type and straightforward shopping.",
    color: "#f2e5d5",
    headline: "Everyday things. Exceptionally made.",
    business: "THE EVERYDAY EDIT",
    type: "Retail & independent brands",
  },
  {
    id: "catalogue",
    name: "Everyday Store",
    description:
      "A search-first shop for electronics, books and everyday goods. Clear categories, readable product information and a direct path to checkout.",
    color: "#f4f6fa",
    headline: "Find what you need. Make it yours.",
    business: "EVERYDAY SUPPLY — SAMPLE STORE",
    type: "Electronics, books & general retail",
  },
  {
    id: "horizon",
    name: "Modern Company",
    description:
      "A structured introduction for growing companies. Share your expertise, publish insights and make it easy for customers to get in touch.",
    color: "#dce8f3",
    headline: "A fresh perspective on what’s next.",
    business: "HORIZON PARTNERS",
    type: "Companies & teams",
  },
];
export const templateIds = [
  "studio",
  "atelier",
  "horizon",
  "catalogue",
] as const;
export const templateManifests = {
  studio: {
    version: "1.0.0",
    category: "corporate",
    industries: ["technology", "consulting", "legal", "general"],
    sections: ["hero", "services", "text", "cta", "faq", "insights"],
    references: [
      "https://enyata.com/services",
      "https://enyata.com/client-stories",
    ],
  },
  horizon: {
    version: "1.0.0",
    category: "corporate",
    industries: [
      "general",
      "construction",
      "solar",
      "logistics",
      "education",
      "community",
      "healthcare",
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
    industries: ["electronics", "retail", "books", "food"],
    sections: ["hero", "text", "cta", "faq", "insights"],
    references: [
      "https://www.konga.com/category/mobile-phones-5297",
      "https://kara.com.ng/",
    ],
  },
} as const;
