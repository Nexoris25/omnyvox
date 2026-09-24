"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, RefreshCw, ShieldCheck } from "lucide-react";

/** Where each readiness item gets fixed. Matched on the server's wording. */
const fixes: [RegExp, string, string][] = [
  [/verify your business|business verification/i, "/onboarding", "Verify business"],
  [/business summary|contact phone/i, "/dashboard/business", "Business information"],
  [/enquiry recipient/i, "/dashboard/enquiries", "Forms & enquiries"],
  [/policy|terms|privacy|cookie|refund|shipping|booking|disclaimer/i, "/dashboard/legal", "Legal pages"],
  [/merchant payment/i, "/dashboard/merchant", "Store payments"],
  [/product/i, "/dashboard/products", "Products"],
  [/starter content|sample images/i, "/dashboard/editor", "Edit homepage"],
  [/page|link/i, "/dashboard/pages", "Pages"],
  [/template/i, "/dashboard/templates", "Templates"],
];

/** Everything still standing between this website and going live. */
export function PublishChecklist({ site, compact = false }: { site: string; compact?: boolean }) {
  const [issues, setIssues] = useState<string[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/sites/${site}/readiness`);
      const b = await r.json();
      if (!r.ok) throw Error(b.error || "Couldn’t check your website.");
      setIssues(b.issues);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [site]);
  useEffect(() => {
    load();
  }, [load]);
  if (error) return null;
  if (!issues) return <section className="panel panel-body publish-checklist" aria-busy />;
  const kyb = issues.find((i) => /verify your business|business verification/i.test(i));
  return (
    <section className={`panel panel-body publish-checklist${compact ? " compact" : ""}`} aria-labelledby="publish-checklist-title">
      <div className="publish-checklist-head">
        <h2 id="publish-checklist-title">
          {issues.length ? "Before you publish" : "Ready to publish"}
        </h2>
        <button type="button" className="icon-button" onClick={load} disabled={busy} aria-label="Check again">
          <RefreshCw size={16} className={busy ? "spin" : undefined} />
        </button>
      </div>
      {!issues.length ? (
        <p className="publish-ready">
          <CheckCircle2 size={18} aria-hidden="true" /> Everything is in place. Publish whenever you’re happy.
        </p>
      ) : (
        <>
          {kyb && (
            <div className="publish-kyb">
              <ShieldCheck size={20} aria-hidden="true" />
              <div>
                <b>Business verification is required to publish.</b>
                <span>
                  Every website on Omnyvox belongs to a business verified with the CAC. It only
                  takes a minute with your registration number.
                </span>
              </div>
              {!/being reviewed/i.test(kyb) && (
                <a className="button small" href="/onboarding">
                  Verify now
                </a>
              )}
            </div>
          )}
          <p className="publish-count">
            {issues.length} {issues.length === 1 ? "thing" : "things"} to finish
          </p>
          <ul>
            {(compact ? issues.slice(0, 4) : issues).map((issue) => {
              const fix = fixes.find(([re]) => re.test(issue));
              return (
                <li key={issue}>
                  <Circle size={16} aria-hidden="true" />
                  <span>{issue}</span>
                  {fix && (
                    <a href={fix[1]} aria-label={`${fix[2]}: ${issue}`}>
                      Fix this
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          {compact && issues.length > 4 && (
            <a className="publish-more" href="/dashboard/editor">
              See all {issues.length} items
            </a>
          )}
        </>
      )}
    </section>
  );
}
