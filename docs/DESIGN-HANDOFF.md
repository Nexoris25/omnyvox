# Design handoff — 24 September 2026

## User objective and delivery instructions

Continue the comprehensive UI/UX review of Omnyvox: marketing website, all ten
template families and their inner pages, subscriber workspace, account journeys
and internal administration. The user referenced
https://mayor-web-ee4e.onrender.com/ for the business-site standard. Review its
hierarchy, specific service sections and enquiry flow; do not copy its assets.

Start from the work on **dev**, not from the older main branch. Commit and push
small, verified batches to **dev**. Do not merge or push this redesign to main
without a subsequent instruction.

Use real, relevant photographs with verified licences and accurate alt text;
do not repeat one photograph across unrelated sections. Use Lucide icons for
UI and the existing brand-icon library for social platforms. Retain Omnyvox's
primary `#540CDA`, but preserve subscriber-controlled colours and each template's
identity. Configuration preview is 375px; verify actual layouts down to 320px.

## Committed checkpoint (updated after batch 7)

- Main baseline: `a3761c6`. All design work below is on `origin/dev` only.
- `a56652a`, `24baad4`: batches 1–2 (shared subscriber/preview headers;
  marketing editorial system and licensed marketing photography).
- `5f69be4` (batch 3): private workspaces and account journeys. This
  covers grouped admin navigation with a phone picker, records tables that
  stack on phones, editor overflow, the `inert` preview, the form title as
  the visible h1 in `AuthForm`, and recovery/onboarding headings. The CSS
  layer is `app/workspace-refinement.css`, imported last.
- `327a210` (batch 4): all 19 industry kits use distinct licensed photos, and
  about 130 editor-directed starter strings are now fictional sample copy
  written for visitors (roles, not names; project types, not clients).
- `9d17199` (batch 5): marketing detail pass. It adds a 12px type floor,
  36–48px targets and `aria-hidden` template miniatures, swept on 67 routes
  at 320/375/1440px.
- `dff4801` (batch 6): workspace and admin at 320px (17 destinations and 22
  admin tabs).
- Batch 7: the handoff follow-ups. It verifies the photo ledger, fixes the
  FAQ page double heading, a sitemap bug listing unservable sites, and an
  Insights crash on articles without a category, and refines the general
  business copy.
- Detail and exact coverage per batch: `DESIGN-REVIEW-2026-09-24.md`.
- Local working branch is `codex/design-review` (pushed with
  `git push origin HEAD:dev`). Untracked `.claude/` is unrelated; do not stage it.

## Status of the original five priorities

All five priorities have been worked through. What remains is depth, not
coverage:

1. **Private workspaces:** done at 375px (batch 3) and 320px (batch 6).
   These were checked by automated measurement plus spot screenshots.
   Empty/loading/error states and the media library were not exercised with
   seeded edge-case data.
2. **Account journeys:** the auth h1 is fixed, with recovery/onboarding
   headings and type floor. Not walked end to end: MFA enrolment, team
   invitations, invoices and order status.
3. **Templates:** photos and copy are done for every kit. Legal pages keep
   deliberate `[Required: …]` markers for the owner's adviser. Previews show
   only each family's primary industry; the other industries were checked by
   mapping, not visually.
4. **Marketing:** a layout sweep of all sitemap routes is done. It was not a
   page-by-page copy re-read, and keyboard focus order was not audited.
5. **Regression:** build, 53 unit tests and the integration suites
   (integration, organisation, admin-ops, sites-content, amendment,
   launch-readiness) pass against `omnyvox_test`.

## Suggested next work

- A keyboard-only pass (focus order, visible focus, skip link) on marketing,
  auth, the editor and the admin.
- Seed empty/error states in `omnyvox_test` and review them (no records, a
  failed upload, an expired subscription, a pending KYB).
- A visual review of non-primary industries by creating test sites per
  industry in `omnyvox_test` (not the ordinary database).
- A real MFA sign-in walkthrough with the design accounts (see cautions below).

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
- `omnyvox_test` (127.0.0.1:55432) holds current migrations and the QA accounts
  `design-owner@example.invalid` and `design-admin@example.invalid` (seeding
  completed). Their passwords are not recorded anywhere; if you need them, re-run
  `scripts/seed-test-accounts.ts` with your own SEED_PASSWORD **against
  `omnyvox_test` only**. Never reset passwords or seed fake data in the ordinary
  application database.
- Isolated QA server used in batches 3–7 (production build, test DB, sandbox KYB,
  no external delivery credentials):
  `KYB_PROVIDER=sandbox DATABASE_URL=postgresql://omnyvox@127.0.0.1:55432/omnyvox_test
  APP_URL=http://localhost:3010 PLATFORM_DOMAIN=localhost ENCRYPTION_KEY=<test key>
  node node_modules/next/dist/bin/next start -p 3010`. Integration scripts in
  `scripts/*-test.*` also need `TEST_DATABASE_URL` and
  `TEST_BASE_URL=http://localhost:3010`. It was stopped at the end of batch 7.
- **Deviation to be aware of:** in batches 3 and 6 the agent could not type
  passwords, so it created sessions for the two QA accounts directly in
  `omnyvox_test` and set the session cookie in the browser pane. This did not
  touch production data or weaken authentication, but it is not the "normal
  sign-in/MFA UI" route. Prefer a real sign-in next time, and repeat the MFA
  walkthrough.
- The 3003 server (if running) uses `.env.local` and the ordinary database; use
  it for read-only checks only.
- Browser skill is available. Use its browser runtime and documented UI tools;
  do not inspect browser storage/cookies. Prior handles are not guaranteed to
  survive a new agent/session. Reset viewport overrides after checks.

## Small follow-ups

- Done in batch 7: the photographer URLs were verified against Unsplash (two
  handles corrected), record-page spacing was checked on real test sites, and
  the general business copy was refined.
- Test fixtures in `omnyvox_test` include published sites without a snapshot
  (`launch-*`, `ashford-ui`); they are now excluded from the sitemap. That is
  expected, not a regression.
- Earlier functional backlog requests exist, but this checkpoint concerns the
  latest comprehensive design request. Do not replace the design task with an
  unrelated engineering expansion or revert newer main-branch security work.
