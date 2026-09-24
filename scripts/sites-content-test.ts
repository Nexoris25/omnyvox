import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool, query } from "../lib/db";
import { lookupCac, cacInput } from "../lib/kyb";

if (!/\/omnyvox_test(\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Run against the isolated omnyvox_test database only.");
const base = process.env.TEST_BASE_URL || "http://localhost:3010";

let passes = 0;
const check = (v: unknown, label: string) => {
  assert.ok(v, label);
  passes++;
  console.log("PASS", label);
};
const page = async (path: string) => {
  const r = await fetch(base + path);
  return { status: r.status, html: await r.text() };
};

try {
  // Registry provider parsing (Dojah response shape), without network.
  process.env.KYB_PROVIDER = "dojah";
  process.env.DOJAH_APP_ID = "app";
  process.env.DOJAH_SECRET_KEY = "secret";
  let seen = "";
  const dojah = (async (url: URL, init: RequestInit) => {
    seen = `${url.pathname}?${url.searchParams} ${(init.headers as Record<string, string>).AppId}`;
    return new Response(
      JSON.stringify({ entity: { company_name: "ACME NIGERIA LIMITED", rc_number: "1234567", address: "1 Broad St, Lagos", date_of_registration: "2015-06-01", status: "ACTIVE" } }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;
  const hit = await lookupCac(cacInput.parse({ companyType: "RC", cacNumber: "RC 1234567" }), dojah);
  check(
    hit.status === "found" && hit.record.name === "ACME NIGERIA LIMITED" && hit.record.reference === "RC1234567" &&
      seen.startsWith("/api/v1/kyc/cac?rc_number=1234567&company_type=RC app"),
    "Dojah CAC lookups send the number and type and read the registered name",
  );
  const missing = await lookupCac(
    cacInput.parse({ companyType: "BN", cacNumber: "1" + "234567" }),
    (async () => new Response(JSON.stringify({ error: "Company not found" }), { status: 400 })) as unknown as typeof fetch,
  );
  check(missing.status === "not_found", "Registry 'not found' responses are reported as not found");
  const down = await lookupCac(
    cacInput.parse({ companyType: "IT", cacNumber: "7654321" }),
    (async () => {
      throw Error("offline");
    }) as unknown as typeof fetch,
  );
  check(down.status === "unavailable", "An unreachable registry is reported as unavailable, never as verified");
  delete process.env.DOJAH_APP_ID;
  check((await lookupCac(cacInput.parse({ companyType: "RC", cacNumber: "1234567" }))).status === "unavailable", "Without credentials the registry is unavailable");

  // A published Growth website with categories, authors and articles.
  const [owner] = await query<{ id: string }>(
    "INSERT INTO users(name,email,password,email_verified) VALUES('Content QA',$1,'x',true) RETURNING id",
    [`content-${randomUUID()}@example.test`],
  );
  await query(
    "INSERT INTO business_verifications(user_id,business_name,cac_number,status,registered_name,verified_via) VALUES($1,'QA LIMITED','RC1234567','verified','QA LIMITED','registry')",
    [owner.id],
  );
  const slug = `content-${randomUUID().slice(0, 8)}`;
  const { previewSite } = await import("../lib/industry-kits");
  const data = previewSite("legal", "corporate", { name: "Ashford QA" }).data;
  const [site] = await query<{ id: string }>(
    "INSERT INTO sites(owner_id,name,slug,category,tier,status,subscription,paid_until,industry_id,data,published) VALUES($1,'Ashford QA',$2,'corporate','growth','published','active',now()+interval '20 days','legal',$3,$3) RETURNING id",
    [owner.id, slug, JSON.stringify(data)],
  );
  const rec = (kind: string, d: Record<string, unknown>, ageMinutes = 0) =>
    query<{ id: string }>(
      "INSERT INTO records(site_id,kind,data,created_at) VALUES($1,$2,$3,now()-$4*interval '1 minute') RETURNING id",
      [site.id, kind, JSON.stringify({ status: "published", body: "<p>Body text.</p>", category: "general", ...d }), ageMinutes],
    );
  await rec("categories", { title: "Tax Advice", slug: "tax-advice" });
  await rec("categories", { title: "Company Law", slug: "company-law" });
  const [author] = await rec("authors", {
    title: "Ngozi Adeyemi",
    slug: "ngozi-adeyemi",
    role: "Managing Partner",
    links: { linkedin: "https://www.linkedin.com/in/example" },
  });
  for (let i = 1; i <= 4; i++)
    await rec(
      "articles",
      { title: `Article number ${i}`, slug: `article-${i}`, category: i % 2 ? "tax-advice" : "company-law", authorId: author.id, author: "Ngozi Adeyemi" },
      i * 10,
    );
  await rec("legal", { title: "Privacy policy", slug: "privacy-policy", policyType: "privacy", policyReviewed: true });

  const home = await page(`/sites/${slug}`);
  check(home.status === 200 && home.html.includes("Latest insights"), "The homepage shows a Latest insights section");
  check(
    home.html.includes("Article number 1") && home.html.includes("Article number 3") && !home.html.includes("Article number 4"),
    "The homepage shows only the three newest published articles",
  );
  check(home.html.includes("RC1234567"), "The footer shows the verified CAC registration");
  check(!home.html.includes("EXPLORE"), "The leftover page-card grid is gone from the homepage");

  const all = await page(`/sites/${slug}/insights`);
  check(all.status === 200 && all.html.includes("Tax Advice") && all.html.includes("Company Law"), "The Insights page lists the subscriber's categories");
  const tax = await page(`/sites/${slug}/insights?category=tax-advice`);
  check(
    tax.html.includes("Article number 1") && tax.html.includes("Article number 3") && !tax.html.includes("Article number 2"),
    "Filtering by category shows only that category's articles",
  );
  check(/aria-current="page"[^>]*>Tax Advice|Tax Advice[^<]*<span>2/.test(tax.html), "The active category is highlighted with its count");

  const article = await page(`/sites/${slug}/insights/article-1`);
  check(
    article.html.includes("About the author") && article.html.includes("/authors/ngozi-adeyemi") && article.html.includes("Managing Partner"),
    "Articles link to an author profile with name and role",
  );
  check(!article.html.includes("linkedin.com/in/example"), "Professional links stay hidden on Growth");
  await query("UPDATE sites SET tier='advanced' WHERE id=$1", [site.id]);
  const advanced = await page(`/sites/${slug}/insights/article-1`);
  check(advanced.html.includes("linkedin.com/in/example"), "Professional links appear on Advanced");
  const profile = await page(`/sites/${slug}/authors/ngozi-adeyemi`);
  check(profile.status === 200 && /Articles by (<!-- -->)?Ngozi Adeyemi/.test(profile.html), "The author page lists their articles");

  await query("UPDATE sites SET tier='basic' WHERE id=$1", [site.id]);
  check((await page(`/sites/${slug}/insights`)).status === 404, "Insights are unavailable on Basic");

  // Dashboard modules follow website type, plan and role.
  const { buildModules } = await import("../lib/modules");
  const keys = (m: { key: string }[]) => m.map((x) => x.key);
  const corporate = keys(buildModules({ category: "corporate", tier: "advanced" }, { people: "People" }));
  const storeModules = keys(buildModules({ category: "commerce", tier: "advanced" }));
  check(
    !["products", "orders", "fulfilment", "merchant"].some((k) => corporate.includes(k)) && corporate.includes("people"),
    "Business websites get their industry collections and no store tools",
  );
  check(["products", "orders", "fulfilment", "merchant"].every((k) => storeModules.includes(k)) && !storeModules.includes("people"), "Stores get store tools");
  const editor = keys(buildModules({ category: "commerce", tier: "advanced", role: "editor" }));
  check(!["billing", "merchant", "domains", "business", "orders", "editor"].some((k) => editor.includes(k)) && editor.includes("articles"), "Editors only see content tools");
  const manager = keys(buildModules({ category: "commerce", tier: "advanced", role: "store_manager" }));
  check(manager.includes("orders") && manager.includes("products") && !manager.includes("pages") && !manager.includes("billing"), "Store managers only see store tools");

  // API gates for plan features, using the site owner's session.
  const { createHash, randomBytes } = await import("node:crypto");
  const token = randomBytes(32).toString("hex");
  await query("INSERT INTO sessions(token,user_id,expires,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)", [createHash("sha256").update(token).digest("hex"), owner.id]);
  const api = async (path: string, method: string, body?: unknown) => {
    const r = await fetch(`${base}/api/${path}`, {
      method,
      headers: { Cookie: `omnyvox_session=${token}`, Origin: base, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return r.status;
  };
  check((await api(`sites/${site.id}/authors`, "POST", { title: "Basic Author", slug: "basic-author", status: "draft" })) === 403, "Basic websites cannot create author profiles");
  check((await api(`sites/${site.id}/categories`, "POST", { title: "Basic Cat", slug: "basic-cat", status: "draft" })) === 403, "Basic business websites cannot create insight categories");
  await query("UPDATE sites SET tier='growth' WHERE id=$1", [site.id]);
  const faqPage = { title: "Frequently asked questions", slug: "faq", body: "", status: "draft", category: "general" };
  check((await api(`sites/${site.id}/pages`, "POST", faqPage)) === 403, "FAQ pages need the Advanced plan");
  await query("UPDATE sites SET tier='advanced' WHERE id=$1", [site.id]);
  const created = await api(`sites/${site.id}/pages`, "POST", faqPage);
  check([200, 201].includes(created), "Advanced websites can add an FAQ page");
  await query(
    "UPDATE records SET data=data||$2::jsonb WHERE site_id=$1 AND kind='pages' AND data->>'slug'='faq'",
    [site.id, JSON.stringify({ status: "published", sections: [{ id: "q", type: "faq", title: "FAQ", body: "", visible: true, faqs: [{ question: "Do you offer free consultations?", answer: "Yes, the first meeting is free." }] }] })],
  );
  const faqHtml = (await page(`/sites/${slug}/faq`)).html;
  check(faqHtml.includes('"@type":"FAQPage"') && faqHtml.includes("Do you offer free consultations?"), "Advanced FAQ pages publish FAQPage structured data");
  await query("UPDATE sites SET tier='growth' WHERE id=$1", [site.id]);
  check(!(await page(`/sites/${slug}/faq`)).html.includes('"@type":"FAQPage"'), "FAQ structured data is an Advanced feature");

  // Template previews are multi-page with working legal links.
  const preview = await page("/templates/trust");
  check(preview.status === 200 && preview.html.includes('href="/templates/trust/about"'), "Template previews link to real inner pages");
  check(preview.html.includes('href="/templates/trust/legal/privacy"'), "Template preview footers link to real legal pages");
  for (const p of ["about", "contact", "insights", "legal/terms", "legal/privacy"])
    check((await page(`/templates/trust/${p}`)).status === 200, `Template preview page /${p} loads`);
  const people = await page("/templates/trust/people");
  check(people.status === 200 && people.html.includes("What you can expect from us"), "Preview inner pages use purpose-built sections, not a placeholder");
  const sizes = await page("/templates/atelier/size-guide");
  check(sizes.status === 200 && sizes.html.includes("Find your size") && sizes.html.includes("<table"), "Store guide pages include real guidance");
  const store = await page("/templates/glow/shop");
  check(store.status === 200 && store.html.includes("All products"), "Store template previews include a Shop page");
  check((await page("/templates/trust/not-a-page")).status === 404, "Unknown preview pages return 404");

  // Marketing site legal pages exist and are in the footer.
  const marketing = await page("/");
  for (const slugName of ["terms", "privacy", "cookies", "acceptable-use", "refunds"])
    check(marketing.html.includes(`href="/legal/${slugName}"`), `Marketing footer links to /legal/${slugName}`);
  check((await page("/legal/cookies")).status === 200, "The cookie policy page loads");
  console.log(`${passes} site content checks passed`);
} finally {
  await pool.end();
}
