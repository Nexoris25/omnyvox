"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Globe2,
  LayoutTemplate,
  FileText,
  Palette,
  ShoppingBag,
  BarChart3,
  Settings,
  CreditCard,
  LifeBuoy,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Search,
  Image as ImageIcon,
  Eye,
  Save,
  Rocket,
  SlidersHorizontal,
  Inbox,
  Headphones,
  Download,
  Layers,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { BillingSummary } from "./billing-summary";
import { BrandSettings, RobotsSettings } from "./brand-settings";
import { RecordExtras } from "./record-extras";
import { NavigationEditor } from "./navigation-editor";
import { ContentHistory } from "./content-history";
import { FormRouting } from "./form-routing";
import { BusinessProfile } from "./business-profile";
import type { Module } from "@/lib/industry";
import { SectionEditor } from "./section-editor";
import { RichTextEditor } from "./rich-text-editor";
import { MediaLibrary } from "./media-library";
import { WebsiteOperations } from "./website-operations";
import { Brand } from "./brand";
import { SiteRenderer } from "./site-renderer";
import { ScaledPreview } from "./scaled-preview";
import { templates, templateManifests, templateIds } from "@/lib/templates";
import {
  TemplateCard,
  TemplatePickerGrid,
  templateOptions,
} from "./template-picker";
import { Site, limits, entitled } from "@/lib/model";
import { previewSite } from "@/lib/industry-kits";
const nav = [
  ["overview", "Overview", LayoutDashboard],
  ["websites", "My websites", Globe2],
  ["editor", "Website editor", Layers],
  ["pages", "Pages", FileText],
  ["branding", "Brand & appearance", Palette],
  ["media", "Media library", ImageIcon],
  ["articles", "Blog / Insights", FileText],
  ["authors", "Authors", FileText],
  ["categories", "Categories", FileText],
  ["legal", "Legal pages", FileText],
  ["products", "Products", ShoppingBag],
  ["orders", "Orders", ShoppingBag],
  ["merchant", "Store payments", CreditCard],
  ["enquiries", "Enquiries", Inbox],
  ["domains", "Domains", Globe2],
  ["seo", "SEO settings", Search],
  ["templates", "Templates", LayoutTemplate],
  ["billing", "Subscription & billing", CreditCard],
] as const;
const demoSite: Site = {
  id: "demo",
  owner_id: "demo",
  name: "Forma Studio",
  slug: "forma-studio",
  category: "corporate",
  tier: "growth",
  status: "draft",
  subscription: "pending",
  industry_id: "technology",
  data: previewSite("technology", "corporate", { name: "Forma Studio" }).data,
  published: null,
};
type Row = {
  id: string;
  data: {
    title: string;
    slug: string;
    body: string;
    status: string;
    category?: string;
    price?: number;
    stock?: number;
    image?: string;
    imageAlt?: string;
    authorId?: string;
    sections?: import("@/lib/model").Section[];
    indexing?: { index: boolean; follow: boolean };
    name?: string;
    email?: string;
    message?: string;
  };
  created_at: string;
};
export function Dashboard({ section }: { section: string }) {
  const [sites, setSites] = useState<Site[]>([]),
    [selected, setSelected] = useState(""),
    [account, setAccount] = useState<{
      name: string;
      email: string;
      email_verified?: boolean;
    }>({ name: "Your workspace", email: "" }),
    [loading, setLoading] = useState(true),
    [demo, setDemo] = useState(false),
    [menu, setMenu] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(false),
    [rows, setRows] = useState<Row[]>([]),
    [editRow, setEditRow] = useState<Row | null>(null),
    [recordModal, setRecordModal] = useState(false),
    [filter, setFilter] = useState(""),
    [modules, setModules] = useState<Module[]>([]),
    [industries, setIndustries] = useState<
      { id: string; label: string; category: string }[]
    >([]),
    [creationCategory, setCreationCategory] = useState("corporate"),
    [creationIndustry, setCreationIndustry] = useState(""),
    [industryTouched, setIndustryTouched] = useState(false),
    [creationTemplate, setCreationTemplate] = useState("studio"),
    [preview, setPreview] = useState(0),
    [startPreferences, setStartPreferences] = useState<{
      template?: string;
      category?: string;
      tier?: string;
    }>({});
  useEffect(() => {
    if (selected) sessionStorage.setItem("omnyvox-selected-site", selected);
  }, [selected]);
  const site = sites.find((s) => s.id === selected) || sites[0];
  useEffect(() => {
    if (site && !demo)
      api(`sites/${site.id}/modules`)
        .then((b) => setModules(b.modules))
        .catch((e) => setMessage(e.message));
  }, [site?.id, site?.tier, demo]);
  useEffect(() => {
    api("industries")
      .then(setIndustries)
      .catch(() => {});
  }, []);
  const [previewExtras, setPreviewExtras] = useState<{
    legal: { title: string; href: string }[];
    contact: { phone?: string; address?: string; hours?: string };
  }>({ legal: [], contact: {} });
  useEffect(() => {
    if (!site || section !== "editor") return;
    if (demo) {
      const p = previewSite(site.industry_id || "general", site.category, {
        name: site.data.brand.name,
      });
      setPreviewExtras({ legal: p.legal, contact: p.contact });
      return;
    }
    Promise.all([
      api(`sites/${site.id}/legal`).catch(() => []),
      api(`sites/${site.id}/business`).catch(() => ({})),
    ]).then(
      ([legal, facts]: [
        { data: { title: string } }[],
        { phone?: string; address?: string; showAddress?: boolean; hours?: string },
      ]) =>
        setPreviewExtras({
          legal: legal.map((l) => ({ title: l.data.title, href: "#" })),
          contact: {
            phone: facts.phone || undefined,
            address: facts.showAddress ? facts.address || undefined : undefined,
            hours: facts.hours || undefined,
          },
        }),
    );
  }, [site?.id, section, demo]);
  useEffect(() => {
    const belongs = industries.some(
      (i) => i.id === creationIndustry && i.category === creationCategory,
    );
    if (!belongs) {
      const match = industries.find((i) => i.category === creationCategory);
      setCreationIndustry(match ? match.id : "");
    }
  }, [industries, creationCategory, creationIndustry]);
  useEffect(() => {
    if (!creationIndustry) return;
    if (!industryTouched && startPreferences.template) return;
    const [best] = templateOptions(
      creationCategory as "corporate" | "commerce",
      creationIndustry,
    );
    if (best) setCreationTemplate(best.id);
  }, [creationIndustry, creationCategory]);
  const isRecords = [
    "pages",
    "articles",
    "products",
    "enquiries",
    "support",
    "services",
    "legal",
    "authors",
    "categories",
    "offerings",
    "projects",
    "people",
    "properties",
    "facilities",
    "programmes",
    "locations",
  ].includes(section);
  async function api(path: string, method = "GET", body?: unknown) {
    const r = await fetch(`/api/${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error || "Something went wrong");
    return b;
  }
  useEffect(() => {
    setSelected(sessionStorage.getItem("omnyvox-selected-site") || "");
    try {
      const preferences = JSON.parse(
        sessionStorage.getItem("omnyvox-start") || "{}",
      );
      setStartPreferences(preferences);
      const startCategory =
        preferences.category === "commerce" ? "commerce" : "corporate";
      setCreationCategory(startCategory);
      setCreationTemplate(
        preferences.template ||
          (startCategory === "commerce" ? "catalogue" : "studio"),
      );
    } catch {}
    const isDemo = new URLSearchParams(location.search).get("demo") === "1";
    if (isDemo) {
      setDemo(true);
      const saved = sessionStorage.getItem("omnyvox-demo");
      try {
        setSites(saved ? JSON.parse(saved) : [demoSite]);
      } catch {
        setSites([demoSite]);
      }
      setAccount({ name: "Alex Morgan", email: "demo@example.com" });
      setLoading(false);
      return;
    }
    Promise.all([api("me"), api("sites")])
      .then(([u, s]) => {
        setAccount(u);
        setSites(s);
      })
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (demo && sites.length)
      sessionStorage.setItem("omnyvox-demo", JSON.stringify(sites));
  }, [sites, demo]);
  useEffect(() => {
    if (!site || !isRecords) return;
    setRows([]);
    if (demo) {
      try {
        setRows(
          JSON.parse(
            sessionStorage.getItem(`demo-${site.id}-${section}`) || "[]",
          ),
        );
      } catch {}
      return;
    }
    api(`sites/${site.id}/${section}`)
      .then(setRows)
      .catch((e) => setMessage(e.message));
  }, [site?.id, section, demo, isRecords]);
  function updateSite(data: Site["data"]) {
    setSites((prev) =>
      prev.map((s) =>
        s.id === site.id ? { ...s, name: data.brand.name, data } : s,
      ),
    );
  }
  async function action(work: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    await action(async () => {
      if (!demo) await api(`sites/${site.id}`, "PATCH", site.data);
      setMessage(
        demo
          ? "Saved in this demo session."
          : "Your changes are saved as a draft.",
      );
    });
  }
  async function publish() {
    await action(async () => {
      if (demo) {
        setMessage(
          "Demo preview only. Create an account and activate a subscription to publish.",
        );
        return;
      }
      await api(`sites/${site.id}`, "PATCH", site.data);
      await api(`sites/${site.id}/publish`, "POST");
      setSites(await api("sites"));
      setMessage("Your website is published.");
    });
  }
  const href = (s: string) =>
    `/dashboard${s === "overview" ? "" : `/${s}`}${demo ? "?demo=1" : ""}`;
  function NewSite() {
    return (
      <div className="modal-backdrop">
        <section
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label="Create website"
        >
          <div className="modal-header">
            <h2>Your next website starts here.</h2>
            <button
              className="icon-button"
              onClick={() => setModal(false)}
              aria-label="Close"
            >
              <X />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              action(async () => {
                const s = demo
                  ? ({
                      ...demoSite,
                      id: crypto.randomUUID(),
                      name: String(data.name),
                      slug: String(data.slug),
                      category: data.category,
                      tier: data.tier,
                      industry_id: String(data.industry),
                      data: {
                        ...previewSite(
                          String(data.industry),
                          data.category as "corporate" | "commerce",
                          { name: String(data.name) },
                        ).data,
                        template: String(data.template),
                      },
                    } as Site)
                  : await api("sites", "POST", data);
                setSites([...sites, s]);
                setSelected(s.id);
                setModal(false);
                setMessage(
                  "Website created. Make it yours in the website editor.",
                );
              });
            }}
          >
            <div className="form-grid">
              <label className="field full">
                Business name
                <input
                  name="name"
                  required
                  minLength={2}
                  placeholder="Your business name"
                  autoFocus
                />
              </label>
              <label className="field full">
                Website address
                <input
                  name="slug"
                  required
                  pattern="[a-z][a-z0-9\-]{2,48}"
                  placeholder="your-business"
                />
                <small>
                  Use lowercase letters, numbers, and hyphens. Your address:
                  your-business.omnyvox.com
                </small>
              </label>
              <label className="field">
                Website category
                <select
                  name="category"
                  onChange={(e) => {
                    const cat = e.target.value;
                    setIndustryTouched(true);
                    setCreationCategory(cat);
                    setCreationTemplate(
                      cat === "commerce" ? "catalogue" : "studio",
                    );
                  }}
                  defaultValue={startPreferences.category || "corporate"}
                >
                  <option value="corporate">Corporate website</option>
                  <option value="commerce">e-Commerce store</option>
                </select>
              </label>
              <label className="field">
                Industry
                <select
                  name="industry"
                  key={creationCategory}
                  aria-label="Industry"
                  value={creationIndustry}
                  onChange={(e) => {
                    setIndustryTouched(true);
                    setCreationIndustry(e.target.value);
                  }}
                >
                  {industries
                    .filter((i) => i.category === creationCategory)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                Your plan
                <select
                  name="tier"
                  defaultValue={startPreferences.tier || "basic"}
                >
                  <option value="basic">Basic</option>
                  <option value="growth">Growth</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <div className="field full">
                <span className="field-label">Starting template</span>
                <p className="muted" style={{ fontSize: 12, margin: "0 0 4px" }}>
                  Matched to your industry — change it any time later.
                </p>
                <TemplatePickerGrid
                  category={creationCategory as "corporate" | "commerce"}
                  industry={creationIndustry}
                  value={creationTemplate}
                  onChange={setCreationTemplate}
                />
                <input type="hidden" name="template" value={creationTemplate} />
              </div>
            </div>
            <p className="muted" style={{ fontSize: 11, marginTop: 18 }}>
              Start with a draft. Subscription payment is required before your
              website goes live.
            </p>
            <div className="form-actions">
              <button className="button" disabled={busy}>
                Create website <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }
  async function upload(file: File) {
    if (demo) {
      setMessage(
        "Image uploads require an account. Colour and content changes work in this demo.",
      );
      return;
    }
    await action(async () => {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch(`/api/sites/${site.id}/media`, {
        method: "POST",
        body: form,
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      updateSite({ ...site.data, brand: { ...site.data.brand, logo: b.url } });
      setMessage(
        "Logo uploaded and converted to WebP. Save your brand settings to apply it.",
      );
    });
  }
  async function saveRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const data = {
      ...form,
      policyReviewed: form.policyReviewed === "on",
      title: String(form.title || ""),
      slug: String(form.slug || ""),
      body: String(form.body || ""),
      status: String(form.status || "draft"),
      publishAt: form.publishAt
        ? new Date(String(form.publishAt) + "Z").toISOString()
        : "",
      price: Math.round(Number(form.price || 0) * 100),
      stock: Number(form.stock || 0),
      indexing: { index: form.index === "on", follow: form.follow === "on" },
      sections: form.sections ? JSON.parse(String(form.sections)) : undefined,
      details: form.details ? JSON.parse(String(form.details)) : undefined,
    };
    await action(async () => {
      if (demo) {
        const newRow = {
          id: editRow?.id || crypto.randomUUID(),
          data: data as Row["data"],
          created_at: new Date().toISOString(),
        };
        const next = editRow
          ? rows.map((r) => (r.id === editRow.id ? newRow : r))
          : [newRow, ...rows];
        setRows(next);
        sessionStorage.setItem(
          `demo-${site.id}-${section}`,
          JSON.stringify(next),
        );
      } else {
        await api(
          `sites/${site.id}/${section}${editRow ? "/" + editRow.id : ""}`,
          editRow ? "PATCH" : "POST",
          data,
        );
        setRows(await api(`sites/${site.id}/${section}`));
      }
      setRecordModal(false);
      setMessage("Saved successfully.");
    });
  }
  const title =
    modules.find((m) => m.key === section)?.label ||
    nav.find((n) => n[0] === section)?.[1] ||
    (
      {
        services: "Professional setup",
        support: "Help & support",
        domains: "Domain settings",
        analytics: "Analytics",
      } as Record<string, string>
    )[section] ||
    "Overview";
  return (
    <div className="workspace">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Brand />
        <div className="workspace-switcher">
          <span className="workspace-avatar">{account.name.charAt(0)}</span>
          <div>
            <b>{account.name.split(" ")[0]}’s workspace</b>
            <small>{demo ? "Demo workspace" : "Business workspace"}</small>
          </div>
          {menu && (
            <button
              className="icon-button"
              onClick={() => setMenu(false)}
              aria-label="Close menu"
            >
              <X />
            </button>
          )}
        </div>
        <div className="nav-group">WORKSPACE</div>
        <nav>
          {(demo || !site
            ? nav.map(([key, label]) => ({
                key,
                label,
                state: "enabled" as const,
              }))
            : modules
          ).map(({ key, label, state }) => {
            const Icon = nav.find((n) => n[0] === key)?.[2] || FileText;
            return (
              <Link
                href={href(key)}
                className={section === key ? "active" : ""}
                key={key}
                onClick={() => setMenu(false)}
              >
                <Icon />
                {label}
                {state === "upgrade" && <small>Growth+</small>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href={href("services")}>
            <Headphones size={17} />
            Professional setup
          </Link>
          <Link href={href("support")}>
            <LifeBuoy size={17} />
            Help & support
          </Link>
          <button
            className="button secondary small"
            style={{ width: "100%", marginTop: 12 }}
            onClick={() =>
              demo
                ? location.assign("/register")
                : action(async () => {
                    await api("auth/logout", "POST");
                    location.href = "/login";
                  })
            }
          >
            {demo ? "Create your own account" : "Log out"}
            <LogOut size={13} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(!menu)}
            >
              <Menu />
            </button>
            <div className="breadcrumbs">
              <span>Workspace</span>
              <ChevronRight size={12} />
              <b>{title}</b>
            </div>
          </div>
          <div className="account">
            {site && (
              <Link
                href={demo ? href("editor") : `/sites/${site.slug}?preview=1`}
                className="icon-button"
                aria-label="Preview website"
              >
                <ExternalLink />
              </Link>
            )}
            <span>{account.name}</span>
            <div className="avatar">
              {account.name
                .split(" ")
                .map((v) => v[0])
                .slice(0, 2)
                .join("")}
            </div>
          </div>
        </header>
        <main id="main" className="workspace-content">
          {demo && (
            <div className="notice">
              Interactive demo · Changes stay in this browser session.{" "}
              <Link href="/register">
                <b>Create an account →</b>
              </Link>
            </div>
          )}
          {!demo && account.email_verified === false && (
            <div className="notice">
              Enter your email code to complete verification.{" "}
              <Link href="/onboarding">Verify email & business →</Link>{" "}
              <button
                className="button secondary small"
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    const result = await api(
                      "auth/resend-verification",
                      "POST",
                      {},
                    );
                    setMessage(result.message);
                  })
                }
              >
                Resend verification
              </button>
            </div>
          )}
          {message && (
            <div className="notice" role="status">
              {message}{" "}
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
                style={{
                  float: "right",
                  background: "none",
                  border: 0,
                  color: "inherit",
                }}
              >
                ×
              </button>
              {message === "Please sign in" && (
                <Link href="/login"> Log in →</Link>
              )}
            </div>
          )}
          {loading ? (
            <div className="loading">Opening your workspace…</div>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <h1>
                    {section === "overview"
                      ? `Welcome ${demo ? "back, Alex" : account.name === "Your workspace" ? "to Omnyvox" : account.name.split(" ")[0]}.`
                      : title}
                  </h1>
                  <p>
                    {section === "overview"
                      ? "A little progress today. A bigger possibility tomorrow."
                      : section === "branding"
                        ? "Make every detail feel unmistakably like your business."
                        : section === "editor"
                          ? "Make changes, preview your website, and publish when you’re ready."
                          : "Everything you need, right where you need it."}
                  </p>
                </div>
                {["overview", "websites"].includes(section) ? (
                  <button className="button" onClick={() => setModal(true)}>
                    <Plus size={15} />
                    Create website
                  </button>
                ) : site && ["branding", "seo", "editor"].includes(section) ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={save}
                    >
                      <Save size={14} />
                      Save draft
                    </button>
                    {section === "editor" && (
                      <button
                        className="button"
                        disabled={busy}
                        onClick={publish}
                      >
                        <Rocket size={14} />
                        Publish
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
              {sites.length > 1 && (
                <label
                  className="field"
                  style={{ maxWidth: 320, marginBottom: 22 }}
                >
                  Current website
                  <select
                    value={site?.id}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {sites.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {site && section === "enquiries" && !demo && (
                <FormRouting siteId={site.id} />
              )}
              {site && section === "business" && !demo ? (
                <BusinessProfile siteId={site.id} />
              ) : site &&
                !demo &&
                modules.length > 0 &&
                !["support", "services"].includes(section) &&
                (!modules.find((m) => m.key === section) ||
                  modules.find((m) => m.key === section)?.state ===
                    "upgrade") ? (
                <section className="panel panel-body">
                  <h2>
                    {modules.find((m) => m.key === section)?.state === "upgrade"
                      ? "Available on Growth and Advanced"
                      : "This module does not apply to your website"}
                  </h2>
                  <p>
                    {modules.find((m) => m.key === section)?.state === "upgrade"
                      ? "Compare plans to enable this feature. Your existing content is preserved."
                      : "Use the menu to manage the features for your business."}
                  </p>
                  <Link href={href("billing")}>View subscription</Link>
                </section>
              ) : !site && !["templates", "billing"].includes(section) ? (
                <div className="panel empty">
                  <Globe2 />
                  <h2>Your next chapter is a website.</h2>
                  <p>
                    Create your first website to start customising your content,
                    colours, and brand.
                  </p>
                  <button className="button" onClick={() => setModal(true)}>
                    Create your first website <Plus size={16} />
                  </button>
                </div>
              ) : (
                <>
                  {section === "overview" && site && (
                    <>
                      <div className="overview-grid">
                        {[
                          [
                            "Your websites",
                            sites.length.toString(),
                            "One workspace, endless possibilities",
                            Globe2,
                          ],
                          [
                            "Published websites",
                            sites
                              .filter((s) => s.status === "published")
                              .length.toString(),
                            "Ready for the world",
                            Eye,
                          ],
                          [
                            "Current plan",
                            site.tier.charAt(0).toUpperCase() +
                              site.tier.slice(1),
                            "Made for your next chapter",
                            ZapIcon,
                          ],
                          [
                            "Website status",
                            site.status === "published" ? "Live" : "Draft",
                            site.subscription === "active"
                              ? "Subscription active"
                              : "Finish setup to go live",
                            BarChart3,
                          ],
                        ].map(([label, value, note, Icon]) => {
                          const I = Icon as typeof Globe2;
                          return (
                            <div className="stat-card" key={String(label)}>
                              <div className="stat-label">
                                {String(label)}
                                <I />
                              </div>
                              <strong>{String(value)}</strong>
                              <small>{String(note)}</small>
                            </div>
                          );
                        })}
                      </div>
                      <div className="dashboard-grid">
                        <section className="panel">
                          <div className="panel-header">
                            <h2>Your website</h2>
                            <Link href={href("websites")}>
                              View all <ArrowUpRight size={12} />
                            </Link>
                          </div>
                          <div className="panel-body">
                            <div className="site-preview">
                              <div className="site-preview-bar">
                                <span>● ● ●</span>
                                <span>{site.slug}.omnyvox.com</span>
                                <ExternalLink size={10} />
                              </div>
                              <div
                                className="site-preview-content"
                                style={{
                                  background:
                                    site.data.template === "horizon"
                                      ? "#1b3445"
                                      : undefined,
                                  color:
                                    site.data.template === "horizon"
                                      ? "white"
                                      : undefined,
                                }}
                              >
                                <small>{site.name.toUpperCase()}</small>
                                <h3>{site.data.sections[0]?.title}</h3>
                                <p>{site.data.sections[0]?.body}</p>
                              </div>
                            </div>
                            <div className="site-info">
                              <div>
                                <h3>{site.name}</h3>
                                <small>{site.slug}.omnyvox.com</small>
                              </div>
                              <span
                                className={`badge ${site.status === "published" ? "live" : ""}`}
                              >
                                {site.status === "published"
                                  ? "Published"
                                  : "Draft website"}
                              </span>
                            </div>
                            <div className="panel-actions">
                              <Link href={href("editor")} className="button">
                                Edit your website <ArrowUpRight size={13} />
                              </Link>
                              <Link
                                href={
                                  demo
                                    ? href("editor")
                                    : `/sites/${site.slug}?preview=1`
                                }
                                className="button secondary"
                              >
                                <Eye size={13} />
                                Preview website
                              </Link>
                            </div>
                          </div>
                        </section>
                        <section className="panel">
                          <div className="panel-header">
                            <h2>Let’s get you launch-ready</h2>
                            <span className="badge">
                              {1 +
                                (site.subscription === "active" ? 1 : 0) +
                                (site.status === "published" ? 1 : 0)}{" "}
                              of 4
                            </span>
                          </div>
                          <div className="checklist">
                            {[
                              [
                                "Choose your starting point",
                                "Website and template selected",
                                "templates",
                                true,
                              ],
                              [
                                "Make it your own",
                                "Add your branding and content",
                                "branding",
                                false,
                              ],
                              [
                                "Activate your subscription",
                                "Choose how you want to grow",
                                "billing",
                                site.subscription === "active",
                              ],
                              [
                                "Share it with the world",
                                "Preview and publish your website",
                                "editor",
                                site.status === "published",
                              ],
                            ].map(([t, d, url, done], i) => (
                              <Link href={href(String(url))} key={String(t)}>
                                <span
                                  className={`check-circle ${done ? "done" : ""}`}
                                >
                                  {done ? <Check /> : i + 1}
                                </span>
                                <div>
                                  <h3>{String(t)}</h3>
                                  <p>{String(d)}</p>
                                </div>
                                <ChevronRight
                                  style={{
                                    marginLeft: "auto",
                                    color: "#b6a9c5",
                                  }}
                                />
                              </Link>
                            ))}
                          </div>
                        </section>
                      </div>
                      <div className="quick-grid">
                        {[
                          [
                            "branding",
                            "Change your colours",
                            "A fresh look, entirely yours.",
                            Palette,
                          ],
                          [
                            "pages",
                            "Update your content",
                            "Keep your website up to date.",
                            FileText,
                          ],
                          [
                            "seo",
                            "Get discovered",
                            "Fine-tune how you show up.",
                            Search,
                          ],
                        ].map(([key, t, d, Icon]) => {
                          const I = Icon as typeof Palette;
                          return (
                            <Link
                              className="quick-card"
                              href={href(String(key))}
                              key={String(key)}
                            >
                              <I />
                              <div>
                                <h3>{String(t)}</h3>
                                <p>{String(d)}</p>
                              </div>
                              <ChevronRight
                                size={13}
                                style={{ marginLeft: "auto", color: "#b4a9c2" }}
                              />
                            </Link>
                          );
                        })}
                      </div>
                      <div className="help-banner">
                        <div>
                          <h3>A great website, with a helping hand.</h3>
                          <p>
                            Let the Nexoris team help with setup, content, and
                            the finishing touches.
                          </p>
                        </div>
                        <Link
                          href={href("services")}
                          className="button secondary"
                        >
                          Explore setup services <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </>
                  )}
                  {section === "websites" && (
                    <div className="template-grid">
                      {sites.map((s) => (
                        <article className="panel" key={s.id}>
                          <div className="panel-body">
                            <span className="badge">
                              {s.category === "commerce"
                                ? "Online store"
                                : "Corporate website"}
                            </span>
                            <h2 style={{ fontSize: 22, marginTop: 20 }}>
                              {s.name}
                            </h2>
                            <p className="muted" style={{ fontSize: 12 }}>
                              {s.slug}.omnyvox.com
                            </p>
                            <span className="badge">{s.status}</span>
                            <div className="form-actions">
                              <button
                                className="button small"
                                onClick={() => {
                                  setSelected(s.id);
                                  location.href = href("editor");
                                }}
                              >
                                Open editor <ArrowUpRight size={13} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {section === "branding" && site && (
                    <div className="dashboard-grid">
                      <section className="panel">
                        <div className="panel-header">
                          <h2>Your brand, in every detail</h2>
                          <Palette size={17} />
                        </div>
                        <div className="panel-body form-grid">
                          <label className="field full">
                            Business name
                            <input
                              value={site.data.brand.name}
                              onChange={(e) =>
                                updateSite({
                                  ...site.data,
                                  brand: {
                                    ...site.data.brand,
                                    name: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                          <label className="field full">
                            Logo
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) =>
                                e.target.files?.[0] && upload(e.target.files[0])
                              }
                            />
                            <small>
                              PNG, JPG, or WebP. Up to 5 MB. Optimised to WebP
                              automatically.
                            </small>
                            {site.data.brand.logo && (
                              <button
                                className="button secondary small"
                                onClick={() =>
                                  updateSite({
                                    ...site.data,
                                    brand: { ...site.data.brand, logo: "" },
                                  })
                                }
                              >
                                Remove logo
                              </button>
                            )}
                          </label>
                          {(
                            [
                              "primary",
                              "secondary",
                              "background",
                              "text",
                            ] as const
                          ).map((key) => (
                            <label className="field" key={key}>
                              {key.charAt(0).toUpperCase() + key.slice(1)}{" "}
                              colour
                              <div className="colour-field">
                                <input
                                  type="color"
                                  aria-label={`${key} colour picker`}
                                  value={site.data.brand[key]}
                                  onChange={(e) =>
                                    updateSite({
                                      ...site.data,
                                      brand: {
                                        ...site.data.brand,
                                        [key]: e.target.value,
                                      },
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  aria-label={`${key} colour hex`}
                                  value={site.data.brand[key]}
                                  maxLength={7}
                                  onChange={(e) =>
                                    updateSite({
                                      ...site.data,
                                      brand: {
                                        ...site.data.brand,
                                        [key]: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </div>
                            </label>
                          ))}
                          <label className="field full">
                            Typography
                            <select
                              value={site.data.brand.font}
                              onChange={(e) =>
                                updateSite({
                                  ...site.data,
                                  brand: {
                                    ...site.data.brand,
                                    font: e.target.value as "sans" | "serif",
                                  },
                                })
                              }
                            >
                              <option value="sans">Modern sans serif</option>
                              <option value="serif">Classic serif</option>
                            </select>
                          </label>
                          <label className="field full">
                            Contact email
                            <input
                              type="email"
                              value={site.data.brand.email}
                              onChange={(e) =>
                                updateSite({
                                  ...site.data,
                                  brand: {
                                    ...site.data.brand,
                                    email: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        </div>
                      </section>
                      <section className="panel">
                        <div className="panel-header">
                          <h2>Brand preview</h2>
                          <Eye size={17} />
                        </div>
                        <div
                          className="panel-body"
                          style={{
                            background: site.data.brand.background,
                            color: site.data.brand.text,
                            fontFamily:
                              site.data.brand.font === "serif"
                                ? "Georgia"
                                : "inherit",
                            minHeight: 300,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: site.data.brand.primary,
                              fontWeight: 600,
                            }}
                          >
                            YOUR BRAND, YOUR WAY
                          </span>
                          <h2 style={{ fontSize: 28, marginTop: 30 }}>
                            {site.data.brand.name}
                          </h2>
                          <p style={{ fontSize: 13 }}>
                            Good things happen when your website feels like your
                            business.
                          </p>
                          <button
                            className="button"
                            style={{
                              background: site.data.brand.primary,
                              borderColor: site.data.brand.primary,
                            }}
                            onClick={() =>
                              setMessage(
                                "This is a preview of your website’s button style.",
                              )
                            }
                          >
                            Let’s talk <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </section>
                    </div>
                  )}
                  {section === "branding" && site && (
                    <NavigationEditor
                      siteId={site.id}
                      brand={site.data.brand}
                      sections={site.data.sections}
                      modules={modules}
                      category={site.category}
                      onChange={(brand) => updateSite({ ...site.data, brand })}
                      demo={demo}
                    />
                  )}
                  {section === "branding" && site && (
                    <BrandSettings
                      brand={site.data.brand}
                      onChange={(brand) => updateSite({ ...site.data, brand })}
                    />
                  )}
                  {section === "seo" && site && (
                    <RobotsSettings
                      brand={site.data.brand}
                      onChange={(brand) => updateSite({ ...site.data, brand })}
                    />
                  )}
                  {section === "seo" && site && (
                    <section className="panel">
                      <div className="panel-header">
                        <h2>Search & social sharing</h2>
                        <Search size={17} />
                      </div>
                      <div className="panel-body">
                        <div className="form-grid">
                          <label className="field full">
                            Website title
                            <input
                              maxLength={100}
                              value={site.data.brand.name}
                              onChange={(e) =>
                                updateSite({
                                  ...site.data,
                                  brand: {
                                    ...site.data.brand,
                                    name: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                          <label className="field full">
                            Website description
                            <textarea
                              maxLength={300}
                              value={site.data.brand.description}
                              onChange={(e) =>
                                updateSite({
                                  ...site.data,
                                  brand: {
                                    ...site.data.brand,
                                    description: e.target.value,
                                  },
                                })
                              }
                            />
                            <small>
                              {site.data.brand.description.length}/300
                              characters. A clear summary helps people decide to
                              visit.
                            </small>
                          </label>
                          <label className="inline-check field full">
                            <input
                              type="checkbox"
                              checked={site.data.brand.categoryUrls}
                              onChange={(e) =>
                                updateSite({
                                  ...site.data,
                                  brand: {
                                    ...site.data.brand,
                                    categoryUrls: e.target.checked,
                                  },
                                })
                              }
                            />
                            <span>
                              Include article categories in URLs
                              <small style={{ display: "block" }}>
                                Example: /insights/
                                {site.data.brand.categoryUrls
                                  ? "business/"
                                  : ""}
                                your-article. The other URL redirects to your
                                preferred format.
                              </small>
                            </span>
                          </label>
                        </div>
                        <div className="notice" style={{ marginTop: 25 }}>
                          Organisation schema uses your business name. Article
                          schema uses the signed-in author’s name. Canonical
                          URLs, Open Graph tags, and sitemaps are generated for
                          published content.
                        </div>
                        <div
                          style={{
                            border: "1px solid var(--line)",
                            padding: 22,
                            borderRadius: 9,
                          }}
                        >
                          <small className="muted">SEARCH PREVIEW</small>
                          <h3
                            style={{
                              color: "#32107e",
                              fontSize: 21,
                              margin: "12px 0 6px",
                            }}
                          >
                            {site.data.brand.name}
                          </h3>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#408565",
                              margin: 0,
                            }}
                          >
                            {site.slug}.omnyvox.com
                          </p>
                          <p style={{ fontSize: 13, margin: "6px 0 0" }}>
                            {site.data.brand.description}
                          </p>
                        </div>
                      </div>
                    </section>
                  )}
                  {section === "editor" && site && (
                    <>
                      <div className="tabs">
                        <button
                          className={preview === 0 ? "active" : ""}
                          onClick={() => setPreview(0)}
                        >
                          <Monitor size={13} /> Desktop
                        </button>
                        <button
                          className={preview === 768 ? "active" : ""}
                          onClick={() => setPreview(768)}
                        >
                          <Tablet size={13} /> Tablet
                        </button>
                        <button
                          className={preview === 375 ? "active" : ""}
                          onClick={() => setPreview(375)}
                        >
                          <Smartphone size={13} /> 375px mobile
                        </button>
                      </div>
                      <div className="editor-grid">
                        <SectionEditor
                          sections={site.data.sections}
                          onChange={(sections) =>
                            updateSite({ ...site.data, sections })
                          }
                          mediaEndpoint={
                            demo ? undefined : `/api/sites/${site.id}/media`
                          }
                          allowVideo={entitled(site.tier, "video")}
                          industry={site.industry_id}
                        />
                        <div className="preview-wrap">
                          <ScaledPreview width={preview || 1280}>
                            <SiteRenderer
                              data={site.data}
                              videoEnabled={entitled(site.tier, "video")}
                              legal={previewExtras.legal}
                              contact={previewExtras.contact}
                            />
                          </ScaledPreview>
                        </div>
                      </div>
                    </>
                  )}
                  {section === "templates" && (
                    <>
                      <div className="notice">
                        Switch templates while keeping your content and brand
                        settings. Save your draft in the editor to keep the
                        change.
                      </div>
                      <div className="template-grid">
                        {templateIds
                          .filter(
                            (t) =>
                              !site ||
                              templateManifests[t].category === site.category,
                          )
                          .map((t) => (
                            <TemplateCard
                              key={t}
                              id={t}
                              selected={site?.data.template === t}
                              onSelect={() => {
                                if (!site) {
                                  setModal(true);
                                  return;
                                }
                                updateSite({ ...site.data, template: t });
                                setMessage(
                                  `${templates.find((p) => p.id === t)?.name} applied to your draft. Open the editor to preview and save.`,
                                );
                              }}
                            />
                          ))}
                      </div>
                    </>
                  )}
                  {isRecords && site && (
                    <>
                      {section === "articles" &&
                      modules.find((m) => m.key === "articles")?.state ===
                        "upgrade" ? (
                        <Upgrade feature="Blog / Insights" />
                      ) : section === "products" &&
                        !modules.some((m) => m.key === "products") ? (
                        <div className="panel empty">
                          <ShoppingBag />
                          <h2>A storefront starts with a store.</h2>
                          <p>
                            Products are available for e-Commerce websites.
                            Create an online store to manage your catalogue.
                          </p>
                          <button
                            className="button"
                            onClick={() => setModal(true)}
                          >
                            Create an online store
                          </button>
                        </div>
                      ) : (
                        <section className="panel">
                          <div className="panel-header">
                            <h2>
                              {section === "enquiries"
                                ? "Messages from your website"
                                : section === "services"
                                  ? "Your setup requests"
                                  : section === "support"
                                    ? "Your support tickets"
                                    : `Your ${section}`}{" "}
                              <span className="muted">({rows.length})</span>
                            </h2>
                            {section !== "enquiries" && (
                              <button
                                className="button small"
                                onClick={() => {
                                  setEditRow(null);
                                  setRecordModal(true);
                                }}
                              >
                                <Plus size={13} />
                                {section === "services"
                                  ? "Request setup"
                                  : section === "support"
                                    ? "New ticket"
                                    : `Add ${section === "articles" ? "article" : section === "products" ? "product" : "page"}`}
                              </button>
                            )}
                          </div>
                          {rows.length > 0 ? (
                            <>
                              <div className="panel-body">
                                <input
                                  className="search-input"
                                  aria-label={`Search ${section}`}
                                  placeholder={`Search ${section}…`}
                                  value={filter}
                                  onChange={(e) => setFilter(e.target.value)}
                                />
                              </div>
                              <div className="table-wrap">
                                <table className="data-table">
                                  <thead>
                                    <tr>
                                      <th>
                                        {section === "enquiries"
                                          ? "Name"
                                          : "Title"}
                                      </th>
                                      <th>Status</th>
                                      <th>
                                        {section === "products"
                                          ? "Price"
                                          : "Updated"}
                                      </th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows
                                      .filter((r) =>
                                        (r.data.title || r.data.name || "")
                                          .toLowerCase()
                                          .includes(filter.toLowerCase()),
                                      )
                                      .map((r) => (
                                        <tr key={r.id}>
                                          <td>
                                            <b>{r.data.title || r.data.name}</b>
                                            <br />
                                            <small className="muted">
                                              {r.data.email || r.data.slug}
                                            </small>
                                            {section === "enquiries" && (
                                              <p>{r.data.message}</p>
                                            )}
                                          </td>
                                          <td>
                                            <span className="badge">
                                              {r.data.status}
                                            </span>
                                          </td>
                                          <td>
                                            {section === "products"
                                              ? new Intl.NumberFormat("en-NG", {
                                                  style: "currency",
                                                  currency: "NGN",
                                                }).format(
                                                  (r.data.price || 0) / 100,
                                                )
                                              : new Date(
                                                  r.created_at,
                                                ).toLocaleDateString()}
                                          </td>
                                          <td>
                                            {section !== "enquiries" && (
                                              <>
                                                <button
                                                  onClick={() => {
                                                    setEditRow(r);
                                                    setRecordModal(true);
                                                  }}
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    if (
                                                      !confirm(
                                                        `Delete “${r.data.title}”? This cannot be undone.`,
                                                      )
                                                    )
                                                      return;
                                                    action(async () => {
                                                      if (!demo)
                                                        await api(
                                                          `sites/${site.id}/${section}/${r.id}`,
                                                          "DELETE",
                                                        );
                                                      const next = rows.filter(
                                                        (v) => v.id !== r.id,
                                                      );
                                                      setRows(next);
                                                      if (demo)
                                                        sessionStorage.setItem(
                                                          `demo-${site.id}-${section}`,
                                                          JSON.stringify(next),
                                                        );
                                                    });
                                                  }}
                                                >
                                                  Delete
                                                </button>
                                              </>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          ) : (
                            <div className="empty">
                              {section === "products" ? (
                                <ShoppingBag />
                              ) : section === "enquiries" ? (
                                <Inbox />
                              ) : (
                                <FileText />
                              )}
                              <h2>
                                {section === "enquiries"
                                  ? "Your next conversation starts here."
                                  : section === "services"
                                    ? "A helping hand, when you need one."
                                    : section === "support"
                                      ? "How can we help?"
                                      : `Your ${section}, ready to take shape.`}
                              </h2>
                              <p>
                                {section === "enquiries"
                                  ? "Enquiries from your published website will appear here."
                                  : section === "services"
                                    ? "Tell Nexoris about the website you want. Your setup request is separate from your subscription."
                                    : `Add your first ${section === "articles" ? "article" : section === "products" ? "product" : section === "support" ? "support ticket" : "page"} to get started.`}
                              </p>
                            </div>
                          )}
                        </section>
                      )}
                    </>
                  )}
                  {site && section === "media" && (
                    <MediaLibrary site={site.id} demo={demo} />
                  )}
                  {site &&
                    ["domains", "merchant", "orders"].includes(section) && (
                      <WebsiteOperations
                        site={site.id}
                        section={section}
                        demo={demo}
                      />
                    )}
                  {section === "billing" && (
                    <section className="panel">
                      <div className="panel-header">
                        <h2>Your subscription</h2>
                        <CreditCard size={18} />
                      </div>
                      <div className="panel-body">
                        {site ? (
                          <>
                            <span className="badge">{site.subscription}</span>
                            <h2
                              style={{
                                fontSize: 28,
                                marginTop: 22,
                                textTransform: "capitalize",
                              }}
                            >
                              {site.category === "commerce"
                                ? "e-Commerce"
                                : "Corporate"}{" "}
                              {site.tier}
                            </h2>
                            <p className="muted" style={{ fontSize: 13 }}>
                              {limits[site.tier].pages} content pages ·{" "}
                              {limits[site.tier].websites} website(s) ·{" "}
                              {site.tier === "basic"
                                ? "Omnyvox subdomain"
                                : "Custom domain and Blog / Insights"}
                            </p>
                            <div className="notice">
                              Prices are set by Nexoris. You’ll review your
                              payment with Paystack before being charged. Your
                              subscription activates only after payment
                              verification.
                            </div>
                            <BillingSummary
                              planId={`${site.category}-${site.tier}`}
                            />
                            <div className="form-actions">
                              {["monthly", "annual"].map((interval) => (
                                <button
                                  key={interval}
                                  disabled={busy}
                                  className={`button ${interval === "annual" ? "secondary" : ""}`}
                                  onClick={() =>
                                    action(async () => {
                                      if (demo) {
                                        setMessage(
                                          "Payments are disabled in the demo.",
                                        );
                                        return;
                                      }
                                      const b = await api(
                                        `sites/${site.id}/billing`,
                                        "POST",
                                        { interval },
                                      );
                                      location.href = b.url;
                                    })
                                  }
                                >
                                  Pay {interval} <ArrowUpRight size={16} />
                                </button>
                              ))}
                            </div>
                            <hr
                              style={{
                                border: 0,
                                borderTop: "1px solid var(--line)",
                                margin: "30px 0",
                              }}
                            />
                            <h3 style={{ fontSize: 17 }}>
                              Your data stays yours.
                            </h3>
                            <p className="muted" style={{ fontSize: 12 }}>
                              Download a copy of your website settings and
                              content.
                            </p>
                            <button
                              className="button secondary small"
                              onClick={() =>
                                action(async () => {
                                  const data = demo
                                    ? site
                                    : await api(`sites/${site.id}/export`);
                                  const url = URL.createObjectURL(
                                    new Blob([JSON.stringify(data, null, 2)], {
                                      type: "application/json",
                                    }),
                                  );
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${site.slug}-export.json`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                })
                              }
                            >
                              <Download size={14} />
                              Export website data
                            </button>
                          </>
                        ) : (
                          <p>Create a website to choose a subscription.</p>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
      {/* Called as a function: <NewSite /> would remount on every render and wipe typed input. */}
      {modal && NewSite()}
      {recordModal && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Content editor"
          >
            <div className="modal-header">
              <h2>
                {editRow ? "Edit" : "Create"}{" "}
                {section === "products"
                  ? "product"
                  : section === "articles"
                    ? "article"
                    : section === "support"
                      ? "support ticket"
                      : section === "services"
                        ? "setup request"
                        : "page"}
              </h2>
              <button
                className="icon-button"
                onClick={() => setRecordModal(false)}
                aria-label="Close editor"
              >
                <X />
              </button>
            </div>
            {editRow && site.tier === "advanced" && !demo && (
              <ContentHistory
                siteId={site.id}
                recordId={editRow.id}
                onRestore={(data) => {
                  setRecordModal(false);
                  setEditRow({ ...editRow, data: data as Row["data"] });
                  setTimeout(() => setRecordModal(true), 0);
                }}
              />
            )}
            <form onSubmit={saveRecord}>
              <div className="form-grid">
                <label className="field full">
                  {["services", "support"].includes(section)
                    ? "Subject"
                    : "Title"}
                  <input
                    name="title"
                    required
                    minLength={2}
                    defaultValue={editRow?.data.title}
                  />
                </label>
                <label className="field full">
                  URL identifier
                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    placeholder="your-content-title"
                    defaultValue={editRow?.data.slug}
                  />
                </label>
                <label className="field full">
                  {section === "products" ? "Product description" : "Content"}
                  <RichTextEditor
                    key={editRow?.id || "new"}
                    name="body"
                    value={editRow?.data.body || ""}
                    mediaEndpoint={
                      demo ? undefined : `/api/sites/${site?.id}/media`
                    }
                    allowVideo={!!site && entitled(site.tier, "video")}
                  />
                </label>
                {section === "products" && (
                  <>
                    <label className="field">
                      Price (NGN)
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={(editRow?.data.price || 0) / 100}
                      />
                    </label>
                    <label className="field">
                      Stock quantity
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={editRow?.data.stock || 0}
                      />
                    </label>
                  </>
                )}
                <RecordExtras
                  key={editRow?.id || "new"}
                  siteId={site?.id || ""}
                  kind={section}
                  initial={editRow?.data}
                  demo={demo}
                  allowVideo={!!site && entitled(site.tier, "video")}
                />
                <label className="field">
                  Category
                  <input
                    name="category"
                    list="site-category-options"
                    pattern="[a-z0-9\-]+"
                    defaultValue={editRow?.data.category || "general"}
                  />
                </label>
                <label className="field">
                  Status
                  <select
                    name="status"
                    defaultValue={editRow?.data.status || "draft"}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    {site.tier !== "basic" &&
                      ["pages", "articles", "legal"].includes(section) && (
                        <option value="scheduled">Scheduled</option>
                      )}
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button className="button" disabled={busy}>
                  Save {section === "products" ? "product" : "content"}{" "}
                  <Save size={15} />
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setRecordModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
  function Upgrade({ feature }: { feature: string }) {
    return (
      <div className="panel empty">
        <Rocket />
        <h2>More room for your next chapter.</h2>
        <p>
          {feature} is available on Growth and Advanced. Your current content is
          always preserved.
        </p>
        <Link className="button" href={href("billing")}>
          View your subscription <ArrowRight size={16} />
        </Link>
      </div>
    );
  }
}
function ZapIcon() {
  return <SlidersHorizontal size={16} />;
}
