/**
 * Content for the Omnyvox marketing pages. Facts here must match the
 * product: plan limits come from lib/model.ts, and nothing is promised that
 * the platform does not do today.
 */
export type MarketingPage = {
  title: string;
  description: string;
  sections: { title: string; body: string; points?: string[] }[];
  /** Related pages, shown as cards under the content. */
  links?: { href: string; label: string; text: string }[];
  cta?: { title: string; body: string; primary: [string, string]; secondary?: [string, string] };
};

const startCta: MarketingPage["cta"] = {
  title: "Ready when you are.",
  body: "Pick a template, add your details and preview your website before you pay for anything.",
  primary: ["Start your website", "/register"],
  secondary: ["Compare plans", "/pricing"],
};

export const marketingPages: Record<string, MarketingPage> = {
  "corporate-websites": {
    title: "A professional website for your business.",
    description:
      "For firms, clinics, schools, studios and companies that win work through trust. Show what you do, prove you are real and make it easy to get in touch.",
    sections: [
      {
        title: "Made for your kind of business",
        body: "Tell us your industry and your website starts with the right pages already in place, written in a sensible first draft you can rewrite in your own words.",
        points: [
          "Law firms get practice areas and people profiles",
          "Clinics get medical services and facilities",
          "Schools get programmes and admissions",
          "Builders, solar and logistics firms get projects, solutions and coverage",
        ],
      },
      {
        title: "Your brand, not a generic look",
        body: "Choose from six business templates, each with its own design style. Add your logo, colours, photos and wording; every page adapts to phones automatically.",
      },
      {
        title: "Enquiries you won’t miss",
        body: "Visitors contact you through a form with spam protection and a clear consent checkbox. Messages go to the email address you verify and are kept in your workspace too, so your inbox is never the only copy.",
      },
      {
        title: "Trust built in",
        body: "Every business is verified with its CAC registration before its website goes live, and your registration number appears in your website footer, a small detail customers notice. Industry-appropriate privacy, cookie and terms pages come as drafts for you to complete.",
      },
    ],
    links: [
      { href: "/templates?type=corporate", label: "Business templates", text: "Six designs for different industries." },
      { href: "/features/insights", label: "Insights & blogging", text: "Publish articles with author profiles." },
      { href: "/features/domains", label: "Your own domain", text: "Use your .com.ng or .com address." },
    ],
    cta: startCta,
  },
  "ecommerce-websites": {
    title: "An online store that feels like your brand.",
    description:
      "Sell to customers across Nigeria with your own storefront, secure Paystack checkout, delivery and pickup options, and orders in one place.",
    sections: [
      {
        title: "Products shown properly",
        body: "Add photos, descriptions and prices, group products into categories and let customers search and sort your catalogue.",
        points: [
          "Options such as size and colour, each with its own stock, price and SKU",
          "A clear stock status so customers know what is available",
          "Product pages that search engines understand",
        ],
      },
      {
        title: "A checkout customers trust",
        body: "Customers add items to a cart that remembers them, choose delivery or pickup and pay through Paystack. Payments go straight to your own Paystack account; Omnyvox adds no commission.",
      },
      {
        title: "Delivery your way",
        body: "Set a fee for each area you deliver to, add pickup locations with opening hours, or run collection only. The fee is calculated for the customer at checkout.",
      },
      {
        title: "Orders without the spreadsheets",
        body: "See every order with the items, options, delivery method and customer note. Move orders from processing to delivered, and we flag any payment that needs a second look.",
      },
    ],
    links: [
      { href: "/templates?type=ecommerce", label: "Store templates", text: "Four designs for different kinds of shops." },
      { href: "/features/ecommerce", label: "Store features", text: "Everything included for selling online." },
      { href: "/pricing/ecommerce", label: "Store plans", text: "Compare product allowances and features." },
    ],
    cta: { ...startCta!, title: "Open your store." },
  },
  features: {
    title: "Everything you need to run your website.",
    description:
      "Editing, publishing, selling, blogging and customer enquiries, all in one workspace that only shows the tools your business actually uses.",
    sections: [
      {
        title: "Edit without breaking anything",
        body: "Change text, photos, buttons and whole sections in a guided editor. Homepage and brand edits save automatically, and nothing goes live until you publish.",
      },
      {
        title: "Built to be found",
        body: "Clean page addresses, search titles and descriptions, social sharing images, a sitemap and structured data come as standard.",
      },
      {
        title: "A workspace that fits your business",
        body: "A business website never shows store tools, and a store never shows tools it doesn’t need. Features from a higher plan are clearly labelled rather than hidden away.",
      },
      {
        title: "Your team, your rules",
        body: "Invite colleagues as administrators, editors or, for stores, store managers. Each role only sees what it is allowed to change.",
      },
    ],
    links: [
      { href: "/features/website-editor", label: "Website editor", text: "Sections, rich text, autosave and previews." },
      { href: "/features/ecommerce", label: "Online store", text: "Products, cart, checkout and delivery." },
      { href: "/features/insights", label: "Insights & blogging", text: "Articles, categories and author profiles." },
      { href: "/features/seo", label: "SEO", text: "Search-friendly pages from day one." },
      { href: "/features/domains", label: "Domains", text: "Connect your own web address." },
      { href: "/features/integrations", label: "Integrations", text: "Payments, WhatsApp and social profiles." },
      { href: "/features/ai-content-setup", label: "Writing assistant", text: "Optional help with a first draft." },
      { href: "/security", label: "Security & privacy", text: "How we protect your business and customers." },
    ],
    cta: startCta,
  },
  "features/website-editor": {
    title: "Edit your website with confidence.",
    description: "A guided editor keeps your design consistent while you make every word and photo your own.",
    sections: [
      {
        title: "Sections that just work",
        body: "Build pages from ready-made sections: banners, services, highlights, process steps, team, gallery, FAQs, calls to action and contact details. Reorder or hide them in a click.",
      },
      {
        title: "Writing made simple",
        body: "The rich text editor covers headings, lists, links, tables, quotes, images with descriptions and, on Growth and Advanced, embedded YouTube or Cloudinary videos.",
      },
      {
        title: "Your work is always saved",
        body: "Homepage and brand edits save a few seconds after you stop typing, with a copy kept on your device until it is safely stored. If someone else saves at the same time, you choose which version to keep.",
      },
      {
        title: "Preview, then publish",
        body: "See your pages at phone, tablet and desktop sizes before they go live. Advanced keeps a history of earlier versions you can restore.",
      },
    ],
    cta: startCta,
  },
  "features/insights": {
    title: "Share what you know.",
    description: "Publish articles that answer your customers’ questions and show your expertise, on Growth and Advanced.",
    sections: [
      {
        title: "A proper home for your articles",
        body: "Your Insights page lists every article with its category, date and author, and visitors can filter by the categories you create.",
      },
      {
        title: "Always fresh on your homepage",
        body: "Your three newest articles appear on your homepage automatically, so returning visitors always see something new.",
      },
      {
        title: "Real people behind the words",
        body: "Add author profiles with a photo, role and short biography. Each article shows an About the author card and links to the author’s page.",
        points: [
          "Growth: up to 3 author profiles",
          "Advanced: up to 25 profiles, with website, LinkedIn and X links",
        ],
      },
      {
        title: "FAQ pages that stand out in search",
        body: "On Advanced, add a dedicated FAQ page. We mark it up so search engines can understand your questions and answers.",
      },
    ],
    cta: startCta,
  },
  "features/ai-content-setup": {
    title: "A helping hand with the first draft.",
    description: "Optional writing help that starts from the facts you confirm about your business and leaves every decision to you.",
    sections: [
      {
        title: "Private by design",
        body: "The assistant runs on Omnyvox’s own servers, not a third-party AI service, and is switched on by our team once it is ready for your account.",
      },
      {
        title: "You stay in charge",
        body: "Ask for a homepage headline, an introduction or an About section. Read it, change it or discard it. Nothing is published until you choose to publish.",
      },
      {
        title: "Never a dependency",
        body: "Your website, forms and checkout work the same whether or not the assistant is available.",
      },
    ],
  },
  "features/domains": {
    title: "Give your business its own address.",
    description: "Every website starts on a free Omnyvox address. On Growth and Advanced, connect a domain you own.",
    sections: [
      {
        title: "Connect in a few steps",
        body: "Add your domain, copy the records we show you into your domain provider’s settings and we confirm when it’s verified. Our team then switches it on with a secure certificate.",
      },
      {
        title: "Your domain stays yours",
        body: "You buy and renew your domain with a registrar of your choice, so it stays in your name whatever happens. Contact us if you would like help choosing or setting one up.",
      },
    ],
  },
  "features/seo": {
    title: "Help customers find you.",
    description: "Search-friendly structure comes as standard, with the controls you need for each page.",
    sections: [
      {
        title: "Control every page",
        body: "Set the search title, description and sharing image for each page, product and article, and choose whether a page should appear in search results.",
      },
      {
        title: "The technical parts, done for you",
        body: "Published pages appear in your sitemap automatically, with clean addresses and structured data that describes your business, products, articles and breadcrumbs.",
      },
      {
        title: "Local businesses, found locally",
        body: "Add your address and opening hours once and we describe your business as a local business to search engines. On Advanced, FAQ pages get FAQ markup too.",
      },
    ],
  },
  "features/ecommerce": {
    title: "From product page to paid order.",
    description: "Everything a growing shop needs to sell online, without plugins or extra fees.",
    sections: [
      {
        title: "Catalogue",
        body: "Products with photos, descriptions, categories and prices.",
        points: ["Up to 3 options per product, such as size and colour", "Each combination has its own SKU, stock, price and photo", "Sold-out combinations are clearly marked"],
      },
      {
        title: "Cart and checkout",
        body: "A cart that remembers items between visits and syncs across tabs, and a checkout with clear totals, delivery or pickup and your store policies linked.",
      },
      {
        title: "Delivery and pickup",
        body: "Delivery areas with their own fees and delivery times, pickup locations with hours and instructions, or collection only.",
      },
      {
        title: "Payments and orders",
        body: "Payments go to your own Paystack account and are confirmed automatically. Stock is held while a customer pays and released if they don’t. Any payment that can’t be confirmed is flagged for you to review.",
      },
    ],
    cta: { ...startCta!, title: "Start selling." },
  },
  "features/integrations": {
    title: "Connected where it counts.",
    description: "The connections your customers expect, set up in minutes.",
    sections: [
      {
        title: "Payments",
        body: "Connect your Paystack account to take payments in your store using the methods Paystack offers, such as card, bank transfer and USSD.",
      },
      {
        title: "Conversations",
        body: "Add WhatsApp click-to-chat and link your Instagram, Facebook, LinkedIn, X, TikTok and YouTube profiles.",
      },
      {
        title: "Need something else?",
        body: "Tell us about the analytics, logistics or other tools you use. We’ll let you know honestly whether we can connect them and what that would involve.",
      },
    ],
  },
  "how-it-works": {
    title: "From sign-up to published in three steps.",
    description: "No code, no guesswork. Here’s what happens between creating your account and going live.",
    sections: [
      {
        title: "1. Create your account and verify your business",
        body: "Confirm your email, then enter your CAC registration number. We look up your registered business name automatically; you just confirm it’s you. This is needed before your website can go live.",
      },
      {
        title: "2. Choose a template and make it yours",
        body: "Pick your industry and a template. Your website arrives with the right pages and starter wording. Replace it with your own words, photos and products.",
      },
      {
        title: "3. Review and publish",
        body: "Preview on phone and desktop, work through the short checklist (real content, reviewed policies, a verified enquiry inbox), choose your plan and publish.",
      },
    ],
    cta: startCta,
  },
  "website-setup": {
    title: "Set it up yourself, or let us help.",
    description: "Most businesses are ready in an afternoon. If you’d rather hand it over, we can do it for you.",
    sections: [
      {
        title: "Do it yourself",
        body: "The editor guides you through each page, and a checklist shows what still needs attention before you publish. Your draft is saved as you go, so you can come back any time.",
      },
      {
        title: "Done for you",
        body: "Send us your content, photos and product list and our team will set up your website. We agree the scope, price and timeline with you before any work starts. Setup is a one-off service, separate from your subscription.",
      },
    ],
    cta: { title: "Want a hand?", body: "Tell us what you need and we’ll reply with a clear quote.", primary: ["Request setup help", "/contact"], secondary: ["Start on your own", "/register"] },
  },
  "professional-services": {
    title: "Expert help when you need it.",
    description: "Setup, content writing, product uploads and moving from another website, with the scope and price agreed up front.",
    sections: [
      {
        title: "What we can help with",
        body: "",
        points: ["Setting up your pages and branding", "Writing or polishing your website copy", "Uploading your product catalogue and photos", "Moving your content from an old website"],
      },
      {
        title: "How it works",
        body: "Tell us the result you want. We confirm what’s included, what we need from you, the fee and the timeline before we start, and you approve the work before it goes live.",
      },
      {
        title: "Your plan stays the same",
        body: "Buying a service doesn’t change your subscription or unlock features from another plan.",
      },
    ],
    links: [{ href: "/professional-services/migration", label: "Moving from another website", text: "Bring your pages, products and links with you." }],
    cta: { title: "Tell us about your project.", body: "We aim to reply within one working day.", primary: ["Contact us", "/contact"] },
  },
  "professional-services/migration": {
    title: "Moving from another website?",
    description: "We’ll help you bring your content across and keep the links people already use.",
    sections: [
      {
        title: "Start with a list",
        body: "Note the pages, articles, products, images and domain you want to keep, and any links that matter, such as pages shared on social media or printed on flyers.",
      },
      {
        title: "Agree the plan",
        body: "We check what moves across cleanly, what fits your plan’s allowances and which old links should redirect to new pages. Keep your old website running until the new one is live.",
      },
    ],
    cta: { title: "Plan your move.", body: "Share your current website address and we’ll take a look.", primary: ["Contact us", "/contact"] },
  },
  about: {
    title: "Websites for businesses doing real work.",
    description: "Omnyvox is built by Nexoris Technologies Ltd to give Nigerian businesses a professional website without the cost and hassle of a custom build.",
    sections: [
      {
        title: "Why we built Omnyvox",
        body: "Too many good businesses rely on a social media page or an outdated website because a proper one felt expensive, slow or complicated. We think every registered business deserves a website it’s proud to share.",
      },
      {
        title: "What we believe",
        body: "",
        points: [
          "Verified businesses make the internet more trustworthy, so every business is checked against the CAC register before its website goes live",
          "Good design shouldn’t need a designer every time you change a word",
          "Your customers’ data deserves care, so we collect only what’s needed",
          "Prices and plan limits should be clear before you pay",
        ],
      },
      {
        title: "Who we are",
        body: "Omnyvox is a product of Nexoris Technologies Ltd, a Nigerian technology company. We’d love to hear what your business needs.",
      },
    ],
    cta: { title: "Say hello.", body: "Questions, ideas or partnerships: we read every message.", primary: ["Contact us", "/contact"], secondary: ["See templates", "/templates"] },
  },
  help: {
    title: "How can we help?",
    description: "Answers to the most common questions about setting up and running your website.",
    sections: [
      {
        title: "Before you publish",
        body: "Your website can go live once these are done:",
        points: ["Your email address is verified", "Your business is verified with its CAC registration number", "Sample text and photos are replaced with your own", "Your legal pages are completed and reviewed", "An enquiry inbox is verified", "Your subscription is active"],
      },
      {
        title: "If something isn’t available",
        body: "Some features belong to a higher plan, some need a setup step first, and occasionally a service is briefly unavailable. The message in your workspace tells you which. If you’re still stuck, contact us with your website name and what you were trying to do.",
      },
      {
        title: "Account security",
        body: "Turn on two-step verification in Account security. If you lose access to your email or authenticator, use Account recovery on the sign-in page.",
      },
    ],
    links: [
      { href: "/guides", label: "Launch checklist", text: "Make your website useful from day one." },
      { href: "/faq", label: "FAQs", text: "Quick answers about plans and setup." },
      { href: "/contact", label: "Contact support", text: "Talk to a person." },
    ],
  },
  guides: {
    title: "Make your website useful from day one.",
    description: "A short checklist for clear content and smooth customer journeys.",
    sections: [
      {
        title: "Write for your customer’s next step",
        body: "Say what you do, who it’s for and how to get started, in the first few lines. Finish every page with one clear action, such as book, call or buy.",
      },
      {
        title: "Use photos that are yours",
        body: "Real photos of your work, team and premises build trust faster than stock images. Add a short description to each one and check how it crops on a phone.",
      },
      {
        title: "Test the whole journey",
        body: "Click through your menu, inner pages, contact form and, for stores, a test order. A homepage on its own isn’t a complete website.",
      },
      {
        title: "Keep it current",
        body: "Update prices, hours and policies when they change, and publish an article when you have something useful to share.",
      },
    ],
    cta: startCta,
  },
  faq: {
    title: "Questions before you start?",
    description: "Quick answers about plans, setup and your website.",
    sections: [
      { title: "Do I need to know how to code?", body: "No. Everything is edited through a guided editor: text, photos, colours, sections and products." },
      { title: "Can I use my own logo and colours?", body: "Yes. Upload your logo and set your brand colours. We check colour contrast so your text stays readable." },
      { title: "How many websites can I have?", body: "Basic and Growth include one website. Advanced includes up to three under one subscription." },
      { title: "Why do you verify my business?", body: "Every website on Omnyvox belongs to a verified business, which keeps Omnyvox trustworthy for your customers. We look up your registered name automatically from your CAC number, and you can build and preview your website while it’s being checked." },
      { title: "Can I use my own domain?", body: "Yes, on Growth and Advanced. Every plan includes a free Omnyvox address." },
      { title: "Do you take a cut of my sales?", body: "No. Store payments go to your own Paystack account. Paystack’s standard fees apply." },
      { title: "Can I change plans later?", body: "Yes. Upgrades apply straight away, and you only pay the difference for the rest of your billing period. Downgrades apply at the end of the period you’ve paid for." },
      { title: "Does the writing assistant need to be on?", body: "No. It’s optional. Your website, forms and checkout work the same without it." },
    ],
    links: [{ href: "/pricing", label: "Pricing", text: "Plans and billing questions." }, { href: "/help", label: "Help centre", text: "Setup and troubleshooting." }],
  },
  security: {
    title: "Security and privacy, taken seriously.",
    description: "How we protect your account, your business and your customers’ information.",
    sections: [
      {
        title: "Your account",
        body: "",
        points: [
          "Passwords are stored using a strong one-way hash, never in plain text",
          "Two-step verification with an authenticator app, plus one-time recovery codes",
          "Staff accounts must use two-step verification to reach administration tools",
          "Sign-in sessions can be ended, and suspicious accounts can be locked by our team",
        ],
      },
      {
        title: "Payments",
        body: "Card details never touch Omnyvox. Store and subscription payments are handled by Paystack, and we keep only payment references and status.",
      },
      {
        title: "Your customers’ information",
        body: "Enquiries and orders are visible only to the website owner and the team members they choose. Forms ask for consent, and we collect only what’s needed to reply or fulfil an order. We use only essential cookies, with no advertising trackers.",
      },
      {
        title: "Verified businesses",
        body: "Every business is verified against the CAC register before its website goes live. This helps keep impersonation and fraud off the platform. Our Acceptable use policy sets out what isn’t allowed.",
      },
      {
        title: "Your rights",
        body: "We follow the Nigeria Data Protection Act. You can ask to see, correct or delete your information through our contact page.",
      },
    ],
    links: [
      { href: "/legal/privacy", label: "Privacy notice", text: "What we collect and why." },
      { href: "/legal/cookies", label: "Cookie policy", text: "The essential storage we use." },
      { href: "/legal/acceptable-use", label: "Acceptable use policy", text: "What isn’t allowed on Omnyvox." },
    ],
  },
};
