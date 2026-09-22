"use client";
import { useEffect, useState } from "react";
type Job = {
  id: string;
  slot: string;
  state: string;
  result?: { text: string; missingFacts: string[]; reviewWarnings: string[] };
  error?: string;
};
export function AIDrafts({ siteId }: { siteId: string }) {
  const [jobs, setJobs] = useState<Job[]>([]),
    [available, setAvailable] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    const r = await fetch(`/api/sites/${siteId}/ai`);
    if (r.ok) {
      const b = await r.json();
      setJobs(b.jobs);
      setAvailable(b.available);
    }
  }
  useEffect(() => {
    load();
  }, [siteId]);
  async function request(body: unknown, id?: string) {
    try {
      const r = await fetch(`/api/sites/${siteId}/ai${id ? "/" + id : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setMessage(
        id
          ? "Draft action saved. Open the website editor to review your draft."
          : "Draft queued. Refresh to check progress; manual editing remains available.",
      );
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <section className="panel panel-body">
      <h2>Draft-writing assistance</h2>
      <p>
        Uses only your confirmed business facts. Check every suggestion before
        accepting it. Acceptance updates your saved draft; publication is a
        separate action.
      </p>
      {!available && (
        <p className="notice">
          AI generation temporarily unavailable. You can write all content
          manually.
        </p>
      )}
      <p role="status">{message}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          request({
            slot: new FormData(e.currentTarget).get("slot"),
            requestKey: crypto.randomUUID(),
          });
        }}
      >
        <label className="field">
          Content to draft
          <select name="slot">
            <option value="hero.title">Homepage headline</option>
            <option value="hero.body">Homepage introduction</option>
            <option value="about.body">About section</option>
          </select>
        </label>
        <button className="button" disabled={!available}>
          Generate draft
        </button>
      </form>
      <button className="button secondary" type="button" onClick={load}>
        Refresh progress
      </button>
      {jobs.map((job) => (
        <article className="panel panel-body" key={job.id}>
          <b>
            {job.slot} · {job.state}
          </b>
          <p>{job.error}</p>
          {job.result && (
            <>
              <p style={{ whiteSpace: "pre-wrap" }}>{job.result.text}</p>
              {[...job.result.missingFacts, ...job.result.reviewWarnings].map(
                (w, i) => (
                  <p key={i}>{w}</p>
                ),
              )}
            </>
          )}
          {job.state === "completed" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                request({ action: "accept", reviewed: true }, job.id);
              }}
            >
              <label>
                <input type="checkbox" required /> I reviewed the facts and want
                to use this suggestion in my website draft.
              </label>
              <button className="button">Accept draft</button>
            </form>
          )}
          {["queued", "running", "completed"].includes(job.state) && (
            <button
              type="button"
              className="button secondary"
              onClick={() => request({ action: "cancel" }, job.id)}
            >
              Cancel / reject
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
