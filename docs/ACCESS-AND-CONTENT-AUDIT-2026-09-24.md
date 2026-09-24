# Access, content and marketing audit — 24 September 2026

Follows `QA-AUDIT-2026-09-24.md`. Everything marked **Fixed** is in the build and covered by automated checks (`test:sites`, `test:admin-ops`, unit tests).

## 1. Branding

| Issue | Status |
| --- | --- |
| Logo files had solid white backgrounds; the footer inverted them into a white box and the sidebar showed a white tile | **Fixed.** Transparent logo files for light backgrounds and a dark-background variant (white "omny", lifted purple) generated from the original artwork (`scripts/prepare-logo-variants.mjs`, masters in `brand/`). Footer and workspace sidebar use the dark variant; the CSS inversion hack is removed. |

## 2. Marketing website — page by page

| Page | What was missing or weak | Now |
| --- | --- | --- |
| Home | Founder story and another section sat after the FAQ | FAQ is followed only by the final call to action. All ten templates with a filter; testimonials section appears only with consented testimonials. |
| Templates | Ten large rows with every image on the left | Balanced three-column cards grouped into Business websites and Online stores, with filter tabs, browser-framed previews, "best for" industries, Preview and Use buttons. |
| Template previews | Single pages; `#` legal links; many inner pages were a one-line placeholder | Multi-page previews; every default page has a purpose-built layout (see §3). |
| Business websites, Online stores | Three short paragraphs; missed newer features | Rewritten with concrete benefits, bullet points, related links and a call to action. |
| Features (+ 7 sub-pages) | Index didn't link to sub-pages; stiff, technical copy | Plain-English rewrite; index links to every feature page. |
| Insights & blogging | Missing | **New** feature page (articles, categories, authors by plan, Advanced FAQ pages). |
| Security & privacy | Missing | **New** page: account security, payments, customer data, verification, NDPA rights. Linked in the footer. |
| How it works, Website setup, Professional services, Migration | Thin and procedural | Rewritten step by step with clear expectations. |
| About | Generic mission statement | Why Omnyvox exists, what we believe, who we are. |
| Help, Guides, FAQs | Few answers; one inaccurate publishing requirement | Expanded and corrected; links between help pages. |
| Pricing | No link to the comparison; no billing answers | "Compare all features" jump link and a billing FAQ. |
| Contact | No response-time expectation, no other ways to reach us | Clear expectation, links to Help and FAQs, and company email/phone/address/hours (set in Platform admin → Marketing settings; hidden until filled in). |
| Footer | Wrong logo variant | Correct logo, contact line when set, Security link. |

Copy rules applied: second person, short sentences, no jargon, no claims the product cannot back up.

**Recommended next:**
1. ~~Decide whether business verification should be required to publish~~ — **done 24 September 2026.** Every website now needs a verified business (the account owner's CAC verification) before it can be published. It is the first item in the new publishing checklist on the dashboard and editor, and the server refuses to publish without it. Customers can still build and preview freely.
2. Fill in company contact details in Marketing settings.
3. Add real testimonials once customers consent, and case studies later.
4. Have counsel review the five platform policies.

## 3. Template pages

Every default page of every industry now has its own layout with starter wording, validated by a unit test (no page falls back to a placeholder, every section is allowed by its template, and all starter content is flagged for review before publishing).

| Page type | Sections |
| --- | --- |
| About | Story, highlights, team or gallery, call to action |
| Services / Solutions / Practice areas / Medical services / Programmes / Properties | Service cards, process, FAQs, call to action |
| Portfolio / Projects / Gallery | Work gallery with captions, process, call to action |
| Team / People | Team profiles, "what you can expect", call to action |
| Admissions | Intro, five-step process, documents list, FAQs, visit call to action |
| Impact | Intro, focus areas, gallery, reports and accounts, support call to action |
| Rooms | Room types, amenities, booking FAQs, booking call to action |
| Coverage | Intro, service areas, process, quote call to action |
| Size guide / Measurements / Buying guide / Product guide | Guidance (with tables where useful), step-by-step, FAQs, help call to action |
| Facilities | Facilities, gallery, visit call to action |
| Contact | Contact block and FAQs |

**FAQ page:** no longer created by default (migration 021 removes it from every industry's default pages; existing FAQ pages are kept). **Advanced** websites get an "Add FAQ page" button in Pages that creates a ready-made FAQ page, and their pages publish FAQPage structured data built from the visible questions. Other plans see the feature labelled "Advanced plan"; the server refuses FAQ pages below Advanced.

## 4. Dashboard by website type

One rule set (`lib/modules.ts`) decides modules for the server, the dashboard and the demo:

| Module | Business website | Online store |
| --- | --- | --- |
| Edit homepage, Pages, Brand, Media, Legal, SEO, Templates | ✓ | ✓ |
| Insights, Authors (Growth+) | ✓ | ✓ |
| Insight categories (Growth+) | ✓ | — (store categories are shared) |
| Industry collections (Practice areas, People, Projects, Programmes…) | ✓ | — |
| Products, Categories, Orders, Delivery & pickup, Store payments | — | ✓ |
| Forms & enquiries, Business information, Domain (Growth+), Billing | ✓ | ✓ |

**Fixed:** the demo workspace and the "no website yet" state previously showed every module, including store tools for a business website. The sidebar is now grouped (Website, Content, Store, Customers, Account). The server independently refuses store modules for business websites and collections for stores.

## 5. Who can see and do what

### Website team roles

| Area | Owner | Administrator | Editor | Store manager |
| --- | --- | --- | --- | --- |
| Homepage, brand, SEO, templates | Edit | Edit | — | — |
| Pages, articles, authors, categories, collections, media | ✓ | ✓ | Drafts only | Media |
| Legal pages, enquiries, publish | ✓ | ✓ | — | — |
| Products, orders, delivery & pickup | ✓ | ✓ | — | ✓ |
| Store payments, domains, business information, billing, team | ✓ | — | — | — |

The Analyst role was retired on 24 September 2026 (migration 022).

**Fixed:** the sidebar now shows each role only what the server allows (previously editors saw Billing, Store payments and Domains and were refused on click). The Store manager role can only be given in workspaces that have an online store.

### Plans

| Feature | Basic | Growth | Advanced |
| --- | --- | --- | --- |
| Websites | 1 | 1 | 3 |
| Published pages / products | 5 / 25 | 15 / 250 | 100 / 2,000 |
| Insights articles | — | 100 | 1,000 |
| Author profiles | — | 3 | 25 + professional links |
| Insight categories | — | ✓ | ✓ |
| Custom domain, video embeds | — | ✓ | ✓ |
| FAQ page with FAQ rich results | — | — | ✓ |
| Content history | — | — | ✓ |
| Team seats | 1 | 3 | 10 |

**Fixed:** Basic websites could create author profiles and insight categories through the API; both are now refused.

### Platform staff roles

| Admin area | Super admin | Operations | Support | Finance | Billing | Technical | Compliance | Content | Designer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Accounts (view / disable, restore, resend code) | ✓ | ✓ / ✓ | ✓ / — | — | — | — | — | — | — |
| Email delivery (view / retry) | ✓ | ✓ / ✓ | ✓ / — | — | — | ✓ / ✓ | — | — | — |
| Subscriptions | ✓ | ✓ | — | ✓ | ✓ | — | — | — | — |
| Payment reviews | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| Merchant payments | ✓ | — | — | ✓ | — | — | ✓ (approve) | — | — |
| Business verification, account recovery | ✓ | — | — | — | — | — | ✓ | — | — |
| Domains, storage, AI | ✓ | — | — | — | — | ✓ | — | — | — |
| Contact inbox, customer requests | ✓ | ✓ (requests) | ✓ | — | — | — | — | — | — |
| Marketing CMS (insights, authors, categories, pages, testimonials, media) | ✓ | — | — | — | — | — | Legal only | ✓ | Pages, media |

All staff need two-step verification to open the admin.

## 6. Recommendations not yet built

1. ~~Analyst role~~: retired on 24 September 2026. Consider a website analytics screen for owners and administrators instead (visits, top pages, enquiries and orders over time).
2. **Separate store categories from insight categories.** Stores with Insights share one category list for products and articles; give articles their own list.
3. **Plan-change prompts in context.** Where a locked feature appears (FAQ page, author links, domains), link straight to the plan change screen with the target plan preselected.
4. **Template switching preview.** Let owners preview their current content in another template before switching.
5. **Custom domain activation** is still confirmed manually by staff; automate certificate issuance when the hosting provider supports it.

## 7. Test accounts

`npm run db:seed-test-accounts` (with `SEED_PASSWORD`) creates or updates a super administrator and a subscriber with a verified business and an Advanced website active for a year. It refuses to run with `NODE_ENV=production`, and the password is never stored in the repository. The super administrator must set up two-step verification on first visit to the admin; that is intentional.
