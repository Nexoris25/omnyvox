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
