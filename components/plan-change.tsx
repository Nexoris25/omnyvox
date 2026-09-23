"use client";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarClock, CircleAlert, Info } from "lucide-react";

type Tier = "basic" | "growth" | "advanced";
type Conflict = {
  key: string;
  label: string;
  current: number;
  limit: number;
  blocking: boolean;
  resolution: string;
};
type Preview = {
  current: Tier;
  target: Tier;
  direction: "upgrade" | "downgrade";
  effectiveAt: string;
  immediate: boolean;
  charge: { amount: number; remainingDays: number };
  renewalAmount: number | null;
  interval: "monthly" | "annual";
  conflicts: Conflict[];
  scheduled: { tier: Tier; at: string } | null;
};

const names: Record<Tier, string> = { basic: "Basic", growth: "Growth", advanced: "Advanced" };
const summaries: Record<Tier, string> = {
  basic: "One website on an Omnyvox address with the essentials.",
  growth: "Custom domain, Insights, more pages, team members and video.",
  advanced: "Up to three websites, the highest limits and advanced controls.",
};
const money = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export function PlanChange({ site, tier }: { site: string; tier: Tier }) {
  const [target, setTarget] = useState<Tier | null>(null),
    [preview, setPreview] = useState<Preview | null>(null),
    [scheduled, setScheduled] = useState<Preview["scheduled"]>(null),
    [agree, setAgree] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const api = async (method: string, body?: unknown, search = "") => {
    const r = await fetch(`/api/sites/${site}/plan-change${search}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error || "Something went wrong");
    return b;
  };
  useEffect(() => {
    // Any other tier reveals whether a downgrade is already scheduled.
    const probe = tier === "basic" ? "growth" : "basic";
    api("GET", undefined, `?tier=${probe}`)
      .then((p: Preview) => setScheduled(p.scheduled))
      .catch(() => {});
  }, [site, tier]);
  async function choose(t: Tier) {
    setTarget(t);
    setPreview(null);
    setAgree(false);
    setError("");
    setMessage("");
    try {
      setPreview(await api("GET", undefined, `?tier=${t}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function confirm() {
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      const r = await api("POST", { tier: target });
      if (r.url) {
        window.location.href = r.url;
        return;
      }
      if (r.status === "scheduled") {
        setScheduled({ tier: target, at: r.effectiveAt });
        setMessage(`Your change to ${names[target]} is scheduled for ${date(r.effectiveAt)}.`);
      } else {
        setMessage(
          `You are now on the ${names[target]} plan.` +
            (r.effects?.length ? ` ${r.effects.join(". ")}.` : ""),
        );
        setTimeout(() => window.location.reload(), 1500);
      }
      setTarget(null);
      setPreview(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    setError("");
    try {
      await api("DELETE");
      setScheduled(null);
      setMessage("The scheduled plan change was cancelled. You stay on your current plan.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const blocking = preview?.conflicts.filter((c) => c.blocking) || [];
  const automatic = preview?.conflicts.filter((c) => !c.blocking) || [];
  return (
    <section className="panel panel-body plan-change">
      <h2>Change plan</h2>
      <p className="muted">
        Upgrades start straight away; you pay only the difference for the rest of
        your current period. Downgrades take effect when your paid period ends, so
        you keep everything you have paid for. Nothing is ever deleted.
      </p>
      {scheduled && (
        <div className="plan-scheduled" role="status">
          <CalendarClock size={18} />
          <span>
            Moving to <b>{names[scheduled.tier]}</b> on {date(scheduled.at)}.
          </span>
          <button type="button" className="button secondary small" disabled={busy} onClick={cancel}>
            Cancel change
          </button>
        </div>
      )}
      <div className="plan-options" role="radiogroup" aria-label="Choose a plan">
        {(["basic", "growth", "advanced"] as Tier[]).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={target === t}
            disabled={t === tier}
            className={`plan-option${target === t ? " selected" : ""}${t === tier ? " current" : ""}`}
            onClick={() => choose(t)}
          >
            <b>{names[t]}</b>
            <small>{summaries[t]}</small>
            {t === tier && <span className="badge">Current plan</span>}
          </button>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="field-ok" role="status">
          {message}
        </p>
      )}
      {preview && (
        <div className="plan-preview">
          <h3>
            {preview.direction === "upgrade" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            {names[preview.current]} → {names[preview.target]}
          </h3>
          <dl className="plan-facts">
            <div>
              <dt>Takes effect</dt>
              <dd>{preview.immediate ? "Immediately" : date(preview.effectiveAt)}</dd>
            </div>
            {preview.direction === "upgrade" && (
              <div>
                <dt>Due now</dt>
                <dd>
                  {preview.charge.amount >= 10000
                    ? `${money(preview.charge.amount)} for the remaining ${preview.charge.remainingDays} days`
                    : "Nothing"}
                </dd>
              </div>
            )}
            {preview.renewalAmount && (
              <div>
                <dt>Renews at</dt>
                <dd>
                  {money(preview.renewalAmount)} per {preview.interval === "annual" ? "year" : "month"}
                </dd>
              </div>
            )}
          </dl>
          {!!blocking.length && (
            <div className="plan-conflicts blocking">
              <h4>
                <CircleAlert size={16} /> Resolve before changing
              </h4>
              <ul>
                {blocking.map((c) => (
                  <li key={c.key}>
                    <b>{c.label}:</b> {c.current} of {c.limit} allowed. {c.resolution}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!automatic.length && (
            <div className="plan-conflicts">
              <h4>
                <Info size={16} /> What changes on {preview.immediate ? "switching" : date(preview.effectiveAt)}
              </h4>
              <ul>
                {automatic.map((c) => (
                  <li key={c.key}>
                    <b>{c.label}:</b> {c.current} (new allowance {c.limit}). {c.resolution}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {preview.direction === "downgrade" && !preview.conflicts.length && (
            <p className="field-hint">Everything you use today fits within the {names[preview.target]} plan.</p>
          )}
          {!blocking.length && (
            <>
              <label className="checkbox-line">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                {preview.direction === "upgrade"
                  ? `I agree to pay ${preview.charge.amount >= 10000 ? money(preview.charge.amount) + " now and " : ""}the ${names[preview.target]} price at renewal.`
                  : `I understand the changes above will apply ${preview.immediate ? "now" : "on " + date(preview.effectiveAt)}.`}
              </label>
              <button type="button" className="button" disabled={!agree || busy} onClick={confirm}>
                {preview.direction === "upgrade"
                  ? preview.charge.amount >= 10000
                    ? "Continue to payment"
                    : `Switch to ${names[preview.target]}`
                  : preview.immediate
                    ? `Switch to ${names[preview.target]}`
                    : "Schedule this change"}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
