export const marketingPages: Record<
  string,
  {
    title: string;
    description: string;
    sections: { title: string; body: string }[];
  }
> = {
  "corporate-websites": {
    title: "A clear home for your business.",
    description:
      "Explain your work, share your expertise and make it easy for people to get in touch.",
    sections: [
      {
        title: "Built around your industry",
        body: "Choose your business type so the workspace shows relevant collections: practice areas for a law firm, programmes for a school, or projects for a construction business.",
      },
      {
        title: "Your content, your brand",
        body: "Edit pages, images, menus, contact details and approved colour choices. Save changes as a draft and review them before publishing.",
      },
      {
        title: "Enquiries with a proper home",
        body: "Verify the inbox you want to receive enquiries in. Submissions are also kept in your website workspace, so email is not your only copy.",
      },
    ],
  },
  "ecommerce-websites": {
    title: "Your products. Your online store.",
    description:
      "Build a store with your own identity and a direct route from product discovery to payment.",
    sections: [
      {
        title: "A catalogue customers can explore",
        body: "Organise real products by category, add descriptions and images, set prices and stock, and help customers search your range.",
      },
      {
        title: "Payments connected to your business",
        body: "Connect an approved merchant account for checkout. Customer purchases and your Omnyvox subscription use separate payment records.",
      },
      {
        title: "Start with the essentials",
        body: "Basic supports a product catalogue and guest checkout. Compare published product allowances and website features before choosing a plan. Configure your actual delivery and return policies before launch.",
      },
    ],
  },
  features: {
    title: "The tools behind your website.",
    description:
      "Manage content, branding and enquiries from one business workspace.",
    sections: [
      {
        title: "Website editor",
        body: "Use structured sections and a reusable rich text editor. Update images, text, links, FAQs and calls to action without editing code.",
      },
      {
        title: "Search and sharing",
        body: "Published pages include canonical addresses, metadata and appropriate structured data. Add your own search title, description and social image.",
      },
      {
        title: "A workspace that fits",
        body: "Industry-specific menus keep unrelated tools out of the way. Relevant features that require another plan are clearly labelled.",
      },
    ],
  },
  "features/website-editor": {
    title: "Edit your website with confidence.",
    description:
      "A guided editor keeps the layout consistent while you make the content your own.",
    sections: [
      {
        title: "Structure without guesswork",
        body: "Arrange up to 15 supported sections, choose approved layouts, add images and write clear calls to action.",
      },
      {
        title: "Draft, preview, publish",
        body: "Work on your draft, check the mobile preview and publish deliberately. Advanced includes content history for supported content types.",
      },
    ],
  },
  "features/ai-content-setup": {
    title: "A helping hand with the first draft.",
    description:
      "Optional writing assistance uses your confirmed business facts and leaves you in control.",
    sections: [
      {
        title: "Local and optional",
        body: "When enabled by Nexoris after server readiness checks, the assistant runs on the Omnyvox server. There is no hosted AI fallback. Manual editing is always available.",
      },
      {
        title: "Review every suggestion",
        body: "Request a homepage headline, introduction or About-section draft. Review facts and wording before accepting it. Acceptance changes a saved draft; it does not publish your website.",
      },
    ],
  },
  "features/domains": {
    title: "Give your business its own address.",
    description:
      "Start with an Omnyvox address, then connect a domain on an eligible plan.",
    sections: [
      {
        title: "Bring a domain you own",
        body: "Growth and Advanced support a custom domain. Follow the DNS instructions, verify ownership and complete activation with Nexoris.",
      },
      {
        title: "Clear ownership",
        body: "Domain registration and renewal are separate from the website subscription. Contact Nexoris if you need procurement or configuration assistance.",
      },
    ],
  },
  "features/seo": {
    title: "Make each page easier to understand.",
    description:
      "Search metadata and clear content structure are part of your website workflow.",
    sections: [
      {
        title: "Page-by-page control",
        body: "Set search titles, descriptions, image descriptions, indexing choices and social sharing images. Choose whether article URLs include their category.",
      },
      {
        title: "Built into publication",
        body: "Eligible published content appears in the sitemap. Organisation, article, product and breadcrumb markup describe the corresponding content; private previews are not intended for indexing.",
      },
    ],
  },
  "features/ecommerce": {
    title: "From product page to checkout.",
    description: "The core tools for a merchant-owned online store.",
    sections: [
      {
        title: "Know what you are selling",
        body: "Maintain product prices, descriptions, stock, images and useful details such as dimensions or materials.",
      },
      {
        title: "Keep orders together",
        body: "Guest checkout creates a store order, verifies the payment through the payment provider and tracks payment separately from fulfilment.",
      },
    ],
  },
  "features/integrations": {
    title: "Connect the essentials first.",
    description:
      "Use the connections currently supported by your website and plan.",
    sections: [
      {
        title: "Contact and payments",
        body: "Add social profile links, opt into WhatsApp click-to-chat, verify an enquiry recipient and connect an approved store payment account.",
      },
      {
        title: "Additional connections",
        body: "Speak with Nexoris about analytics, logistics or other integration requirements. Availability depends on a working supported connector, your plan and the agreed scope.",
      },
    ],
  },
  "how-it-works": {
    title: "From business details to a working website.",
    description: "Take the setup one clear step at a time.",
    sections: [
      {
        title: "1. Choose a starting point",
        body: "Select your website type, industry, plan and compatible template. Your workspace provisions relevant pages and policy drafts.",
      },
      {
        title: "2. Add what makes it yours",
        body: "Provide accurate business facts, your logo, images, text and products. Verify the enquiry inbox and review your policies.",
      },
      {
        title: "3. Review and publish",
        body: "Check desktop and mobile views, resolve the publication checklist, activate the subscription and publish. Store owners also complete merchant approval.",
      },
    ],
  },
  "website-setup": {
    title: "A little help getting online.",
    description:
      "Set up your website yourself or ask Nexoris to help with a defined scope.",
    sections: [
      {
        title: "Self-service setup",
        body: "Use the editor to add your business content and branding at your own pace. You can return to your saved draft whenever you need.",
      },
      {
        title: "Professional setup",
        body: "Share your pages, catalogue, images and requirements with Nexoris. Pricing, scope and delivery dates must be agreed before work begins; setup assistance is separate from your subscription.",
      },
    ],
  },
  "professional-services": {
    title: "Practical support for your website.",
    description:
      "Get help with setup, content preparation or an agreed customisation.",
    sections: [
      {
        title: "A clear scope",
        body: "Explain the outcome you need. Nexoris reviews the request and agrees the work, required assets, fees and approval process with you.",
      },
      {
        title: "Your subscription stays clear",
        body: "Buying setup assistance does not automatically change your plan or permanently unlock higher-plan capabilities.",
      },
    ],
  },
  "professional-services/migration": {
    title: "Bring your content with you.",
    description:
      "Discuss a planned move from your existing website to Omnyvox.",
    sections: [
      {
        title: "Start with an inventory",
        body: "List the pages, articles, products, media, domains and important existing links you need to preserve.",
      },
      {
        title: "Agree the migration plan",
        body: "Nexoris reviews compatibility, content allowances, redirects and launch requirements before confirming scope. Keep backups of your original website throughout the move.",
      },
    ],
  },
  about: {
    title: "Websites for businesses doing real work.",
    description:
      "Omnyvox is a website service operated by Nexoris Technologies Ltd.",
    sections: [
      {
        title: "One platform, your identity",
        body: "We are building a shared platform that lets businesses maintain their own websites and online stores without managing a separate application.",
      },
      {
        title: "Made for everyday use",
        body: "Clear editing, relevant business tools and straightforward subscription choices guide the product. Tell us what your business needs through the contact page.",
      },
    ],
  },
  help: {
    title: "A good place to start.",
    description:
      "Practical guidance for setting up and maintaining your Omnyvox website.",
    sections: [
      {
        title: "Before publishing",
        body: "Confirm your email and business facts, replace instructional content, verify the enquiry recipient, review policies and complete the subscription requirements.",
      },
      {
        title: "If something is unavailable",
        body: "A plan restriction, missing setup step and a temporary service issue are different problems. Read the message in your workspace; contact support with the website name and the action you were trying to complete.",
      },
    ],
  },
  guides: {
    title: "Make your website useful from day one.",
    description:
      "A short checklist for accurate content and clear visitor journeys.",
    sections: [
      {
        title: "Write for the next step",
        body: "Explain what you do, who it is for and how to enquire or buy. Use specific, verified information and a clear call to action.",
      },
      {
        title: "Prepare your images",
        body: "Use images you own or have permission to publish. Add meaningful descriptions, avoid repeated decorative pictures and check the mobile crop.",
      },
      {
        title: "Check the whole journey",
        body: "Test menus, inner pages, forms, policies and checkout where enabled. A homepage alone is not a complete website.",
      },
    ],
  },
  faq: {
    title: "Questions before you start?",
    description: "A few useful answers about plans and setup.",
    sections: [
      {
        title: "Can I use my own colours and logo?",
        body: "Yes. Upload your logo and choose a palette or accessible brand colours. The template controls the responsive layout.",
      },
      {
        title: "Can Basic receive enquiries at another email address?",
        body: "Yes. Every plan supports a chosen primary enquiry recipient after verification of that inbox.",
      },
      {
        title: "How many websites can I create?",
        body: "Basic and Growth allow one website. Advanced allows up to three websites under its subscription.",
      },
      {
        title: "Does AI need to be available to use my website?",
        body: "No. Manual editing, published pages, forms and checkout work independently of the optional writing assistant.",
      },
    ],
  },
};
