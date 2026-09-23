# WaaS amendment implementation — 22 September 2026

This release advances the master document and the two September amendment/design documents. It is not the completed master-document product. Existing user instructions take precedence: Advanced supports three websites, other tiers one; CAC checks remain manual; no new stock photographs were introduced.

## Implemented in this release

- Versioned transactional SQL migrations, including storage, editorial history, industry context, form routing and local-AI jobs.
- Nineteen industry definitions. New sites receive industry-specific draft pages, navigation and policy review guidance. Server-generated module availability hides irrelevant collections and rejects incompatible deep links. Growth/Advanced features remain plan-gated.
- Published page/product quota accounting. The homepage counts as one content page; drafts and legal records do not consume published-page capacity. Storage allowances are enforced by stored bytes.
- Business facts and a publish-readiness endpoint: confirmed summary/phone, verified recipient, configured email sender, reviewed policies, merchant approval and real products for stores. Templates contain instructional drafts rather than fabricated customer facts.
- Recipient email verification for every tier, independent of login email. Changing the recipient leaves the previous verified address active until verification succeeds. Tenant-bound form IDs, honeypot, consent, rate limits, durable enquiries and retryable email outbox delivery are implemented. Provider acceptance is not presented as inbox delivery.
- Reusable CMS editor, structured detail fields, navigation controls, independent favicon, per-record SEO, scheduled publishing for eligible plans and content history for Advanced. History restoration loads a draft for normal validation and saving.
- Internal-admin Bunny Storage connections, encrypted access keys, connection verification, upload destination switching, resumable migration and migration back to VPS. Failed transfers preserve source bytes; verified migration preserves media IDs and URLs. See the operations guide.
- Same-VPS-only Ollama draft worker, three bounded content slots, server-side quotas, idempotent jobs, cancellation, explicit review/acceptance and stale-draft protection. AI is disabled by default and cannot publish websites.
- Corporate/e-commerce pricing routes, category template galleries, and marketing solution, feature, service and help routes. Known marketing routes can use published CMS page overrides with their slash-separated path converted to a hyphenated slug.
- Four template manifests: Business Studio, Modern Company, Boutique Store and Everyday Store. Search, categories, sorting, cart feedback and structured product details improve the shared shop flow. Preview checkout is disabled.

## Dev-branch update — 23 September 2026

- Template library expanded from four palette-swapped IDs to seven distinct families: Business Studio (technology), Trust & Advisory (law, accounting, consulting), Care & Wellness (healthcare), Modern Company (other corporate), Boutique Store, Everyday Store and Everyday Essentials (grocery). Each has its own heading treatment, hero, button shape and nav/footer styling. The ten-template target (six corporate, four commerce) is still open.
- "Create website" shows a visual template picker, sorted so templates matching the chosen industry come first, instead of a plain dropdown.
- Rich text editor: grouped icon toolbar with active states; adds strikethrough, H4, dividers, callouts, CTA buttons and YouTube/Vimeo embeds. Embeds are limited to `youtube-nocookie.com` and `player.vimeo.com` by the sanitizer.
- Growth/Advanced sites can add extra verified enquiry recipients (defaults: Growth 2, Advanced 4, Basic 0; admins can override via `plans.entitlements.recipients`). Migration `005-form-recipients.sql`.
- LocalBusiness JSON-LD (corporate sites that choose to show their address) and Service JSON-LD (service/practice-area pages).
- `npm run worker:email` runs the existing Resend outbox worker.
- Template previews use industry-specific sample content (clearly labelled as fictitious) in each family's own colours. Service lists render as a card grid, CTA sections as a contrasting band, and the published-site mobile menu is a proper button.
- Readiness now blocks publishing while any stock homepage section is unchanged. Previously only the "About" placeholder was caught.
- Fixes: the create-website form lost typed input and could submit a mismatched category/template on every change (`NewSite` remounted each render); inserting an editor block replaced a just-inserted button; duplicated "| Omnyvox" page titles; the industry list is now public reference data, so demo mode can load it.

### Video embeds (Growth and Advanced)

Subscribers upload videos to YouTube, Vimeo or their own Cloudinary account and paste the link, so videos never use plan storage.

- Every template section has a **Video URL** field that replaces the section image. The editor's video button accepts the same links. `lib/video.ts` is the single parser:
  - YouTube → `youtube-nocookie.com` embed.
  - Vimeo → Vimeo's embed player.
  - Cloudinary `res.cloudinary.com/<cloud>/video/upload/...` → native `<video>`.
  - Cloudinary `player.cloudinary.com/embed/?cloud_name=…&public_id=…` → framed player.
  - Anything else is rejected. This includes plain `http:`, lookalike domains and URLs containing quotes.
- The sanitizer re-checks every stored `iframe`/`video` source against the parser's own output at render time, so saved HTML is never trusted.
- Plan enforcement is `entitled(tier, "video")`. The API returns 403 when a Basic site saves a section video or embedded video. After a downgrade, published sites stop rendering videos but the links are kept. The editor shows a "Remove video" prompt so Basic users can still save.
- Tests: `tests/video.test.ts`.

Verification on 23 September 2026: typecheck, production build, 22 unit tests, and `npm run test:recipients` (12 checks against a throwaway `omnyvox_test` database: plan limits, wrong codes, tenant isolation, enquiry fan-out, Reply-To, readiness). Browser checks at 390px and 1280px: template previews, mobile menu, industry-matched template picker, and every new editor action surviving sanitization. `scripts/integration-test.mjs`, `scripts/extensions-test.mjs` and `scripts/amendment-test.ts` still need a dedicated server on an isolated database (Next 16 allows one dev server per checkout).

## Design reference mapping

The Nigerian references informed information hierarchy and interaction patterns; source photographs and page designs were not copied.

| Reference                                                                                              | Applied direction                                                   |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [Enyata services](https://enyata.com/services) and [client stories](https://enyata.com/client-stories) | Clear services and project collections, concise corporate hierarchy |
| [Mintyn](https://mintyn.com/)                                                                          | Corporate navigation and focused conversion paths                   |
| [Konga mobile phones](https://www.konga.com/category/mobile-phones-5297)                               | Searchable, sortable catalogue and prominent product information    |
| [Kara](https://kara.com.ng/)                                                                           | Dense retail catalogue and direct shopping actions                  |
| [Kilentar](https://kilentar.com/collections) and [Orange Culture](https://orangeculture.com.ng/)       | Boutique/editorial template direction                               |

## Verification for this release

Production build and TypeScript validation pass. Automated checks: 22 unit tests, 41 amendment integration checks, 45 onboarding/CMS/administration regression checks, 36 authentication/public-rendering checks, and 5 payment-integrity checks (149 total). Storage network responses are simulated in automated migration checks; no real Bunny account was used. The local PostgreSQL setup/migration command was rerun successfully.

Browser checks covered the template gallery at 320, 375, 390, 768 and 1440 pixels without horizontal overflow, the 320-pixel mobile menu/login flow, and internal storage/AI controls. This is targeted responsive verification, not the full template/device/accessibility acceptance matrix. Screenshots are in `docs/qa/`.

## Remaining engineering and deployment

- Six corporate and four e-commerce production templates, complete distinct inner-page designs, licensed unique visual assets and a full screenshot/reference acceptance matrix. Current four manifests do not meet the ten-template launch requirement.
- Database-backed template administration/version upgrades, enforced industry compatibility and richer approved layout/section variants.
- Full guided onboarding progress/recovery, authoritative required-page checks, automatic broken-link and accessibility checks, and full policy lifecycle enforcement after publication.
- Whole-site revision browser/rollback, slug redirect management, reusable blocks and editorial approval workflows.
- Marketing homepage/navigation/footer administration and complete seeded editorial content. CMS overrides currently cover the new known content routes.
- Form delivery administration, abuse controls using a trusted edge IP, provider delivery/bounce webhooks and operational alerts.
- VPS inspection and Ollama installation, measured resource/load readiness, recorded full model digest/licence evidence, real worker benchmarks and model-operating procedures. No VPS connection was supplied, and no AI model was downloaded or enabled.
- Actual Bunny account connection, staging migration with real credentials, production backup/restore drills and delivery/performance measurement. Media continues through Omnyvox's authorization-aware endpoint rather than exposing a public storage bucket.
- Team memberships/roles, 2FA, automated billing renewals/invoices/proration, advanced commerce variants/refunds/delivery/taxes, automated domain/TLS provisioning, infrastructure monitoring and full security/load/accessibility launch testing remain from the master document.

Configuration of payment, email, domain and storage providers does not implement these remaining engineering features. Keep commercial launch gated until the relevant roadmap and assurance work is completed.
