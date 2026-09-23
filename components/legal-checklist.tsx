"use client";
import { useCallback, useEffect, useState } from "react";
import { CircleCheck, CircleDashed, FilePlus2, PenLine, Scale } from "lucide-react";
import { legalSetFor, policies, type PolicyType } from "@/lib/legal-policies";

type LegalRow = {
  id: string;
  data: {
    policyType?: PolicyType;
    status: string;
    policyReviewed?: boolean;
    body: string;
  };
};

/** Which legal pages this site's industry requires, and where each stands. */
export function LegalChecklist({
  siteId,
  industry,
  category,
  demo,
  onCreated,
}: {
  siteId: string;
  industry?: string;
  category: string;
  demo: boolean;
  onCreated: () => void;
}) {
  const [rows, setRows] = useState<LegalRow[]>([]),
    [fulfilment, setFulfilment] = useState<"physical" | "digital" | "services">(
      "physical",
    ),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    if (demo) return;
    const [legal, facts]: [
      LegalRow[],
      { fulfilment?: "physical" | "digital" | "services" },
    ] = await Promise.all([
      fetch(`/api/sites/${siteId}/legal`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/sites/${siteId}/business`).then((r) => (r.ok ? r.json() : {})),
    ]);
    setRows(legal);
    if (facts.fulfilment) setFulfilment(facts.fulfilment);
  }, [siteId, demo]);
  useEffect(() => {
    load();
  }, [load]);
  const required = legalSetFor(industry, category, fulfilment);
  async function create(type: Exclude<PolicyType, "other">) {
    setBusy(type);
    setError("");
    try {
      const p = policies[type];
      const r = await fetch(`/api/sites/${siteId}/legal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: p.title,
          slug: p.slug,
          body: p.body,
          status: "draft",
          category: "general",
          policyType: type,
          policyReviewed: false,
        }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      await load();
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  const state = (type: PolicyType) => {
    const row = rows.find((r) => r.data.policyType === type);
    if (!row) return { key: "missing", label: "Not created" } as const;
    if (row.data.status === "published" && row.data.policyReviewed)
      return { key: "done", label: "Published" } as const;
    if (/\[Required:/.test(row.data.body))
      return { key: "draft", label: "Add your details" } as const;
    return { key: "review", label: "Review & publish" } as const;
  };
  const done = required.filter((t) => state(t).key === "done").length;
  return (
    <section className="panel panel-body legal-checklist">
      <div className="legal-checklist-head">
        <Scale size={20} />
        <div>
          <h2>Legal pages for your business</h2>
          <p className="muted">
            Based on your industry{category === "commerce" ? " and how you deliver orders" : ""},
            your website needs these pages. Published pages appear in your
            footer. Drafts are starting points, not legal advice — complete
            every highlighted detail and have them reviewed before publishing.
          </p>
        </div>
        {!demo && (
          <span className="legal-progress">
            {done} / {required.length} published
          </span>
        )}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <ul className="legal-list">
        {required.map((type) => {
          const p = policies[type];
          const s = demo ? ({ key: "draft", label: "Draft" } as const) : state(type);
          return (
            <li key={type} className={`legal-${s.key}`}>
              <span className="legal-icon" aria-hidden="true">
                {s.key === "done" ? (
                  <CircleCheck size={18} />
                ) : s.key === "missing" ? (
                  <CircleDashed size={18} />
                ) : (
                  <PenLine size={18} />
                )}
              </span>
              <span className="legal-text">
                <b>{p.title}</b>
                <small>{p.reason}</small>
              </span>
              <span className={`legal-status status-${s.key}`}>{s.label}</span>
              {s.key === "missing" && !demo && (
                <button
                  type="button"
                  className="button secondary small"
                  disabled={!!busy}
                  onClick={() => create(type)}
                >
                  <FilePlus2 size={14} />
                  {busy === type ? "Creating…" : "Create draft"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
