"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "./brand";
import { RichTextEditor, MediaPicker } from "./rich-text-editor";
import { MediaLibrary } from "./media-library";
import { Admin } from "./admin";
import { StorageSettings } from "./storage-settings";
import { AIOperations } from "./ai-operations";
type Item = {
  id: string;
  user_id?: string;
  site_id?: string;
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
  status?: string;
  reply?: string;
  business_name?: string;
  cac_number?: string;
  review_note?: string;
  verified?: boolean;
  kyb_status?: string;
  hostname?: string;
  verified_at?: string;
  active?: boolean;
  data?: {
    title: string;
    slug: string;
    body: string;
    status: string;
    category?: string;
    authorId?: string;
    image?: string;
    imageAlt?: string;
    reply?: string;
    indexing?: { index: boolean; follow: boolean };
  };
  [key: string]: unknown;
};
const tabs = [
  ["overview", "Overview & pricing"],
  ["support", "Contact inbox"],
  ["requests", "Customer requests"],
  ["kyb", "Business verification"],
  ["users", "Accounts"],
  ["subscriptions", "Subscriptions"],
  ["merchants", "Merchant payments"],
  ["domains", "Domains"],
  ["articles", "Insights"],
  ["pages", "Marketing pages"],
  ["categories", "Categories"],
  ["authors", "Authors"],
  ["legal", "Legal pages"],
  ["media", "Media library"],
  ["storage", "Media storage"],
  ["ai", "Local AI operations"],
  ["settings", "Marketing settings"],
];
const cms = ["pages", "articles", "categories", "authors", "legal"];
export function PlatformAdmin() {
  const [tab, setTab] = useState("overview"),
    [rows, setRows] = useState<Item[]>([]),
    [message, setMessage] = useState(""),
    [edit, setEdit] = useState<Item | null>(null),
    [authors, setAuthors] = useState<Item[]>([]),
    [image, setImage] = useState(""),
    [settings, setSettings] = useState<Record<string, unknown>>({});
  const endpoint =
    tab === "kyb"
      ? "/api/kyb-admin"
      : cms.includes(tab) || ["media", "settings"].includes(tab)
        ? "/api/marketing/" + tab
        : "/api/platform-admin/" + tab;
  async function call(url: string, method = "GET", body?: unknown) {
    const r = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const b = await r.json();
    if (!r.ok) throw Error(b.error);
    return b;
  }
  async function load() {
    if (["overview", "storage", "ai"].includes(tab)) return;
    const b = await call(endpoint);
    if (tab === "settings") setSettings(b);
    else setRows(b);
    if (cms.includes(tab)) setAuthors(await call("/api/marketing/authors"));
  }
  useEffect(() => {
    setRows([]);
    setEdit(null);
    setMessage("");
    load().catch((e) => setMessage(e.message));
  }, [tab]);
  async function save(url: string, method: string, body: unknown) {
    try {
      await call(url, method, body);
      setMessage("Saved. Changes are recorded in the audit log.");
      setEdit(null);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <div className="platform-admin">
      <header>
        <Brand />
        <span>Platform administration</span>
        <Link href="/dashboard">Customer workspace ↗</Link>
      </header>
      <div className="admin-layout">
        <nav aria-label="Admin navigation">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <main id="main">
          <h1>{tabs.find((t) => t[0] === tab)?.[1]}</h1>
          <p role="status">{message}</p>
          {tab === "overview" ? (
            <>
              <Admin />
              <AnnualOffers />
            </>
          ) : tab === "ai" ? (
            <AIOperations />
          ) : tab === "storage" ? (
            <StorageSettings />
          ) : tab === "settings" ? (
            <form
              className="panel panel-body"
              key={JSON.stringify(settings)}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                save(endpoint, "PATCH", {
                  socials: Object.fromEntries(
                    [
                      "facebook",
                      "instagram",
                      "linkedin",
                      "x",
                      "youtube",
                      "tiktok",
                      "whatsapp",
                    ].map((k) => [k, f.get(k) || ""]),
                  ),
                  index: f.get("index") === "on",
                  follow: f.get("follow") === "on",
                  robots: f.get("robots"),
                });
              }}
            >
              <h2>Social links & search visibility</h2>
              {[
                "facebook",
                "instagram",
                "linkedin",
                "x",
                "youtube",
                "tiktok",
                "whatsapp",
              ].map((k) => (
                <label key={k} className="field">
                  {k}
                  <input
                    type="url"
                    name={k}
                    defaultValue={
                      (settings.socials as Record<string, string>)?.[k] || ""
                    }
                    placeholder="https://…"
                  />
                </label>
              ))}
              <label>
                <input
                  name="index"
                  type="checkbox"
                  defaultChecked={settings.index !== false}
                />{" "}
                Allow indexing
              </label>
              <label>
                <input
                  name="follow"
                  type="checkbox"
                  defaultChecked={settings.follow !== false}
                />{" "}
                Follow links
              </label>
              <label className="field">
                Additional robots.txt rules
                <textarea
                  name="robots"
                  defaultValue={String(settings.robots || "")}
                />
              </label>
              <button className="button">Save settings</button>
            </form>
          ) : tab === "media" ? (
            <MediaLibrary site="" demo={false} marketing />
          ) : (
            <>
              {cms.includes(tab) && (
                <button
                  className="button"
                  onClick={() => {
                    setEdit({
                      id: "new",
                      data: { title: "", slug: "", body: "", status: "draft" },
                    });
                    setImage("");
                  }}
                >
                  Create {tab === "articles" ? "insight" : tab.slice(0, -1)} +
                </button>
              )}
              <div className="admin-records">
                {rows.map((r) => (
                  <article
                    className="panel panel-body"
                    key={r.id || r.user_id || r.site_id}
                  >
                    <h2>
                      {r.data?.title ||
                        r.business_name ||
                        r.name ||
                        r.hostname ||
                        r.email}
                    </h2>
                    {r.email && <p>{r.email}</p>}
                    {r.topic && <h3>{r.topic}</h3>}
                    {r.message && <p className="preserve-lines">{r.message}</p>}
                    {r.cac_number && (
                      <p>
                        CAC: {r.cac_number} · {r.status}
                      </p>
                    )}
                    {["support", "requests"].includes(tab) && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          save(
                            endpoint + "/" + r.id,
                            "PATCH",
                            Object.fromEntries(new FormData(e.currentTarget)),
                          );
                        }}
                      >
                        {r.data?.body && <p>{r.data.body}</p>}
                        <label className="field">
                          Status
                          <select
                            name="status"
                            defaultValue={r.status || r.data?.status}
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </label>
                        <label className="field">
                          Reply by email
                          <textarea
                            name="reply"
                            defaultValue={r.reply || r.data?.reply}
                            rows={4}
                          />
                        </label>
                        <button className="button">Save & queue reply</button>
                      </form>
                    )}
                    {tab === "kyb" && r.status === "pending" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          save(endpoint, "PATCH", {
                            ...Object.fromEntries(
                              new FormData(e.currentTarget),
                            ),
                            userId: r.user_id,
                          });
                        }}
                      >
                        <label className="field">
                          Registered name found on CAC records
                          <input name="registeredName" required minLength={2} />
                        </label>
                        <label className="field">
                          Review evidence and decision
                          <textarea name="note" required minLength={10} />
                        </label>
                        <label className="field">
                          Decision
                          <select name="status">
                            <option value="verified">Verified</option>
                            <option value="rejected">
                              Rejected — corrections required
                            </option>
                          </select>
                        </label>
                        <button className="button">Save review decision</button>
                      </form>
                    )}
                    {tab === "merchants" && (
                      <>
                        <p>
                          KYB: {r.kyb_status || "Not submitted"} · Payments:{" "}
                          {r.verified ? "Enabled" : "Awaiting approval"}
                        </p>
                        <button
                          className="button secondary"
                          onClick={() =>
                            save(endpoint + "/" + r.site_id, "PATCH", {
                              verified: !r.verified,
                            })
                          }
                        >
                          {r.verified ? "Disable payments" : "Approve payments"}
                        </button>
                      </>
                    )}
                    {tab === "domains" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          save(endpoint + "/" + r.id, "PATCH", {
                            active: !r.active,
                            sslConfirmed: true,
                          });
                        }}
                      >
                        <p>
                          Ownership: {r.verified_at ? "Verified" : "Pending"} ·
                          Routing: {r.active ? "Active" : "Inactive"}
                        </p>
                        <label>
                          <input type="checkbox" required /> TLS certificate and
                          domain routing have been provisioned.
                        </label>
                        <button
                          className="button secondary"
                          disabled={!r.verified_at}
                        >
                          {r.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    )}
                    {["users", "subscriptions"].includes(tab) && (
                      <dl>
                        {Object.entries(r)
                          .filter(
                            ([k]) =>
                              ![
                                "id",
                                "name",
                                "email",
                                "subscription_site_id",
                              ].includes(k),
                          )
                          .map(([k, v]) => (
                            <div key={k}>
                              <dt>{k.replaceAll("_", " ")}</dt>
                              <dd>{String(v ?? "—")}</dd>
                            </div>
                          ))}
                      </dl>
                    )}
                    {cms.includes(tab) && (
                      <>
                        <p>
                          {r.data?.status} · {r.data?.category}
                        </p>
                        <button
                          className="button secondary"
                          onClick={() => {
                            setEdit(r);
                            setImage(r.data?.image || "");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="button secondary"
                          onClick={() => {
                            if (confirm("Delete this content permanently?"))
                              save(endpoint + "/" + r.id, "DELETE", {});
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </article>
                ))}
              </div>
              {!rows.length && <p>No records here yet.</p>}
            </>
          )}
          {edit && (
            <div className="modal-backdrop">
              <div className="modal">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEdit(null)}
                >
                  Close editor
                </button>
                <form
                  key={edit.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    save(
                      endpoint + (edit.id === "new" ? "" : "/" + edit.id),
                      edit.id === "new" ? "POST" : "PATCH",
                      {
                        ...Object.fromEntries(f),
                        image,
                        indexing: {
                          index: f.get("index") === "on",
                          follow: f.get("follow") === "on",
                        },
                      },
                    );
                  }}
                >
                  <label className="field">
                    Title
                    <input
                      name="title"
                      defaultValue={edit.data?.title}
                      required
                      minLength={2}
                    />
                  </label>
                  <label className="field">
                    URL slug
                    <input
                      name="slug"
                      defaultValue={edit.data?.slug}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      required
                    />
                  </label>
                  <RichTextEditor
                    name="body"
                    value={edit.data?.body || ""}
                    mediaEndpoint="/api/marketing/media"
                  />
                  <MediaPicker
                    endpoint="/api/marketing/media"
                    onSelect={setImage}
                  />
                  {image && (
                    <img
                      src={image}
                      alt="Selected featured image"
                      className="editor-thumb"
                    />
                  )}
                  <label className="field">
                    Image description
                    <input
                      name="imageAlt"
                      defaultValue={edit.data?.imageAlt || ""}
                    />
                  </label>
                  <label className="field">
                    Category
                    <input
                      name="category"
                      defaultValue={edit.data?.category || "general"}
                      required
                    />
                  </label>
                  {tab === "articles" && (
                    <label className="field">
                      Author
                      <select
                        name="authorId"
                        defaultValue={edit.data?.authorId || ""}
                      >
                        <option value="">Current administrator</option>
                        {authors.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.data?.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="field">
                    Publication status
                    <select name="status" defaultValue={edit.data?.status}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="index"
                      defaultChecked={edit.data?.indexing?.index !== false}
                    />{" "}
                    Allow search indexing
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="follow"
                      defaultChecked={edit.data?.indexing?.follow !== false}
                    />{" "}
                    Follow links
                  </label>
                  <button className="button">Save content</button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
function AnnualOffers() {
  const [plans, setPlans] = useState<
      { id: string; annual_discount: number; bonus_months: number }[]
    >([]),
    [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(setPlans);
  }, []);
  return (
    <section className="panel panel-body">
      <h2>Annual subscription offers</h2>
      <p>
        A percentage discount uses 12 times the monthly price. With zero
        discount, the annual price above applies. Bonus months extend the paid
        subscription term.
      </p>
      <p role="status">{message}</p>
      {plans.map((p) => (
        <form
          className="offer-form"
          key={p.id}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const r = await fetch("/api/platform-admin/offers", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: p.id,
                annualDiscount: Number(f.get("discount")),
                bonusMonths: Number(f.get("bonus")),
              }),
            });
            const b = await r.json();
            setMessage(
              r.ok ? "Offer saved. New checkouts use this offer." : b.error,
            );
          }}
        >
          <strong>{p.id}</strong>
          <label className="field">
            Annual discount (%)
            <input
              name="discount"
              type="number"
              min={0}
              max={90}
              defaultValue={p.annual_discount}
            />
          </label>
          <label className="field">
            Extra months
            <input
              name="bonus"
              type="number"
              min={0}
              max={12}
              defaultValue={p.bonus_months}
            />
          </label>
          <button className="button secondary">Save offer</button>
        </form>
      ))}
    </section>
  );
}
