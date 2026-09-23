# Account work checkpoint — 23 September 2026

Development checkpoint requested before continuing the remaining implementation.

Implemented since the previous release: organisations and team invitations, reserved seats, subscriber permission checks, scoped internal staff roles, staff role management, versioned registration consent, phone capture, policy acceptance history, authenticator replacement, profile/email-change flows, and assisted recovery with independent reviews and a security delay.

Verification at this checkpoint:

- TypeScript passes with the current changes.
- 25 organisation/permission/consent checks passed against the isolated database.
- A production build passed before the subsequent profile and assisted-recovery additions.
- Profile/email changes, authenticator replacement and assisted recovery still require integration verification. The full regression suite has not yet been rerun against this checkpoint.

Migrations 011–014 are required. Only 011–012 have been applied to the isolated test database at this checkpoint. Deployments must run the migration runner before serving this code. Registration now requires the published platform Terms and Privacy notice plus explicit acceptance of their current versions. Existing accounts are not retroactively marked as having accepted them.

This is not a completed release or completion of the master-document roadmap. Continue with recovery/security tests, billing and plan transitions, payment resolution, commerce, templates/CMS and the advanced capabilities recorded in the baseline audit. Production provider validation remains an external-environment task.
