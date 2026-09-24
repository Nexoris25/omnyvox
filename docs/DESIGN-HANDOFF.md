# Design handoff — 24 September 2026

## User objective and delivery instructions

Continue the comprehensive UI/UX review of Omnyvox: marketing website, all ten
template families and their inner pages, subscriber workspace, account journeys
and internal administration. The user referenced
https://mayor-web-ee4e.onrender.com/ for the business-site standard. Review its
hierarchy, specific service sections and enquiry flow; do not copy its assets.

Start from the work on **dev**, not from the older main branch. Commit and push
small, verified batches to **dev**. Do not merge or push this redesign to main
without a subsequent instruction. The user paused implementation to request
this checkpoint and a handoff note; the comprehensive redesign is unfinished.

Use real, relevant photographs with verified licences and accurate alt text;
do not repeat one photograph across unrelated sections. Use Lucide icons for
UI and the existing brand-icon library for social platforms. Retain Omnyvox's
primary `#540CDA`, but preserve subscriber-controlled colours and each template's
identity. Configuration preview is 375px; verify actual layouts down to 320px.

## Committed checkpoint

- Main baseline: `a3761c6`.
- `a56652a`: shared subscriber/preview page headers, active navigation, mobile
  menu icon, section refinements and Modern Company sample copy/photography.
- `24baad4`: marketing editorial navigation, process sections, FAQ accordions,
  pricing controls and comparison refinements, contact support explanation, and
  five distinct licensed marketing photographs, including Nigerian workspaces.
- Both implementation commits were successfully pushed to `origin/dev`.
- Local working branch is `codex/design-review`. Untracked `.claude/` existed
  before this work and is unrelated; do not stage it.

## Next work, in order

1. **Review the private workspaces.** This is the exact point implementation
   reached. Inspect every subscriber navigation destination and internal admin
   tab at desktop and mobile widths, including forms, tables, empty/loading/error
   states, media library and rich-text editor. Improve navigation grouping,
   action hierarchy, spacing, labels and responsive tables without changing
   authorization, billing, KYB or publishing behaviour.
2. **Finish account journeys.** Review sign-in, registration, verification,
   onboarding, forgotten/reset password, assisted recovery, security, team,
   invoices and order status. A concrete issue already found: `AuthForm` places
   its sole h1 in the decorative story panel (hidden on mobile), while the actual
   form title is h2. Make the form's purpose the visible h1 and adjust CSS that
   currently targets `.auth-story h1` / `.auth-form h2`. Retain password reveal,
   requirements, confirmation, consent and MFA flows.
3. **Art-direct every template and inner page.** Shared improvements are in
   place, but structural route checks are not a completed visual review. Check
   Studio, Trust, Care, Build, Haven, Horizon, Atelier, Glow, Catalogue and
   Essentials, including legal, contact, Insights/article, guide and store pages.
   Several kits still contain editor-directed starter wording and generated
   imagery/illustrations. Replace these thoughtfully with coherent, explicitly
   fictional sample copy and distinct licensed photographs where appropriate.
   Never invent real credentials, clients, testimonials or staff identities.
   Keep sample-content review/publishing gates intact.
4. **Complete marketing detail review.** Inspect all feature subpages, solution
   pages, setup, professional services/migration, about, security, help, guides,
   pricing categories, template gallery, Insights/articles/authors and legal
   pages. Homepage and the shared editorial system received changes, but not
   every page has received individual screenshot review. Verify photo crops,
   sticky navigation, keyboard focus, links and empty-content handling.
5. **Run final regression and responsive checks.** Build, run relevant tests,
   inspect 1440px, 375px and 320px, exercise menus, FAQs, filters, pricing controls,
   form validation and safe test-account journeys. Push each coherent batch to
   dev and update the review log with exact coverage and remaining limitations.

## Implementation map

- `app/design-refinement.css`: latest scoped design overrides, imported last by
  `app/layout.tsx`. Existing layers are `site-design.css`,
  `template-families.css`, `brand-design.css`, `editor-design.css`, `store-design.css`.
  Check existing selectors before adding rules; duplicate pseudo-elements caused
  a double menu icon and breadcrumb separator during review and were corrected.
- `components/site-renderer.tsx`: shared subscriber and template section renderer.
- `components/site-page-header.tsx`: new inner-page heading/breadcrumb component.
- `components/template-preview.tsx`, `lib/page-purpose.ts`: template inner pages.
- `app/sites/[slug]/[[...path]]/page.tsx`: real subscriber routes; keep these in
  sync with preview improvements, including active navigation and page headers.
- `lib/industry-kits.ts`: sample content and page blueprints; `lib/templates.ts`:
  eligibility/manifests; `lib/brand-assets.ts`: image paths, alt text, source sets.
- `components/marketing-editorial.tsx`, `app/[...marketing]/page.tsx`,
  `lib/marketing-pages.ts`: shared marketing content and page layouts.
- `components/dashboard.tsx`, `platform-admin.tsx`, `admin-table.tsx`,
  `security-settings.tsx`, `team-settings.tsx`: next private UI review targets.
- `docs/licensed-photos.json`: source/photographer/licence ledger for downloaded
  photographs. Existing `docs/brand-assets.json` also lists older generated art;
  do not describe that older collection as real photography.

## Validation completed and limits

- Production build passed after both design batches, including the final mobile
  overflow fix in the marketing section index.
- 53 unit tests passed after the starter-image corrections in batch 1. The later
  article-cover and marketing edits were production-built and browser-reviewed;
  do not imply the unit suite was rerun after every subsequent edit.
- Browser structural inspection: all ten template homepages and 115 linked
  template URLs at 320px had one h1, no page-width overflow, and no failed loaded
  images detected. Lazy images were not exhaustively forced to load; this does
  not certify all assets or all interactions.
- Desktop/375px screenshots inspected for Modern Company home/About and mobile
  menu expansion; desktop Trust practice areas; marketing features desktop;
  marketing FAQ mobile and its expansion behaviour.
- Final 320px checks passed for `/`, `/features`, `/faq`, `/contact`, `/pricing`.
  Store selection and yearly-billing checkbox tested on pricing. Additional
  baseline marketing routes were structurally inspected before batch 2.
- Private admin/subscriber flows have **not** yet been fully reviewed or tested
  in this design pass. No claim that the product is "perfect" or finished.

## Local environment and safe continuation

- Windows PowerShell workspace: `C:\Users\CNED\Desktop\omnyvox`.
- Portable runtime: `.runtime/node.exe`. Next 16.3.5. Read relevant bundled
  `node_modules/next/dist/docs/` guides before code changes, per `AGENTS.md`.
- Build: `.\.runtime\node.exe node_modules/next/dist/bin/next build`.
- Unit tests: `.\.runtime\node.exe --import tsx --test tests/*.test.ts`.
  Sandbox process spawning returned EPERM; approved escalated execution worked.
- The latest production preview was started on **3003**, using `.env.local`.
  It reads the ordinary local database: use it for read-only UI checks. Ports
  3000/3001 may show older builds. Inspect active processes before restarting;
  do not assume a server survived the interrupted turn.
- `omnyvox_test` exists and current schema/migrations were successfully applied
  there for this review. A command to seed dedicated
  `design-admin@example.invalid` and `design-owner@example.invalid` accounts
  was interrupted by the user: **verify whether it completed before retrying**.
  Never reset passwords or seed fake data in the ordinary application database.
- For private UI QA, run a separate server with DATABASE_URL explicitly pointing
  at `omnyvox_test`, its own matching APP_URL and external delivery disabled.
  Use normal sign-in/MFA UI; do not weaken production authentication to inspect
  admin screens. Existing `scripts/seed-test-accounts.ts` takes SEED_PASSWORD and
  email overrides. Do not commit passwords or environment files.
- No isolated QA server was confirmed running at handoff. The 3003 server is
  **not** the isolated test server.
- Browser skill is available. Use its browser runtime and documented UI tools;
  do not inspect browser storage/cookies. Prior handles are not guaranteed to
  survive a new agent/session. Reset viewport overrides after checks.

## Small follow-ups noticed

- Confirm photographer profile URLs in the new licence ledger against the
  source pages; some handles were transcribed during sourcing. The source photo
  URLs and photographer names are the primary evidence.
- Check subscriber `record-pages` spacing on a real test website: the new
  header is applied there, but most visual verification used template previews.
- General business sample CTA/contact copy still has some older generic wording;
  refine consistently with its new advisory positioning.
- Earlier functional backlog requests exist, but this checkpoint concerns the
  latest comprehensive design request. Do not replace the design task with an
  unrelated engineering expansion or revert newer main-branch security work.
