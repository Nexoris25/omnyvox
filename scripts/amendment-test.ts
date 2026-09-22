import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { pool, query } from "../lib/db";
import { createMedia, transferMedia, mediaBytes } from "../lib/media-storage";
import { sealStorageKey } from "../lib/storage-provider";
import { initialSections } from "../lib/model";
import { publishScheduled } from "../lib/publishing";
if (!process.env.DATABASE_URL?.includes(":55432/"))
  throw Error("Use the isolated local database on port 55432");
const base = process.env.TEST_BASE_URL || "http://localhost:3002",
  prefix = "amend" + Date.now();
let passes = 0;
function check(value: unknown, label: string) {
  assert.ok(value, label);
  passes++;
  console.log("PASS", label);
}
async function account(role = "owner") {
  const token = randomBytes(32).toString("hex");
  const [u] = await query<{ id: string }>(
    "INSERT INTO users(name,email,password,role,email_verified) VALUES('QA',$1,'not-a-login-password',$2,true) RETURNING id",
    [`${prefix}${randomUUID()}@example.test`, role],
  );
  await query(
    "INSERT INTO sessions(token,user_id,expires) VALUES($1,$2,now()+interval '1 hour')",
    [createHash("sha256").update(token).digest("hex"), u.id],
  );
  return { id: u.id, cookie: `omnyvox_session=${token}` };
}
async function call(path: string, method = "GET", body?: unknown, cookie = "") {
  const r = await fetch(base + "/api/" + path, {
    method,
    headers: {
      Origin: base,
      cookie,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
}
try {
  const a = await account(),
    b = await account(),
    admin = await account("super_admin");
  const created = await call(
    "sites",
    "POST",
    {
      name: "QA Law",
      slug: prefix,
      category: "corporate",
      tier: "basic",
      industry: "legal",
      template: "studio",
    },
    a.cookie,
  );
  check(created.status === 201, "Create corporate legal-industry website");
  const site = created.data.id;
  const modules = (
    await call(`sites/${site}/modules`, "GET", undefined, a.cookie)
  ).data.modules;
  check(
    modules.some(
      (m: { key: string; label: string }) =>
        m.key === "offerings" && m.label === "Practice Areas",
    ),
    "Legal industry names Practice Areas",
  );
  check(
    !modules.some((m: { key: string }) =>
      ["products", "orders", "merchant", "properties"].includes(m.key),
    ),
    "Inapplicable commerce and property modules omitted",
  );
  check(
    (await call(`sites/${site}/products`, "GET", undefined, a.cookie))
      .status === 404,
    "Corporate product deep link blocked",
  );
  check(
    (
      await call(
        `sites/${site}/articles`,
        "POST",
        { title: "Insight", slug: "insight" },
        a.cookie,
      )
    ).status === 403,
    "Basic blog write blocked",
  );
  check(
    (await call(`sites/${site}/forms`, "GET", undefined, b.cookie)).status ===
      404,
    "Recipient settings isolated by tenant",
  );
  check(
    (await call("platform-admin/storage", "GET", undefined, a.cookie))
      .status === 403,
    "Storage admin blocked for ordinary owner",
  );
  const recipient = `${prefix}inbox@example.test`;
  check(
    (
      await call(
        `sites/${site}/forms/request`,
        "POST",
        { email: recipient },
        a.cookie,
      )
    ).status === 200,
    "Basic may choose a non-login recipient",
  );
  let form = (await call(`sites/${site}/forms`, "GET", undefined, a.cookie))
    .data.form;
  check(
    !form.active_email && form.pending_email === recipient,
    "Unverified recipient stays pending",
  );
  const [mail] = await query<{ body: string }>(
    "SELECT body FROM email_outbox WHERE site_id=$1 ORDER BY created_at DESC LIMIT 1",
    [site],
  );
  const code = mail.body.match(/code is (\d{6})/)![1];
  check(
    (await call(`sites/${site}/forms/verify`, "POST", { code }, b.cookie))
      .status === 404,
    "Another tenant cannot verify this recipient",
  );
  check(
    (await call(`sites/${site}/forms/verify`, "POST", { code }, a.cookie))
      .status === 200,
    "Mailbox code activates recipient",
  );
  check(
    (await call(`sites/${site}/forms/verify`, "POST", { code }, a.cookie))
      .status === 400,
    "Recipient code is single-use",
  );
  await query(
    "UPDATE site_forms SET sent_at=now()-interval '2 minutes' WHERE site_id=$1",
    [site],
  );
  await call(
    `sites/${site}/forms/request`,
    "POST",
    { email: `${prefix}next@example.test` },
    a.cookie,
  );
  form = (await call(`sites/${site}/forms`, "GET", undefined, a.cookie)).data
    .form;
  check(
    form.active_email === recipient,
    "Pending replacement preserves working inbox",
  );
  const page = {
    title: "About us",
    slug: "about",
    body: "We provide legal services.",
    status: "draft",
  };
  for (let i = 0; i < 6; i++)
    check(
      (
        await call(
          `sites/${site}/pages`,
          "POST",
          { ...page, slug: "page-" + i },
          a.cookie,
        )
      ).status === 200,
      "Drafts do not consume published page allowance " + i,
    );
  let rows = (
    await call(`sites/${site}/pages`, "GET", undefined, a.cookie)
  ).data.filter((r: { data: { slug: string } }) =>
    r.data.slug.startsWith("page-"),
  );
  const publication = await Promise.all(
    rows.map((r: { id: string; data: unknown }) =>
      call(
        `sites/${site}/pages/${r.id}`,
        "PATCH",
        { ...page, slug: r.id, status: "published" },
        a.cookie,
      ),
    ),
  );
  check(
    publication.filter((r) => r.status === 200).length === 4 &&
      publication.filter((r) => r.status === 403).length === 2,
    "Concurrent publication reserves homepage within five-page limit",
  );
  const policyRows = (
    await call(`sites/${site}/legal`, "GET", undefined, a.cookie)
  ).data;
  const privacy = policyRows.find(
    (r: { data: { slug: string } }) => r.data.slug === "privacy",
  );
  check(
    (
      await call(
        `sites/${site}/legal/${privacy.id}`,
        "PATCH",
        {
          ...page,
          slug: "privacy",
          status: "published",
          policyType: "privacy",
          policyReviewed: true,
        },
        a.cookie,
      )
    ).status === 200,
    "Reviewed policy is outside custom page allowance",
  );
  check(
    (
      await call(
        `sites/${site}/legal`,
        "POST",
        { ...page, slug: "terms", status: "published", policyType: "terms" },
        a.cookie,
      )
    ).status === 400,
    "Unreviewed policy cannot publish",
  );
  check(
    (
      await call(
        `sites/${site}/pages`,
        "POST",
        { ...page, slug: "checkout" },
        a.cookie,
      )
    ).status === 400,
    "Custom page cannot take reserved system route",
  );
  check(
    (
      await call(
        `sites/${site}/versions/${rows[0].id}`,
        "GET",
        undefined,
        a.cookie,
      )
    ).status === 403,
    "Content history gated to Advanced",
  );
  await query(
    "UPDATE sites SET tier='advanced',subscription='active',paid_until=now()+interval '1 month' WHERE id=$1",
    [site],
  );
  check(
    (
      await call(
        `sites/${site}/versions/${rows[0].id}`,
        "GET",
        undefined,
        a.cookie,
      )
    ).data.length > 0,
    "Previous versions captured and retrievable",
  );
  check(
    (
      await call(
        `sites/${site}/versions/${rows[0].id}`,
        "GET",
        undefined,
        b.cookie,
      )
    ).status === 404,
    "Content versions isolated by tenant",
  );
  check(
    (await call(`sites/${site}/publish`, "POST", {}, a.cookie)).status === 409,
    "Publication preflight rejects incomplete setup",
  );
  check(
    (
      await call(
        `sites/${site}/ai`,
        "POST",
        { slot: "hero.body", requestKey: randomUUID() },
        a.cookie,
      )
    ).status === 503,
    "AI disabled state preserves manual setup",
  );
  check(
    (await call(`sites/${site}/ai`, "GET", undefined, b.cookie)).status === 404,
    "AI jobs isolated by tenant",
  );
  // Make a published fixture directly, without bypassing any production endpoint gate.
  await query(
    "UPDATE sites SET status='published',published=data WHERE id=$1",
    [site],
  );
  const submission = {
    site,
    formId: form.id,
    name: "Visitor",
    email: "visitor@example.test",
    message: "Please tell me about your services.",
    website: "",
    consent: "on",
  };
  check(
    (await call("enquiries", "POST", submission)).status === 201,
    "Verified form durably accepts an enquiry",
  );
  const [enquiry] = await query<{ count: string }>(
    "SELECT count(*) FROM records r JOIN email_outbox e ON e.enquiry_id=r.id WHERE r.site_id=$1 AND e.recipient=$2",
    [site, recipient],
  );
  check(
    Number(enquiry.count) === 1,
    "Enquiry record and correctly routed email are both committed",
  );
  check(
    (await call("enquiries", "POST", { ...submission, formId: randomUUID() }))
      .status === 404,
    "Cross-form identifier rejected",
  );
  check(
    (await call("enquiries", "POST", { ...submission, website: "spam" }))
      .status === 400,
    "Honeypot rejects automated submission",
  );
  // Storage migration with a controlled transport, never real provider credentials.
  process.env.STORAGE_ENCRYPTION_KEY = randomBytes(32).toString("hex");
  const [provider] = await query<{ id: string }>(
    "INSERT INTO storage_providers(label,endpoint,zone,secret,tested_at) VALUES('QA','storage.bunnycdn.com','qa-zone',$1,now()) RETURNING id",
    [sealStorageKey("qa-storage-password")],
  );
  const media = await createMedia(
    site,
    Buffer.from("webp-fixture"),
    "QA image",
    "qa.webp",
  );
  const originalFetch = globalThis.fetch;
  const objects = new Map<string, Uint8Array>();
  let corrupt = false;
  globalThis.fetch = (async (url, init) => {
    const key = String(url);
    if (init?.method === "PUT") {
      objects.set(key, init.body as Uint8Array);
      return new Response("", { status: 201 });
    }
    if (init?.method === "DELETE") {
      objects.delete(key);
      return new Response("", { status: 200 });
    }
    return new Response(
      new Uint8Array(corrupt ? [1] : objects.get(key) || []),
      { status: 200 },
    );
  }) as typeof fetch;
  try {
    corrupt = true;
    await assert.rejects(transferMedia(media.id, provider.id));
    let [stored] = await query<any>("SELECT * FROM media WHERE id=$1", [
      media.id,
    ]);
    check(
      stored.bytes && !stored.provider_id,
      "Failed migration preserves VPS bytes",
    );
    corrupt = false;
    await transferMedia(media.id, provider.id);
    [stored] = await query<any>("SELECT * FROM media WHERE id=$1", [media.id]);
    check(
      stored.bytes === null && stored.provider_id === provider.id,
      "Successful migration removes local bytes only after verification",
    );
    check(
      (await mediaBytes(stored)).toString() === "webp-fixture",
      "Remote image reads return verified bytes",
    );
    await transferMedia(media.id, null);
    [stored] = await query<any>("SELECT * FROM media WHERE id=$1", [media.id]);
    check(
      stored.bytes.toString() === "webp-fixture" && !stored.provider_id,
      "Images can migrate back to VPS without changing ID",
    );
  } finally {
    globalThis.fetch = originalFetch;
    await query("DELETE FROM storage_cleanup WHERE provider_id=$1", [
      provider.id,
    ]);
    await query("DELETE FROM storage_providers WHERE id=$1", [provider.id]);
  }
  const state = await call(
    "platform-admin/storage",
    "GET",
    undefined,
    admin.cookie,
  );
  check(
    state.status === 200 && !JSON.stringify(state.data).includes("secret"),
    "Admin storage response never exposes encrypted credentials",
  );
  const [scheduled] = await query<{ id: string }>(
    "INSERT INTO records(site_id,kind,data) VALUES($1,'articles',$2) RETURNING id",
    [
      site,
      JSON.stringify({
        title: "Scheduled story",
        slug: "scheduled-story",
        body: "Reviewed business update",
        status: "scheduled",
        publishAt: new Date(Date.now() - 60000).toISOString(),
      }),
    ],
  );
  await query("UPDATE sites SET tier='basic' WHERE id=$1", [site]);
  await publishScheduled();
  check(
    (
      await query<any>("SELECT data FROM records WHERE id=$1", [scheduled.id])
    )[0].data.status === "scheduled",
    "Scheduler preserves drafts after downgrade to Basic",
  );
  await query("UPDATE sites SET tier='advanced' WHERE id=$1", [site]);
  await Promise.all([publishScheduled(), publishScheduled()]);
  check(
    (
      await query<any>("SELECT data FROM records WHERE id=$1", [scheduled.id])
    )[0].data.status === "published",
    "Eligible scheduled content publishes",
  );
  check(
    (
      await query<any>(
        "SELECT count(*)::int AS total FROM audit WHERE target=$1 AND action='content.scheduled.published'",
        [scheduled.id],
      )
    )[0].total === 1,
    "Concurrent schedulers publish and audit exactly once",
  );
  console.log(`${passes} amendment checks passed.`);
} finally {
  await pool.end();
}
