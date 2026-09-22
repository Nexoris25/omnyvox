"use client";
import { useEffect, useState } from "react";
import type { AISettings } from "@/lib/local-ai";
export function AIOperations() {
  const [data, setData] = useState<{
      settings: AISettings;
      environmentEnabled: boolean;
      jobs: { state: string; count: number }[];
    } | null>(null),
    [message, setMessage] = useState("");
  async function load() {
    const r = await fetch("/api/platform-admin/ai");
    if (r.ok) setData(await r.json());
  }
  useEffect(() => {
    load();
  }, []);
  if (!data) return <p>Loading AI operations…</p>;
  return (
    <form
      className="panel panel-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const r = await fetch("/api/platform-admin/ai", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...f,
            enabled: f.enabled === "on",
            readinessApproved: f.readinessApproved === "on",
            monthly: {
              basic: Number(f.basic),
              growth: Number(f.growth),
              advanced: Number(f.advanced),
            },
          }),
        });
        const b = await r.json();
        setMessage(
          r.ok
            ? "AI settings saved. Environment and readiness gates still apply."
            : b.error,
        );
        await load();
      }}
    >
      <h2>Local-only content generation</h2>
      <p>
        Endpoint: 127.0.0.1:11434. No cloud inference or fallback. The server
        environment switch is {data.environmentEnabled ? "enabled" : "disabled"}
        .
      </p>
      <label className="field">
        Approved model
        <select name="model" defaultValue={data.settings.model}>
          <option>qwen3:4b-instruct</option>
        </select>
      </label>
      <label className="field">
        Installed model SHA-256 digest
        <input name="digest" defaultValue={data.settings.digest} />
      </label>
      <label className="field">
        Commercial licence record
        <input
          name="licence"
          maxLength={300}
          defaultValue={data.settings.licence}
        />
      </label>
      <label className="field">
        VPS readiness evidence
        <textarea
          name="readinessNotes"
          maxLength={4000}
          defaultValue={data.settings.readinessNotes}
          placeholder="CPU, available RAM, swap, disk, service peaks, latency under load, resource limits and verification date"
        />
      </label>
      <label>
        <input
          type="checkbox"
          name="readinessApproved"
          defaultChecked={data.settings.readinessApproved}
        />{" "}
        VPS and local-only service configuration reviewed
      </label>
      <label>
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={data.settings.enabled}
        />{" "}
        Allow queued generation
      </label>
      <div className="form-grid">
        {(["basic", "growth", "advanced"] as const).map((t) => (
          <label className="field" key={t}>
            {t} monthly requests
            <input
              type="number"
              name={t}
              min={0}
              max={t === "basic" ? 100 : t === "growth" ? 200 : 500}
              defaultValue={data.settings.monthly[t]}
            />
          </label>
        ))}
      </div>
      <p role="status">{message}</p>
      <button className="button">Save AI settings</button>
      <h3>Job states</h3>
      {data.jobs.map((j) => (
        <p key={j.state}>
          {j.state}: {j.count}
        </p>
      ))}
    </form>
  );
}
