"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "./brand";
import { RichTextEditor, MediaPicker } from "./rich-text-editor";
import { MediaLibrary } from "./media-library";
import { Admin } from "./admin";
import { StorageSettings } from "./storage-settings";
import { AIOperations } from "./ai-operations";
import { AdminTable, StatusBadge, fmtDate, fmtDateTime, fmtNaira, type Column } from "./admin-table";
import { canInternal } from "@/lib/permissions";
import { StaffSettings } from "./staff-settings";
import { RecoveryReviews } from './recovery-reviews';
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
    role?: string;
    consentConfirmed?: boolean;
    links?: { website?: string; linkedin?: string; x?: string };
    indexing?: { index: boolean; follow: boolean };
  };
  [key: string]: unknown;
};
const tabs = [
  ["overview", "Overview & pricing"],
  ["staff", "Staff permissions"],
  ['recovery','Account recovery'],
  ["support", "Contact inbox"],
  ["requests", "Customer requests"],
  ["kyb", "Business verification"],
  ["users", "Accounts"],
  ["emails", "Email delivery"],
  ["subscriptions", "Subscriptions"],
  ["merchants", "Merchant payments"],
  ["payments", "Payment reviews"],
  ["domains", "Domains"],
  ["articles", "Insights"],
  ["pages", "Marketing pages"],
  ["categories", "Categories"],
  ["authors", "Authors"],
  ["testimonials", "Testimonials"],
  ["legal", "Legal pages"],
  ["media", "Media library"],
  ["storage", "Media storage"],
  ["ai", "Local AI operations"],
  ["settings", "Marketing settings"],
];
const cms = ["pages", "articles", "categories", "authors", "legal", "testimonials"];
/** Admin navigation groups; every tab id appears exactly once. */
const adminGroups: [string, string[]][] = [
  ["Overview", ["overview"]],
  ["Customers", ["users", "subscriptions", "kyb", "recovery", "support", "requests"]],
  ["Payments", ["payments", "merchants"]],
  ["Operations", ["domains", "emails", "storage", "ai", "staff"]],
  ["Marketing website", ["articles", "pages", "categories", "authors", "testimonials", "legal", "media", "settings"]],
];
export function PlatformAdmin({role = "super_admin"}:{role?:string}) {
  const allowedTabs = tabs.filter(([key])=>canInternal(role,key==='overview'?['admin']:key==='kyb'?['kyb-admin']:cms.includes(key)||['media','settings'].includes(key)?['marketing',key]:['platform-admin',key],'GET'));
  const [tab, setTab] = useState(allowedTabs[0]?.[0] || "overview"),
    [rows, setRows] = useState<Item[]>([]),
    [message, setMessage] = useState(""),
    [edit, setEdit] = useState<Item | null>(null),
    [authors, setAuthors] = useState<Item[]>([]),
    [categories, setCategories] = useState<Item[]>([]),
    [selected, setSelected] = useState<Item | null>(null),
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
    if (["overview", "storage", "ai", "staff", "recovery"].includes(tab)) return;
    const b = await call(endpoint);
    if (tab === "settings") setSettings(b);
    else setRows(b);
    if (cms.includes(tab)) {
      setAuthors(await call("/api/marketing/authors"));
      setCategories(await call("/api/marketing/categories"));
    }
  }
  useEffect(() => {
    setRows([]);
    setSelected(null);
    setEdit(null);
    setMessage("");
    load().catch((e) => setMessage(e.message));
  }, [tab]);
  async function save(url: string, method: string, body: unknown) {
    try {
      await call(url, method, body);
      setMessage("Saved. Changes are recorded in the audit log.");
      setEdit(null);
      setSelected(null);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  const renderDetail = (r: Item) => (
    <div className="admin-detail-body">
      {tab === "users" && (
        <div className="admin-actions">
          <StatusBadge
            value={r.disabled_at ? "suspended" : "active"}
            label={r.disabled_at ? "Sign-in disabled" : "Sign-in allowed"}
          />
          {r.disabled_reason ? <p className="admin-note">Reason: {String(r.disabled_reason)}</p> : null}
          {!r.email_verified && (
            <button
              type="button"
              className="button secondary small"
              onClick={() => save(endpoint + "/" + r.id, "PATCH", { action: "resend-verification" })}
            >
              Resend verification code
            </button>
          )}
          {r.disabled_at ? (
            <button
              type="button"
              className="button small"
              onClick={() => save(endpoint + "/" + r.id, "PATCH", { action: "enable" })}
            >
              Restore sign-in
            </button>
          ) : (
            <form
              className="admin-inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const reason = String(new FormData(e.currentTarget).get("reason") || "");
                if (confirm("Disable sign-in for this account? All of its sessions will end immediately."))
                  save(endpoint + "/" + r.id, "PATCH", { action: "disable", reason });
              }}
            >
              <label className="field">
                Reason for disabling (recorded in the audit log)
                <input name="reason" required minLength={10} maxLength={500} placeholder="e.g. Reported for phishing; under investigation" />
              </label>
              <button className="button secondary small danger">Disable sign-in</button>
            </form>
          )}
        </div>
      )}
      {tab === "emails" && (
        <>
          <h2>{String(r.subject)}</h2>
          <dl className="admin-facts">
            <div><dt>Recipient</dt><dd>{String(r.recipient)}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge value={emailTone[String(r.status)]} label={String(r.status)} /></dd></div>
            <div><dt>Queued</dt><dd>{fmtDateTime(r.created_at)}</dd></div>
            <div><dt>{r.sent_at ? "Delivered to provider" : "Next attempt"}</dt><dd>{fmtDateTime(r.sent_at || r.next_attempt_at)}</dd></div>
            <div><dt>Attempts</dt><dd>{String(r.attempts)}</dd></div>
            {r.site ? <div><dt>Website</dt><dd>{String(r.site)}</dd></div> : null}
            {r.provider_id ? <div className="wide"><dt>Provider reference</dt><dd>{String(r.provider_id)}</dd></div> : null}
            {r.last_error ? <div className="wide"><dt>Last error</dt><dd>{String(r.last_error)}</dd></div> : null}
          </dl>
          <p className="admin-note">Message bodies are not shown here because they can contain sign-in codes or personal details.</p>
          {!r.sent_at && (
            <button
              type="button"
              className="button small"
              onClick={() => save(endpoint + "/" + r.id, "PATCH", {})}
            >
              Retry delivery now
            </button>
          )}
        </>
      )}

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
                        CAC: {String(r.cac_number)} · {String(r.status)} ·{" "}
                        {r.verified_via === "registry" ? "checked on the CAC registry" : "manual review"}
                      </p>
                    )}
                    {!!r.registry && (
                      <dl className="admin-facts">
                        {Object.entries(r.registry as Record<string, unknown>)
                          .filter(([k]) => ["name", "entityStatus", "registeredOn", "address", "provider"].includes(k))
                          .map(([k, v]) => (
                            <div key={k}>
                              <dt>
                                {({ name: "Registry name", entityStatus: "Registry status", registeredOn: "Registered", address: "Registered address", provider: "Source" } as Record<string, string>)[k]}
                              </dt>
                              <dd>{String(v)}</dd>
                            </div>
                          ))}
                      </dl>
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
                          <input
                            name="registeredName"
                            required
                            minLength={2}
                            defaultValue={String(r.registered_name || r.business_name || "")}
                          />
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
                    {["users", "subscriptions", "payments"].includes(tab) && (
                      <dl className="admin-facts">
                        {Object.entries(r)
                          .filter(
                            ([k, v]) =>
                              !["id", "name", "subscription_site_id", "user_id", "site_id"].includes(k) &&
                              v !== null &&
                              v !== "",
                          )
                          .map(([k, v]) => (
                            <div key={k}>
                              <dt>{k.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase())}</dt>
                              <dd>
                                {typeof v === "boolean"
                                  ? v ? "Yes" : "No"
                                  : k === "amount"
                                    ? fmtNaira(v)
                                    : /(_at|_until)$/.test(k)
                                      ? fmtDateTime(v)
                                      : String(v)}
                              </dd>
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
    </div>
  );
  return (
    <div className="platform-admin">
      <header>
        <Brand />
        <span>Platform administration</span>
        <Link href="/dashboard">Customer workspace ↗</Link>
      </header>
      <div className="admin-layout">
        <nav aria-label="Admin navigation">
          {/* Phones: one grouped picker instead of a long sideways strip. */}
          <label className="admin-nav-select">
            <span>Go to</span>
            <select value={tab} onChange={(e) => setTab(e.target.value)}>
              {adminGroups.map(([group, ids]) => {
                const items = allowedTabs.filter(([id]) => ids.includes(id));
                return items.length ? (
                  <optgroup key={group} label={group}>
                    {items.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </label>
          {adminGroups.map(([group, ids]) => {
            const items = allowedTabs.filter(([id]) => ids.includes(id));
            return items.length ? (
              <div className="admin-nav-group" key={group}>
                <span className="admin-nav-heading">{group}</span>
                {items.map(([id, label]) => (
                  <button
                    key={id}
                    className={tab === id ? "active" : ""}
                    aria-current={tab === id ? "page" : undefined}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null;
          })}
        </nav>
        <main id="main">
          <h1>{tabs.find((t) => t[0] === tab)?.[1]}</h1>
          <p role="status">{message}</p>
          {tab === 'recovery' ? <RecoveryReviews/> : tab === "staff" ? <StaffSettings /> : tab === "overview" ? (
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
                  contact: {
                    email: String(f.get("contactEmail") || ""),
                    phone: String(f.get("contactPhone") || ""),
                    address: String(f.get("contactAddress") || ""),
                    hours: String(f.get("contactHours") || ""),
                  },
                });
              }}
            >
              <h2>Company contact details</h2>
              <p className="admin-note">Shown on the Contact page and in the website footer. Leave a field empty to hide it.</p>
              {(
                [
                  ["contactEmail", "Support email", "email", "email"],
                  ["contactPhone", "Phone or WhatsApp", "tel", "phone"],
                  ["contactAddress", "Office address", "text", "address"],
                  ["contactHours", "Support hours", "text", "hours"],
                ] as const
              ).map(([name, label, type, key]) => (
                <label key={name} className="field">
                  {label}
                  <input
                    name={name}
                    type={type}
                    defaultValue={((settings.contact as Record<string, string>) || {})[key] || ""}
                  />
                </label>
              ))}
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
              <AdminTable<Item>
                key={tab}
                rows={rows}
                columns={columnsFor(tab)}
                rowKey={(r) => String(r.id || r.user_id || r.site_id)}
                status={statusFor(tab)}
                onOpen={
                  cms.includes(tab)
                    ? (r) => {
                        setEdit(r);
                        setImage(r.data?.image || "");
                      }
                    : ["support", "requests", "kyb", "merchants", "domains", "users", "subscriptions", "payments", "emails"].includes(tab)
                      ? setSelected
                      : undefined
                }
                searchLabel={`Search ${tabs.find((t) => t[0] === tab)?.[1].toLowerCase() || "records"}`}
              />
              {selected && (
                <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
                  <section className="modal admin-detail" role="dialog" aria-modal="true" aria-label="Record details">
                    <button type="button" className="icon-button admin-detail-close" aria-label="Close" onClick={() => setSelected(null)}>
                      ×
                    </button>
                    {renderDetail(selected)}
                  </section>
                </div>
              )}
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
                        ...(tab === "authors"
                          ? {
                              links: {
                                website: String(f.get("website") || ""),
                                linkedin: String(f.get("linkedin") || ""),
                                x: String(f.get("x") || ""),
                              },
                              website: undefined,
                              linkedin: undefined,
                              x: undefined,
                            }
                          : {}),
                        ...(["authors", "categories", "legal", "testimonials"].includes(tab)
                          ? { category: "general" }
                          : {}),
                        ...(tab === "testimonials"
                          ? {
                              consentConfirmed: f.get("consentConfirmed") === "on",
                              slug:
                                String(f.get("slug") || "") ||
                                `${String(f.get("title") || "testimonial")
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 7)}`,
                            }
                          : {}),
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
                    {tab === "authors" || tab === "testimonials" ? "Customer name" : tab === "categories" ? "Category name" : "Title"}
                    <input
                      name="title"
                      defaultValue={edit.data?.title}
                      required
                      minLength={2}
                    />
                  </label>
                  {tab === "testimonials" && (
                    <>
                      <label className="field">
                        Role and business
                        <input name="role" maxLength={100} required defaultValue={edit.data?.role || ""} placeholder="e.g. Founder, Adaeze Fabrics, Aba" />
                      </label>
                      <label className="consent-check">
                        <input type="checkbox" name="consentConfirmed" defaultChecked={!!edit.data?.consentConfirmed} />
                        <span>
                          This customer gave written permission to publish their name, words
                          and photo on the Omnyvox website. Required before publishing.
                        </span>
                      </label>
                    </>
                  )}
                  {tab === "authors" && (
                    <>
                      <label className="field">
                        Role or job title
                        <input name="role" maxLength={100} defaultValue={edit.data?.role || ""} placeholder="e.g. Head of Customer Success" />
                      </label>
                      <div className="form-grid">
                        <label className="field">
                          Website
                          <input name="website" type="url" pattern="https://.*" defaultValue={edit.data?.links?.website || ""} placeholder="https://" />
                        </label>
                        <label className="field">
                          LinkedIn
                          <input name="linkedin" type="url" pattern="https://([a-z]+\.)?linkedin\.com/.*" defaultValue={edit.data?.links?.linkedin || ""} placeholder="https://www.linkedin.com/in/…" />
                        </label>
                        <label className="field">
                          X (Twitter)
                          <input name="x" type="url" pattern="https://(x|twitter)\.com/.*" defaultValue={edit.data?.links?.x || ""} placeholder="https://x.com/…" />
                        </label>
                      </div>
                    </>
                  )}
                  {tab === "testimonials" ? (
                    <input type="hidden" name="slug" value={edit.data?.slug || ""} />
                  ) : (
                    <label className="field">
                      URL slug
                      <input
                        name="slug"
                        defaultValue={edit.data?.slug}
                        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                        required
                      />
                    </label>
                  )}
                  {tab === "testimonials" && <span className="field-label">Testimonial (their own words)</span>}
                  <RichTextEditor
                    name="body"
                    value={edit.data?.body || ""}
                    mediaEndpoint="/api/marketing/media"
                  />
                  <span className="field-label">
                    {tab === "authors" ? "Profile photo" : "Featured image"}
                  </span>
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
                  {["articles", "pages"].includes(tab) && (
                    <label className="field">
                      Category
                      <select name="category" defaultValue={edit.data?.category || "general"}>
                        <option value="general">General</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.data?.slug}>
                            {c.data?.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
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
                  <div className="admin-edit-actions">
                    <button className="button">Save content</button>
                    {edit.id !== "new" && (
                      <button
                        type="button"
                        className="button secondary danger"
                        onClick={() => {
                          if (confirm("Delete this content permanently?"))
                            save(endpoint + "/" + edit.id, "DELETE", {});
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
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

const title = (r: Item) =>
  String(r.data?.title || r.registered_name || r.business_name || r.name || r.hostname || r.email || "—");
const emailTone: Record<string, string> = { sent: "verified", queued: "new", retrying: "pending", failed: "rejected" };
const paymentStatus: Record<string, string> = {
  pending: "Awaiting payment",
  verification_required: "Payment unconfirmed",
  review_required: "Paid after release",
};
function columnsFor(tab: string): Column<Item>[] {
  const updated: Column<Item> = {
    key: "updated",
    label: "Updated",
    text: (r) => String(r.updated_at || r.created_at || ""),
    render: (r) => fmtDate(r.updated_at || r.created_at),
  };
  switch (tab) {
    case "users":
      return [
        { key: "name", label: "Account", render: (r) => <><b>{String(r.name)}</b><small>{String(r.email)}</small></>, text: (r) => `${r.name} ${r.email}` },
        { key: "role", label: "Role", render: (r) => <StatusBadge value="info" label={String(r.role).replaceAll("_", " ")} /> },
        { key: "email_verified", label: "Email", render: (r) => <StatusBadge value={r.email_verified ? "verified" : "pending"} label={r.email_verified ? "Verified" : "Unverified"} /> },
        { key: "access", label: "Sign-in", render: (r) => <StatusBadge value={r.disabled_at ? "suspended" : "active"} label={r.disabled_at ? "Disabled" : r.two_factor ? "Allowed · 2FA" : "Allowed"} /> },
        { key: "last_sign_in", label: "Last sign-in", render: (r) => fmtDate(r.last_sign_in) },
        { key: "created_at", label: "Joined", render: (r) => fmtDate(r.created_at) },
      ];
    case "subscriptions":
      return [
        { key: "name", label: "Website", render: (r) => <><b>{String(r.name)}</b><small>{String(r.email)}</small></>, text: (r) => `${r.name} ${r.email}` },
        { key: "tier", label: "Plan", render: (r) => <span className="plan-pill">{String(r.tier)}</span> },
        { key: "subscription", label: "Status", render: (r) => <StatusBadge value={r.subscription} /> },
        { key: "billing_interval", label: "Billing", render: (r) => String(r.billing_interval || "—") },
        { key: "paid_until", label: "Paid until", render: (r) => fmtDate(r.paid_until) },
      ];
    case "payments":
      return [
        { key: "name", label: "Store", render: (r) => <><b>{String(r.name)}</b><small>{String(r.email)}</small></>, text: (r) => `${r.name} ${r.email} ${r.reference}` },
        { key: "amount", label: "Amount", render: (r) => fmtNaira(r.amount) },
        { key: "payment_status", label: "Status", render: (r) => <StatusBadge value={r.payment_status} label={paymentStatus[String(r.payment_status)]} /> },
        { key: "review_reason", label: "Reason", render: (r) => String(r.review_reason || r.reconcile_error || "—") },
        { key: "opened", label: "Opened", render: (r) => fmtDateTime(r.review_opened_at || r.created_at) },
      ];
    case "kyb":
      return [
        { key: "business", label: "Business", render: (r) => <><b>{r.registered_name || r.business_name ? String(r.registered_name || r.business_name) : "Awaiting registered name"}</b><small>{String(r.email)}</small></>, text: (r) => `${r.registered_name || ""} ${r.business_name || ""} ${r.email} ${r.cac_number}` },
        { key: "cac_number", label: "CAC number" },
        { key: "verified_via", label: "Checked by", render: (r) => (r.verified_via === "registry" ? "CAC registry" : r.verified_via === "manual" ? "Manual review" : "—") },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        { key: "submitted_at", label: "Submitted", render: (r) => fmtDate(r.submitted_at) },
      ];
    case "merchants":
      return [
        { key: "name", label: "Store" },
        { key: "kyb_status", label: "Business verification", render: (r) => <StatusBadge value={r.kyb_status || "pending"} label={r.kyb_status ? undefined : "Not submitted"} /> },
        { key: "verified", label: "Payments", render: (r) => <StatusBadge value={r.verified ? "active" : "pending"} label={r.verified ? "Enabled" : "Awaiting approval"} /> },
        { key: "delivery", label: "Flat delivery", render: (r) => fmtNaira(r.delivery) },
      ];
    case "domains":
      return [
        { key: "hostname", label: "Domain", render: (r) => <><b>{String(r.hostname)}</b><small>{String(r.name)}</small></>, text: (r) => `${r.hostname} ${r.name}` },
        { key: "verified_at", label: "Ownership", render: (r) => <StatusBadge value={r.verified_at ? "verified" : "pending"} label={r.verified_at ? "Verified" : "Pending"} /> },
        { key: "active", label: "Routing", render: (r) => <StatusBadge value={r.active ? "active" : "inactive"} label={r.active ? "Active" : "Inactive"} /> },
      ];
    case "emails":
      return [
        { key: "recipient", label: "Recipient", render: (r) => <><b>{String(r.recipient)}</b><small>{String(r.site || "Omnyvox")}</small></>, text: (r) => `${r.recipient} ${r.site || ""} ${r.subject}` },
        { key: "subject", label: "Subject" },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={emailTone[String(r.status)]} label={String(r.status)} /> },
        { key: "attempts", label: "Attempts" },
        { key: "created_at", label: "Queued", render: (r) => fmtDateTime(r.created_at) },
      ];
    case "support":
    case "requests":
      return [
        { key: "from", label: "From", render: (r) => <><b>{String(r.name || "—")}</b><small>{String(r.email || "")}</small></>, text: (r) => `${r.name} ${r.email}` },
        { key: "topic", label: "Subject", render: (r) => String(r.topic || r.data?.title || "—"), text: (r) => `${r.topic || r.data?.title || ""} ${r.message || ""}` },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status || r.data?.status || "new"} /> },
        { key: "created_at", label: "Received", render: (r) => fmtDateTime(r.created_at) },
      ];
    default:
      return [
        { key: "title", label: tab === "authors" ? "Name" : "Title", render: (r) => <><b>{title(r)}</b><small>/{String(r.data?.slug || "")}</small></>, text: (r) => `${title(r)} ${r.data?.slug || ""}` },
        ...(tab === "articles" || tab === "pages"
          ? [{ key: "category", label: "Category", render: (r: Item) => String(r.data?.category || "general").replaceAll("-", " ") }]
          : []),
        ...(tab === "authors" || tab === "testimonials" ? [{ key: "role", label: "Role", render: (r: Item) => String(r.data?.role || "—") }] : []),
        ...(tab === "testimonials"
          ? [{ key: "consent", label: "Consent", render: (r: Item) => <StatusBadge value={r.data?.consentConfirmed ? "verified" : "pending"} label={r.data?.consentConfirmed ? "Confirmed" : "Missing"} /> }]
          : []),
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.data?.status} />, text: (r) => String(r.data?.status || "") },
        updated,
      ];
  }
}
function statusFor(tab: string) {
  if (["merchants", "domains"].includes(tab)) return undefined;
  if (tab === "users") return { get: (r: Item) => (r.disabled_at ? "disabled" : r.email_verified ? "active" : "unverified") };
  if (tab === "emails") return { get: (r: Item) => String(r.status || "") };
  if (tab === "subscriptions") return { get: (r: Item) => String(r.subscription || "") };
  if (tab === "payments") return { get: (r: Item) => String(r.payment_status || ""), labels: paymentStatus };
  if (["support", "requests"].includes(tab)) return { get: (r: Item) => String(r.status || r.data?.status || "new") };
  if (tab === "kyb") return { get: (r: Item) => String(r.status || "") };
  return { get: (r: Item) => String(r.data?.status || "") };
}
