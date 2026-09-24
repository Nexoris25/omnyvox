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

## Batch 3 — private workspaces and account journeys

Reviewed on an isolated server against `omnyvox_test` with the seeded
`design-owner@example.invalid` and `design-admin@example.invalid` accounts.
Sessions were created in the test database (passwords are not typed by the
reviewing agent); production authentication was not changed.

- Subscriber workspace: scripted audit of all 20 sidebar destinations at 375px
  (clipping, tap targets, text size, accessible names, labels, headings).
- Fixed: 9–11px text across the workspace (new 12px floor, 14px body/buttons);
  the generic "Everything you need…" subtitle replaced by a specific line per
  section; records tables (pages, articles, products, collections) become
  stacked cards on phones with readable dates, status colours and labelled
  Edit/Delete buttons; section editor overflowed the phone width (grid tracks
  now shrink); live preview is `inert`, so its headings and links no longer
  duplicate the page's h1 or enter the tab order; larger touch targets for the
  rich-text toolbar and menu editor on touch screens.
- Internal admin: all 22 tabs audited at 375px. Navigation grouped into
  Overview, Customers, Payments, Operations and Marketing website; phones get a
  single grouped "Go to" picker instead of a sideways strip. Stat labels
  enlarged; duplicate "Staff permissions" heading renamed.
- Account journeys: sign-in and registration now have the form title as the
  visible h1 ("Sign in to Omnyvox", "Create your Omnyvox account"); forgot,
  reset and verify pages gained an h1; onboarding has its own page title.
  Password reveal, requirements, consent and MFA flows unchanged.
- Validation: production build, 53 unit tests, and integration, extensions,
  organisation, site-content and admin-ops suites (186 checks) passed.
- Limits: screenshots in the in-app browser were intermittently partial, so
  layout was verified with measurements plus spot screenshots. Desktop
  widths were measured rather than visually reviewed in full.

## Batch 4 — template art direction and sample copy

- **Photography:** consulting, solar, logistics, education, community, books,
  furniture and retail used illustrated SVG hero/about art. Each now has a
  distinct licensed Unsplash hero and about photograph (1440px and 640px WebP,
  all under 210KB) with accurate alt text marked "sample image". No photo is
  reused across industries, and none shows readable third-party branding or
  book titles. The source, photographer and licence for each are recorded in
  `docs/licensed-photos.json`. All 19 kits now resolve to photographs, which
  was checked against the files on disk.
- **Sample copy:** about 130 editor-directed instructions in `lib/industry-kits.ts`
  ("List the services you offer today.", "Describe the space", "State your
  consultation policy…") became natural, clearly fictional copy written for
  visitors. It makes no credentials, client names, figures, testimonials or
  invented staff names:
  - Team cards show role titles only (e.g. "Partner — Leads client matters…").
  - Gallery cards show project types.
  - FAQ answers are sensible, generic sample answers.
- **Unchanged:** all starter content stays `sample: true`. The publish gate
  still blocks until it is reviewed, because it checks the flag and not the
  wording. The legal page `[Required: …]` markers are intentionally left for
  the owner's adviser to complete.
- **Checked:**
  - Crawled every core, legal and Insights page of all 10 template previews:
    all returned 200, with no instruction wording.
  - The Trust people page at 375px has no overflow.
  - 53 unit tests pass and the production build succeeds.
- **Limit:** template previews render only each family's primary industry.
  The eight new photo sets were confirmed through the kit-to-file mapping,
  not through a live preview of every industry.

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

Next agent: start with [DESIGN-HANDOFF.md](DESIGN-HANDOFF.md) for the current
checkpoint, remaining priorities and test-environment cautions.
