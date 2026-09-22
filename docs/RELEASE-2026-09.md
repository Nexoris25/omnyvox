# September 2026 update

## Implemented

- Sticky, mobile-friendly marketing navigation; dedicated pricing, template gallery and previews, contact, Insights, article, author and legal pages.
- Original WebP photographs with one visible placement each; transparent favicon based on the supplied logo. See [asset prompts and placement](IMAGE-ASSETS.md).
- Marketing CMS for articles, categories, authors and legal pages; social links, crawling rules and indexing preferences.
- Reusable Tiptap rich text editor with headings, formatting, lists, links, alignment, tables, undo/redo and media selection. Shared by website sections, page/product/article content and the marketing CMS.
- Shared section composer: maximum 15 sections per page, images and descriptions, column/row/reversed layouts, up to three CTA buttons, structured FAQs and an Insights section. Preview preset is 375px; responsive layouts target 320px and above.
- Tenant legal pages in the published footer, business-specific policy recommendations, social links, configurable enquiry email recipient and email outbox delivery.
- Six-digit email verification, 10-minute expiry, five-attempt limit and 60-second resend cooldown. Password confirmation and minimum eight characters including uppercase, number and special character.
- CAC registration submission with explicit **manual review**, review evidence, decision and administrator audit. Automated provider checks are not implied.
- Basic and Growth accounts allow one website; Advanced allows three. Creation is serialized per owner. Additional websites inherit the primary website's subscription, billing interval and suspension, and retain their own content/media scopes. Mixed-category bundles are not supported.
- Admin workspaces for contacts/replies, customer support/setup requests, business review, accounts, subscriptions, merchant approvals, domains, marketing content/media/settings, prices/content limits, offers and audit history.
- Annual percentage discounts and bonus months are configurable per plan. A nonzero discount is calculated against 12 monthly payments; otherwise the explicit annual price applies. The checkout stores its amount and bonus months so later offer changes cannot alter that payment.
- Public availability includes a private seven-day annual / one-day monthly expiry grace period. It is not included in marketing copy. The central effective subscription view also governs media, contact forms, checkout and sitemaps.
- Media descriptions and deletion of unused images; published/draft references prevent deleting images still in use. Uploaded files are re-encoded as WebP.

## Setup and external services

Apply `infrastructure/schema.sql`, then run `scripts/seed-marketing.ts` to add initial editorial content and editable platform notices. Existing editorial text is preserved. The original shared article cover is migrated to separate covers.

Set production prices and company social URLs in admin. Configure the platform Paystack key, merchant encryption key, approved merchant accounts, signed webhook endpoints, Resend credentials/verified sender and the scheduled email-outbox worker. Local verification creates queued emails and synthetic payment events; it does not send email or make real charges. Marketing legal notices describe the implementation and need operator review against actual production practices; data subject rights were checked against the [Nigeria Data Protection Commission](https://ndpc.gov.ng/).

The original master-document roadmap is still broader than this update. Automatic recurring billing, invoice/refund workflows, team invitations, automated domain/TLS provisioning, media object storage, revisions and commerce reconciliation remain tracked in [implementation status](IMPLEMENTATION.md).

## Validation

The production build and 98 automated checks passed on 22 September 2026: 11 unit tests, 37 original integration checks, 45 extension checks and five signed-payment/stock checks. A separate rendered-page audit confirmed five distinct photographs across five marketing placements, with no cover-photo reuse in article previews. Browser checks at 320px found no horizontal overflow on the homepage, pricing, templates, Insights, contact, registration, editor or support inbox.

Run unit tests, production build, `scripts/integration-test.mjs`, `scripts/extensions-test.mjs` and `scripts/commerce-test.ts` against an isolated database. The extension suite covers password matching, OTP and KYB scope, concurrent website limits, cross-tenant authors/media, HTML-encoded image references, legal/social rendering, notification recipients, robots/noindex, grace boundaries, inherited subscriptions, admin-only support/CMS access and reply deduplication.

Browser checks exercise mobile navigation, rich text editing and saving, the 375px preview preset, admin support and 320px page layouts. These checks are not a complete accessibility, penetration or provider-certification audit.
