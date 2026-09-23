# Launch readiness implementation checkpoint

23 September 2026. This records work after the baseline [product gap audit](PRODUCT-GAP-AUDIT-2026-09-23.md); it does not mark the full master document complete.

## Implemented

- Account MFA with authenticator setup, single-use recovery codes, replacement recovery codes, replay protection, mandatory MFA for internal administration, authenticated password changes, session listing and revocation. Security changes rotate sessions and queue email alerts.
- Subscription payment history and owner-scoped printable invoices. Verified payments are idempotent. Optional recurring billing requires explicit subscriber consent and a reusable payment authorization. Cancellation preserves paid access. Renewal terms are captured; uncertain charges are verified using the original reference instead of blindly resubmitted. Renewal reminders and bounded failed-payment retries run through maintenance.
- Stock reservation reconciliation verifies provider state before releasing inventory. Late payments after release require review. Uncertain initialization retains inventory for verification. Cart contents persist per website across catalogue/product navigation.
- Live-policy deletion/unpublication protection, business-policy checks, template/industry compatibility, core-page/link publishing checks, and optimistic revision checks for site and record saves.
- Refreshed login/registration layouts, accessible password reveal controls, live password requirements and confirmation indicators, including password reset. Article covers and author avatars now appear in shared cards on the homepage, Insights and contributor pages. Authors without a photo use initials, not a fabricated portrait. The marketing footer links to distinct product, resources, company, account and legal pages.

## Deployment requirements

1. Back up the database and existing encryption keys. Apply migrations **007–010** with `npm run db:migrate` before serving this build. Existing deployment migrations remain required.
2. Configure a stable **ENCRYPTION_KEY**, exactly 64 hexadecimal characters, before MFA enrollment or merchant/recurring-payment storage. Keep it private and backed up. Do not replace an existing key: changing it without migrating encrypted data makes stored credentials unreadable. MFA and payment authorization secrets use AES-256-GCM; recovery codes are hashed.
3. Administrators must visit `/account/security`, enroll an authenticator and save recovery codes before accessing internal administration. Existing sessions alone no longer grant admin access. There is no insecure MFA bypass for support.
4. Configure the server Paystack key, APP_URL and signed webhook, plus each store's merchant connection. Run `npm run worker:maintenance` regularly through the deployment scheduler, and run the email worker. A checkout redirect is never evidence of payment.
5. Automatic renewal defaults to **off**. Subscribers explicitly enable it in Subscription & billing after a successful reusable-method payment. Live provider charging, production email delivery and deployment scheduling still require environment validation; automated tests use an injected provider and an isolated database.

The implementation follows the [Paystack transaction API](https://paystack.com/docs/api/transaction/), [payment verification guidance](https://paystack.com/docs/payments/verify-payments/), [recurring-charge flow](https://paystack.com/docs/payments/recurring-charges/) and [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238).

## Verification

- Production build and TypeScript passed.
- 47 unit checks; 36 existing integration, 45 extension, 41 amendment, 12 recipient and 35 provisioning checks passed.
- 38 launch-readiness/security/payment-recovery and 13 subscription lifecycle checks passed. Total: **267 automated checks**.
- Browser checks covered 320px registration/password controls, 375px Insights image loading and footer links, and 1440px account/footer layout. Published article covers loaded as distinct WebP assets. Password reveal, all four requirements and confirmation matching were exercised.

Run isolated database suites with DATABASE_URL pointing to `omnyvox_test`; HTTP suites also need TEST_BASE_URL pointing at the server using that same database. The legacy `.mjs` suites use TEST_DATABASE_URL. Never run fixtures against production.

## Remaining work, in priority order

- Organisations, invitations, user seats, subscriber/internal action-level roles; authenticator-device replacement and assisted account-recovery procedures; versioned terms consent and other audited account gaps.
- Full plan-change and downgrade lifecycle, price versions, proration, invoice tax/billing-profile handling, subscription refunds and production provider validation.
- Operational resolution for late/uncertain payments and indefinitely unknown provider references. Unknown payment status intentionally retains inventory; support must investigate, not release potentially paid stock blindly.
- Commerce variants/SKUs, delivery zones/pickup, tax/coupons, customer records, richer fulfilment/refund workflows and dedicated cart/checkout journeys.
- Remaining template families, complete template section eligibility, CMS autosave/conflict-recovery UX, complete revision/approval workflows, and the advanced capabilities in the baseline audit.

The baseline audit remains historical evidence. Use this checkpoint alongside it to avoid counting the implemented items as still wholly missing.
