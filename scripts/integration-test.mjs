import assert from "node:assert/strict";
import pg from "pg";
import sharp from "sharp";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
if (!process.env.TEST_DATABASE_URL)
  throw new Error("Set TEST_DATABASE_URL to the isolated test database.");
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
const prefix = `qa${Date.now()}`;
let checks = 0;
async function call(path, method = "GET", body, cookie = "", origin = base) {
  if (path === "auth/register" && body) {
    const policyResponse = await fetch(base + "/api/consent");
    const policies = Object.fromEntries((await policyResponse.json()).map((p) => [p.slug, p.id]));
    body = {...body, phone:"+2348012345678", consent:{...policies,accepted:true}};
  }
  const r = await fetch(base + "/api/" + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      Origin: origin,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await r.json();
  } catch {
    data = null;
  }
  return {
    status: r.status,
    data,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
function check(condition, message) {
  assert.ok(condition, message);
  checks++;
  console.log("PASS", message);
}
try {
  const a = await call("auth/register", "POST", {
    name: "QA Author",
    email: prefix + "a@example.test",
    password: "Test-only-password!2026",
    confirmPassword: "Test-only-password!2026",
  });
  check(a.status === 201, "Account registration and session");
  const {
    rows: [verification],
  } = await pool.query(
    "SELECT body FROM email_outbox WHERE recipient=$1 ORDER BY created_at DESC LIMIT 1",
    [prefix + "a@example.test"],
  );
  const verificationToken = verification.body.match(/code is (\d{6})/)[1];
  check(
    (
      await call(
        "onboarding/otp",
        "POST",
        { code: verificationToken },
        a.cookie,
      )
    ).status === 200,
    "Email verification token works",
  );
  check(
    (
      await call(
        "onboarding/otp",
        "POST",
        { code: verificationToken },
        a.cookie,
      )
    ).status === 400,
    "Verification token cannot be reused",
  );
  const b = await call("auth/register", "POST", {
    name: "QA Other",
    email: prefix + "b@example.test",
    password: "Test-only-password!2026",
    confirmPassword: "Test-only-password!2026",
  });
  check(b.status === 201, "Separate tenant registration");
  const create = await call(
    "sites",
    "POST",
    { name: "QA Studio", slug: prefix, category: "corporate", tier: "basic" },
    a.cookie,
  );
  check(create.status === 201, "Create tenant website");
  const s = create.data;
  const png = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#540CDA" },
  })
    .png()
    .toBuffer();
  const upload = new FormData();
  upload.set("file", new Blob([png], { type: "image/png" }), "test.png");
  upload.set("alt", "Test logo");
  const uploaded = await fetch(base + "/api/sites/" + s.id + "/media", {
    method: "POST",
    headers: { cookie: a.cookie, Origin: base },
    body: upload,
  });
  check(uploaded.status === 201, "Tenant image upload");
  const media = await uploaded.json();
  const image = await fetch(base + media.url, {
    headers: { cookie: a.cookie },
  });
  check(
    image.headers.get("content-type") === "image/webp",
    "PNG upload served as WebP",
  );
  const deniedImage = await fetch(base + media.url, {
    headers: { cookie: b.cookie },
  });
  check(
    deniedImage.status === 404,
    "Private media is inaccessible to another tenant",
  );
  check(
    (await call("sites/" + s.id, "GET", undefined, b.cookie)).status === 404,
    "Cross-tenant read denied",
  );
  check(
    (await call("sites/" + s.id, "PATCH", s.data, b.cookie)).status === 404,
    "Cross-tenant write denied",
  );
  check(
    (await call("admin", "GET", undefined, a.cookie)).status === 403,
    "Subscriber cannot access internal administration",
  );
  check(
    (
      await call(
        "sites/" + s.id + "/articles",
        "POST",
        { title: "Not allowed", slug: "not-allowed" },
        a.cookie,
      )
    ).status === 403,
    "Basic blog restriction enforced by API",
  );
  check(
    (
      await call(
        "sites/" + s.id + "/domains",
        "POST",
        { hostname: "example.com" },
        a.cookie,
      )
    ).status === 403,
    "Basic domain restriction enforced by API",
  );
  check(
    (await call("sites/" + s.id + "/publish", "POST", {}, a.cookie)).status ===
      403,
    "Pending subscription cannot publish",
  );
  check(
    (
      await call(
        "sites/" + s.id,
        "PATCH",
        s.data,
        a.cookie,
        "https://evil.example",
      )
    ).status === 403,
    "Cross-origin mutation blocked",
  );
  for (let i = 0; i < 4; i++)
    check(
      (
        await call(
          "sites/" + s.id + "/pages",
          "POST",
          {
            title: "Page " + i,
            slug: "page-" + i,
            body: "Content",
            status: "published",
          },
          a.cookie,
        )
      ).status === 200,
      "Allowed page " + (i + 1),
    );
  check(
    (
      await call(
        "sites/" + s.id + "/pages",
        "POST",
        { title: "Too many", slug: "over-limit", status: "published" },
        a.cookie,
      )
    ).status === 403,
    "Page limit enforced atomically",
  );
  await pool.query(
    "UPDATE sites SET subscription='active',paid_until=now()+interval '1 month',tier='growth' WHERE id=$1",
    [s.id],
  );
  check(
    (await call("sites/" + s.id + "/publish", "POST", {}, a.cookie)).status ===
      409,
    "Active subscription still requires completed publishing preflight",
  );
  // Public-rendering fixtures are deliberately separate from publishing acceptance.
  await pool.query(
    "UPDATE sites SET published=data,status='published' WHERE id=$1",
    [s.id],
  );
  const article = await call(
    "sites/" + s.id + "/articles",
    "POST",
    {
      title: "A test article",
      slug: "test-article",
      body: "Useful article content",
      status: "published",
      category: "news",
    },
    a.cookie,
  );
  check(article.status === 200, "Growth article creation");
  const html = await (
    await fetch(base + "/sites/" + s.slug + "/insights/test-article")
  ).text();
  check(
    html.includes("QA Author") && html.includes("BlogPosting"),
    "Automatic author and article schema",
  );
  check(
    html.includes("og:title") && html.includes('rel="canonical"'),
    "Open Graph and canonical metadata",
  );
  const changed = {
    ...s.data,
    brand: { ...s.data.brand, name: "Draft Brand", categoryUrls: true },
  };
  await call("sites/" + s.id, "PATCH", changed, a.cookie);
  const published = await (await fetch(base + "/sites/" + s.slug)).text();
  check(
    !published.includes("Draft Brand"),
    "Draft changes do not change the published website",
  );
  await pool.query("UPDATE sites SET published=data WHERE id=$1", [s.id]);
  const redirect = await fetch(
    base + "/sites/" + s.slug + "/insights/test-article",
    { redirect: "manual" },
  );
  check(
    redirect.status === 308 &&
      redirect.headers.get("location").endsWith("/insights/news/test-article"),
    "Category URL toggle preserves old links with permanent redirect",
  );
  const {
    rows: [form],
  } = await pool.query(
    "UPDATE site_forms SET active_email=$2,verified_at=now() WHERE site_id=$1 RETURNING id",
    [s.id, prefix + "a@example.test"],
  );
  const message = await call("enquiries", "POST", {
    site: s.id,
    formId: form.id,
    consent: "on",
    name: "QA Visitor",
    email: prefix + "visitor@example.test",
    message: "A test enquiry",
    website: "",
  });
  check(message.status === 201, "Public contact form stores enquiry");
  check(
    (await call("sites/" + s.id + "/enquiries", "GET", undefined, b.cookie))
      .status === 404,
    "Enquiries stay tenant-isolated",
  );
  const sitemap = await fetch(base + "/sites/" + s.slug + "/sitemap.xml");
  check(
    sitemap.status === 200 &&
      (await sitemap.text()).includes("/insights/news/test-article"),
    "Tenant sitemap uses canonical article URLs",
  );
  const robots = await fetch(base + "/sites/" + s.slug + "/robots.txt");
  check(
    robots.status === 200 && (await robots.text()).includes("Disallow: /api/"),
    "Tenant robots excludes private API routes",
  );
  await pool.query(
    "UPDATE sites SET paid_until=now()-interval '2 days' WHERE id=$1",
    [s.id],
  );
  check(
    (await fetch(base + "/sites/" + s.slug)).status === 404,
    "Expired subscription does not serve public website",
  );
  const webhook = await call("webhooks/paystack", "POST", {
    event: "charge.success",
    data: { reference: "fake" },
  });
  check(
    [401, 503].includes(webhook.status),
    "Unsigned payment cannot activate subscription",
  );
  const reset = await call("auth/forgot", "POST", {
    email: prefix + "a@example.test",
  });
  check(reset.status === 200, "Password reset request gives generic success");
  const {
    rows: [email],
  } = await pool.query(
    "SELECT body FROM email_outbox WHERE recipient=$1 AND subject=$2 ORDER BY created_at DESC LIMIT 1",
    [prefix + "a@example.test", "Reset your Omnyvox password"],
  );
  const token = email.body.match(/token=([a-f0-9]{64})/)[1];
  const resetResult = await call("auth/reset", "POST", {
    token,
    password: "A-new-test-password!2026",
    confirmPassword: "A-new-test-password!2026",
  });
  check(resetResult.status === 200, "Single-use password reset token accepted");
  check(
    (await call("me", "GET", undefined, a.cookie)).status === 401,
    "Password reset revokes existing sessions",
  );
  check(
    (
      await call("auth/reset", "POST", {
        token,
        password: "Another-test-password!2026",
        confirmPassword: "Another-test-password!2026",
      })
    ).status === 400,
    "Password reset token cannot be reused",
  );
  console.log(`${checks} integration checks passed.`);
} finally {
  await pool.end();
}
