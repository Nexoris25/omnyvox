# Product design review

Baseline: `a3761c6`, fetched from `origin/main`. Deliver design batches to `dev`.
The reference site was reviewed for hierarchy, page rhythm, service specificity,
photography and enquiry paths; its assets and copy are not copied.

## Batch 1 — subscriber website foundations

- Shared inner-page header for template previews and subscriber content pages.
- Active navigation, consistent mobile menu icon, semantic Lucide feature icons,
  service cards, clearer FAQ rows, contact panels and reading widths.
- Preserve subscriber colours and each template family's typography and layout.
- Modern Company now has a specific, clearly fictional business-advisory sample,
  two distinct licensed photographs and three distinct editorial cover photos.
- Photograph sources and licences: `licensed-photos.json`. Existing generated
  illustrations elsewhere remain; this batch does not claim to replace them all.
- Validation: production build and 53 unit tests; desktop and 375px browser
  inspection of Modern Company and its About page; mobile menu expansion.

## Remaining review coverage

## Batch 2 — marketing pages

- Editorial layouts with in-page navigation, semantic icons, numbered process
  sections, expandable FAQs and early, explicit calls to action.
- Pricing selection announces its state; comparison tables retain row labels
  while scrolling. Contact page explains the support handoff.
- Five distinct licensed photographs replace generated marketing scenes; no
  stock portrait is presented as an Omnyvox employee or customer testimonial.
- Production build passed. Browser checks at 320px covered the revised homepage,
  features, FAQ, contact and pricing; tested FAQ expansion and store/yearly pricing.
- All ten template homepages and 115 linked template routes inspected at 320px:
  one main heading, no page overflow, no failed loaded images detected. This is
  structural coverage, not a claim that every screenshot has been art-directed.

## Remaining review coverage (continuing)

- Every family: Studio, Trust, Care, Build, Haven, Horizon, Atelier, Glow,
  Catalogue and Essentials. Inspect each linked core, legal and Insights page.
- Marketing: home, solution pages, features, process, about, setup, services,
  security, help, FAQ, contact, pricing/category pricing, gallery, Insights,
  article, author and legal pages.
- Account: authentication, verification, onboarding, recovery, security, team,
  invoices and order status.
- Subscriber dashboard: all navigation destinations, editor and CMS states.
- Internal admin: all management areas and narrow-screen forms/tables.
- Responsive review: 1440px desktop, 375px configuration preview and 320px.

This is a work log, not a declaration that the entire redesign is complete.
