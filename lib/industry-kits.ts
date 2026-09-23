import type { Brand, Section } from "./model";
import type { templateIds } from "./templates";
import { legalSetFor, policies } from "./legal-policies";
import { starterImage, photoAlt } from "./brand-assets";

/**
 * Industry starter kits: the palette, template, navigation button and
 * homepage section set a new website receives for its industry.
 *
 * Copy is deliberately free of figures, awards, credentials and other
 * claims only the business can make. Every section is flagged `sample`, and
 * publishing stays blocked until the owner has reviewed it. Images point to
 * bundled artwork in /public/samples (see scripts/generate-samples.tsx).
 */
type TemplateId = (typeof templateIds)[number];
type Item = NonNullable<Section["items"]>[number];
export type IndustryKit = {
  template: TemplateId;
  palette: Pick<
    Brand,
    "primary" | "secondary" | "background" | "text" | "font"
  >;
  description: string;
  navCta: { label: string; href: string };
  /** Artwork keys → lucide icon name, rendered by the sample generator. */
  art: Record<string, string>;
  sections: Section[];
};

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const img = starterImage;

function build(
  industry: string,
  spec: {
    template: TemplateId;
    palette: IndustryKit["palette"];
    description: string;
    navCta: [string, string];
    hero: {
      eyebrow: string;
      title: string;
      body: string;
      cta: [string, string][];
      art: string;
    };
    offers: {
      eyebrow: string;
      title: string;
      body: string;
      link?: [string, string];
      items: [string, string, string][];
    };
    features: { eyebrow: string; title: string; items: [string, string][] };
    steps: { eyebrow: string; title: string; items: [string, string][] };
    about: { eyebrow: string; title: string; body: string; art: string };
    extra?:
      | {
          type: "team";
          eyebrow: string;
          title: string;
          body: string;
          items: [string, string][];
        }
      | {
          type: "gallery";
          eyebrow: string;
          title: string;
          body: string;
          items: [string, string][];
        };
    faqs: [string, string][];
    cta: { title: string; body: string; button: [string, string] };
    contact: { title: string; body: string };
  },
): IndustryKit {
  const art: Record<string, string> = {
    hero: spec.hero.art,
    about: spec.about.art,
  };
  const pic = (key: string, icon: string, alt: string): Partial<Item> => {
    art[key] = icon;
    return { image: img(industry, key), imageAlt: alt };
  };
  const sections: Section[] = [
    {
      id: "hero",
      type: "hero",
      eyebrow: spec.hero.eyebrow,
      title: spec.hero.title,
      body: spec.hero.body,
      layout: "row",
      image: img(industry, "hero"),
      imageAlt:
        photoAlt[`${industry}-hero`] || `${spec.hero.eyebrow} — sample image`,
      ctas: spec.hero.cta.map(([label, href]) => ({ label, href })),
      visible: true,
      sample: true,
    },
    {
      id: "services",
      type: "services",
      eyebrow: spec.offers.eyebrow,
      title: spec.offers.title,
      body: spec.offers.body,
      items: spec.offers.items.map(([title, text, icon]) => ({
        title,
        text,
        ...pic(slug(title), icon, `${title} — sample image`),
      })),
      ctas: spec.offers.link
        ? [{ label: spec.offers.link[0], href: spec.offers.link[1] }]
        : undefined,
      visible: true,
      sample: true,
    },
    {
      id: "about",
      type: "text",
      eyebrow: spec.about.eyebrow,
      title: spec.about.title,
      body: spec.about.body,
      layout: "row-reverse",
      image: img(industry, "about"),
      imageAlt:
        photoAlt[`${industry}-about`] || `${spec.about.eyebrow} — sample image`,
      visible: true,
      sample: true,
    },
    {
      id: "features",
      type: "features",
      eyebrow: spec.features.eyebrow,
      title: spec.features.title,
      body: "",
      items: spec.features.items.map(([title, text]) => ({ title, text })),
      visible: true,
      sample: true,
    },
    {
      id: "steps",
      type: "steps",
      eyebrow: spec.steps.eyebrow,
      title: spec.steps.title,
      body: "",
      items: spec.steps.items.map(([title, text]) => ({ title, text })),
      visible: true,
      sample: true,
    },
  ];
  if (spec.extra)
    sections.push({
      id: spec.extra.type,
      type: spec.extra.type,
      eyebrow: spec.extra.eyebrow,
      title: spec.extra.title,
      body: spec.extra.body,
      items: spec.extra.items.map(([title, text], i) => ({
        title,
        text,
        ...pic(
          `${spec.extra!.type}-${i + 1}`,
          spec.extra!.type === "team" ? "user-round" : art.hero,
          spec.extra!.type === "team"
            ? "Team member portrait — sample image"
            : `${title} — sample image`,
        ),
      })),
      visible: true,
      sample: true,
    });
  sections.push(
    {
      id: "faq",
      type: "faq",
      eyebrow: "Questions",
      title: "Frequently asked questions",
      body: "",
      faqs: spec.faqs.map(([question, answer]) => ({ question, answer })),
      visible: true,
      sample: true,
    },
    {
      id: "cta",
      type: "cta",
      title: spec.cta.title,
      body: spec.cta.body,
      ctas: [{ label: spec.cta.button[0], href: spec.cta.button[1] }],
      visible: true,
      sample: true,
    },
    {
      id: "contact",
      type: "contact",
      eyebrow: "Contact",
      title: spec.contact.title,
      body: spec.contact.body,
      visible: true,
      sample: true,
    },
  );
  return {
    template: spec.template,
    palette: spec.palette,
    description: spec.description,
    navCta: { label: spec.navCta[0], href: spec.navCta[1] },
    art,
    sections,
  };
}

const sans = "sans" as const,
  serif = "serif" as const;

export const industryKits: Record<string, IndustryKit> = {
  creative: build("creative", {
    template: "studio",
    palette: {
      primary: "#B03A5B",
      secondary: "#1E1A24",
      background: "#FAF7F5",
      text: "#1C1820",
      font: sans,
    },
    description: "Photography, events and creative design.",
    navCta: ["Book a consultation", "/contact"],
    hero: {
      eyebrow: "Creative studio & events",
      title: "Ideas made memorable.",
      body: "We plan, create and deliver work people remember — from brand shoots and celebrations to spaces that simply feel right. Tell us what you have in mind and we’ll shape it with you.",
      cta: [
        ["Start your project", "/contact"],
        ["View our portfolio", "/portfolio"],
      ],
      art: "camera",
    },
    offers: {
      eyebrow: "Services",
      title: "What we create",
      body: "List the services you offer today.",
      link: ["All services", "/services"],
      items: [
        [
          "Photography & film",
          "Portraits, products and events captured with care.",
          "camera",
        ],
        [
          "Event planning",
          "Weddings, launches and celebrations planned end to end.",
          "party-popper",
        ],
        [
          "Interior & spatial design",
          "Homes, offices and venues designed around how they are used.",
          "lamp",
        ],
        [
          "Brand & marketing",
          "Identity, campaigns and content that feel like you.",
          "megaphone",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Creativity with a clear process.",
      body: "Introduce your studio, your style and the people behind the work. Feature only projects and clients you have permission to show.",
      art: "palette",
    },
    features: {
      eyebrow: "Working with us",
      title: "What you can expect",
      items: [
        ["A clear brief", "Goals, budget and timeline agreed before we begin."],
        [
          "Regular check-ins",
          "See progress and share feedback at every stage.",
        ],
        [
          "Ready-to-use delivery",
          "Final work delivered in the formats you need.",
        ],
      ],
    },
    steps: {
      eyebrow: "How it works",
      title: "From idea to delivery",
      items: [
        ["Consultation", "We discuss your idea, date, budget and style."],
        ["Proposal", "You receive a written scope and quotation."],
        ["Create", "We plan, produce and refine the work with you."],
        ["Deliver", "Final files, spaces or events delivered as agreed."],
      ],
    },
    extra: {
      type: "gallery",
      eyebrow: "Portfolio",
      title: "Selected work",
      body: "Add your best projects with each client’s permission.",
      items: [
        ["Project name", "Client · Type"],
        ["Project name", "Client · Type"],
        ["Project name", "Client · Type"],
      ],
    },
    faqs: [
      [
        "How far in advance should I book?",
        "Share your typical lead times for shoots, events and design projects.",
      ],
      [
        "How do you price your work?",
        "Explain your packages, day rates or custom quotations.",
      ],
      [
        "Do you work outside your city?",
        "List the locations you cover and any travel fees.",
      ],
    ],
    cta: {
      title: "Let’s create something memorable",
      body: "Tell us about your idea and we’ll suggest how to bring it to life.",
      button: ["Start your project", "/contact"],
    },
    contact: {
      title: "Tell us about your project",
      body: "Share your date, location and what you have in mind.",
    },
  }),

  consulting: build("consulting", {
    template: "trust",
    palette: {
      primary: "#1E4D6B",
      secondary: "#0F2A3B",
      background: "#F7F6F2",
      text: "#1C2530",
      font: serif,
    },
    description: "Advisory, accounting and business consulting.",
    navCta: ["Book a consultation", "/contact"],
    hero: {
      eyebrow: "Advisory & accounting",
      title: "Sound advice for confident decisions.",
      body: "We help organisations plan, comply and grow — with practical guidance, clear reporting and a team that explains the numbers behind every recommendation.",
      cta: [
        ["Book a consultation", "/contact"],
        ["Our services", "/services"],
      ],
      art: "chart-no-axes-combined",
    },
    offers: {
      eyebrow: "Services",
      title: "How we support your organisation",
      body: "Engage us for a single project or ongoing advisory support.",
      link: ["View all services", "/services"],
      items: [
        [
          "Accounting & bookkeeping",
          "Accurate records and timely reports you can act on.",
          "calculator",
        ],
        [
          "Tax advisory",
          "Planning and compliance support for businesses and individuals.",
          "receipt-text",
        ],
        [
          "Business advisory",
          "Strategy, restructuring and growth planning.",
          "briefcase-business",
        ],
        [
          "Audit & assurance",
          "Independent reviews that strengthen stakeholder confidence.",
          "file-check-2",
        ],
      ],
    },
    about: {
      eyebrow: "About the firm",
      title: "Advice grounded in your reality.",
      body: "Introduce your firm here: who you serve, how you work and the qualifications of your team. Only include registrations and accreditations you can verify.",
      art: "landmark",
    },
    features: {
      eyebrow: "Our commitment",
      title: "Working with us",
      items: [
        [
          "A named adviser",
          "One point of contact who knows your organisation.",
        ],
        [
          "Clear engagement terms",
          "Scope, timelines and fees agreed in writing.",
        ],
        [
          "Plain-language reporting",
          "Findings explained so you can decide with confidence.",
        ],
      ],
    },
    steps: {
      eyebrow: "Getting started",
      title: "How an engagement works",
      items: [
        [
          "Initial consultation",
          "We discuss your needs and whether we’re the right fit.",
        ],
        ["Proposal", "You receive a written scope and fee proposal."],
        ["Delivery", "We carry out the work and keep you updated."],
        ["Review", "We walk you through results and next steps."],
      ],
    },
    extra: {
      type: "team",
      eyebrow: "Our people",
      title: "Meet the team",
      body: "Add your partners and advisers with their roles and verified qualifications.",
      items: [
        ["Full name", "Role or title"],
        ["Full name", "Role or title"],
        ["Full name", "Role or title"],
      ],
    },
    faqs: [
      [
        "Which organisations do you work with?",
        "Describe the sectors and business sizes you serve.",
      ],
      [
        "How are your fees structured?",
        "Explain whether you charge fixed fees, retainers or hourly rates.",
      ],
      [
        "Can we meet in person?",
        "Share your office location and whether you offer virtual meetings.",
      ],
    ],
    cta: {
      title: "Plan your next move with confidence",
      body: "Book an initial consultation to discuss your objectives.",
      button: ["Book a consultation", "/contact"],
    },
    contact: {
      title: "Speak with an adviser",
      body: "Tell us briefly about your organisation and what you need.",
    },
  }),

  legal: build("legal", {
    template: "trust",
    palette: {
      primary: "#7A2E2E",
      secondary: "#1E1A17",
      background: "#FAF7F2",
      text: "#211C18",
      font: serif,
    },
    description: "Legal advice and representation.",
    navCta: ["Request a consultation", "/contact"],
    hero: {
      eyebrow: "Legal practice",
      title: "Considered counsel. Clear next steps.",
      body: "We advise businesses and individuals on their legal matters with careful analysis, candid guidance and responsive communication.",
      cta: [
        ["Request a consultation", "/contact"],
        ["Practice areas", "/practice-areas"],
      ],
      art: "scale",
    },
    offers: {
      eyebrow: "Practice areas",
      title: "How we can help",
      body: "List only the areas in which your firm actively practises.",
      link: ["View all practice areas", "/practice-areas"],
      items: [
        [
          "Corporate & commercial",
          "Formation, contracts, governance and transactions.",
          "building-2",
        ],
        [
          "Dispute resolution",
          "Negotiation, arbitration and litigation.",
          "gavel",
        ],
        [
          "Property & real estate",
          "Acquisitions, leases and title matters.",
          "house",
        ],
        [
          "Employment",
          "Contracts, policies and workplace disputes.",
          "users-round",
        ],
      ],
    },
    about: {
      eyebrow: "The firm",
      title: "Your matter, handled with care.",
      body: "Describe your firm, its history and the principles that guide your practice. Include enrolment details and memberships only where accurate and current.",
      art: "landmark",
    },
    features: {
      eyebrow: "Our approach",
      title: "What clients can expect",
      items: [
        ["Candid advice", "An honest assessment of your position and options."],
        [
          "Responsive communication",
          "Regular updates at every stage of your matter.",
        ],
        ["Clear engagement terms", "Scope and fees agreed before work begins."],
      ],
    },
    steps: {
      eyebrow: "Engaging us",
      title: "How to get started",
      items: [
        ["Share your matter", "Send a brief summary using our enquiry form."],
        [
          "Consultation",
          "We discuss the facts, options and likely next steps.",
        ],
        ["Engagement", "We confirm scope and terms in writing."],
      ],
    },
    extra: {
      type: "team",
      eyebrow: "Our people",
      title: "Partners and associates",
      body: "Add each lawyer with their role, practice areas and verified qualifications.",
      items: [
        ["Full name", "Partner"],
        ["Full name", "Senior Associate"],
        ["Full name", "Associate"],
      ],
    },
    faqs: [
      [
        "Is the first consultation free?",
        "State your consultation policy and any fees.",
      ],
      [
        "Is my enquiry confidential?",
        "Explain how enquiries are handled before an engagement is confirmed.",
      ],
      [
        "Do you act outside your city?",
        "Describe the jurisdictions and locations you cover.",
      ],
    ],
    cta: {
      title: "Discuss your matter with us",
      body: "Share a short summary and we’ll respond promptly.",
      button: ["Request a consultation", "/contact"],
    },
    contact: {
      title: "Contact the firm",
      body: "Please don’t include sensitive details in your first message.",
    },
  }),

  healthcare: build("healthcare", {
    template: "care",
    palette: {
      primary: "#0E7C66",
      secondary: "#0B4F43",
      background: "#F4FAF8",
      text: "#12302A",
      font: sans,
    },
    description: "Clinic, diagnostics and patient care.",
    navCta: ["Request an appointment", "/contact"],
    hero: {
      eyebrow: "Clinic & diagnostics",
      title: "Attentive care for you and your family.",
      body: "Consultations, diagnostics and follow-up care in a calm, welcoming setting. Request an appointment and our team will confirm a time that suits you.",
      cta: [
        ["Request an appointment", "/contact"],
        ["Our services", "/medical-services"],
      ],
      art: "stethoscope",
    },
    offers: {
      eyebrow: "Medical services",
      title: "Care when you need it",
      body: "List the services your facility currently provides.",
      link: ["View all services", "/medical-services"],
      items: [
        [
          "General consultation",
          "Assessment, treatment and referral by a registered practitioner.",
          "stethoscope",
        ],
        [
          "Laboratory tests",
          "Sample collection and tests, with results explained clearly.",
          "microscope",
        ],
        [
          "Maternal & child health",
          "Antenatal visits, immunisation and child wellness checks.",
          "baby",
        ],
        [
          "Health screening",
          "Routine check-ups to help you stay ahead of your health.",
          "heart-pulse",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "A welcoming place to be cared for.",
      body: "Introduce your facility, your team and the standards you work to. Include registration details only where accurate. Avoid promises about treatment outcomes.",
      art: "hospital",
    },
    features: {
      eyebrow: "Your visit",
      title: "What to expect",
      items: [
        [
          "Clear information",
          "We explain each step of your care and answer your questions.",
        ],
        ["Respect and privacy", "Your records are handled confidentially."],
        [
          "Easy scheduling",
          "Request an appointment online and we’ll confirm by phone.",
        ],
      ],
    },
    steps: {
      eyebrow: "Appointments",
      title: "Booking a visit",
      items: [
        [
          "Send a request",
          "Tell us the service you need and your preferred time.",
        ],
        [
          "We confirm",
          "Our front desk contacts you to confirm the appointment.",
        ],
        [
          "Your visit",
          "Bring any previous results, prescriptions and a valid ID.",
        ],
      ],
    },
    extra: {
      type: "team",
      eyebrow: "Our professionals",
      title: "Meet our clinicians",
      body: "Add your doctors, nurses and specialists with their verified qualifications.",
      items: [
        ["Full name", "Medical Officer"],
        ["Full name", "Nursing Lead"],
        ["Full name", "Laboratory Scientist"],
      ],
    },
    faqs: [
      [
        "What are your opening hours?",
        "Add your opening hours, including weekends and public holidays.",
      ],
      [
        "Do you accept health insurance?",
        "List the insurance providers or HMOs you accept, if any.",
      ],
      [
        "What should I do in an emergency?",
        "In an emergency, call your local emergency number or go to the nearest emergency department.",
      ],
    ],
    cta: {
      title: "Request an appointment",
      body: "Send a request and our team will call to confirm a time.",
      button: ["Request an appointment", "/contact"],
    },
    contact: {
      title: "Visit or contact us",
      body: "For emergencies, call your local emergency number. For appointments and enquiries, send us a message.",
    },
  }),

  property: build("property", {
    template: "horizon",
    palette: {
      primary: "#1D5B45",
      secondary: "#10281F",
      background: "#F8F7F3",
      text: "#1B2621",
      font: sans,
    },
    description: "Property sales, rentals and management.",
    navCta: ["Book a viewing", "/contact"],
    hero: {
      eyebrow: "Real estate",
      title: "Find a place that fits your next chapter.",
      body: "Browse available properties, arrange viewings and get straightforward advice on buying, renting or letting.",
      cta: [
        ["View properties", "/properties"],
        ["Book a viewing", "/contact"],
      ],
      art: "house",
    },
    offers: {
      eyebrow: "Services",
      title: "How we help",
      body: "Whether you’re searching, selling or letting, we guide you through each step.",
      link: ["Browse properties", "/properties"],
      items: [
        ["Sales", "Homes and commercial spaces available to buy.", "key-round"],
        [
          "Rentals",
          "Residential and short-let options across our locations.",
          "building",
        ],
        [
          "Property management",
          "Tenant sourcing, rent collection and maintenance coordination.",
          "clipboard-list",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Local knowledge, honest advice.",
      body: "Tell visitors about your agency, the areas you cover and how you work. Only list properties you’re authorised to market.",
      art: "map-pinned",
    },
    features: {
      eyebrow: "Why choose us",
      title: "Buying and renting, simplified",
      items: [
        [
          "Verified listings",
          "Full details and photographs for every property.",
        ],
        ["Guided viewings", "We accompany you and answer questions on site."],
        ["Clear documentation", "Every term explained before you commit."],
      ],
    },
    steps: {
      eyebrow: "Next steps",
      title: "From enquiry to keys",
      items: [
        ["Shortlist", "Browse listings and tell us what you’re looking for."],
        ["View", "We arrange an inspection at a convenient time."],
        ["Agree terms", "We help you review the offer or tenancy agreement."],
        ["Move in", "We coordinate handover and documentation."],
      ],
    },
    extra: {
      type: "gallery",
      eyebrow: "Featured",
      title: "Featured properties",
      body: "Replace these with your own listings and photographs.",
      items: [
        ["Property name", "Location · Type"],
        ["Property name", "Location · Type"],
        ["Property name", "Location · Type"],
      ],
    },
    faqs: [
      [
        "How do I arrange a viewing?",
        "Send us a message with the property and your preferred time.",
      ],
      [
        "What fees should I expect?",
        "Explain agency, legal and service fees clearly.",
      ],
      [
        "Which areas do you cover?",
        "List the neighbourhoods and cities you serve.",
      ],
    ],
    cta: {
      title: "Ready to find your next property?",
      body: "Tell us what you need and we’ll suggest suitable options.",
      button: ["Book a viewing", "/contact"],
    },
    contact: {
      title: "Talk to our team",
      body: "Let us know the property or area you’re interested in.",
    },
  }),

  construction: build("construction", {
    template: "horizon",
    palette: {
      primary: "#B8500F",
      secondary: "#1F2328",
      background: "#F6F5F2",
      text: "#1C1F23",
      font: sans,
    },
    description: "Construction, engineering and architecture.",
    navCta: ["Request a quote", "/contact"],
    hero: {
      eyebrow: "Construction & architecture",
      title: "Built right, from plan to handover.",
      body: "We plan, design and deliver building projects with careful supervision, clear reporting and a strong focus on safety.",
      cta: [
        ["Request a quote", "/contact"],
        ["View our projects", "/projects"],
      ],
      art: "hard-hat",
    },
    offers: {
      eyebrow: "Capabilities",
      title: "What we deliver",
      body: "Add only the services your team provides today.",
      link: ["All services", "/services"],
      items: [
        [
          "Design & planning",
          "Architectural design, drawings and approvals support.",
          "drafting-compass",
        ],
        [
          "Building construction",
          "Residential and commercial construction.",
          "building-2",
        ],
        [
          "Renovation & fit-out",
          "Upgrades, extensions and interior fit-outs.",
          "paint-roller",
        ],
        [
          "Project management",
          "Scheduling, supervision and cost control.",
          "clipboard-check",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Quality you can see on site.",
      body: "Describe your company, its experience and the standards you follow. Include licences and certifications only where you can verify them.",
      art: "construction",
    },
    features: {
      eyebrow: "Our standards",
      title: "How we work",
      items: [
        ["Safety first", "Site procedures that protect workers and visitors."],
        [
          "Transparent reporting",
          "Regular progress updates and site photographs.",
        ],
        [
          "Agreed budgets",
          "Costs and variations approved before work proceeds.",
        ],
      ],
    },
    steps: {
      eyebrow: "Process",
      title: "Our project approach",
      items: [
        ["Consultation", "We review your site, brief and budget."],
        ["Design & quote", "We prepare drawings and a detailed quotation."],
        ["Construction", "We build to plan with regular updates."],
        ["Handover", "We inspect, complete snags and hand over."],
      ],
    },
    extra: {
      type: "gallery",
      eyebrow: "Projects",
      title: "Recent projects",
      body: "Showcase completed work with the client’s permission.",
      items: [
        ["Project name", "Location · Scope"],
        ["Project name", "Location · Scope"],
        ["Project name", "Location · Scope"],
      ],
    },
    faqs: [
      [
        "How do you price a project?",
        "Explain how quotations are prepared and what they include.",
      ],
      [
        "Do you handle permits and approvals?",
        "Describe the approvals support you provide.",
      ],
      [
        "Which locations do you serve?",
        "List the cities or regions you work in.",
      ],
    ],
    cta: {
      title: "Planning a build?",
      body: "Share your project details and we’ll prepare a quotation.",
      button: ["Request a quote", "/contact"],
    },
    contact: {
      title: "Start your project",
      body: "Tell us about the site, scope and timeline.",
    },
  }),

  solar: build("solar", {
    template: "horizon",
    palette: {
      primary: "#B45309",
      secondary: "#0C3B2E",
      background: "#FBFAF4",
      text: "#1A2A22",
      font: sans,
    },
    description: "Solar power systems, installation and maintenance.",
    navCta: ["Request an assessment", "/contact"],
    hero: {
      eyebrow: "Solar & energy",
      title: "Reliable power for your home and business.",
      body: "We assess your energy needs, design the right solar and backup system, and install it with care — so you get dependable power.",
      cta: [
        ["Request an assessment", "/contact"],
        ["Our solutions", "/solutions"],
      ],
      art: "sun",
    },
    offers: {
      eyebrow: "Solutions",
      title: "Power solutions we provide",
      body: "Tailored systems for homes, offices and commercial sites.",
      link: ["All solutions", "/solutions"],
      items: [
        [
          "Home solar systems",
          "Panels, inverters and batteries sized for your household.",
          "house-plug",
        ],
        [
          "Commercial installations",
          "Systems designed around your operating hours and load.",
          "factory",
        ],
        [
          "Inverters & batteries",
          "Backup power for when the grid is unavailable.",
          "battery-charging",
        ],
        [
          "Maintenance",
          "Inspections, cleaning and performance checks.",
          "wrench",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Power planned around how you live and work.",
      body: "Introduce your company, your installation standards and the brands you work with. Avoid savings or output figures you cannot support.",
      art: "solar-panel",
    },
    features: {
      eyebrow: "Why choose us",
      title: "Our approach",
      items: [
        [
          "Proper sizing",
          "Systems designed from a load assessment, not guesswork.",
        ],
        [
          "Quality equipment",
          "Components from suppliers you can name and verify.",
        ],
        ["After-sales support", "Maintenance and help when you need it."],
      ],
    },
    steps: {
      eyebrow: "Getting started",
      title: "From assessment to power",
      items: [
        ["Energy assessment", "We review your appliances and usage."],
        ["System design", "We recommend a system and provide a quotation."],
        ["Installation", "Our team installs and tests your system."],
        ["Handover", "We show you how to monitor and care for it."],
      ],
    },
    extra: {
      type: "gallery",
      eyebrow: "Installations",
      title: "Recent installations",
      body: "Add photographs of completed installations with permission.",
      items: [
        ["Installation", "Location · System size"],
        ["Installation", "Location · System size"],
        ["Installation", "Location · System size"],
      ],
    },
    faqs: [
      [
        "How do I know what size I need?",
        "We carry out a load assessment before recommending a system.",
      ],
      [
        "Do you offer payment plans?",
        "Describe any financing options you provide.",
      ],
      [
        "What warranty is included?",
        "State the warranties that apply to equipment and installation.",
      ],
    ],
    cta: {
      title: "Get a system designed for you",
      body: "Request an assessment and we’ll recommend the right setup.",
      button: ["Request an assessment", "/contact"],
    },
    contact: {
      title: "Talk to an energy adviser",
      body: "Tell us about your property and power needs.",
    },
  }),

  logistics: build("logistics", {
    template: "horizon",
    palette: {
      primary: "#C8102E",
      secondary: "#0B2545",
      background: "#F5F7FA",
      text: "#0F1C2E",
      font: sans,
    },
    description: "Delivery, freight and logistics services.",
    navCta: ["Get a quote", "/contact"],
    hero: {
      eyebrow: "Logistics & delivery",
      title: "Deliveries you can plan around.",
      body: "Pickups, deliveries and freight handled with care, clear timelines and responsive support from booking to drop-off.",
      cta: [
        ["Get a quote", "/contact"],
        ["Coverage areas", "/coverage"],
      ],
      art: "truck",
    },
    offers: {
      eyebrow: "Services",
      title: "Moving what matters",
      body: "Choose the service that suits your shipment.",
      link: ["All services", "/services"],
      items: [
        [
          "Same-city delivery",
          "Pickups and drop-offs within your city.",
          "bike",
        ],
        [
          "Interstate shipping",
          "Scheduled deliveries between cities.",
          "truck",
        ],
        [
          "Freight & haulage",
          "Bulk and commercial cargo movement.",
          "container",
        ],
        [
          "Business logistics",
          "Recurring deliveries for merchants and retailers.",
          "package-check",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Reliable logistics, clearly communicated.",
      body: "Describe your fleet, coverage and service standards. Only describe tracking features if you actually offer them.",
      art: "warehouse",
    },
    features: {
      eyebrow: "Why ship with us",
      title: "What you can expect",
      items: [
        ["Careful handling", "Packages handled and packed with care."],
        ["Clear timelines", "Delivery windows agreed at booking."],
        ["Responsive support", "A team you can reach about every shipment."],
      ],
    },
    steps: {
      eyebrow: "How it works",
      title: "Booking a delivery",
      items: [
        ["Request a quote", "Share pickup, destination and package details."],
        ["Confirm & pay", "Approve the quote and schedule pickup."],
        ["Delivery", "We deliver and confirm drop-off."],
      ],
    },
    faqs: [
      ["Which areas do you cover?", "List your cities and delivery zones."],
      [
        "How is pricing calculated?",
        "Explain how weight, size and distance affect your rates.",
      ],
      ["What items can’t you carry?", "List prohibited or restricted items."],
    ],
    cta: {
      title: "Need something delivered?",
      body: "Request a quote and we’ll get back to you quickly.",
      button: ["Get a quote", "/contact"],
    },
    contact: {
      title: "Book or ask a question",
      body: "Include pickup and delivery locations for a faster quote.",
    },
  }),

  education: build("education", {
    template: "horizon",
    palette: {
      primary: "#1E3A8A",
      secondary: "#0F1E4A",
      background: "#F8FAFF",
      text: "#152033",
      font: sans,
    },
    description: "School, training and learning programmes.",
    navCta: ["Admissions enquiry", "/contact"],
    hero: {
      eyebrow: "School & training",
      title: "Where curious minds grow.",
      body: "Learning programmes designed to build knowledge, character and confidence — in a supportive environment for every learner.",
      cta: [
        ["Admissions enquiry", "/contact"],
        ["Our programmes", "/programmes"],
      ],
      art: "graduation-cap",
    },
    offers: {
      eyebrow: "Programmes",
      title: "Learning pathways",
      body: "List the levels, classes or courses you currently offer.",
      link: ["All programmes", "/programmes"],
      items: [
        ["Early years", "Play-based learning for young children.", "blocks"],
        [
          "Primary",
          "Strong foundations in literacy, numeracy and discovery.",
          "book-open",
        ],
        [
          "Secondary",
          "Preparing students for examinations and beyond.",
          "notebook-pen",
        ],
        [
          "Professional training",
          "Short courses and certifications for adults.",
          "presentation",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "A place to learn and belong.",
      body: "Share your school’s mission, curriculum and values. Include accreditation and examination body details only where current and accurate.",
      art: "school",
    },
    features: {
      eyebrow: "Learning with us",
      title: "What makes us different",
      items: [
        ["Attentive teaching", "Teachers who know each learner by name."],
        [
          "Well-rounded education",
          "Academic learning alongside sports, arts and clubs.",
        ],
        [
          "Partnership with families",
          "Regular updates and open communication.",
        ],
      ],
    },
    steps: {
      eyebrow: "Admissions",
      title: "How to apply",
      items: [
        ["Enquire", "Send an admissions enquiry or visit us."],
        ["Assessment", "Meet our team and complete any entry assessment."],
        ["Offer", "Receive an admission offer and next steps."],
        ["Enrol", "Complete registration and prepare to start."],
      ],
    },
    extra: {
      type: "gallery",
      eyebrow: "Campus life",
      title: "Life at our school",
      body: "Add photographs of your facilities and activities, with consent.",
      items: [
        ["Classrooms", "Describe the space"],
        ["Library", "Describe the space"],
        ["Sports & activities", "Describe the space"],
      ],
    },
    faqs: [
      [
        "When does admission open?",
        "Share your admission calendar and deadlines.",
      ],
      [
        "What are the school fees?",
        "Explain your fee structure or invite families to request it.",
      ],
      [
        "Do you offer transport?",
        "Describe any transport or boarding options.",
      ],
    ],
    cta: {
      title: "Plan a visit",
      body: "Send an admissions enquiry and we’ll arrange a tour.",
      button: ["Admissions enquiry", "/contact"],
    },
    contact: {
      title: "Speak with admissions",
      body: "Tell us the learner’s age and the programme you’re interested in.",
    },
  }),

  community: build("community", {
    template: "horizon",
    palette: {
      primary: "#B4462B",
      secondary: "#2F4A3A",
      background: "#FBF7F2",
      text: "#2A211C",
      font: sans,
    },
    description: "Community programmes and social impact.",
    navCta: ["Get involved", "/contact"],
    hero: {
      eyebrow: "Non-profit & community",
      title: "Working together for stronger communities.",
      body: "We run programmes that open doors to education, health and opportunity. Learn about our work and how you can take part.",
      cta: [
        ["Get involved", "/contact"],
        ["Our programmes", "/programmes"],
      ],
      art: "hand-heart",
    },
    offers: {
      eyebrow: "Our programmes",
      title: "Where we focus",
      body: "Describe the programmes you actively run.",
      link: ["All programmes", "/programmes"],
      items: [
        [
          "Education support",
          "Helping children and young people stay in learning.",
          "book-open",
        ],
        [
          "Health outreach",
          "Community health education and access to care.",
          "heart-pulse",
        ],
        [
          "Livelihoods",
          "Skills and opportunities for sustainable income.",
          "sprout",
        ],
      ],
    },
    about: {
      eyebrow: "Our mission",
      title: "Change that starts with people.",
      body: "Share your mission, registration details and the communities you serve. Report only impact you can evidence.",
      art: "handshake",
    },
    features: {
      eyebrow: "How we work",
      title: "Our principles",
      items: [
        ["Community-led", "Programmes shaped with the people they serve."],
        ["Accountable", "Clear reporting on how resources are used."],
        ["Partnership-driven", "Working alongside local organisations."],
      ],
    },
    steps: {
      eyebrow: "Get involved",
      title: "Ways to support",
      items: [
        ["Volunteer", "Share your time and skills."],
        ["Partner", "Work with us as an organisation."],
        ["Give", "Support our programmes through approved channels."],
      ],
    },
    extra: {
      type: "gallery",
      eyebrow: "Our work",
      title: "Stories from the field",
      body: "Share real stories and photographs, with consent from those featured.",
      items: [
        ["Programme story", "Short description"],
        ["Programme story", "Short description"],
        ["Programme story", "Short description"],
      ],
    },
    faqs: [
      [
        "Are you a registered organisation?",
        "State your registration details here.",
      ],
      ["How can I volunteer?", "Explain your volunteering process."],
      [
        "How are donations used?",
        "Describe how you allocate and report on funds.",
      ],
    ],
    cta: {
      title: "Join us in making a difference",
      body: "Reach out to volunteer, partner or learn more.",
      button: ["Get involved", "/contact"],
    },
    contact: {
      title: "Get in touch",
      body: "We’d love to hear from volunteers, partners and supporters.",
    },
  }),

  hospitality: build("hospitality", {
    template: "horizon",
    palette: {
      primary: "#8C6A3F",
      secondary: "#1E1B18",
      background: "#FAF7F2",
      text: "#231F1B",
      font: serif,
    },
    description: "Hotel, rooms and hospitality.",
    navCta: ["Make a reservation", "/contact"],
    hero: {
      eyebrow: "Hotel & hospitality",
      title: "A warm welcome, every stay.",
      body: "Comfortable rooms, thoughtful service and a relaxing atmosphere — whether you’re here for business or a well-earned break.",
      cta: [
        ["Make a reservation", "/contact"],
        ["View rooms", "/rooms"],
      ],
      art: "bed-double",
    },
    offers: {
      eyebrow: "Stay with us",
      title: "Rooms & facilities",
      body: "Describe the rooms and facilities available to guests.",
      link: ["View rooms", "/rooms"],
      items: [
        [
          "Standard room",
          "A comfortable room for solo travellers and couples.",
          "bed-single",
        ],
        ["Deluxe room", "Extra space with a lounge area.", "bed-double"],
        ["Suite", "A separate living area for longer stays.", "sofa"],
        ["Dining", "Meals prepared by our kitchen team.", "utensils-crossed"],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Hospitality with a personal touch.",
      body: "Tell guests what makes your property special: its location, character and the service they can expect.",
      art: "hotel",
    },
    features: {
      eyebrow: "Amenities",
      title: "Everything you need",
      items: [
        ["Comfort", "List your room amenities here."],
        ["Connectivity", "Describe Wi-Fi and workspace availability."],
        [
          "Convenience",
          "Describe parking, airport transfers or concierge services.",
        ],
      ],
    },
    steps: {
      eyebrow: "Reservations",
      title: "How to book",
      items: [
        ["Send a request", "Share your dates, room type and number of guests."],
        [
          "We confirm availability",
          "Our team replies with availability and rates.",
        ],
        ["Confirm your stay", "Complete payment to secure your booking."],
      ],
    },
    extra: {
      type: "gallery",
      eyebrow: "Gallery",
      title: "A look inside",
      body: "Replace these with photographs of your property.",
      items: [
        ["Lobby", ""],
        ["Rooms", ""],
        ["Restaurant", ""],
      ],
    },
    faqs: [
      [
        "What are check-in and check-out times?",
        "Add your check-in and check-out times.",
      ],
      ["Is breakfast included?", "Explain what your rates include."],
      [
        "What is your cancellation policy?",
        "Summarise your cancellation terms.",
      ],
    ],
    cta: {
      title: "Plan your stay",
      body: "Send a reservation request and we’ll confirm availability.",
      button: ["Make a reservation", "/contact"],
    },
    contact: {
      title: "Reservations & enquiries",
      body: "Share your dates and we’ll get back to you.",
    },
  }),

  general: build("general", {
    template: "horizon",
    palette: {
      primary: "#2F5D8C",
      secondary: "#13263A",
      background: "#F7F9FB",
      text: "#182430",
      font: sans,
    },
    description: "Professional services for your needs.",
    navCta: ["Get in touch", "/contact"],
    hero: {
      eyebrow: "Professional services",
      title: "Dependable service, done properly.",
      body: "We help customers get things done with clear communication, fair pricing and a commitment to quality work.",
      cta: [
        ["Get in touch", "/contact"],
        ["Our services", "/services"],
      ],
      art: "briefcase-business",
    },
    offers: {
      eyebrow: "Services",
      title: "What we offer",
      body: "Describe the services you provide.",
      link: ["All services", "/services"],
      items: [
        [
          "Service one",
          "Describe what it includes and who it is for.",
          "circle-check",
        ],
        [
          "Service two",
          "Describe what it includes and who it is for.",
          "circle-check",
        ],
        [
          "Service three",
          "Describe what it includes and who it is for.",
          "circle-check",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "A business built on trust.",
      body: "Tell customers who you are, how long you’ve been serving them and what they can expect from you.",
      art: "users-round",
    },
    features: {
      eyebrow: "Why choose us",
      title: "Our promise",
      items: [
        ["Clear communication", "We keep you informed from start to finish."],
        ["Quality work", "We take care over every detail."],
        ["Fair pricing", "Quotes agreed before work begins."],
      ],
    },
    steps: {
      eyebrow: "How it works",
      title: "Getting started",
      items: [
        ["Get in touch", "Tell us what you need."],
        ["Receive a quote", "We explain the work and the cost."],
        ["We deliver", "We complete the work and follow up."],
      ],
    },
    faqs: [
      ["Which areas do you serve?", "List the locations you cover."],
      ["How soon can you start?", "Describe your typical lead time."],
      ["How do I pay?", "List the payment methods you accept."],
    ],
    cta: {
      title: "Let’s get started",
      body: "Send us a message and we’ll respond promptly.",
      button: ["Get in touch", "/contact"],
    },
    contact: {
      title: "Contact us",
      body: "We’re happy to answer your questions.",
    },
  }),

  fashion: build("fashion", {
    template: "atelier",
    palette: {
      primary: "#111111",
      secondary: "#B08D57",
      background: "#FAF8F5",
      text: "#151515",
      font: serif,
    },
    description: "Clothing and accessories.",
    navCta: ["Shop now", "/shop"],
    hero: {
      eyebrow: "New collection",
      title: "Pieces made to be lived in.",
      body: "Considered designs, quality materials and an easy fit — discover the latest collection.",
      cta: [
        ["Shop the collection", "/shop"],
        ["Our story", "/about"],
      ],
      art: "shirt",
    },
    offers: {
      eyebrow: "Shop by category",
      title: "Find your style",
      body: "",
      link: ["Browse everything", "/shop"],
      items: [
        ["Women", "Dresses, tops and tailoring.", "shirt"],
        ["Men", "Shirts, trousers and outerwear.", "shirt"],
        ["Accessories", "Bags, jewellery and finishing touches.", "gem"],
      ],
    },
    about: {
      eyebrow: "Our story",
      title: "Designed with intention.",
      body: "Tell customers where your pieces are designed and made, and the materials you use. Only describe sourcing you can verify.",
      art: "scissors",
    },
    features: {
      eyebrow: "Shopping with us",
      title: "Shop with confidence",
      items: [
        ["Size guidance", "Measurements for every piece."],
        ["Secure checkout", "Pay safely online."],
        ["Easy returns", "Summarise your returns policy here."],
      ],
    },
    steps: {
      eyebrow: "Delivery",
      title: "How ordering works",
      items: [
        ["Choose your pieces", "Add items to your bag."],
        ["Checkout securely", "Enter delivery details and pay."],
        ["Delivered to you", "Describe your delivery times and areas."],
      ],
    },
    faqs: [
      ["How do I find my size?", "Link to your size guide."],
      ["How long does delivery take?", "State delivery times by location."],
      ["Can I return an item?", "Summarise your returns and exchanges policy."],
    ],
    cta: {
      title: "Discover the collection",
      body: "New pieces added regularly.",
      button: ["Shop now", "/shop"],
    },
    contact: {
      title: "Customer care",
      body: "Questions about an order, sizing or delivery? We’re here to help.",
    },
  }),

  beauty: build("beauty", {
    template: "atelier",
    palette: {
      primary: "#A8436B",
      secondary: "#3B1F2B",
      background: "#FCF7F8",
      text: "#2B1D23",
      font: serif,
    },
    description: "Beauty, skincare and cosmetics.",
    navCta: ["Shop now", "/shop"],
    hero: {
      eyebrow: "Beauty & skincare",
      title: "Everyday care for your skin.",
      body: "Thoughtfully chosen skincare, makeup and body care — with clear ingredient information to help you choose.",
      cta: [
        ["Shop now", "/shop"],
        ["Our story", "/about"],
      ],
      art: "sparkles",
    },
    offers: {
      eyebrow: "Shop by category",
      title: "Find what suits you",
      body: "",
      link: ["Browse everything", "/shop"],
      items: [
        ["Skincare", "Cleansers, serums and moisturisers.", "droplets"],
        ["Makeup", "Complexion, eyes and lips.", "palette"],
        ["Body & hair", "Care for every day.", "flower-2"],
      ],
    },
    about: {
      eyebrow: "Our story",
      title: "Beauty, honestly.",
      body: "Share your brand story and product philosophy. Avoid medical or treatment claims, and list ingredients as provided by manufacturers.",
      art: "flower-2",
    },
    features: {
      eyebrow: "Shopping with us",
      title: "Why shop here",
      items: [
        ["Clear ingredients", "Product details listed for every item."],
        ["Secure checkout", "Pay safely online."],
        ["Helpful support", "Ask us about any product."],
      ],
    },
    steps: {
      eyebrow: "Ordering",
      title: "How it works",
      items: [
        ["Choose", "Browse by category or concern."],
        ["Checkout", "Pay securely online."],
        ["Delivery", "Describe your delivery options."],
      ],
    },
    faqs: [
      [
        "Are your products authentic?",
        "Explain where your products are sourced.",
      ],
      ["How long does delivery take?", "State delivery times by location."],
      ["Can I return an opened product?", "Summarise your returns policy."],
    ],
    cta: {
      title: "Treat yourself",
      body: "Discover our latest arrivals.",
      button: ["Shop now", "/shop"],
    },
    contact: {
      title: "Customer care",
      body: "Questions about a product or order? We’re here to help.",
    },
  }),

  electronics: build("electronics", {
    template: "catalogue",
    palette: {
      primary: "#0B63CE",
      secondary: "#0A1B2E",
      background: "#F5F7FA",
      text: "#0F1B2A",
      font: sans,
    },
    description: "Phones, computers and electronics.",
    navCta: ["Shop now", "/shop"],
    hero: {
      eyebrow: "Electronics store",
      title: "The tech you need, clearly explained.",
      body: "Phones, computers, accessories and power solutions — with full specifications, honest stock levels and delivery details shown before checkout.",
      cta: [
        ["Shop all products", "/shop"],
        ["Buying guide", "/buying-guide"],
      ],
      art: "laptop",
    },
    offers: {
      eyebrow: "Shop by category",
      title: "Popular categories",
      body: "",
      link: ["Browse all", "/shop"],
      items: [
        [
          "Phones & tablets",
          "Current models with full specifications.",
          "smartphone",
        ],
        ["Computing", "Laptops, monitors and accessories.", "laptop"],
        ["Audio", "Headphones, speakers and more.", "headphones"],
        ["Power", "Inverters, batteries and power banks.", "battery-charging"],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Shop with confidence.",
      body: "Explain where your products come from and what warranty applies. State warranty terms only as provided by the manufacturer or your store.",
      art: "store",
    },
    features: {
      eyebrow: "Why shop here",
      title: "Buying made simple",
      items: [
        ["Full specifications", "Compare products with confidence."],
        ["Honest stock levels", "See availability before you order."],
        ["Secure checkout", "Pay safely online."],
      ],
    },
    steps: {
      eyebrow: "Ordering",
      title: "How it works",
      items: [
        ["Find your product", "Search or browse categories."],
        ["Checkout", "Pay securely online."],
        ["Delivery or pickup", "Describe your delivery and pickup options."],
      ],
    },
    faqs: [
      [
        "Are products new and original?",
        "Describe product condition and sourcing.",
      ],
      [
        "What warranty applies?",
        "Explain warranty terms per product or brand.",
      ],
      ["How long does delivery take?", "State delivery times by location."],
    ],
    cta: {
      title: "Need help choosing?",
      body: "Contact our team for product advice.",
      button: ["Contact us", "/contact"],
    },
    contact: {
      title: "Customer support",
      body: "Questions about a product, order or warranty? Get in touch.",
    },
  }),

  furniture: build("furniture", {
    template: "atelier",
    palette: {
      primary: "#7A5230",
      secondary: "#2E2A25",
      background: "#F8F5F0",
      text: "#2A241E",
      font: serif,
    },
    description: "Furniture and home décor.",
    navCta: ["Shop now", "/shop"],
    hero: {
      eyebrow: "Furniture & home",
      title: "Furniture made for everyday living.",
      body: "Comfortable, well-made pieces for every room — with dimensions, materials and delivery details on every product.",
      cta: [
        ["Shop furniture", "/shop"],
        ["Measuring guide", "/measurements"],
      ],
      art: "sofa",
    },
    offers: {
      eyebrow: "Shop by room",
      title: "Furnish every space",
      body: "",
      link: ["Browse everything", "/shop"],
      items: [
        ["Living room", "Sofas, chairs and tables.", "sofa"],
        ["Bedroom", "Beds, wardrobes and storage.", "bed-double"],
        ["Dining", "Tables and seating.", "utensils"],
        ["Office", "Desks and ergonomic chairs.", "armchair"],
      ],
    },
    about: {
      eyebrow: "Our craft",
      title: "Pieces built to last.",
      body: "Describe how and where your furniture is made, and the materials you use.",
      art: "hammer",
    },
    features: {
      eyebrow: "Shopping with us",
      title: "Buy with confidence",
      items: [
        ["Exact dimensions", "Measurements listed for every piece."],
        ["Material details", "Know exactly what you’re buying."],
        ["Delivery options", "Describe delivery and assembly."],
      ],
    },
    steps: {
      eyebrow: "Delivery",
      title: "From order to your home",
      items: [
        ["Choose", "Check dimensions against your space."],
        ["Order", "Checkout securely online."],
        ["Delivery", "Describe delivery scheduling and assembly."],
      ],
    },
    faqs: [
      [
        "Do you deliver and assemble?",
        "Explain delivery areas and assembly options.",
      ],
      ["Can I customise a piece?", "Describe any customisation options."],
      [
        "What if an item arrives damaged?",
        "Summarise your returns and damage policy.",
      ],
    ],
    cta: {
      title: "Make your space your own",
      body: "Explore our latest pieces.",
      button: ["Shop now", "/shop"],
    },
    contact: {
      title: "Talk to us",
      body: "Questions about sizing, materials or delivery? Get in touch.",
    },
  }),

  books: build("books", {
    template: "catalogue",
    palette: {
      primary: "#7A1F2B",
      secondary: "#1F2A44",
      background: "#FBF8F2",
      text: "#221D18",
      font: serif,
    },
    description: "Books, stationery and learning materials.",
    navCta: ["Browse books", "/shop"],
    hero: {
      eyebrow: "Bookshop",
      title: "Stories and ideas worth sharing.",
      body: "Fiction, non-fiction, textbooks and children’s books — with author, format and edition details for every title.",
      cta: [
        ["Browse books", "/shop"],
        ["About us", "/about"],
      ],
      art: "library-big",
    },
    offers: {
      eyebrow: "Browse",
      title: "Find your next read",
      body: "",
      link: ["All books", "/shop"],
      items: [
        ["Fiction", "Novels and short stories.", "book-open"],
        ["Non-fiction", "Biography, business and ideas.", "book-marked"],
        ["Education", "Textbooks and study guides.", "graduation-cap"],
        ["Children", "Picture books and early readers.", "baby"],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "A bookshop for curious readers.",
      body: "Tell readers about your shop and the books you champion.",
      art: "library-big",
    },
    features: {
      eyebrow: "Shopping with us",
      title: "Why readers shop here",
      items: [
        ["Detailed listings", "Author, format and edition for each title."],
        ["Secure checkout", "Pay safely online."],
        ["Helpful service", "Ask us to find a title."],
      ],
    },
    steps: {
      eyebrow: "Ordering",
      title: "How it works",
      items: [
        ["Browse", "Search by title, author or subject."],
        ["Checkout", "Pay securely online."],
        ["Delivery", "Describe your delivery options."],
      ],
    },
    faqs: [
      ["Can you order a book you don’t stock?", "Explain special orders."],
      ["How long does delivery take?", "State delivery times by location."],
      ["Do you supply schools?", "Describe bulk and institutional orders."],
    ],
    cta: {
      title: "Find your next book",
      body: "Browse the full catalogue.",
      button: ["Browse books", "/shop"],
    },
    contact: {
      title: "Contact the shop",
      body: "Looking for a specific title? Ask us.",
    },
  }),

  food: build("food", {
    template: "essentials",
    palette: {
      primary: "#2F7D32",
      secondary: "#1D3B1F",
      background: "#F7FAF3",
      text: "#1E2B1A",
      font: sans,
    },
    description: "Groceries and household essentials.",
    navCta: ["Shop groceries", "/shop"],
    hero: {
      eyebrow: "Groceries & essentials",
      title: "Everyday essentials, delivered.",
      body: "Fresh produce, pantry staples and household items — order online and choose delivery or pickup.",
      cta: [
        ["Shop groceries", "/shop"],
        ["Delivery areas", "/faq"],
      ],
      art: "shopping-basket",
    },
    offers: {
      eyebrow: "Shop by aisle",
      title: "Everything in one place",
      body: "",
      link: ["Browse all aisles", "/shop"],
      items: [
        ["Fresh produce", "Fruit and vegetables.", "carrot"],
        ["Pantry staples", "Rice, grains, oils and spices.", "wheat"],
        ["Drinks", "Water, juice and beverages.", "cup-soda"],
        ["Household", "Cleaning and personal care.", "spray-can"],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Your neighbourhood store, online.",
      body: "Tell customers about your store, where you deliver and how you keep products fresh. List allergen and ingredient information as supplied.",
      art: "store",
    },
    features: {
      eyebrow: "Why shop here",
      title: "Shopping made easy",
      items: [
        ["Clear pack sizes", "Weights and quantities on every item."],
        ["Delivery or pickup", "Choose what suits you."],
        ["Secure checkout", "Pay safely online."],
      ],
    },
    steps: {
      eyebrow: "Ordering",
      title: "How it works",
      items: [
        ["Fill your basket", "Browse by aisle or search."],
        ["Choose delivery or pickup", "Select your preferred option."],
        ["Receive your order", "Describe your delivery times."],
      ],
    },
    faqs: [
      ["Where do you deliver?", "List your delivery areas and fees."],
      ["Is there a minimum order?", "State any minimum order value."],
      [
        "How do you handle fresh items?",
        "Describe your freshness and substitution policy.",
      ],
    ],
    cta: {
      title: "Stock up today",
      body: "Order your essentials in minutes.",
      button: ["Shop groceries", "/shop"],
    },
    contact: {
      title: "Customer care",
      body: "Questions about an order or delivery? We’re here to help.",
    },
  }),

  retail: build("retail", {
    template: "catalogue",
    palette: {
      primary: "#C2410C",
      secondary: "#1F2937",
      background: "#F9FAFB",
      text: "#111827",
      font: sans,
    },
    description: "Quality products for everyday life.",
    navCta: ["Shop now", "/shop"],
    hero: {
      eyebrow: "Online store",
      title: "Quality products, simple shopping.",
      body: "Browse our range, see clear prices and stock levels, and check out securely in minutes.",
      cta: [
        ["Shop now", "/shop"],
        ["About us", "/about"],
      ],
      art: "shopping-bag",
    },
    offers: {
      eyebrow: "Shop by category",
      title: "Popular categories",
      body: "",
      link: ["Browse all", "/shop"],
      items: [
        ["New arrivals", "The latest additions to our range.", "sparkles"],
        ["Best sellers", "Customer favourites.", "star"],
        ["Home & living", "Everyday items for your home.", "house"],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "A store you can rely on.",
      body: "Tell customers who you are and what you sell.",
      art: "store",
    },
    features: {
      eyebrow: "Why shop here",
      title: "Shop with confidence",
      items: [
        ["Clear pricing", "Prices and stock shown on every product."],
        ["Secure checkout", "Pay safely online."],
        ["Helpful support", "We’re here if you need us."],
      ],
    },
    steps: {
      eyebrow: "Ordering",
      title: "How it works",
      items: [
        ["Browse", "Find what you need."],
        ["Checkout", "Pay securely online."],
        ["Delivery", "Describe your delivery options."],
      ],
    },
    faqs: [
      ["How long does delivery take?", "State delivery times by location."],
      ["Can I return an item?", "Summarise your returns policy."],
      [
        "Which payment methods do you accept?",
        "List accepted payment methods.",
      ],
    ],
    cta: {
      title: "Find something you’ll love",
      body: "Explore the full range.",
      button: ["Shop now", "/shop"],
    },
    contact: {
      title: "Customer support",
      body: "Questions about an order? We’re here to help.",
    },
  }),
};

export function kitFor(industry: string | undefined, category: string) {
  return (
    industryKits[industry || ""] ||
    industryKits[category === "commerce" ? "retail" : "general"]
  );
}

/** Representative industry used for each template's public preview. */
export const templatePreviewIndustry: Record<TemplateId, string> = {
  studio: "creative",
  trust: "legal",
  care: "healthcare",
  horizon: "construction",
  atelier: "fashion",
  catalogue: "electronics",
  essentials: "food",
};

/** A complete, self-contained sample site for public template previews.
 * Internal links become on-page anchors because previews have no inner
 * pages; business details are clearly fictitious. */
export function previewSite(
  industry: string,
  category: "corporate" | "commerce",
  business: { name: string },
) {
  const kit = kitFor(industry, category);
  const anchor = (href: string) =>
    !href.startsWith("/")
      ? href
      : /contact/.test(href)
        ? "#contact"
        : /about/.test(href)
          ? "#about"
          : "#services";
  const services = kit.sections.find((s) => s.id === "services");
  const sections = kit.sections.map((s) => ({
    ...s,
    ctas: s.ctas?.map((c) => ({ ...c, href: anchor(c.href) })),
    items: s.items?.map((i) => (i.href ? { ...i, href: anchor(i.href) } : i)),
  }));
  const brand: Brand = {
    name: business.name,
    description: kit.description,
    ...kit.palette,
    email: "hello@example.com",
    categoryUrls: false,
    logo: "",
    navCta: { label: kit.navCta.label, href: anchor(kit.navCta.href) },
    socials: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      x: "https://x.com/",
      whatsapp: "https://wa.me/",
    },
    navigation: [
      {
        label: services?.eyebrow || "Services",
        href: "#services",
        footer: false,
        children: (services?.items || []).slice(0, 4).map((i) => ({
          label: i.title,
          href: "#services",
        })),
      },
      { label: "About", href: "#about", footer: false },
      { label: "FAQ", href: "#faq", footer: false },
      { label: "Contact", href: "#contact", footer: false },
    ],
  };
  return {
    data: { template: kit.template, brand, sections },
    contact: {
      phone: "+234 800 000 0000",
      address: "12 Sample Street, Lagos",
      hours: "Monday to Friday, 8am – 6pm",
    },
    legal: legalSetFor(industry, category).map((type) => ({
      title: policies[type].title,
      href: "#",
    })),
  };
}

/** Starter sections for a provisioned inner page, drawn from the kit so the
 * whole site shares one voice. Every section stays flagged as sample. */
export function pageSections(kit: IndustryKit, title: string): Section[] {
  const pick = (id: string) => kit.sections.find((s) => s.id === id);
  const fresh = (list: (Section | undefined)[]) =>
    structuredClone(list.filter((s): s is Section => !!s)).map((s) => ({
      ...s,
      id: `${s.id}-${Math.random().toString(36).slice(2, 8)}`,
    }));
  const key = title.toLowerCase();
  const offers = pick("services");
  if (key === "contact") return fresh([pick("contact"), pick("faq")]);
  if (key === "about")
    return fresh([
      pick("about"),
      pick("features"),
      pick("team") || pick("gallery"),
      pick("cta"),
    ]);
  if (key === "faq") return fresh([pick("faq"), pick("cta")]);
  if (offers && key === (offers.eyebrow || "").toLowerCase())
    return fresh([
      { ...offers, eyebrow: "", title: offers.title, ctas: undefined },
      pick("steps"),
      pick("faq"),
      pick("cta"),
    ]);
  if (
    ["services", "solutions", "practice areas", "medical services"].includes(
      key,
    )
  )
    return fresh([{ ...offers!, ctas: undefined }, pick("steps"), pick("cta")]);
  if (key === "gallery")
    return fresh([pick("gallery") || pick("about"), pick("cta")]);
  return fresh([
    {
      id: "intro",
      type: "text",
      eyebrow: title,
      title,
      body: `Explain what visitors need to know about ${title.toLowerCase()}. Keep it factual, specific to your business and easy to scan.`,
      visible: true,
      sample: true,
    },
    pick("cta"),
  ]);
}
