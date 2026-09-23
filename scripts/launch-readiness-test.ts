import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { pool, query } from "../lib/db";
import { totp } from "../lib/totp";
import { checkout, encrypt, merchantWebhook } from "../lib/commerce";
import { reconcileOrders } from "../lib/payment-recovery";
if (!/\/omnyvox_test(?:\?|$)/.test(process.env.DATABASE_URL || ""))
  throw Error("Use only omnyvox_test");
const base = process.env.TEST_BASE_URL || "http://localhost:3002";
let passes = 0;
const check = (value: unknown, label: string) => {
  assert.ok(value, label);
  console.log("PASS", label);
  passes++;
};
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
  return {
    status: r.status,
    data: await r.json(),
    cookie: r.headers.get("set-cookie")?.split(";")[0] || cookie,
  };
}
const email = `launch-${randomUUID()}@example.test`,
  password = "LaunchTests!2026";
try {
  const registered = await call("auth/register", "POST", {
    email,
    password,
    confirmPassword: password,
    name: "Launch QA",
  });
  let cookie = registered.cookie;
  check(registered.status === 201, "registration remains functional");
  const [owner] = await query<{ id: string }>(
    "SELECT id FROM users WHERE email=$1",
    [email],
  );
  await query(
    "UPDATE users SET role='super_admin',email_verified=true WHERE id=$1",
    [owner.id],
  );
  check(
    (await call("admin", "GET", undefined, cookie)).status === 403,
    "admin without MFA cannot read operational data",
  );
  check(
    (await call("security/setup", "POST", { password: "wrong" }, cookie))
      .status === 403,
    "MFA setup requires current password",
  );
  const setup = await call("security/setup", "POST", { password }, cookie);
  check(
    setup.status === 200 && setup.data.secret,
    "MFA enrollment returns a private setup key",
  );
  const code = totp(setup.data.secret, Math.floor(Date.now() / 30000));
  const enabled = await call(
    "security/enable",
    "POST",
    { password, code },
    cookie,
  );
  cookie = enabled.cookie;
  check(
    enabled.status === 200 && enabled.data.recoveryCodes.length === 10,
    "MFA enrollment creates recovery codes and rotates session",
  );
  check(
    (await call("me", "GET", undefined, registered.cookie)).status === 401,
    "enrollment invalidates old sessions",
  );
  check(
    (await call("admin", "GET", undefined, cookie)).status === 200,
    "verified MFA session can administer platform",
  );
  check(
    (await call("auth/login", "POST", { email, password })).status === 401,
    "MFA account cannot sign in using only password",
  );
  check(
    (await call("auth/login", "POST", { email, password, code })).status ===
      401,
    "enrollment TOTP cannot be replayed",
  );
  const codes = enabled.data.recoveryCodes as string[];
  const login = await call("auth/login", "POST", {
    email,
    password,
    code: codes[0],
  });
  check(login.status === 200, "unused recovery code signs in");
  check(
    (await call("auth/login", "POST", { email, password, code: codes[0] }))
      .status === 401,
    "recovery code cannot be replayed",
  );
  const security = await call("security", "GET", undefined, login.cookie);
  check(
    security.data.sessions.length === 2,
    "session manager lists own active sessions",
  );
  check(
    !JSON.stringify(security.data).includes("omnyvox_session") &&
      !JSON.stringify(security.data).includes("token"),
    "session manager does not expose session tokens",
  );
  check(
    (
      await call(
        "security/revoke-others",
        "POST",
        { password, code: codes[1] },
        login.cookie,
      )
    ).status === 200,
    "user can revoke other sessions",
  );
  check(
    (await call("me", "GET", undefined, cookie)).status === 401,
    "revoked session immediately loses access",
  );
  cookie = login.cookie;
  check(
    (
      await call(
        "security/disable",
        "POST",
        { password, code: codes[2] },
        cookie,
      )
    ).status === 403,
    "platform administrator cannot disable MFA",
  );
  const another = await call("auth/register", "POST", {
    email: `other-${email}`,
    password,
    confirmPassword: password,
    name: "Other QA",
  });
  const otherSession = (
    await call("security", "GET", undefined, another.cookie)
  ).data.currentSession;
  await call(
    "security/revoke",
    "POST",
    { password, code: codes[3], sessionId: otherSession },
    cookie,
  );
  check(
    (await call("me", "GET", undefined, another.cookie)).status === 200,
    "session revocation is account-scoped",
  );
  const created = await call(
    "sites",
    "POST",
    {
      name: "Launch Shop",
      slug: "launch-" + randomUUID().slice(0, 8),
      category: "commerce",
      tier: "growth",
      industry: "electronics",
      template: "catalogue",
    },
    cookie,
  );
  check(created.status === 201, "compatible site creation succeeds");
  const site = created.data;
  const siteId = site.id;
  check(!!siteId, "created site has identifier");
  const fetched = (await call(`sites/${siteId}`, "GET", undefined, cookie))
    .data;
  const first = await call(`sites/${siteId}`, "PATCH", fetched.data, cookie);
  check(first.status === 200, "first draft save succeeds");
  check(
    (await call(`sites/${siteId}`, "PATCH", fetched.data, cookie)).status ===
      409,
    "stale website draft is rejected",
  );
  const legal = (
    await query<{ id: string; data: Record<string, unknown> }>(
      "SELECT id,data FROM records WHERE site_id=$1 AND kind='legal' LIMIT 1",
      [siteId],
    )
  )[0];
  await query(
    'UPDATE records SET data=data||\'{"status":"published","policyReviewed":true}\'::jsonb WHERE id=$1',
    [legal.id],
  );
  await query("UPDATE sites SET status='published' WHERE id=$1", [siteId]);
  await assert.rejects(
    () => query("DELETE FROM records WHERE id=$1", [legal.id]),
    /replacement policy/,
  );
  check(true, "database rejects removal of live policy");
  await assert.rejects(
    () =>
      query(
        "UPDATE records SET data=jsonb_set(data,'{status}','\"draft\"') WHERE id=$1",
        [legal.id],
      ),
    /replacement policy/,
  );
  check(true, "database rejects unpublishing the last live policy");
  const product = randomUUID(),
    merchantSecret = "sk_test_" + randomUUID();
  await query(
    "INSERT INTO records(id,site_id,kind,data) VALUES($1,$2,'products',$3)",
    [
      product,
      siteId,
      JSON.stringify({
        title: "Recovery product",
        slug: "recovery",
        status: "published",
        stock: 3,
        price: 25000,
      }),
    ],
  );
  await query(
    "INSERT INTO merchant_accounts(site_id,secret,verified) VALUES($1,$2,true)",
    [siteId, encrypt(merchantSecret)],
  );
  async function order(status: string) {
    const reference = "store_" + randomUUID();
    await query(
      "INSERT INTO orders(site_id,reference,customer,items,amount,reservation_expires_at,reconcile_after) VALUES($1,$2,'{}',$3,25000,'1970-01-01','1970-01-01')",
      [
        siteId,
        reference,
        JSON.stringify([
          { id: product, quantity: 1, price: 25000, title: "Recovery product" },
        ]),
      ],
    );
    const transport = (async () =>
      new Response(
        JSON.stringify({
          status: true,
          data: { reference, status, amount: 25000, currency: "NGN" },
        }),
        { status: 200 },
      )) as typeof fetch;
    return { reference, transport };
  }
  const abandoned = await order("abandoned");
  await reconcileOrders(abandoned.transport, 1);
  check(
    (
      await query<{ data: { stock: number } }>(
        "SELECT data FROM records WHERE id=$1",
        [product],
      )
    )[0].data.stock === 4,
    "abandoned verified payment releases reserved inventory",
  );
  await reconcileOrders(abandoned.transport, 1);
  check(
    (
      await query<{ data: { stock: number } }>(
        "SELECT data FROM records WHERE id=$1",
        [product],
      )
    )[0].data.stock === 4,
    "reservation release is idempotent",
  );
  const pending = await order("pending");
  await reconcileOrders(pending.transport, 1);
  check(
    (
      await query<{ payment_status: string }>(
        "SELECT payment_status FROM orders WHERE reference=$1",
        [pending.reference],
      )
    )[0].payment_status === "pending",
    "in-flight payment remains reserved",
  );
  const successful = await order("success");
  await reconcileOrders(successful.transport, 1);
  check(
    (
      await query<{ payment_status: string }>(
        "SELECT payment_status FROM orders WHERE reference=$1",
        [successful.reference],
      )
    )[0].payment_status === "paid",
    "reconciliation recovers missing success webhook",
  );
  const late = JSON.stringify({
    event: "charge.success",
    data: {
      reference: abandoned.reference,
      status: "success",
      amount: 25000,
      currency: "NGN",
    },
  });
  await merchantWebhook(
    siteId,
    late,
    createHmac("sha512", merchantSecret).update(late).digest("hex"),
  );
  check(
    (
      await query<{ payment_status: string }>(
        "SELECT payment_status FROM orders WHERE reference=$1",
        [abandoned.reference],
      )
    )[0].payment_status === "review_required",
    "late payment cannot fulfil already released stock",
  );
  const uncertain = await order("abandoned");
  await reconcileOrders(
    (async () => {
      throw Error("network failure");
    }) as typeof fetch,
    1,
  );
  check(
    (
      await query<{ payment_status: string }>(
        "SELECT payment_status FROM orders WHERE reference=$1",
        [uncertain.reference],
      )
    )[0].payment_status === "pending",
    "provider outage does not release possibly paid stock",
  );
  await query(
    "UPDATE sites SET subscription='active',paid_until=now()+interval '1 month' WHERE id=$1",
    [siteId],
  );
  const checkoutInput = {
    site: siteId,
    email,
    name: "Checkout QA",
    phone: "08012345678",
    address: "Test delivery address",
    items: [{ id: product, quantity: 1 }],
  };
  const stock = async () =>
    (
      await query<{ data: { stock: number } }>(
        "SELECT data FROM records WHERE id=$1",
        [product],
      )
    )[0].data.stock;
  const before = await stock();
  await assert.rejects(
    () =>
      checkout(checkoutInput, (async () => {
        throw Error("timeout");
      }) as typeof fetch),
    /order reference/,
  );
  check(
    (await stock()) === before - 1,
    "uncertain initialization retains stock for reconciliation",
  );
  await assert.rejects(
    () =>
      checkout(
        checkoutInput,
        (async () =>
          new Response(JSON.stringify({ status: false }), {
            status: 400,
          })) as typeof fetch,
      ),
    /order reference/,
  );
  check(
    (await stock()) === before - 1,
    "explicit provider rejection releases only its own reservation",
  );
  const changed = await call(
    "security/password",
    "POST",
    {
      password,
      code: codes[4],
      newPassword: "ChangedTests!2026",
      confirmPassword: "ChangedTests!2026",
    },
    cookie,
  );
  check(changed.status === 200, "authenticated password change succeeds");
  check(
    (await call("me", "GET", undefined, cookie)).status === 401,
    "password change invalidates prior session",
  );
  check(
    (await call("auth/login", "POST", { email, password, code: codes[5] }))
      .status === 401,
    "old password no longer works",
  );
  const replaced = await call(
    "security/recovery-codes",
    "POST",
    {
      password: "ChangedTests!2026",
      code: codes[5],
    },
    changed.cookie,
  );
  check(
    replaced.status === 200 && replaced.data.recoveryCodes.length === 10,
    "administrator can replace recovery codes without disabling MFA",
  );
  check(
    (await call("me", "GET", undefined, changed.cookie)).status === 401,
    "recovery replacement invalidates previous sessions",
  );
  check(
    (
      await call("auth/login", "POST", {
        email,
        password: "ChangedTests!2026",
        code: codes[6],
      })
    ).status === 401,
    "replacement invalidates unused old recovery codes",
  );
  check(
    (
      await call("auth/login", "POST", {
        email,
        password: "ChangedTests!2026",
        code: replaced.data.recoveryCodes[0],
      })
    ).status === 200,
    "replacement recovery code can sign in",
  );
  console.log(`${passes} launch-readiness checks passed`);
} finally {
  await pool.end();
}
