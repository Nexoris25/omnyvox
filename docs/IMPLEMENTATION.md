# Implementation status

The supplied master document specifies a multi-phase SaaS business, including substantial advanced commerce and operational scope. This repository implements the core foundation and working website flows. It must not be represented as the complete commercial product described by all 40 sections.

The [September update](RELEASE-2026-09.md) records the expanded CMS, onboarding, marketing and administration workflows. The newer [WaaS amendment status](AMENDMENT-IMPLEMENTATION.md) supersedes the older feature and remaining-work inventory below for storage, industry collections, navigation, scheduled publishing and local AI. Consult that document for the current release boundary and remaining engineering.

## Working implementation

- Marketing website, three shared template styles, FAQ, configured corporate pricing, and registration entry points.
- Registration, login, scrypt credentials, hashed sessions, email OTP, legacy verification tokens, reset tokens, session revocation, and transactional email outbox/worker.
- Owner-scoped websites and content; protected internal super-administration; audit records for privileged mutations.
- Six unpriced subscription products; administrative prices; configurable content caps in admin; Basic blog/domain restrictions; server-side limits.
- Website creation, section editing, duplicate/hide/remove/move-up, draft saving, device-width preview, and publication snapshot.
- Primary/secondary/background/text colours, fonts, business name, contact email, logo, media upload and library.
- Pages, articles, products, categories as content fields, search, status changes, and deletion.
- Published corporate/storefront renderer; guest cart and checkout; server pricing; transactional inventory reservations; separate merchant billing; signed idempotent payment webhooks; fulfilment status updates.
- Manual monthly/annual platform payments and expiry; no destructive deletion on expiry or suspension.
- DNS TXT ownership verification, wildcard host routing, and operator-controlled domain activation after SSL provisioning.
- Organisation, BlogPosting, Product/Offer and breadcrumb schema; automatic author/publisher names; Open Graph, Twitter cards, canonical URLs, robots and sitemaps; category-URL preference and alternate article redirects.
- Enquiry capture, setup/support request capture, website data export, and website suspension/restoration.
- Desktop/mobile layouts and minimum-width browser checks at 320px, with a 375px editor preset.

## Configuration needed to exercise external integrations

- Production PostgreSQL, stable public domain, TLS and wildcard/custom-host routing.
- Platform and per-merchant Paystack accounts, webhook URLs, approval evidence, and sandbox end-to-end payment tests.
- Resend key, verified sender, and scheduled email worker.
- Merchant encryption key and secret rotation procedure.
- Commercial prices and all launch policies left undecided in the source document.

## Engineering work still required for the full master document

| Area               | Remaining work                                                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and teams | Two-factor authentication, invitations, organisation membership model, role-level authorization, session management UI, suspicious-login handling                                                                           |
| CMS                | Additional embed providers, editable navigation, scheduled publishing, editorial review, revisions/rollback, reusable blocks                                                                                                |
| Content modules    | Dedicated services, projects, team profiles, testimonials                                                                                                                                                                   |
| Media              | S3-compatible storage, quota accounting/enforcement, cropping, folders, responsive derivative sets, independent favicon selection                                                                                           |
| Commerce           | Variants/SKUs, CSV import/export, discounts/coupons, delivery zones/pickup/taxes, customer accounts, inventory adjustment history, refunds, order notifications, reservation expiry/reconciliation, abandoned-cart recovery |
| Billing            | Automated recurrence, invoices, automatic renewal retries, cancellation, proration, upgrade/downgrade impact flow, timed overrides, service billing                                                                         |
| Domains            | Automated provider attachment/TLS, primary domain selection and aliases, canonical host redirects, DNS/SSL health checks, domain procurement assistance                                                                     |
| SEO and analytics  | Per-page dedicated SEO title/description/social image controls, LocalBusiness subtypes, arbitrary redirect manager, author pages, privacy-aware analytics and conversion reports                                            |
| Integrations       | OAuth connections, analytics/search-console settings, webhook subscriptions, retry queues, connection-health reporting                                                                                                      |
| Operations         | Support attachments/assignment, service quotations/approval workflow, scoped assisted access                                                                                                                                |
| Infrastructure     | Independent service extraction where needed, Redis/BullMQ jobs, versioned migrations, database row-level-security defense in depth, backup/restore drills, monitoring, tracing, incident handling, automated retention      |
| Launch assurance   | Full WCAG 2.2 AA review, broader browser/device coverage, provider sandbox certification, concurrency/load tests, penetration/security review, legal approval                                                               |

## Requirement ambiguities resolved conservatively

- Basic team capacity is one owner in this release. The document’s narrative and tables differ between one and two users; multi-user invitations are not implemented.
- Advanced uses an explicit initial cap of 100 content pages and 1,000 articles instead of an undefined “unlimited” allowance. Plan cap overrides are supported by the backend; the cap-editing admin form is implemented.
- Corporate Growth uses three users as its default entitlement. Commerce Growth team-limit differences need commercial confirmation before invitations are introduced.
- All prices begin null and checkout is unavailable until configured.
- Approval of a merchant and activation of a verified custom domain are explicit operator actions, never inferred from a client-side button or payment redirect.
- Content exports are available; account/website ownership transfer and legal retention/deletion workflows remain to be implemented.

## Release boundary

This is suitable for local evaluation and continued development. Do not open commercial subscriptions or live store payments until the remaining security, billing, commerce reconciliation, legal, and operational launch gates are closed. Configuration alone does not implement the missing roadmap features.
