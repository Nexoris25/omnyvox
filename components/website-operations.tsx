"use client";
import { useEffect, useState } from "react";
type Domain = {
  id: string;
  hostname: string;
  token: string;
  verified_at: string | null;
  active: boolean;
};
type Order = {
  id: string;
  reference: string;
  customer: { name: string; email: string };
  amount: number;
  payment_status: string;
  fulfilment_status: string;
};
export function WebsiteOperations({
  site,
  section,
  demo,
}: {
  site: string;
  section: string;
  demo: boolean;
}) {
  const [domains, setDomains] = useState<Domain[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [merchant, setMerchant] = useState({ verified: false, delivery: 0 });
  async function call(method = "GET", body?: unknown, suffix = "") {
    if (demo) {
      throw new Error(
        "This action requires your own account. Demo data is not connected to external services.",
      );
    }
    const r = await fetch(`/api/sites/${site}/${section}${suffix}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error);
    return b;
  }
  async function load() {
    if (demo) return;
    const b = await call();
    if (section === "domains") setDomains(b);
    if (section === "orders") setOrders(b);
    if (section === "merchant") setMerchant(b);
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, [section, site, demo]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      {section === "domains" ? (
        <>
          <section className="panel panel-body">
            <h2 style={{ fontSize: 23 }}>Your own address on the internet.</h2>
            <p className="muted" style={{ fontSize: 13 }}>
              Connect a domain you already own. Domain registration and renewal
              are separate.
            </p>
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                action(async () => {
                  await call("POST", { hostname: f.get("hostname") });
                  await load();
                });
              }}
            >
              <label className="field">
                Domain name
                <input
                  name="hostname"
                  required
                  placeholder="yourbusiness.com"
                />
              </label>
              <div className="form-actions">
                <button className="button" disabled={busy}>
                  Connect domain
                </button>
              </div>
            </form>
          </section>
          {domains.map((d) => (
            <section className="panel panel-body" key={d.id}>
              <h3>{d.hostname}</h3>
              <span className="badge">
                {d.active
                  ? "Active"
                  : d.verified_at
                    ? "Ownership verified · SSL pending"
                    : "Verification needed"}
              </span>
              <p style={{ fontSize: 13, marginTop: 20 }}>
                Add this TXT record with your domain provider:
              </p>
              <div
                style={{
                  overflowWrap: "anywhere",
                  fontSize: 12,
                  background: "#f7f4fb",
                  padding: 15,
                  borderRadius: 8,
                }}
              >
                <b>Name:</b> _omnyvox.{d.hostname}
                <br />
                <b>Value:</b> {d.token}
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
                After ownership verification, Nexoris provisions routing and SSL
                before activation.
              </p>
              <div className="form-actions">
                <button
                  className="button small"
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      const b = await call("PATCH", {}, `/${d.id}`);
                      setMessage(b.message);
                      await load();
                    })
                  }
                >
                  Check verification
                </button>
                <button
                  className="button secondary small"
                  onClick={() => {
                    if (confirm("Remove this domain connection?"))
                      action(async () => {
                        await call("DELETE", undefined, `/${d.id}`);
                        await load();
                      });
                  }}
                >
                  Remove
                </button>
              </div>
            </section>
          ))}
        </>
      ) : section === "merchant" ? (
        <section className="panel panel-body">
          <h2 style={{ fontSize: 23 }}>Get ready to accept payments.</h2>
          <span className="badge">
            {merchant.verified
              ? "Approved for checkout"
              : "Merchant review required"}
          </span>
          <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
            Connect your own Paystack merchant account. Store payments settle
            through your account and are kept separate from Omnyvox
            subscriptions.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              action(async () => {
                const b = await call("POST", {
                  secret: f.get("secret"),
                  delivery: Math.round(Number(f.get("delivery")) * 100),
                });
                setMessage(b.message);
                await load();
              });
            }}
          >
            <div className="form-grid">
              <label className="field full">
                Paystack secret key
                <input
                  type="password"
                  name="secret"
                  required
                  autoComplete="off"
                  placeholder="sk_test_… or sk_live_…"
                />
                <small>
                  Encrypted on the server. Never included in your public
                  website.
                </small>
              </label>
              <label className="field">
                Flat delivery fee (NGN)
                <input
                  type="number"
                  name="delivery"
                  min={0}
                  step="0.01"
                  defaultValue={merchant.delivery / 100}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="button" disabled={busy}>
                Save payment connection
              </button>
            </div>
          </form>
          <p style={{ fontSize: 12, marginTop: 25, overflowWrap: "anywhere" }}>
            Set your Paystack webhook URL to:
            <br />
            <code>
              {typeof window !== "undefined" ? location.origin : ""}
              /api/webhooks/store/{site}
            </code>
          </p>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-header">
            <h2>Store orders</h2>
            <span className="badge">{orders.length}</span>
          </div>
          {orders.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Fulfilment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        {o.customer.name}
                        <br />
                        <small>{o.customer.email}</small>
                      </td>
                      <td>₦{(o.amount / 100).toLocaleString()}</td>
                      <td>
                        <span className="badge">{o.payment_status}</span>
                      </td>
                      <td>
                        <select
                          aria-label={`Fulfilment for ${o.customer.name}`}
                          value={o.fulfilment_status}
                          disabled={o.payment_status !== "paid"}
                          onChange={(e) =>
                            action(async () => {
                              await call(
                                "PATCH",
                                { status: e.target.value },
                                `/${o.id}`,
                              );
                              await load();
                            })
                          }
                        >
                          {[
                            "unfulfilled",
                            "processing",
                            "ready_for_pickup",
                            "shipped",
                            "delivered",
                            "completed",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <h2>Your next order starts here.</h2>
              <p>
                Orders appear when customers check out from your published
                store.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
