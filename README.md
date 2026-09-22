# Omnyvox

**Business websites. Built for your next step.**

Omnyvox is a pre-launch Websites-as-a-Service implementation for Nexoris Technologies Ltd. It includes a marketing site, subscriber workspace, shared corporate/storefront renderer, and protected platform administration. This repository is a working first release of the foundation and core website workflows, **not completion of every phase in the master requirements document**. See [implementation status](docs/IMPLEMENTATION.md) before treating it as commercially launch-ready.

## Stack

Current stable package versions were resolved from npm on 21 September 2026 and pinned exactly in `package.json` and `package-lock.json`: Next.js 16.3.5, React 19.3.0, TypeScript 7.0.2, PostgreSQL driver 8.23.0, Zod 4.6.5, Sharp 0.35.4, and Lucide 1.98.0. Node.js 26.9.0 is the target runtime. Fonts are self-hosted. PostgreSQL 18 is the deployment database; local integration tests also ran on the available PostgreSQL 17 installation.

The initial backend uses modular Next.js route handlers and PostgreSQL instead of introducing a separate NestJS service before the shared domain logic is established. `lib/` separates authentication, entitlements, commerce, database access, and public rendering. The recommended future NestJS/BullMQ/S3 split is recorded in the implementation status.

## Run locally

1. Install Node.js 26.9.0 and PostgreSQL 18, or start the database with `docker compose up -d`.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local`, and set `DATABASE_URL` and `APP_URL`.
4. Run `npm run db:setup`, then `npm run db:seed-marketing`.
5. Run `npm run dev`, then open [localhost:3000](http://localhost:3000).

The database schema is idempotent for this initial release. Adopt ordered, versioned migrations before production schema evolution.

The [interactive demo](http://localhost:3000/dashboard?demo=1) works without a database. Demo edits remain in session storage and cannot publish, upload media, or charge payments. Real accounts and websites use PostgreSQL; no demo data is inserted into production tables.

See the [September update](docs/RELEASE-2026-09.md) for onboarding, CMS, platform administration, offers and verification details.

## Product routes

| Route                                             | Purpose                                                      |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `/`                                               | Marketing site, templates, configured corporate prices, FAQs |
| `/onboarding`                                     | Email OTP and manual CAC business review                     |
| `/pricing`, `/templates`, `/contact`, `/insights` | Dedicated marketing and editorial pages                      |
| `/register`, `/login`                             | Account creation and sign-in                                 |
| `/verify`, `/forgot-password`, `/reset-password`  | Legacy verification links and password recovery              |
| `/dashboard`                                      | Subscriber overview and website creation                     |
| `/dashboard/editor`                               | Structured section editor and device previews                |
| `/dashboard/branding`                             | Logo, colours, typography, and contact email                 |
| `/dashboard/pages`, `/dashboard/articles`         | Content publishing                                           |
| `/dashboard/media`                                | WebP media library                                           |
| `/dashboard/products`, `/dashboard/orders`        | Catalogue and fulfilment                                     |
| `/dashboard/merchant`                             | Encrypted merchant payment configuration                     |
| `/dashboard/domains`                              | Domain connection and DNS verification                       |
| `/dashboard/seo`                                  | Metadata and category-in-URL preference                      |
| `/dashboard/billing`                              | Subscription payment and website export                      |
| `/dashboard/support`, `/dashboard/services`       | Initial support/setup request capture                        |
| `/admin`                                          | Platform operations, content, support, KYB, offers and audit |
| `/sites/{slug}`                                   | Shared website renderer; local path fallback                 |
| `/sites/{slug}?preview=1`                         | Private owner-only draft preview                             |

## Branding and media

The supplied Omnyvox logo sheet is the source of the WebP icon and wordmark. The original tagline is omitted from the extracted wordmark and replaced in the product with “Business websites. Built for your next step.” The primary colour is `#540CDA`.

Uploaded JPEG, PNG, and WebP images are decoded, auto-oriented, limited to 40 million input pixels, resized to a maximum 1920px edge, stripped of source metadata, and encoded as WebP. SVG upload is deliberately unavailable until a sanitisation pipeline exists. Media is tenant-scoped. Favicon and social images are WebP. Font files are served locally.

## Authentication and email

Passwords use salted scrypt hashes. Session tokens are random, stored hashed, expire after seven days, and use HttpOnly/SameSite cookies (Secure in production). Password reset revokes all sessions. Auth and form endpoints have database-backed rate limits; mutations enforce origin checks.

Six-digit verification codes and password-reset emails are written to `email_outbox`. Configure `RESEND_API_KEY` and a verified `EMAIL_FROM`, then run `node --env-file=.env.local scripts/send-email.mjs` on a scheduler. The worker uses row locks and provider idempotency keys. It does not run automatically during local development. No real emails were sent during tests. Email verification is required before publishing.

After registering an internal operator, assign administration explicitly:

```sh
node --env-file=.env.local scripts/admin.mjs operator@example.com
```

Ordinary registrations never receive administration privileges.

## Payments

All monetary values are integer minor units. The admin screen accepts NGN and converts to kobo. All six plans start **unpriced**. No commercial price was invented.

### Omnyvox subscriptions

Set the platform `PAYSTACK_SECRET_KEY`. Set the Paystack webhook to `APP_URL/api/webhooks/paystack`. Subscription checkout initializes server-side. An HMAC-verified successful webhook must match the stored reference, amount, and currency before access is activated. Duplicate webhooks do not extend access twice. Monthly/annual payments extend `paid_until`. Annual offers can include a percentage discount and bonus months. After expiry, annual subscriptions retain access for seven days and monthly subscriptions for one day; these are internal rules, not marketed benefits. Websites retain their content after deactivation.

This release supports **manual renewal payments**, not automatic recurring subscriptions, proration, refunds, invoices, or automatic renewal retries. Do not advertise those capabilities until implemented and approved.

### Subscriber store payments

Generate a 32-byte encryption key and put its 64-character hexadecimal representation in `ENCRYPTION_KEY`. Each store connects its own Paystack key. Credentials are encrypted with AES-256-GCM and never returned to the browser. A connection requires review before live checkout:

```sh
node --env-file=.env.local scripts/approve-merchant.mjs WEBSITE_UUID "verification evidence reference"
```

Use `APP_URL/api/webhooks/store/WEBSITE_UUID` in that merchant’s Paystack account. Store orders are separate from platform billing records. Checkout reloads prices on the server and reserves inventory with row locks. Webhooks validate the merchant-specific signature, reference, amount, and currency. Payment and fulfilment states are separate. Late payments on cancelled reservations require manual review.

Pending checkout reservations are not yet automatically reconciled or expired. Production needs the reconciliation/expiry worker and refund handling described in `docs/IMPLEMENTATION.md` before accepting real orders. Tests used synthetic signed events; no live or provider-sandbox charge was performed.

## Domains and SEO

Set `PLATFORM_DOMAIN` to the production apex. Configure wildcard DNS and a reverse proxy/hosting provider that forwards verified hostnames to the Next.js service. Reserved application hosts are separate from tenant rendering. Never forward an arbitrary user-controlled hostname from an untrusted upstream.

Growth/Advanced owners add domains and verify a generated `_omnyvox` TXT token. Ownership verification does **not** automatically provision TLS or activate routing. Once the operator has provisioned valid HTTPS:

```sh
node --env-file=.env.local scripts/activate-domain.mjs customer.example.com
```

Only verified, active domain records resolve to a tenant. Basic cannot use custom domains. The initial primary custom-domain choice is the first verified active hostname alphabetically; a primary-domain selection UI and alias redirects remain on the roadmap.

Published content generates organisation, article/author, product/offer, and breadcrumb JSON-LD as applicable. Schema uses real stored names, prices, availability, and authors; no invented ratings or reviews. JSON-LD escapes `<` to prevent script breakout. Category URL changes permanently redirect the alternate supported article URL to the preferred path. Public sites have their own sitemap and robots endpoints. Draft previews, application routes, and order status pages are noindex.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

With a running app and an isolated PostgreSQL database:

```sh
# Set TEST_DATABASE_URL to the same isolated database used by the app.
node scripts/integration-test.mjs
node scripts/extensions-test.mjs
# Commerce tests enforce the local test database port 55432.
node --env-file=.env.local --import tsx scripts/commerce-test.ts
```

Tests create uniquely named `qa…` accounts and data. They must not run against production. They do not send email or contact payment gateways.

Validated: five core tests; 37 API/rendering/account-recovery/media checks; five merchant webhook checks. Browser checks covered desktop and 280px widths, mobile navigation, brand-colour editing and saving, and editor previews. This is not a complete accessibility audit or a substitute for payment-provider sandbox certification.

## Production preparation

Use the Dockerfile or a Node.js host with PostgreSQL connectivity. Configure secrets outside Git, HTTPS, ingress body-size limits, connection pooling, backups, logging, worker scheduling, and monitoring. Approve prices, legal documents, support commitments, retention, refunds, and suspension policy before onboarding paying customers. See the explicit remaining work in [implementation status](docs/IMPLEMENTATION.md).

For Docker builds, pass `--build-arg APP_URL=https://your-platform-domain --build-arg PLATFORM_DOMAIN=your-platform-domain` so statically generated marketing metadata uses the correct public address. Supply the same values and server secrets at runtime. Never pass payment or encryption secrets as build arguments.

## References

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Node.js current releases](https://nodejs.org/en/blog)
- [Paystack webhook validation](https://paystack.com/docs/payments/webhooks/)
- [Paystack transaction verification](https://paystack.com/docs/payments/verify-payments/)
- [Resend idempotency keys](https://resend.com/changelog/idempotency-keys)
- [Vercel multi-tenant reference](https://vercel.com/templates/next.js/platforms-starter-kit)

The visual direction uses the editorial clarity and template previews common to mature website builders, with original Omnyvox layouts rather than copied source code or assets.
