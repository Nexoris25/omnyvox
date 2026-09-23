# Omnyvox brand refresh — 23 September 2026

## Source of truth

Fetched `origin/dev` at `dda2db0`, seven commits ahead of the previous main release (`876d1f2`). Work starts on `codex/brand-refresh` from that exact dev commit. The untracked `.claude/` directory belongs to the local workspace and is excluded from this release.

The dev baseline supersedes the prior status record: seven visual template families; manifest-driven modules; multiple verified enquiry recipients; LocalBusiness and Service schema; video embeds; industry starter pages; image editing; industry-specific legal sets; and brand social icons. Software & IT was retired in that branch. These changes are preserved.

## Identity and usage

Keep the supplied Omnyvox symbol and wordmark. The core promise is **Business websites. Fully managed.** Use plain, specific copy about websites, stores, content and enquiries. Do not imply unimplemented services or guaranteed business results.

| Role          | Colour  | Usage                                                  |
| ------------- | ------- | ------------------------------------------------------ |
| Primary       | #540CDA | Main actions, selected states, links on light surfaces |
| Primary hover | #4208AD | Hover/pressed primary actions                          |
| Ink           | #171329 | Main text and operational navigation                   |
| Muted ink     | #625B71 | Secondary text on light backgrounds                    |
| Canvas        | #F7F6FA | Workspace background                                   |
| Surface       | #FFFFFF | Forms, cards, content surfaces                         |
| Violet tint   | #F0EAFE | Subtle grouping and selected backgrounds               |
| Mint          | #C6F5DD | Small decorative accents on ink backgrounds            |
| Success ink   | #176345 | Status labels; never colour alone                      |

Manrope headings and DM Sans body text remain locally hosted. Maintain readable body copy, visible keyboard focus, descriptive form labels, touch targets and reduced-motion support. Green is an accent/status colour, not a second primary button colour.

Customer and internal administration use the same visual tokens, with a dark navigation rail and light work surfaces. Marketing uses generous whitespace, editorial photography and clear action hierarchy. Subscriber sites use their own chosen palette and logo; platform branding must not override their colours.

## Imagery

Original AI-generated editorial scenes illustrate Nigerian businesses and products. They are not actual customer testimonials, staff identities, healthcare credentials or completed project evidence. Template images remain explicitly marked as samples and subject to the existing owner-review publishing gate.

Each new photograph has one section assignment; template gallery thumbnails represent their corresponding template rather than a second unrelated photo use. Image-led hero/About sections use photography. Service icons, process steps, forms and FAQs use lightweight functional visuals where appropriate. Bundled vector artwork is retained as editable source and exported to WebP for delivery. Existing customer-uploaded images and brand settings are not replaced.

Final assets are stored in the repository, with responsive variants for the new photography. The asset inventory records provenance and intended placement. Validation and release commit are recorded after verification.

## Verification and release

The production build and TypeScript checks passed. Automated verification passed 217 checks: 43 unit, 35 provisioning, 12 recipient routing, 45 extensions, 36 integration, 41 amendment and 5 commerce checks. Database-backed checks ran against the separate `omnyvox_test` database. These checks cover tenant boundaries, authentication, publishing, contact routing, subscriptions, payment callbacks and storage migration safeguards; they do not substitute for live provider credentials or production operations testing.

Browser checks covered all seven public templates at 320, 375, 390, 768 and 1440 pixels with no horizontal document overflow. Home, pricing, contact, insights, templates, customer branding and internal administration also passed the 320px overflow check. Mobile navigation worked, and a subscriber palette change persisted after saving and reloading. Desktop and mobile screenshots are in `docs/qa/brand-refresh/`.

The 18 new original photographs have distinct content hashes, compressed 1440px WebP exports and smaller 640px variants. The artwork generator was run twice; the final comparison confirmed all photographic files remained unchanged. It regenerates 138 SVG illustrations and corresponding WebP delivery assets without clearing the samples directory.

Release target: `main`, preserving the full `dda2db0` dev ancestry. The commit containing this record identifies the branding release. This record describes the branding scope, not completion of every future feature in the master roadmap.
