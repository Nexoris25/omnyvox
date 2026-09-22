"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { limits, Tier } from "@/lib/model";
type Plan = {
  id: string;
  category: string;
  tier: string;
  monthly: number | null;
  annual: number | null;
  entitlements?: {
    pages: number;
    products: number;
    articles: number;
    team: number;
    storageBytes?: number;
    collections?: number;
  };
};
type AdminData = {
  sites: {
    id: string;
    name: string;
    slug: string;
    category: string;
    tier: string;
    status: string;
    subscription: string;
  }[];
  plans: Plan[];
  audit: {
    id: number;
    actor: string;
    action: string;
    target: string;
    created_at: string;
  }[];
};
export function Admin() {
  const [data, setData] = useState<AdminData | null>(null),
    [message, setMessage] = useState(""),
    [section, setSection] = useState("websites");
  async function load() {
    const r = await fetch("/api/admin");
    const b = await r.json();
    if (!r.ok) throw new Error(b.error);
    setData(b);
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  async function patch(path: string, body: unknown) {
    try {
      const r = await fetch(`/api/admin/${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      await load();
      setMessage("Changes saved and recorded in the audit log.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <>
      <section className="section" style={{ paddingTop: 35 }}>
        <div className="page-heading">
          <div>
            <span className="eyebrow">NEXORIS TECHNOLOGIES</span>
            <h1 style={{ marginTop: 15 }}>The bigger picture.</h1>
            <p>Manage websites, commercial plans, and platform activity.</p>
          </div>
        </div>
        {message && (
          <div className="notice" role="status">
            {message}
            {!data && <Link href="/login"> · Sign in →</Link>}
          </div>
        )}
        {data && (
          <>
            <div className="overview-grid">
              <div className="stat-card">
                <span className="stat-label">Websites</span>
                <strong>{data.sites.length}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Published</span>
                <strong>
                  {data.sites.filter((s) => s.status === "published").length}
                </strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active subscriptions</span>
                <strong>
                  {data.sites.filter((s) => s.subscription === "active").length}
                </strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Subscription products</span>
                <strong>{data.plans.length}</strong>
              </div>
            </div>
            <div className="tabs">
              {["websites", "plans", "audit"].map((t) => (
                <button
                  className={section === t ? "active" : ""}
                  onClick={() => setSection(t)}
                  key={t}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {section === "plans" ? (
              <div className="template-grid">
                {data.plans.map((p) => (
                  <form
                    className="panel panel-body"
                    key={p.id}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      patch("plans", {
                        id: p.id,
                        monthly: Math.round(Number(f.get("monthly")) * 100),
                        annual: Math.round(Number(f.get("annual")) * 100),
                        entitlements: {
                          pages: Number(f.get("pages")),
                          products: Number(f.get("products")),
                          articles: Number(f.get("articles")),
                          storageBytes: Math.round(
                            Number(f.get("storageGB")) * 1024 ** 3,
                          ),
                          collections: Number(f.get("collections")),
                          team:
                            p.entitlements?.team ?? limits[p.tier as Tier].team,
                        },
                      });
                    }}
                  >
                    <h2 style={{ fontSize: 19, textTransform: "capitalize" }}>
                      {p.category} {p.tier}
                    </h2>
                    <div className="stack">
                      <label className="field">
                        Monthly price (NGN)
                        <input
                          type="number"
                          name="monthly"
                          min="1"
                          step="0.01"
                          required
                          defaultValue={p.monthly ? p.monthly / 100 : ""}
                        />
                      </label>
                      <label className="field">
                        Annual price (NGN)
                        <input
                          type="number"
                          name="annual"
                          min="1"
                          step="0.01"
                          required
                          defaultValue={p.annual ? p.annual / 100 : ""}
                        />
                      </label>
                      {(["pages", "products", "articles"] as const).map(
                        (key) => (
                          <label className="field" key={key}>
                            {key} per website
                            <input
                              name={key}
                              type="number"
                              min={key === "pages" ? 1 : 0}
                              max={key === "pages" ? 10000 : 100000}
                              required
                              defaultValue={
                                p.entitlements?.[key] ??
                                limits[p.tier as Tier][key]
                              }
                            />
                          </label>
                        ),
                      )}
                      <button className="button small">Save plan</button>
                      <label className="field">
                        Storage per website (GB)
                        <input
                          type="number"
                          name="storageGB"
                          required
                          min="0.001"
                          max="1024"
                          step="0.001"
                          defaultValue={
                            (p.entitlements?.storageBytes || 1073741824) /
                            1024 ** 3
                          }
                        />
                      </label>
                      <label className="field">
                        Records per industry collection
                        <input
                          type="number"
                          name="collections"
                          required
                          min={1}
                          max={100000}
                          defaultValue={p.entitlements?.collections || 100}
                        />
                      </label>
                    </div>
                  </form>
                ))}
              </div>
            ) : section === "audit" ? (
              <div className="panel table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.audit.map((a) => (
                      <tr key={a.id}>
                        <td>{new Date(a.created_at).toLocaleString()}</td>
                        <td>{a.action}</td>
                        <td>{a.actor}</td>
                        <td>{a.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Website</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Subscription</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sites.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <b>{s.name}</b>
                          <br />
                          {s.slug}
                        </td>
                        <td>
                          {s.category} / {s.tier}
                        </td>
                        <td>
                          <span className="badge">{s.status}</span>
                        </td>
                        <td>{s.subscription}</td>
                        <td>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `${s.status === "suspended" ? "Restore to draft" : "Suspend"} ${s.name}? Content will be preserved.`,
                                )
                              )
                                patch("sites", {
                                  id: s.id,
                                  status:
                                    s.status === "suspended"
                                      ? "draft"
                                      : "suspended",
                                });
                            }}
                          >
                            {s.status === "suspended"
                              ? "Restore draft"
                              : "Suspend"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
