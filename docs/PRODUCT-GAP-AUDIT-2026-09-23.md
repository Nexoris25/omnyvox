# Omnyvox product gap audit — 23 September 2026

Implementation updates after this baseline are tracked in [Launch readiness progress](LAUNCH-READINESS-PROGRESS.md).

## Scope and method

Baseline: `08035ef` on `main`. Compared all 40 sections of the original master document with the Nigerian template design brief, WaaS amendment v2, subsequent user decisions, database schema/migrations, API handlers, workers, public renderer and administration components. This is a source-code requirements audit, not a new penetration test, live-provider certification or VPS inspection. The prior 217 passing checks demonstrate covered behaviours; they do not establish full specification completion.

User decisions take precedence: Advanced permits three websites; Basic/Growth permit one. CAC verification remains manual until a provider is connected. The editor mobile preset is 375px and layouts must work at 320px. Annual/monthly grace periods are seven/one days and must not be advertised. Software & IT retirement and Creative & events replacement are retained from the accepted dev baseline.

Status: **Missing** means no functioning implementation found. **Partial** means there is working foundation code, but the required journey or controls are incomplete. **Deployment/assurance** means configuration or real-environment evidence is still required, not necessarily more feature code. Items are grouped by product capability rather than every repeated sentence in the specifications.

## Release-critical corrections to existing foundations

| Gap | Evidence and required completion |
| --- | --- |
| Stock reservation expiry and payment reconciliation | `lib/commerce.ts` deducts stock when checkout starts. It restores stock when provider initialization fails, but `scripts/maintenance.ts` has no abandoned-payment expiry/reconciliation job. Add safe provider verification, reservation expiry, recovery for late payments and an operator resolution workflow. A shopper abandoning payment must not reserve stock indefinitely. |
| Durable cross-page cart | `components/checkout.tsx` keeps cart contents in component-local React state. Navigating between catalogue and product pages or refreshing loses that cart. Build a tenant-scoped persistent cart and coherent cart/checkout routes. |
| Ongoing required-policy enforcement | Initial readiness checks exist, but the generic record DELETE/status handlers allow a required legal record to be deleted or unpublished after website publication. Enforce required policies on subsequent edits/deletions and changes of fulfilment/business type, with versioned acceptance. |
| Required-page and link readiness | `lib/readiness.ts` checks facts, email, policies, merchant/products, page counts and sample homepage content. It does not establish that every mandatory blueprint page exists, is published and has working CTAs/routes. Add authoritative page/asset/link checks, not merely a checklist. |
| Template compatibility and allowed variants | Creation checks template category and industry category separately, not membership in the selected template's supported industries. Manifests list fewer section types than the editor permits. Make template/industry/section eligibility authoritative for creation, switching, editing and publishing. |
| Safe concurrent editing | Ordinary draft/record saves lack a revision precondition. Two browser sessions can overwrite one another. Add optimistic concurrency and recovery; the AI acceptance hash check is not general editor conflict protection. |
| Downgrade transitions | Blog/video/domain restrictions exist, but no complete paid plan-change journey checks excess pages/products, explains consequences, sets an effective date, resolves linked Advanced websites and handles domain/SEO transitions. |
| Consent and privacy behaviour | Policy drafts and form consent exist; actual cookie/embedded-media consent controls, consent version history and data-retention/deletion workflows do not. Add controls corresponding to the services actually loaded. |

## 1. Accounts, organisations and permissions — partial

Source: `infrastructure/schema.sql`, `lib/auth.ts`, `components/auth-form.tsx`, `components/onboarding.tsx`, `lib/industry.ts`, site owner guards in `app/api/[...path]/route.ts`.

- Organisation/workspace records and membership model: websites currently belong directly to an `owner_id`.
- Member invitations, acceptance/revocation, removing members and enforced user-seat limits.
- Subscriber roles: owner, website administrator, editor, store manager and analyst, with action-level permissions.
- Internal roles: operations, billing, support, designer, content, finance, technical and compliance. Current administration uses the broad `super_admin` role.
- Two-factor authentication, recovery codes and enforced admin security policy.
- Account/profile settings, authenticated password/email change, active-session list and selective session revocation. Password reset revocation already exists.
- Suspicious-login detection, account security events and user alerts.
- Registration phone capture and explicit, versioned Terms/Privacy acceptance.
- Ownership transfer, account closure and controlled data export/deletion requests. Existing site export is not a full account lifecycle.
- A resumable end-to-end onboarding wizard joining business facts, industry, template, branding, verified inbox, setup choice, subscription and readiness. Current steps are distributed across screens.
- Registered/unregistered business branches, richer industry-specific fact collection and verification-document handling where required. Manual CAC submission/review/resubmission exists; an automated CAC provider is intentionally deferred.

## 2. Plans, entitlements and subscription billing — partial

Source: `lib/model.ts`, `lib/entitlements.ts`, `lib/billing-quote.ts`, billing handlers, `components/billing-summary.tsx`, `components/admin.tsx`.

- Recurring subscription collection, payment-method management, failed-renewal attempts, retry schedule and dunning/reminders.
- Self-service cancellation, end-of-term access, reactivation and cancellation records.
- Upgrade/downgrade checkout, effective dates, proration and explicit impact/conflict review.
- Invoices, invoice numbering/downloads, billing identity/address, tax calculation and payment history UI.
- Subscription refunds, reconciliation, finance ledger/reporting and disputed-payment handling.
- Versioned prices, grandfathering, scheduled price changes and effective-date communication. Checkout amount/offer snapshots exist but are not a price-versioning system.
- Trial configuration/lifecycle, setup fees, optional paid add-ons and professional-service billing.
- Full product administration: descriptions, feature availability, publication state, currency/tax/trial settings and effective dates. The six products are seeded; only selected fields are editable.
- Time-limited per-subscriber overrides with reason, scope, expiry and auditing.
- Fully configurable entitlements and a unified applicability → plan → role → prerequisite → limit → platform-health contract. Many feature decisions still use tier constants; current module states are only enabled/upgrade.
- Admin controls for all declared resource limits. For example, additional-recipient limits are read from entitlement JSON, but the plan-update schema does not expose them.

Already built: six plan records, configurable monthly/annual prices, annual percentage discounts/bonus months, payment initialization and verified idempotent success processing, three-site Advanced grouping, one/seven-day grace behaviour and expiry-based public availability.

## 3. Commerce — substantially incomplete beyond basic selling

Source: `lib/cms-schema.ts`, `lib/commerce.ts`, `components/checkout.tsx`, order/merchant handlers and the public site route.

- Product variants/options with independent SKU, price, stock, image and availability; bounded combinations.
- Product SKU, promotional price, short description, multiple-image gallery, weight/dimensions and related-product controls as typed commerce fields. Generic label/value details are not operational product attributes.
- Hierarchical categories/subcategories, category images/order/metadata and real category product-listing pages.
- Industry-appropriate filters/facets: size/colour, brand/specifications, material/finish, pack size and similar fields. Search, category dropdown and simple sorting already exist.
- CSV product import/export, bulk editing and validation/error recovery.
- Inventory adjustment history, low-stock alerts, variant inventory, reporting and reservation/reconciliation controls.
- Persistent cart and dedicated coherent cart/checkout journey, including continuation across product detail pages.
- Pickup selection and pickup locations; current checkout requires an address and uses one merchant flat delivery fee. Free delivery is possible by setting that fee to zero.
- Delivery zones, zone eligibility/rates, weight/value rules, shipping promotions and approved logistics integrations.
- Taxes and separate order line accounting for merchandise, discounts, shipping, tax, refunds and provider fees where available.
- Coupons, expiry, usage/minimum-spend rules, percentage/fixed discounts and Advanced customer-specific/free-shipping conditions.
- Store customer accounts, verification, saved addresses, purchase history, merchant customer directory and segmentation.
- Complete order status history and fulfilment workflow, pickup/shipping/tracking details and customer-facing status progression.
- Full/partial refunds, refund audit/payment reconciliation and operator handling of `review_required` late payments.
- Order/payment/shipping/cancellation/refund/completion/low-stock notification lifecycle.
- Abandoned-cart recovery and reporting.
- Rich sales, product, customer, category, coupon and inventory reports/exports.
- Payment provider abstraction/additional approved providers. Paystack is implemented directly; Flutterwave is a proposed provider, not a reason to block the existing Paystack-only initial option.
- Complete guided merchant certification/test-transaction evidence and live activation procedures.

## 4. Templates, editor and publishing — partial

Source: `lib/templates.ts`, `lib/industry-kits.ts`, `lib/blueprints.ts`, `components/section-editor.tsx`, `components/dashboard.tsx`, `lib/publishing.ts`.

- Ten-template launch target: **met — six corporate (Studio, Trust, Care, Build & Industry, Hospitality & Stays, Modern Company) and four commerce (Boutique, Beauty Counter, Everyday Store, Everyday Essentials)**. Hospitality, property and beauty still use illustrated samples; licensed photography would let the Hospitality immersive hero show in previews.
- Distinct industry-specific inner listing/detail experiences, especially property discovery, programmes, hospitality, facilities and project galleries. Many records still share a title/body/image/details layout.
- Database-backed template registry, immutable versions, staging/QA approval, publish/unpublish and safe tenant migration of changed slot schemas. Version strings in source code are not lifecycle management.
- Internal management of industries, page blueprints, section schemas, approved palettes/font pairs and template plan eligibility. (Template section eligibility is now enforced from the manifests in the editor and API.)
- Template switching compatibility preview and mapping/rollback for unsupported content/layouts.
- Inline select-to-edit preview; current property panels and scaled preview do not provide the full required inline workflow.
- Whole-site revision restoration. Autosave, conflict choice ("Keep my copy" / "Use the saved version") and recovery of unsaved edits are implemented; record-level history restoration exists, but no complete site-history browser/rollback is exposed.
- Saved reusable blocks/sections, editorial approval states, reviewer assignment and editorial permissions.
- Remaining approved block variants: testimonials, pricing/comparison, statistics, product collections and richer project/portfolio compositions. Generic cards/manual text can approximate some layouts but are not dedicated structured modules.
- Controlled spacing and expanded typography/button/header/footer presets; independent accent/supporting-token management within accessible constraints.
- Page duplication and a complete page-layout/visibility workflow; do not confuse section duplication with page duplication.
- Full per-template screenshot and interaction evidence covering homepage, listing, detail, contact, policies, empty/error states, keyboard and long/missing content. Previous viewport checks primarily establish fit, not full usability/accessibility certification.

## 5. CMS, collections, Insights and media — partial

Source: `lib/cms-schema.ts`, `components/record-extras.tsx`, `components/rich-text-editor.tsx`, `lib/industry-routes.ts`, `components/media-library.tsx`, `lib/media-management.ts`.

- Typed, industry-specific record schemas and relationships: related services/projects/professionals, qualifications, property attributes, programme dates/modes, galleries, display ordering and appropriate enquiry pathways. Generic collections and up to 15 text detail fields exist.
- Dedicated testimonial management with customer attribution, approval/display status and order; reusable FAQ management.
- Insights editorial approvals/reviewer roles, reusable article blocks and content performance reports.
- Complete article presentation/settings: editable excerpt, reading time, publication-date handling separate from creation time, related articles, canonical override, breadcrumb short title and configurable public Insights label.
- Subscriber article-category archive navigation/routes. Category-in-article-URL preference and author records/routes already exist.
- H5/H6 controls in the reusable editor toolbar; visible heading controls currently stop at H4.
- Image crop/focal-point tools, captions and responsive derivative generation for uploaded assets. Uploads currently produce one bounded WebP; bundled new photographs have responsive variants.
- Safe SVG import/rasterisation, if retaining the master's supported-format requirement. Uploaded SVGs currently are intentionally rejected.
- Richer global settings: language, timezone/date preferences, configurable copyright and customer-facing system/transactional copy. International commerce itself remains future scope.
- Image references/rendering need consistent use of stored alt text and correct tenant-host asset URLs; an inner record image currently uses its title as alt rather than `imageAlt`.

Already built: reusable rich text editor, 15-section cap, row/column/reverse layouts, CTAs/FAQ/Insights blocks, navigation/dropdowns, independent favicon, WebP upload conversion, media search/rename/folder labels/delete safeguards, storage quotas and Advanced record history.

## 6. Forms, email and notifications — partial

Source: `lib/forms.ts`, `infrastructure/migrations/003-context-and-forms.sql`, `scripts/send-email.mjs`.

- Multiple independently configured forms per website. `site_forms.site_id` is unique; extra recipients are not extra forms.
- Phone/custom fields, field validation schemas, conditional fields, attachments and plan-specific form controls.
- Conditional lead routing/assignment, automation and per-form reporting.
- Trusted-edge/client abuse throttling and stronger abuse monitoring. Current protection includes site/email limits, honeypot and consent.
- Delivery/bounce/complaint webhooks, suppression handling, dead-letter/manual retry controls and operational alerting. Existing worker retries five times and records provider acceptance, not confirmed delivery.
- Internal email/form operations dashboard: queue lag, verification backlog, failures, abuse and masked delivery configuration.
- Central user notification preferences/inbox and configurable protected transactional templates.
- Remaining event notifications: publication/domains, subscription lifecycle, setup progression, commerce events and richer support activity. OTP, password recovery, enquiry forwarding and admin replies exist.

## 7. Domains, SEO and integrations — partial / missing

Source: `proxy.ts`, `lib/public-site.ts`, public metadata/sitemap routes, domain handlers and `lib/model.ts`.

- Automatic domain attachment and certificate provisioning/renewal, DNS/SSL monitoring and recovery.
- Explicit primary-domain selection, alias → primary and www/non-www redirects. Current canonical base chooses the first active domain alphabetically.
- Domain downgrade/retention transition and procurement assistance workflow.
- Redirect manager with automatic slug-change redirects and plan limits; current automatic redirects cover alternate article category-URL formats only.
- Industry-specific LocalBusiness subtypes and supported schema configuration/validation. Organization, generic LocalBusiness, Service, Article, Product/Offer and breadcrumbs already exist; FAQ schema and broader appropriate schema support remain.
- SEO health/broken-link/indexing reports, category metadata handling, Search Console verification and content-performance integration.
- Correct host-aware OG/media/canonical verification across all custom-domain/system-page cases, with automated acceptance coverage.
- Website traffic/pageview/enquiry analytics and dashboards; sales/revenue trends and all Growth/Advanced reporting/conversion features.
- Google Analytics, Search Console, Meta Pixel, maps, approved chat, email marketing, CRM and logistics connectors as scoped by the plans.
- Integration catalogue, connect/disconnect, OAuth where relevant, credential rotation, health/error status, event subscriptions, signed outgoing webhooks and retry queues.
- Versioned external API contracts/documentation and supported customer API access.

Social profile links, WhatsApp click-to-chat, payment connection and allowed video embeds exist; they are not the complete integration platform.

## 8. Marketing, professional services and support — partial

Source: `app/page.tsx`, `components/marketing-header.tsx`, `components/marketing-shell.tsx`, `lib/marketing-pages.ts`, `components/platform-admin.tsx`, `lib/admin-api.ts`.

- Full marketing CMS ownership of homepage sections/copy/images, navigation, footer, FAQs, template catalogue and promotional banners. Much of this remains source-code content despite working marketing page/article/legal CRUD.
- Dedicated richer feature/help/tutorial content and structured searchable help centre; finish all promised marketing sitemap destinations or intentional equivalent redirects. Several current pages are short generic content shells.
- Marketing SEO controls comparable to subscriber record controls, full category archives and editorial lifecycle.
- Editable professional-service catalogue/packages/prices, structured setup questionnaire and asset collection.
- Quotations, approval, payment/invoicing, assigned staff, tasks, agreed scope, due dates, revision limits, QA, customer review and project closure. Current service requests are a useful intake mechanism, not this project workflow.
- Support ticket threading, attachments, priority/category management, assignment, resolution history and support metrics. Current reply/status fields are not a complete conversation system.
- Scoped assisted access: explicit consent, reason, expiry, visible indicator, permission limits, action log and termination.

## 9. Internal administration and operations — partial

Source: `components/platform-admin.tsx`, `lib/admin-api.ts`, `components/admin.tsx`, infrastructure files and worker scripts.

- Organisation/member administration, detailed subscriber history, role-specific operational access and account restrictions.
- Full subscription lifecycle operations, finance/refund/reconciliation tools and service-project management.
- Template/industry/blueprint/palette management and staged releases.
- Support assignment/assistance operations and email-delivery health.
- Revenue/MRR/ARR/churn/activation/conversion reports, setup revenue, support resolution and infrastructure cost/profitability.
- Central incidents, application/job errors, SSL/domain health, security events, abuse investigations and data requests.
- Comprehensive audit context (tenant, action changes, timestamp, source IP where appropriate), search/export/retention and complete coverage of privileged changes. Existing audit rows store actor/action/target/time.
- Configurable policies/feature flags/notifications and restricted administrator lifecycle.

Existing admin screens for pricing, websites, accounts, subscriptions, merchant/domain approval, CAC review, contact/request replies, marketing records, storage and AI settings must not be mistaken for the full operations platform above.

## 10. Local AI — partial feature; deployment unverified

Source: `lib/local-ai.ts`, `lib/ai-api.ts`, `scripts/ai-worker.ts`, `components/ai-operations.tsx`.

- Expand the current three supported slots (`hero.title`, `hero.body`, `about.body`) into the requested blueprint-based initial multi-page draft workflow and approved per-field regeneration.
- Persist richer prompt/template provenance, field mappings and complete generation-group progress/recovery.
- Revalidate effective plan/subscription/quota permissions at execution time; current worker checks ownership, suspension and confirmed facts, but not the full effective subscription entitlement state.
- Runtime pressure monitoring/circuit breaker, resource-aware queue controls, latency percentiles, plan usage metrics and detailed redacted operational failure handling. Manual disable and job counts already exist.
- Real VPS hardware/headroom assessment, Ollama installation/service isolation, pinned model licence/digest, cgroup/CPU/memory controls and real load/quality benchmarks. No live deployment was verified in this audit.

Local-only restrictions, model allow-list, structured output validation, quotas, idempotent requests, cancellation, review/acceptance and stale-draft protection already exist. Do not add a paid/cloud fallback.

## 11. Storage, infrastructure, security and launch assurance

- **Storage built, operational proof outstanding:** Bunny connection controls, encrypted credentials, destination switching and resumable verified migration/back-migration exist. Connect a real account and test failures, backup, restore, delivery latency and scale. Add complete media lifecycle/orphan/version retention and production CDN strategy where appropriate.
- **Deployment:** establish production PostgreSQL, secrets/rotation, domain ownership/routing/TLS, worker supervision/schedules, migration rollout and rollback. The Compose file provisions development PostgreSQL; it is not a complete production platform.
- **Recovery:** automated protected database/media backups, retention, off-host copies, point-in-time recovery where chosen and measured restore drills.
- **Observability:** errors/traces, uptime, DNS/SSL, worker lag, DB health, payment/mail failures, tenant resource usage, alerts and incident runbooks.
- **Defence in depth:** formal tenant access-control matrix, database isolation constraints/policies where appropriate, admin MFA/RBAC, upload threat policy and API abuse testing. Current owner-scoped queries are real isolation controls; their presence is not a complete security certification.
- **Privacy operations:** configurable retention, export/deletion requests and legal holds, consent records, policy versions, abuse reports and security incident handling.
- **Release engineering:** automated CI quality gates, staging acceptance, migration/rollback verification and load/concurrency coverage beyond existing targeted tests.
- **Accessibility/performance:** full WCAG 2.2 AA keyboard/screen-reader review, cross-browser/device tests, slow-network/mobile performance, long-content/empty/error scenarios and per-template evidence.
- **Live integration assurance:** payment sandbox end-to-end/callback recovery, verified email delivery/bounce behaviour, custom-domain TLS and Bunny migration. Existing simulated tests are not live-provider certification.
- **Commercial/legal launch decisions:** approved six-plan prices, service prices, trial/refund/retention/support/fair-use rules, merchant eligibility and reviewed legal content. Grace periods and Advanced site count are already decided and must not be reopened as unknowns.

## Not required to rebuild or treat as missing

Next.js shared rendering, PostgreSQL-backed queues and the current modular application are acceptable under the amendment. A NestJS rewrite, Redis/BullMQ, Kubernetes or S3 replacement is not an automatic requirement. Bunny is the requested storage direction. Automatic CAC checking is deferred by explicit instruction. Social login is not a first-release requirement. Marketplace, AI chat agents, ERP, multi-location inventory, international/multilingual commerce and unrestricted custom code are future/out-of-scope unless separately commissioned.

## Recommended delivery sequence

1. Close stock/payment recovery, policy lifecycle, template compatibility, concurrent editing and publishing-readiness gaps; add identity/admin security foundations.
2. Complete billing lifecycle and production email/domain/storage/recovery operations.
3. Finish Basic commerce (variants, pickup, persistent cart, notifications), then Growth/Advanced commerce and team roles.
4. Complete ten templates, richer inner pages, full CMS/marketing management and editorial workflows.
5. Deliver analytics/integrations, professional-service/support operations and expanded local-AI workflow.
6. Run the complete six-plan journeys and amendment T01–T20 in staging; publish a pass/fail report. Do not equate visual polish or the previous passing regression suite with completion of these journeys.
