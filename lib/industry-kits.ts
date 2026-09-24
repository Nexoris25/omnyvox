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
        ...(industry === "general" ? {} : pic(slug(title), icon, `${title} — sample image`)),
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
      body: "Four ways we help people and brands tell their story.",
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
      body: "We are a small team of photographers, planners and designers who love turning a loose idea into something people remember. Every project starts with listening, and ends with work you are proud to share.",
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
      body: "A few recent projects, shared with our clients’ permission.",
      items: [
        ["Brand launch", "Product photography and styling"],
        ["Garden wedding", "Planning, décor and photography"],
        ["Office refresh", "Interior design for a small team"],
      ],
    },
    faqs: [
      [
        "How far in advance should I book?",
        "For photo shoots, two to three weeks is usually enough. Weddings and large events are best booked three to six months ahead. Get in touch even at short notice and we will tell you honestly what is possible.",
      ],
      [
        "How do you price your work?",
        "Most work is quoted per project, based on the time, team and materials involved. You receive a written quotation before anything is booked.",
      ],
      [
        "Do you work outside your city?",
        "Yes. We are happy to travel, and any travel or accommodation costs are included in your quotation upfront.",
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
      body: "We work with owner-managed businesses, growing companies and not-for-profits that want clear numbers and practical advice. You deal with the same adviser from the first meeting, and we explain every recommendation in plain language.",
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
      body: "The advisers you will work with. Each profile lists the person’s role and the areas they look after.",
      items: [
        ["Managing partner", "Leads client relationships and advisory work."],
        ["Tax manager", "Looks after tax planning and compliance."],
        ["Senior accountant", "Prepares accounts and management reports."],
      ],
    },
    faqs: [
      [
        "Which organisations do you work with?",
        "Mostly small and medium-sized businesses, from start-ups to established family companies, across trade, services, manufacturing and the not-for-profit sector.",
      ],
      [
        "How are your fees structured?",
        "Most ongoing work is on an agreed monthly fee, and one-off projects are quoted in advance. You always see the fee in writing before work begins.",
      ],
      [
        "Can we meet in person?",
        "Yes. You are welcome at our office, and we are just as happy to meet by video call if that suits you better.",
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
      body: "The areas in which we regularly advise clients.",
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
      body: "We are a practice built on careful preparation and straight answers. We tell clients where they stand, what their options are and what each will cost, so that decisions are made with a clear head.",
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
      body: "The lawyers who will handle your matter, with their roles and practice areas.",
      items: [
        ["Partner", "Leads client matters and advises on strategy."],
        ["Senior associate", "Manages matters day to day and prepares documents."],
        ["Associate", "Supports research, drafting and client updates."],
      ],
    },
    faqs: [
      [
        "Is the first consultation free?",
        "We offer a short introductory call to understand your matter and explain how we can help. If a full consultation is needed, we confirm the fee before it is booked.",
      ],
      [
        "Is my enquiry confidential?",
        "Yes. Enquiries are treated in confidence and seen only by the lawyers who need to review them. A formal engagement begins only once terms are agreed in writing.",
      ],
      [
        "Do you act outside your city?",
        "We advise clients across Nigeria and can attend meetings and hearings outside our home city by arrangement.",
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
      body: "Everyday care and specialist support, under one roof.",
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
      body: "We are a friendly clinic where patients are seen on time, listened to properly and told clearly what happens next. Our team works to high standards of hygiene, privacy and care.",
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
      body: "The clinicians who look after our patients, with their roles and areas of care.",
      items: [
        ["Medical officer", "Sees patients for consultations and ongoing care."],
        ["Nursing lead", "Leads nursing care and patient support."],
        ["Laboratory scientist", "Runs tests and reports results to your clinician."],
      ],
    },
    faqs: [
      [
        "What are your opening hours?",
        "We are open Monday to Saturday. Please check our contact page for today’s hours and public holiday arrangements.",
      ],
      [
        "Do you accept health insurance?",
        "We work with a number of HMOs. Contact us with your provider’s name and we will confirm whether we can accept it before your visit.",
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
    template: "haven",
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
      body: "We help people buy, rent and let homes and commercial spaces with honest advice and no surprises. Every property we list is one we are authorised to market, and we tell you everything we know about it.",
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
      body: "A selection of homes and spaces currently available.",
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
        "We explain every fee before you commit, including agency, legal and service charges, so the total cost is clear from the start.",
      ],
      [
        "Which areas do you cover?",
        "We focus on a handful of neighbourhoods we know well, and can recommend trusted partners elsewhere.",
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
    template: "build",
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
      body: "From the first drawing to the final handover.",
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
      body: "We build homes, offices and commercial spaces with a site team that takes pride in the detail. Clients get a named project lead, regular site updates and a clear record of every change.",
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
      body: "A few completed projects, shared with our clients’ permission.",
      items: [
        ["Family home", "New build · Four bedrooms"],
        ["Office fit-out", "Renovation · Two floors"],
        ["Retail unit", "Extension and finishing"],
      ],
    },
    faqs: [
      [
        "How do you price a project?",
        "After a site visit and review of your drawings, we prepare an itemised quotation covering materials, labour and timelines, so you can compare like for like.",
      ],
      [
        "Do you handle permits and approvals?",
        "We guide you through the approvals your project needs and work with your architect and engineers to prepare the documents.",
      ],
      [
        "Which locations do you serve?",
        "We work across our home state and neighbouring states. Tell us where your site is and we will confirm.",
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
    template: "build",
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
      body: "We design solar and battery systems around how you actually use power, install them neatly and safely, and stay on hand for maintenance. You get an honest assessment, not a sales pitch.",
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
      body: "A few recent installations, shared with our customers’ permission.",
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
        "We can spread the cost of some systems over agreed instalments. Ask us for the options available for your installation.",
      ],
      [
        "What warranty is included?",
        "Panels, inverters and batteries carry their manufacturers’ warranties, and our installation work is covered by our own workmanship guarantee. Full terms are included in your quotation.",
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
    template: "build",
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
      body: "We move parcels, pallets and full loads for businesses and individuals, with drivers who know their routes and a team that keeps you updated from pickup to delivery.",
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
      ["Which areas do you cover?", "We deliver within our home city every day and run scheduled routes to other major cities. Share your destination and we will confirm."],
      [
        "How is pricing calculated?",
        "Prices depend on the size and weight of your items, the distance and how quickly you need them delivered. You always get the price before we collect.",
      ],
      ["What items can’t you carry?", "We cannot carry illegal, hazardous or perishable goods without prior arrangement. Ask us if you are unsure about an item."],
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
      body: "Programmes for every stage of a learner’s journey.",
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
      body: "We are a school where children are known by name, encouraged to ask questions and supported to do their best. Small classes, caring teachers and strong links with families are at the heart of what we do.",
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
      body: "A glimpse of daily life, shared with the consent of those pictured.",
      items: [
        ["Classrooms", "Bright, well-equipped rooms for focused learning"],
        ["Library", "A quiet space to read, research and study"],
        ["Sports & activities", "Room to play, compete and try something new"],
      ],
    },
    faqs: [
      [
        "When does admission open?",
        "Admission for the new session opens each spring, and we welcome enquiries all year for any spaces that become available.",
      ],
      [
        "What are the school fees?",
        "Fees depend on the class and programme. Contact admissions and we will send you the current fee schedule.",
      ],
      [
        "Do you offer transport?",
        "We offer school transport on selected routes. Ask admissions whether your area is covered.",
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
      body: "The work we do with and for our community.",
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
      body: "We are a community organisation that brings people together to learn, grow and support each other. Our programmes are shaped by the people they serve, and we report openly on how we use every donation.",
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
      body: "Stories and photographs shared with the consent of those featured.",
      items: [
        ["Programme story", "Short description"],
        ["Programme story", "Short description"],
        ["Programme story", "Short description"],
      ],
    },
    faqs: [
      [
        "Are you a registered organisation?",
        "Yes. Our registration details are shown on this website and on every receipt we issue.",
      ],
      ["How can I volunteer?", "Send us a message with the skills and time you can offer, and our volunteer coordinator will be in touch."],
      [
        "How are donations used?",
        "Donations go directly to our programmes and essential running costs, and we publish a yearly summary of how funds were used.",
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
    template: "haven",
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
      body: "Comfortable rooms and thoughtful facilities for business and leisure stays.",
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
      body: "We are a small, personal hotel where guests are greeted by name and looked after with care. Our location puts you close to business districts, restaurants and the places worth seeing.",
      art: "hotel",
    },
    features: {
      eyebrow: "Amenities",
      title: "Everything you need",
      items: [
        ["Comfort", "Air-conditioned rooms with quality bedding and a quiet night’s sleep."],
        ["Connectivity", "Fast Wi-Fi throughout and a desk in every room."],
        [
          "Convenience",
          "Secure parking and airport transfers on request.",
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
      body: "A look at our rooms, restaurant and shared spaces.",
      items: [
        ["Lobby", ""],
        ["Rooms", ""],
        ["Restaurant", ""],
      ],
    },
    faqs: [
      [
        "What are check-in and check-out times?",
        "Check-in is from 2pm and check-out is by 12 noon. Early arrival or late departure can often be arranged.",
      ],
      ["Is breakfast included?", "Breakfast is included with most room rates. Your booking confirmation shows exactly what is included."],
      [
        "What is your cancellation policy?",
        "Bookings can usually be cancelled free of charge up to 48 hours before arrival. Full terms are in our booking policy.",
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
    description:
      "Practical business advice, from the first plan to everyday operations.",
    navCta: ["Get in touch", "/contact"],
    hero: {
      eyebrow: "Professional services",
      title: "Your next chapter starts with a clear plan.",
      body: "Bring direction to your business with practical planning, better processes and hands-on project support.",
      cta: [
        ["Get in touch", "/contact"],
        ["Our services", "/services"],
      ],
      art: "briefcase-business",
    },
    offers: {
      eyebrow: "Services",
      title: "Move your business forward.",
      body: "Focused support for the decisions, systems and projects that shape your business.",
      link: ["All services", "/services"],
      items: [
        [
          "Business planning",
          "Turn your priorities into a practical roadmap, with clear milestones and a shared definition of success.",
          "circle-check",
        ],
        [
          "Operations improvement",
          "Simplify everyday work with clearer responsibilities, more useful processes and fewer unnecessary steps.",
          "circle-check",
        ],
        [
          "Project delivery",
          "Keep important work moving with a defined scope, coordinated tasks and regular progress reviews.",
          "circle-check",
        ],
      ],
    },
    about: {
      eyebrow: "About us",
      title: "Good advice starts with listening.",
      body: "Every business has its own challenges. We take time to understand yours, agree the work together and keep you involved as it takes shape.",
      art: "users-round",
    },
    features: {
      eyebrow: "Why choose us",
      title: "A working relationship you can rely on.",
      items: [
        ["Plain-spoken advice", "Straight answers and recommendations you can act on."],
        ["Practical, not theoretical", "Plans shaped around your people, budget and pace."],
        ["Agreed before we begin", "Scope, timing and fees set out in a written proposal."],
      ],
    },
    steps: {
      eyebrow: "How it works",
      title: "From the first conversation to the next step.",
      items: [
        [
          "Get in touch",
          "Share your priorities, your challenges and what you would like to change.",
        ],
        [
          "Agree the scope",
          "Review a written proposal with the scope, timeline and fees before deciding to go ahead.",
        ],
        [
          "Work together",
          "Put the plan into practice with regular check-ins and a clear record of progress.",
        ],
      ],
    },
    faqs: [
      [
        "Which areas do you serve?",
        "Tell us your location when you enquire so we can discuss the best way to work together.",
      ],
      [
        "How soon can you start?",
        "We agree availability and a start date after understanding your brief.",
      ],
      [
        "How do I pay?",
        "Your proposal sets out the payment schedule and available payment options before work begins.",
      ],
    ],
    cta: {
      title: "Ready to plan your next step?",
      body: "Tell us where your business is today and where you want it to be. We’ll suggest a sensible place to start.",
      button: ["Get in touch", "/contact"],
    },
    contact: {
      title: "Start a conversation.",
      body: "Share a little about your business and what you would like to change, and we’ll come back to you with a suggested next step.",
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
      body: "Every piece starts as a sketch in our studio and is made in small batches with fabrics chosen for how they feel and wear. We would rather make fewer things, better.",
      art: "scissors",
    },
    features: {
      eyebrow: "Shopping with us",
      title: "Shop with confidence",
      items: [
        ["Size guidance", "Measurements for every piece."],
        ["Secure checkout", "Pay safely online."],
        ["Easy returns", "Changed your mind? Returns are simple."],
      ],
    },
    steps: {
      eyebrow: "Delivery",
      title: "How ordering works",
      items: [
        ["Choose your pieces", "Add items to your bag."],
        ["Checkout securely", "Enter delivery details and pay."],
        ["Delivered to you", "Delivered to your door, or collect in store."],
      ],
    },
    faqs: [
      ["How do I find my size?", "Our size guide lists measurements for every size. If you are between sizes, choose the larger one."],
      ["How long does delivery take?", "Most orders arrive within 2–4 working days, depending on where you are. You will see delivery options and costs at checkout."],
      ["Can I return an item?", "Yes. Unworn items with tags attached can be returned or exchanged. See our refund policy for details."],
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
    template: "glow",
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
      body: "We choose every product for how it feels and how well it works in our climate. We list full ingredients on each product page, so you always know what you are putting on your skin.",
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
        ["Delivery", "Fast delivery to your door."],
      ],
    },
    faqs: [
      [
        "Are your products authentic?",
        "Yes. We buy directly from brands and their authorised distributors, never from unofficial sellers.",
      ],
      ["How long does delivery take?", "Most orders arrive within 2–4 working days, depending on where you are. You will see delivery options and costs at checkout."],
      ["Can I return an opened product?", "Unopened products can be returned within the period set out in our refund policy. For hygiene reasons, opened products can only be returned if they are faulty."],
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
      body: "We stock genuine devices from trusted suppliers, test what we sell and stand behind every sale. If something is not right, our support team is here to help.",
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
        ["Delivery or pickup", "Delivered to you, or collect from our store."],
      ],
    },
    faqs: [
      [
        "Are products new and original?",
        "Yes. Unless a product is clearly marked as refurbished, everything we sell is brand new and sourced from authorised suppliers.",
      ],
      [
        "What warranty applies?",
        "Each product page shows the warranty that applies. Keep your receipt, and contact us if you need to make a claim.",
      ],
      ["How long does delivery take?", "Most orders arrive within 2–4 working days, depending on where you are. You will see delivery options and costs at checkout."],
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
      body: "Our furniture is made by skilled craftspeople using solid wood and durable fabrics, finished by hand and built for everyday family life.",
      art: "hammer",
    },
    features: {
      eyebrow: "Shopping with us",
      title: "Buy with confidence",
      items: [
        ["Exact dimensions", "Measurements listed for every piece."],
        ["Material details", "Know exactly what you’re buying."],
        ["Delivery options", "Scheduled delivery, with assembly available."],
      ],
    },
    steps: {
      eyebrow: "Delivery",
      title: "From order to your home",
      items: [
        ["Choose", "Check dimensions against your space."],
        ["Order", "Checkout securely online."],
        ["Delivery", "We agree a delivery date with you and can assemble on arrival."],
      ],
    },
    faqs: [
      [
        "Do you deliver and assemble?",
        "Yes. We deliver within our city and to selected locations beyond, and our team can assemble your furniture on the day.",
      ],
      ["Can I customise a piece?", "Many pieces can be made in a different size, finish or fabric. Contact us with what you have in mind."],
      [
        "What if an item arrives damaged?",
        "Check your order on delivery and tell us straight away if anything is damaged. We will repair or replace it at no cost to you.",
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
      body: "We are an independent bookshop for curious readers of every age, with a carefully chosen range of fiction, non-fiction, children’s books and African writing.",
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
        ["Delivery", "Fast delivery to your door."],
      ],
    },
    faqs: [
      ["Can you order a book you don’t stock?", "Yes. Send us the title and author and we will tell you when we can get it."],
      ["How long does delivery take?", "Most orders arrive within 2–4 working days, depending on where you are. You will see delivery options and costs at checkout."],
      ["Do you supply schools?", "Yes. We supply schools, libraries and organisations. Send us your list for a quotation."],
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
        ["Ask about delivery", "/contact"],
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
      body: "We are a neighbourhood grocer with fresh produce, pantry staples and household essentials, picked and packed with care. Order online and choose delivery or collection.",
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
        ["Receive your order", "Delivered to your door, often on the same day."],
      ],
    },
    faqs: [
      ["Where do you deliver?", "We deliver to nearby neighbourhoods. You will see the areas we cover and their delivery fees at checkout."],
      ["Is there a minimum order?", "There is no minimum order for collection. Delivery orders may have a small minimum, shown at checkout."],
      [
        "How do you handle fresh items?",
        "We pick fresh items on the day of delivery. If something is unavailable, we will only substitute a similar item with your agreement.",
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
      body: "We are a family-run store with a well-chosen range of everyday essentials and gifts, fair prices and friendly service, in store and online.",
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
        ["Delivery", "Fast delivery to your door."],
      ],
    },
    faqs: [
      ["How long does delivery take?", "Most orders arrive within 2–4 working days, depending on where you are. You will see delivery options and costs at checkout."],
      ["Can I return an item?", "Unopened products can be returned within the period set out in our refund policy. For hygiene reasons, opened products can only be returned if they are faulty."],
      [
        "Which payment methods do you accept?",
        "You can pay online by card, bank transfer or USSD through our secure checkout, and in store by card or transfer.",
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
  build: "construction",
  haven: "hospitality",
  horizon: "general",
  atelier: "fashion",
  glow: "beauty",
  catalogue: "electronics",
  essentials: "food",
};

/** A complete, self-contained sample site for public template previews.
 * Internal links become on-page anchors because previews have no inner
 * pages; business details are clearly fictitious. */
const pageSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Sample articles for template previews, drawn from the kit's own offers. */
export function sampleArticles(kit: IndustryKit) {
  const offers = kit.sections.find((s) => s.id === "services")?.items || [];
  return offers.slice(0, 3).map((item, i) => ({
    slug: pageSlug(`guide-${item.title}`),
    title: [
      `What to know before choosing ${item.title.toLowerCase()}`,
      `${item.title}: common questions, answered`,
      `How we approach ${item.title.toLowerCase()}`,
    ][i % 3],
    category: ["Guides", "Advice", "Updates"][i % 3],
    image: kit === industryKits.general ? `/samples/general-insight-${["planning", "operations", "projects"][i]}-photo.webp` : item.image,
    excerpt: item.text || kit.description,
    body: `<p>${item.text || kit.description}</p><h2>Start with what matters to you</h2><p>This is sample article content for a template preview. On your website, articles are written and published by your team from your workspace.</p><h2>Questions to ask</h2><ul><li>What is included, and what is not?</li><li>How long does it usually take?</li><li>What will you need from me?</li></ul><p>Contact the business to discuss your needs.</p>`,
  }));
}

/**
 * A complete sample site for public template previews. Business details are
 * clearly fictitious. With `base`, links point to real preview pages
 * (`${base}/about`, `${base}/legal/privacy`…); without it they become
 * on-page anchors for single-page thumbnails.
 */
export function previewSite(
  industry: string,
  category: "corporate" | "commerce",
  business: { name: string },
  opts?: { base: string; pages: string[] },
) {
  const kit = kitFor(industry, category);
  const pages = opts?.pages || [];
  const findPage = (href: string) =>
    pages.find((p) => href === "/" + pageSlug(p)) ||
    pages.find((p) => new RegExp(pageSlug(p).split("-")[0]).test(href));
  const to = (href: string) => {
    if (!href.startsWith("/")) return href;
    if (opts) {
      if (href === "/") return "/";
      const page = /contact/.test(href) ? "Contact" : findPage(href);
      return page ? `/${pageSlug(page)}` : "/#services";
    }
    return /contact/.test(href)
      ? "#contact"
      : /about/.test(href)
        ? "#about"
        : "#services";
  };
  const services = kit.sections.find((s) => s.id === "services");
  const sections = kit.sections.map((s) => ({
    ...s,
    ctas: s.ctas?.map((c) => ({ ...c, href: to(c.href) })),
    items: s.items?.map((i) => (i.href ? { ...i, href: to(i.href) } : i)),
  }));
  const servicesPage = pages.find((p) =>
    /services|solutions|practice|rooms|properties|programmes/i.test(p),
  );
  const navigation: NonNullable<Brand["navigation"]> = opts
    ? [
        { label: "Home", href: "/", footer: false },
        ...pages
          .filter((p) => p !== "Contact")
          .map((p) => ({
            label: p,
            href: `/${pageSlug(p)}`,
            footer: false,
            ...(p === servicesPage && services?.items?.length
              ? {
                  children: services.items.slice(0, 4).map((i) => ({
                    label: i.title,
                    href: `/${pageSlug(p)}`,
                  })),
                }
              : {}),
          })),
        ...(category === "commerce"
          ? []
          : [{ label: "Insights", href: "/insights", footer: false }]),
        { label: "Contact", href: "/contact", footer: false },
      ]
    : [
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
      ];
  const brand: Brand = {
    name: business.name,
    description: kit.description,
    ...kit.palette,
    email: "hello@example.com",
    categoryUrls: false,
    logo: "",
    navCta: { label: kit.navCta.label, href: to(kit.navCta.href) },
    socials: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      x: "https://x.com/",
      whatsapp: "https://wa.me/",
    },
    navigation,
  };
  return {
    kit,
    data: { template: kit.template, brand, sections },
    contact: {
      phone: "+234 800 000 0000",
      address: "12 Sample Street, Lagos",
      hours: "Monday to Friday, 8am – 6pm",
    },
    legal: legalSetFor(industry, category).map((type) => ({
      type,
      title: policies[type].title,
      href: opts ? `${opts.base}/legal/${policies[type].slug}` : "#",
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
      sample: true,
      visible: true,
    }));
  const key = title.toLowerCase();
  const offers = pick("services");
  const offerItems = offers?.items || [];
  const section = (
    id: string,
    type: Section["type"],
    parts: Partial<Section> & { title: string },
  ): Section => ({
    id,
    type,
    body: "",
    visible: true,
    sample: true,
    items: undefined,
    ...parts,
  });
  const cta = (title: string, body: string, label: string, href = "/contact") =>
    section("cta", "cta", { title, body, ctas: [{ label, href }] });
  const faq = (id: string, pairs: [string, string][]) =>
    section(id, "faq", {
      eyebrow: "Questions",
      title: "Questions we are often asked",
      faqs: pairs.map(([question, answer]) => ({ question, answer })),
    });
  const people = () =>
    pick("team") ||
    section("team", "team", {
      eyebrow: "Our people",
      title: "The team you will work with",
      body: "The people you will deal with, with their roles and areas of responsibility.",
      items: [
        {
          title: "Team lead",
          text: "Leads client relationships and oversees every piece of work.",
        },
        {
          title: "Specialist",
          text: "Looks after the detail and keeps work on schedule.",
        },
        {
          title: "Client support",
          text: "Your first point of contact for questions and updates.",
        },
      ],
    });
  const work = (title: string) =>
    pick("gallery") ||
    section("gallery", "gallery", {
      eyebrow: title,
      title: "Selected work",
      body: "A few recent projects, shared with our clients’ permission.",
      items: offerItems
        .slice(0, 6)
        .map((i) => ({
          title: i.title,
          text: "A recent project, shared with permission.",
          image: i.image,
          imageAlt: i.imageAlt,
        })),
    });

  if (key === "contact") return fresh([pick("contact"), pick("faq")]);
  if (key === "about")
    return fresh([
      pick("about"),
      pick("features"),
      pick("team") || pick("gallery"),
      pick("cta"),
    ]);
  if (key === "faq") {
    // The page heading already says "Frequently asked questions".
    const faq = pick("faq");
    return fresh([faq && { ...faq, eyebrow: "", title: "Common questions" }, pick("cta")]);
  }
  if (
    offers &&
    (key === (offers.eyebrow || "").toLowerCase() ||
      [
        "services",
        "solutions",
        "practice areas",
        "medical services",
        "programmes",
        "properties",
      ].includes(key))
  )
    return fresh([
      { ...offers, eyebrow: "", title: offers.title, ctas: undefined },
      pick("steps"),
      pick("faq"),
      pick("cta"),
    ]);
  if (["portfolio", "projects", "gallery"].includes(key))
    return fresh([
      work(title),
      pick("steps"),
      cta(
        "Have a project in mind?",
        "Tell us what you are planning and we will get back to you with next steps.",
        "Start a conversation",
      ),
    ]);
  if (["team", "people", "faculty", "professionals"].includes(key))
    return fresh([
      people(),
      section("values", "features", {
        eyebrow: "How we work",
        title: "What you can expect from us",
        items: [
          {
            title: "Clear communication",
            text: "You always know who is handling your matter and what happens next.",
          },
          {
            title: "Straightforward advice",
            text: "We explain your options in plain language, including costs.",
          },
          {
            title: "Care in the detail",
            text: "Work is reviewed before it reaches you.",
          },
        ],
      }),
      cta(
        "Speak with our team",
        "Tell us what you need and the right person will get in touch.",
        "Contact us",
      ),
    ]);
  if (key === "admissions")
    return fresh([
      section("admissions-intro", "text", {
        eyebrow: "Admissions",
        title: "Joining us",
        body: "<p>We welcome applications throughout the year. Visiting us is the best way to see how we teach and to ask questions about your child’s needs.</p><p>Places are offered across our classes when spaces are available, and new pupils join after a short, friendly assessment.</p>",
      }),
      section("admissions-steps", "steps", {
        eyebrow: "How to apply",
        title: "The admissions process",
        items: [
          {
            title: "Enquire",
            text: "Contact us or complete the enquiry form.",
          },
          { title: "Visit", text: "Book a tour and meet our staff." },
          {
            title: "Apply",
            text: "Submit the application form and required documents.",
          },
          {
            title: "Assessment",
            text: "Your child meets us for a friendly assessment, where applicable.",
          },
          {
            title: "Offer",
            text: "We confirm a place and share the next steps.",
          },
        ],
      }),
      section("admissions-documents", "text", {
        eyebrow: "Documents",
        title: "What to bring",
        body: "<ul><li>Birth certificate or passport</li><li>Recent school report, where applicable</li><li>Passport photographs</li><li>Immunisation record</li></ul><p>Update this list to match your requirements.</p>",
      }),
      faq("admissions-faq", [
        ["When can we apply?", "Applications for the new session open each spring, and we consider applications during the year when spaces are available."],
        [
          "Is there an entrance assessment?",
          "New pupils take a short, friendly assessment so that we can place them in the right class and plan any support they need.",
        ],
        [
          "How are fees paid?",
          "Fees are paid termly by bank transfer. Contact the school office for the current fee schedule.",
        ],
      ]),
      cta(
        "Book a school visit",
        "See our classrooms and meet the team.",
        "Arrange a visit",
      ),
    ]);
  if (key === "impact")
    return fresh([
      section("impact-intro", "text", {
        eyebrow: "Impact",
        title: "The difference your support makes",
        body: "<p>Our programmes help young people, families and small businesses gain skills, confidence and support close to home. We track what each programme delivers and share what we learn with our supporters.</p>",
      }),
      section("impact-areas", "features", {
        eyebrow: "Where we focus",
        title: "Our areas of work",
        items: offerItems
          .slice(0, 3)
          .map((i) => ({ title: i.title, text: i.text || "" })),
      }),
      work("Impact"),
      section("impact-reports", "text", {
        eyebrow: "Accountability",
        title: "Reports and accounts",
        body: "<p>We publish yearly reports and accounts so supporters can see exactly how funds are used. Contact us for copies of past reports.</p>",
      }),
      cta(
        "Support our work",
        "Find out how you can give, volunteer or partner with us.",
        "Get involved",
      ),
    ]);
  if (key === "rooms" || key === "rooms & facilities")
    return fresh([
      section("rooms", "services", {
        eyebrow: "Rooms",
        title: "Rooms and suites",
        body: "Choose the room that suits your stay, from a comfortable standard room to a spacious suite.",
        items: [
          {
            title: "Standard room",
            text: "Comfortable room with a queen bed, air conditioning, Wi-Fi and a work desk.",
            image: offerItems[0]?.image,
            imageAlt: offerItems[0]?.imageAlt,
          },
          {
            title: "Deluxe room",
            text: "More space, a king bed and a seating area for longer stays.",
            image: offerItems[1]?.image,
            imageAlt: offerItems[1]?.imageAlt,
          },
          {
            title: "Executive suite",
            text: "A separate lounge, generous storage and room to work or unwind.",
            image: offerItems[2]?.image,
            imageAlt: offerItems[2]?.imageAlt,
          },
        ],
      }),
      section("amenities", "features", {
        eyebrow: "In every room",
        title: "Amenities",
        items: [
          {
            title: "Reliable power",
            text: "Uninterrupted power, with backup when it is needed.",
          },
          { title: "Wi-Fi", text: "Free wireless internet throughout." },
          {
            title: "Breakfast",
            text: "A fresh breakfast served every morning.",
          },
          { title: "Security", text: "Round-the-clock security and secure parking." },
        ],
      }),
      faq("rooms-faq", [
        [
          "What are check-in and check-out times?",
          "Check-in is from 2pm and check-out is by 12 noon. Ask us about early arrival or late departure.",
        ],
        [
          "Can I cancel a booking?",
          "Most bookings can be cancelled free of charge up to 48 hours before arrival. See our booking policy for full terms.",
        ],
        [
          "Do you have parking?",
          "Yes. Secure parking is available for guests at no extra charge.",
        ],
      ]),
      cta(
        "Plan your stay",
        "Send your dates and we will confirm availability and rates.",
        "Request a booking",
      ),
    ]);
  if (key === "coverage")
    return fresh([
      section("coverage-intro", "text", {
        eyebrow: "Coverage",
        title: "Where we deliver",
        body: "<p>We deliver across our home city every day and run scheduled routes to other major cities each week. Tell us your destination and we will confirm the next available collection.</p>",
      }),
      section("coverage-areas", "features", {
        eyebrow: "Service areas",
        title: "Areas we cover",
        items: [
          {
            title: "Lagos",
            text: "Same-day and next-day delivery across the mainland and island.",
          },
          { title: "Abuja", text: "Scheduled deliveries within the FCT." },
          {
            title: "Port Harcourt",
            text: "Regular runs within the city and nearby.",
          },
          {
            title: "Other states",
            text: "Interstate delivery through our partner network.",
          },
        ],
      }),
      pick("steps"),
      cta(
        "Need a delivery quote?",
        "Share pickup and drop-off locations and what you are sending.",
        "Get a quote",
      ),
    ]);
  const guide = (
    heading: string,
    intro: string,
    table: string,
    tips: [string, string][],
    questions: [string, string][],
  ) =>
    fresh([
      section("guide-intro", "text", {
        eyebrow: title,
        title: heading,
        body: `<p>${intro}</p>${table}`,
      }),
      section("guide-tips", "steps", {
        eyebrow: "Step by step",
        title: "How to choose",
        items: tips.map(([t, text]) => ({ title: t, text })),
      }),
      faq("guide-faq", questions),
      cta(
        "Still not sure?",
        "Send us a message and we will help you choose.",
        "Ask us",
      ),
    ]);
  if (key === "size guide")
    return guide(
      "Find your size",
      "Measurements are in centimetres. If you are between sizes, choose the larger size for a relaxed fit.",
      "<table><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Hips</th></tr></thead><tbody><tr><td>S</td><td>86–91</td><td>71–76</td><td>89–94</td></tr><tr><td>M</td><td>94–99</td><td>79–84</td><td>97–102</td></tr><tr><td>L</td><td>102–107</td><td>86–91</td><td>104–109</td></tr><tr><td>XL</td><td>109–114</td><td>94–99</td><td>112–117</td></tr></tbody></table>",
      [
        [
          "Measure your chest",
          "Measure around the fullest part, keeping the tape level.",
        ],
        ["Measure your waist", "Measure around your natural waistline."],
        [
          "Compare with the chart",
          "Match your measurements to the size chart above.",
        ],
      ],
      [
        [
          "What if it doesn’t fit?",
          "Send it back unworn with the tags attached and we will exchange it or refund you, as set out in our refund policy.",
        ],
        [
          "Do sizes run small?",
          "Our pieces are true to size. Where a style fits differently, we say so on the product page.",
        ],
      ],
    );
  if (key === "measurements")
    return guide(
      "Measuring for furniture",
      "Check the space and the route into your home before you order. Product dimensions are listed on each product page.",
      "<table><thead><tr><th>Item</th><th>Allow around it</th></tr></thead><tbody><tr><td>Sofa</td><td>60 cm walkway in front</td></tr><tr><td>Dining table</td><td>90 cm behind each chair</td></tr><tr><td>Bed</td><td>60 cm on each side</td></tr></tbody></table>",
      [
        ["Measure the space", "Note the width, depth and height available."],
        [
          "Measure the way in",
          "Check doorways, stairs and corridors on the delivery route.",
        ],
        ["Compare with the product", "Use the dimensions on the product page."],
      ],
      [
        [
          "Do you assemble on delivery?",
          "Assembly can be added at checkout, and our team will set everything up on delivery.",
        ],
        [
          "Can I return large items?",
          "Large items can be returned in their original condition. We arrange collection, and our refund policy explains any charges.",
        ],
      ],
    );
  if (key === "buying guide")
    return guide(
      "Choosing the right device",
      "Not sure what to buy? These pointers will help you compare options with confidence.",
      "",
      [
        [
          "Decide what you need it for",
          "Everyday use, work, gaming or study all call for different specifications.",
        ],
        [
          "Check the essentials",
          "Compare storage, memory, battery life and screen size.",
        ],
        [
          "Confirm the warranty",
          "Look at the warranty period and what it covers.",
        ],
      ],
      [
        [
          "Are your products genuine?",
          "Yes. We buy only from manufacturers and authorised distributors, and every product is brand new unless clearly marked otherwise.",
        ],
        [
          "What warranty do you offer?",
          "Warranty periods are shown on each product page. Keep your receipt, and contact us to start a claim.",
        ],
      ],
    );
  if (key === "product guide")
    return guide(
      "Finding the right products for you",
      "Every skin and hair type is different. Use this guide to narrow down your options, and check the ingredient list on each product page.",
      "",
      [
        [
          "Know your skin or hair type",
          "Dry, oily, combination or sensitive — each responds differently.",
        ],
        ["Start simple", "Introduce one new product at a time."],
        [
          "Patch test first",
          "Try a small amount on your skin before full use.",
        ],
      ],
      [
        [
          "Are your products suitable for sensitive skin?",
          "Products suited to sensitive skin are marked on their product pages. We always recommend a patch test before first use.",
        ],
        [
          "Are your products original?",
          "Yes. We buy directly from brands and their authorised distributors.",
        ],
      ],
    );
  if (key === "facilities")
    return fresh([
      section("facilities", "features", {
        eyebrow: "Facilities",
        title: "Our facilities",
        body: "Modern spaces and equipment, designed around the people who use them.",
        items: offerItems
          .slice(0, 4)
          .map((i) => ({ title: i.title, text: i.text || "" })),
      }),
      work("Facilities"),
      cta(
        "Arrange a visit",
        "See our facilities in person and ask any questions.",
        "Book a visit",
      ),
    ]);
  return fresh([
    section("intro", "text", {
      eyebrow: title,
      title,
      body: `<p>Introduce this page in a sentence or two, then add the details visitors need about ${title.toLowerCase()}.</p>`,
    }),
    pick("cta"),
  ]);
}
