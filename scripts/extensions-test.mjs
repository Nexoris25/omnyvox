import assert from "node:assert/strict";
import pg from "pg";
import sharp from "sharp";
const base = process.env.TEST_BASE_URL || "http://localhost:3001";
if (!process.env.TEST_DATABASE_URL?.includes("55432"))
  throw Error("Use the isolated local database");
const db = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
const prefix = "ext" + Date.now();
let count = 0;
async function call(path, method = "GET", body, cookie = "") {
  const r = await fetch(base + "/api/" + path, {
    method,
    headers: {
      Origin: base,
      ...(body ? { "Content-Type": "application/json" } : {}),
      cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await r.json();
  } catch {}
  return {
    status: r.status,
    data,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
function check(ok, label) {
  assert.ok(ok, label);
  count++;
  console.log("PASS", label);
}
async function register(suffix) {
  const email = prefix + suffix + "@example.test";
  const r = await call("auth/register", "POST", {
    name: "Extension QA",
    email,
    password: "Strong1!",
    confirmPassword: "Strong1!",
  });
  check(r.status === 201, "Register " + suffix);
  return { ...r, email };
}
try {
  check(
    (
      await call("auth/register", "POST", {
        name: "Test",
        email: prefix + "bad@example.test",
        password: "Strong1!",
        confirmPassword: "Different1!",
      })
    ).status === 400,
    "Server rejects mismatched passwords",
  );
  const a = await register("a"),
    b = await register("b");
  check(
    (await call("onboarding/resend", "POST", {}, a.cookie)).status === 429,
    "OTP resend cooldown",
  );
  check(
    (
      await call(
        "onboarding/business",
        "POST",
        {
          businessName: "Test Business",
          cacNumber: "RC1234567",
          consent: true,
        },
        a.cookie,
      )
    ).status === 403,
    "KYB requires verified email",
  );
  const {
    rows: [mail],
  } = await db.query(
    "SELECT body FROM email_outbox WHERE recipient=$1 ORDER BY created_at DESC LIMIT 1",
    [a.email],
  );
  const code = mail.body.match(/code is (\d{6})/)[1];
  check(
    (await call("onboarding/otp", "POST", { code }, b.cookie)).status === 400,
    "OTP is bound to account",
  );
  check(
    (await call("onboarding/otp", "POST", { code }, a.cookie)).status === 200,
    "OTP verifies account",
  );
  check(
    (await call("onboarding/otp", "POST", { code }, a.cookie)).status === 400,
    "OTP cannot be replayed",
  );
  check(
    (
      await call(
        "onboarding/business",
        "POST",
        {
          businessName: "Test Business",
          cacNumber: "RC1234567",
          consent: true,
        },
        a.cookie,
      )
    ).status === 200,
    "Manual CAC submission",
  );
  check(
    (await call("onboarding", "GET", undefined, b.cookie)).data.business ===
      null,
    "KYB records isolated",
  );
  check(
    (await call("kyb-admin", "GET", undefined, a.cookie)).status === 403,
    "Owner cannot review KYB",
  );
  const s = await call(
    "sites",
    "POST",
    {
      name: "Advanced QA",
      slug: prefix + "a",
      category: "corporate",
      tier: "advanced",
    },
    a.cookie,
  );
  check(s.status === 201, "Advanced primary website");
  const additions = await Promise.all(
    [1, 2, 3].map((i) =>
      call(
        "sites",
        "POST",
        {
          name: "Additional " + i,
          slug: prefix + "a" + i,
          category: "corporate",
          tier: "advanced",
        },
        a.cookie,
      ),
    ),
  );
  check(
    additions.filter((r) => r.status === 201).length === 2 &&
      additions.filter((r) => r.status === 403).length === 1,
    "Concurrent creation enforces three-site cap",
  );
  const basic = await call(
    "sites",
    "POST",
    {
      name: "Basic QA",
      slug: prefix + "b",
      category: "corporate",
      tier: "basic",
    },
    b.cookie,
  );
  check(
    (
      await call(
        "sites",
        "POST",
        {
          name: "Bypass attempt",
          slug: prefix + "b2",
          category: "corporate",
          tier: "advanced",
        },
        b.cookie,
      )
    ).status === 403,
    "Basic cannot bypass one-site cap by choosing Advanced",
  );
  const bytes = await sharp({
    create: { width: 12, height: 12, channels: 3, background: "#540cda" },
  })
    .png()
    .toBuffer();
  const upload = new FormData();
  upload.set("file", new Blob([bytes], { type: "image/png" }), "qa.png");
  upload.set("alt", "QA image");
  const asset = await (
    await fetch(base + "/api/sites/" + basic.data.id + "/media", {
      method: "POST",
      headers: { Origin: base, cookie: b.cookie },
      body: upload,
    })
  ).json();
  check(
    (
      await call(
        "sites/" + s.data.id + "/pages",
        "POST",
        { title: "Wrong image", slug: "wrong-image", image: asset.url },
        a.cookie,
      )
    ).status === 403,
    "Cross-tenant featured image rejected",
  );
  check(
    (
      await call(
        "sites/" + s.data.id + "/pages",
        "POST",
        {
          title: "Encoded image",
          slug: "encoded-image",
          body: '<img src="' + asset.url.replaceAll("/", "&#47;") + '">',
        },
        a.cookie,
      )
    ).status === 403,
    "Encoded cross-tenant rich-text image rejected",
  );
  check(
    (
      await call(
        "sites/" + s.data.id + "/media/" + asset.url.split("/").at(-1),
        "DELETE",
        undefined,
        a.cookie,
      )
    ).status === 404,
    "Cross-tenant media deletion denied",
  );
  check(
    (
      await call(
        "sites/" + basic.data.id + "/media/" + asset.url.split("/").at(-1),
        "PATCH",
        { alt: "Updated description" },
        b.cookie,
      )
    ).status === 200,
    "Media description can be updated",
  );
  check(
    (
      await call(
        "sites/" + s.data.id + "/legal",
        "POST",
        {
          title: "Privacy policy",
          slug: "privacy",
          body: "Our privacy information.",
          status: "published",
        },
        a.cookie,
      )
    ).status === 200,
    "Legal policy publication",
  );
  const updated = {
    ...s.data.data,
    brand: {
      ...s.data.data.brand,
      notificationEmail: prefix + "notify@example.test",
      businessNature: "services",
      socials: { instagram: "https://www.instagram.com/example" },
      robots: {
        index: true,
        follow: true,
        rules: "User-agent: ExampleBot\nDisallow: /",
      },
    },
  };
  check(
    (await call("sites/" + s.data.id, "PATCH", updated, a.cookie)).status ===
      200,
    "Brand social, contact recipient and robots settings saved",
  );
  check(
    (
      await call(
        "sites/" + s.data.id + "/authors",
        "POST",
        {
          title: "Owner Author",
          slug: "author",
          body: "Author bio",
          status: "published",
        },
        a.cookie,
      )
    ).status === 200,
    "Create site author",
  );
  const authors = await call(
    "sites/" + s.data.id + "/authors",
    "GET",
    undefined,
    a.cookie,
  );
  check(
    (
      await call(
        "sites/" + basic.data.id + "/pages",
        "POST",
        {
          title: "Bad author",
          slug: "bad-author",
          authorId: authors.data[0].id,
        },
        b.cookie,
      )
    ).status === 403,
    "Cross-tenant author rejected",
  );
  check(
    (
      await call(
        "sites/" + s.data.id + "/pages",
        "POST",
        {
          title: "Long page",
          slug: "too-long",
          sections: Array(16).fill({
            id: "x",
            type: "text",
            title: "Test",
            body: "",
          }),
        },
        a.cookie,
      )
    ).status === 400,
    "Server rejects more than 15 sections",
  );
  check(
    (
      await call(
        "sites/" + s.data.id + "/pages",
        "POST",
        {
          title: "Private page",
          slug: "private-search",
          body: "<p>Safe</p><script>bad()</script>",
          status: "published",
          indexing: { index: false, follow: false },
        },
        a.cookie,
      )
    ).status === 200,
    "Page indexing persisted",
  );
  await db.query(
    "UPDATE sites SET subscription='active',billing_interval='monthly',paid_until=now()-interval '12 hours',published=data,status='published' WHERE id=$1",
    [s.data.id],
  );
  check(
    (await fetch(base + "/sites/" + s.data.slug)).status === 200,
    "Monthly website remains available inside one-day grace",
  );
  const home = await (await fetch(base + "/sites/" + s.data.slug)).text();
  check(
    home.includes("Privacy policy") &&
      home.includes("https://www.instagram.com/example"),
    "Published footer includes legal policy and social link",
  );
  check(
    (
      await call("enquiries", "POST", {
        site: s.data.id,
        name: "Visitor QA",
        email: prefix + "enquiry@example.test",
        message: "Please contact me about your service.",
        website: "",
      })
    ).status === 201,
    "Contact form remains available during grace",
  );
  check(
    (
      await db.query("SELECT id FROM email_outbox WHERE recipient=$1", [
        prefix + "notify@example.test",
      ])
    ).rows.length === 1,
    "Enquiry routed to website-specific recipient",
  );
  check(
    (
      await (await fetch(base + "/sites/" + s.data.slug + "/robots.txt")).text()
    ).includes("User-agent: ExampleBot"),
    "Custom robots rules rendered",
  );
  await db.query(
    "UPDATE sites SET paid_until=now()-interval '25 hours' WHERE id=$1",
    [s.data.id],
  );
  check(
    (await fetch(base + "/sites/" + s.data.slug)).status === 404,
    "Monthly website deactivates after one day",
  );
  await db.query(
    "UPDATE sites SET billing_interval='annual',paid_until=now()-interval '6 days' WHERE id=$1",
    [s.data.id],
  );
  check(
    (await fetch(base + "/sites/" + s.data.slug)).status === 200,
    "Annual website remains available inside seven-day grace",
  );
  const sitemap = await (
    await fetch(base + "/sites/" + s.data.slug + "/sitemap.xml")
  ).text();
  check(
    !sitemap.includes("private-search"),
    "Noindex pages excluded from sitemap",
  );
  const page = await (
    await fetch(base + "/sites/" + s.data.slug + "/private-search")
  ).text();
  check(
    page.includes("noindex") && !page.includes("<script>bad()"),
    "Page noindex and rich-content sanitization rendered",
  );
  const child = additions.find((r) => r.status === 201).data;
  await db.query(
    "UPDATE sites SET published=data,status='published' WHERE id=$1",
    [child.id],
  );
  check(
    (await fetch(base + "/sites/" + child.slug)).status === 200,
    "Additional website inherits paid subscription and grace",
  );
  await db.query("UPDATE sites SET status='suspended' WHERE id=$1", [
    s.data.id,
  ]);
  check(
    (await fetch(base + "/sites/" + child.slug)).status === 404,
    "Primary suspension blocks additional websites",
  );
  await db.query(
    "UPDATE sites SET status='published',paid_until=now()-interval '8 days' WHERE id=$1",
    [s.data.id],
  );
  check(
    (await fetch(base + "/sites/" + s.data.slug)).status === 404,
    "Annual website deactivates after seven days",
  );
  check(
    (
      await call("contact", "POST", {
        name: "Contact QA",
        email: prefix + "visitor@example.test",
        topic: "Website help",
        message: "This is an internal support test.",
        website: "",
      })
    ).status === 201,
    "Marketing contact accepted",
  );
  check(
    (await call("platform-admin/support", "GET", undefined, b.cookie))
      .status === 403,
    "Support inbox denies ordinary owners",
  );
  check(
    (
      await call(
        "marketing/articles",
        "POST",
        { title: "Bad publish", slug: "bad-publish" },
        b.cookie,
      )
    ).status === 403,
    "Marketing CMS denies ordinary owners",
  );
  await db.query("UPDATE users SET role='super_admin' WHERE email=$1", [
    a.email,
  ]);
  const inbox = await call(
    "platform-admin/support",
    "GET",
    undefined,
    a.cookie,
  );
  check(
    inbox.data.some((t) => t.email === prefix + "visitor@example.test"),
    "Contact routed to admin inbox",
  );
  const ticket = inbox.data.find(
    (t) => t.email === prefix + "visitor@example.test",
  );
  check(
    (
      await call(
        "platform-admin/support/" + ticket.id,
        "PATCH",
        { status: "resolved", reply: "Your request has been reviewed." },
        a.cookie,
      )
    ).status === 200,
    "Admin support reply queued",
  );
  const { rows: outbox } = await db.query(
    "SELECT id FROM email_outbox WHERE recipient=$1",
    [ticket.email],
  );
  check(outbox.length === 1, "Reply delivered to correct outbox recipient");
  check(
    (
      await call(
        "platform-admin/support/" + ticket.id,
        "PATCH",
        { status: "resolved", reply: "Your request has been reviewed." },
        a.cookie,
      )
    ).status === 200,
    "Support retry succeeds",
  );
  check(
    (
      await db.query("SELECT id FROM email_outbox WHERE recipient=$1", [
        ticket.email,
      ])
    ).rows.length === 1,
    "Identical reply is not queued twice",
  );
  const kyb = await call("kyb-admin", "GET", undefined, a.cookie);
  const own = kyb.data.find((x) => x.email === a.email);
  check(
    (
      await call(
        "kyb-admin",
        "PATCH",
        {
          userId: own.user_id,
          status: "verified",
          registeredName: "Test Business",
          note: "QA manual review evidence recorded.",
        },
        a.cookie,
      )
    ).status === 200,
    "Admin can complete manual review",
  );
  console.log(count + " extension checks passed.");
} finally {
  await db.end();
}
