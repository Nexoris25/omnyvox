export const templates = [
  {
    id: "studio",
    name: "Business Studio",
    description:
      "An editorial, product-first home for software agencies and technology teams. Confident type, a clear process and project-led credibility.",
    color: "#e7eadd",
    headline: "Good ideas. Thoughtfully delivered.",
    business: "FORM & CO.",
    type: "Technology & software agencies",
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
export const templateManifests = {
  studio: {
    version: "1.1.0",
    category: "corporate",
    industries: ["technology"],
    sections: ["hero", "services", "text", "cta", "faq", "insights"],
    references: [
      "https://enyata.com/services",
      "https://enyata.com/client-stories",
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
    references: [
      "https://www.supermart.ng/",
      "https://www.konga.com/",
    ],
  },
} as const;
/** Illustrative, clearly fictitious demo content used only on template
 * previews so each family is shown with industry-appropriate copy. */
export const templateSamples: Record<
  (typeof templateIds)[number],
  {
    primary: string;
    secondary: string;
    text: string;
    services: [string, string][];
    about: [string, string];
    cta: [string, string];
  }
> = {
  studio: {
    primary: "#1F3D2B",
    secondary: "#1F3D2B",
    text: "#1A2118",
    services: [
      ["Product engineering", "Web and mobile products built in small, reviewable releases."],
      ["Platform integration", "Payments, identity and data connected to the tools you already run."],
      ["Support & iteration", "Monitoring, fixes and improvements after launch."],
    ],
    about: ["How we work", "Discovery, design, build and handover — with a working demo at the end of every sprint."],
    cta: ["Have a product in mind?", "Tell us what you are building and we will suggest a first step."],
  },
  trust: {
    primary: "#5B3A1E",
    secondary: "#2E2418",
    text: "#2A2118",
    services: [
      ["Corporate & commercial", "Formation, contracts and governance for growing companies."],
      ["Dispute resolution", "Negotiation, arbitration and litigation support."],
      ["Tax & advisory", "Planning and compliance reviewed by qualified practitioners."],
    ],
    about: ["Our approach", "Clear engagement terms, a named partner on every matter and regular written updates."],
    cta: ["Request a consultation", "Share a short summary of your matter and we will respond within one business day."],
  },
  care: {
    primary: "#1E6B55",
    secondary: "#1E6B55",
    text: "#17332A",
    services: [
      ["General consultation", "Assessment and referral with a registered practitioner."],
      ["Diagnostics", "Laboratory tests and imaging, with results explained clearly."],
      ["Maternal & child health", "Antenatal visits, immunisation and child wellness checks."],
    ],
    about: ["Visiting us", "Walk-in and booked visits are welcome. Bring any previous results or prescriptions."],
    cta: ["Request an appointment", "Send a request and our front desk will call to confirm a time."],
  },
  horizon: {
    primary: "#17385D",
    secondary: "#17385D",
    text: "#182536",
    services: [
      ["Project delivery", "Planning, supervision and handover on schedule."],
      ["Consultancy", "Feasibility, costing and technical advice before you commit."],
      ["Maintenance", "Scheduled servicing and responsive repairs."],
    ],
    about: ["Who we are", "A team focused on dependable delivery and clear communication at every stage."],
    cta: ["Start a conversation", "Tell us about your project and we will get back to you."],
  },
  atelier: {
    primary: "#6B432D",
    secondary: "#6B432D",
    text: "#35271F",
    services: [
      ["New arrivals", "Seasonal pieces, released in small batches."],
      ["Essentials", "Everyday staples that work with everything."],
      ["Gift edit", "Considered presents, wrapped and ready."],
    ],
    about: ["Made with care", "Each collection is designed in-house and produced with trusted local makers."],
    cta: ["Join the list", "Be first to hear about new collections and restocks."],
  },
  catalogue: {
    primary: "#14253C",
    secondary: "#14253C",
    text: "#172033",
    services: [
      ["Phones & tablets", "Current models with full specifications."],
      ["Computing", "Laptops, monitors and accessories."],
      ["Power & home", "Inverters, batteries and appliances."],
    ],
    about: ["Shopping with us", "Clear prices, honest stock levels and delivery details shown before checkout."],
    cta: ["Need help choosing?", "Contact our team for product advice."],
  },
  essentials: {
    primary: "#3F6B1E",
    secondary: "#3F6B1E",
    text: "#26331A",
    services: [
      ["Fresh produce", "Fruit and vegetables restocked daily."],
      ["Pantry staples", "Rice, grains, oils and spices in family pack sizes."],
      ["Household", "Cleaning and personal care essentials."],
    ],
    about: ["Delivered close to home", "Order before noon for same-day delivery in our coverage areas."],
    cta: ["Check delivery to your area", "Send your location and we will confirm availability."],
  },
};
