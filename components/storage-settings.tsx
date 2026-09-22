"use client";
import { useEffect, useRef, useState } from "react";

type Provider = {
  id: string;
  label: string;
  zone: string;
  endpoint: string;
  tested_at: string | null;
};
type State = {
  active: string | null;
  providers: Provider[];
  usage: { provider_id: string | null; files: number; bytes: string }[];
  cleanup: number;
};
const regions = [
  ["storage.bunnycdn.com", "Frankfurt"],
  ["uk.storage.bunnycdn.com", "London"],
  ["ny.storage.bunnycdn.com", "New York"],
  ["la.storage.bunnycdn.com", "Los Angeles"],
  ["sg.storage.bunnycdn.com", "Singapore"],
  ["se.storage.bunnycdn.com", "Stockholm"],
  ["br.storage.bunnycdn.com", "São Paulo"],
  ["jh.storage.bunnycdn.com", "Johannesburg"],
  ["syd.storage.bunnycdn.com", "Sydney"],
];
export function StorageSettings() {
  const [data, setData] = useState<State | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [target, setTarget] = useState("");
  const stop = useRef(false);
  async function call(action = "", body?: unknown) {
    const r = await fetch(
      "/api/platform-admin/storage" + (action ? "/" + action : ""),
      {
        method: action ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: action ? JSON.stringify(body || {}) : undefined,
      },
    );
    const b = await r.json();
    if (!r.ok) throw Error(b.error);
    return b;
  }
  async function load() {
    setData(await call());
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
    return () => {
      stop.current = true;
    };
  }, []);
  async function run(action: string, body?: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const result = await call(action, body);
      await load();
      setMessage(
        action === "cleanup"
          ? `Removed ${result.deleted} old objects; ${result.failed} will retry. Recent objects wait one hour.`
          : "Storage settings updated.",
      );
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function migrate() {
    stop.current = false;
    setBusy(true);
    try {
      let remaining: number;
      do {
        const b = await call("migrate", { target: target || null });
        remaining = b.remaining;
        setMessage(
          `${remaining} images left to move. You can pause and resume safely.`,
        );
        await load();
        if (!b.moved && remaining) break;
      } while (remaining && !stop.current);
      setMessage(
        remaining
          ? `Migration paused with ${remaining} images remaining.`
          : "Migration complete. Existing image URLs are unchanged.",
      );
    } catch (e) {
      setMessage(
        (e as Error).message + " Resume to retry the remaining images.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <p>
        Keep media on your VPS or connect bunny.net. Existing images keep
        working when you change where new uploads are stored.
      </p>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {data && (
        <>
          <section className="panel panel-body">
            <h2>New uploads</h2>
            <label className="field">
              Storage destination
              <select
                disabled={busy}
                value={data.active || ""}
                onChange={(e) =>
                  run("activate", { target: e.target.value || null })
                }
              >
                <option value="">VPS database</option>
                {data.providers.map((p) => (
                  <option key={p.id} value={p.id} disabled={!p.tested_at}>
                    {p.label}
                    {!p.tested_at ? " — test connection first" : ""}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted">
              If external storage is unavailable, uploads are preserved on your
              VPS. Use migration to transfer them later. Keep the storage zone
              private; Omnyvox checks access before serving images.
            </p>
            {data.usage.map((u) => (
              <p key={u.provider_id || "vps"}>
                {data.providers.find((p) => p.id === u.provider_id)?.label ||
                  "VPS database"}
                : {u.files} images ·{" "}
                {(Number(u.bytes) / 1024 / 1024).toFixed(2)} MB
              </p>
            ))}
          </section>
          <form
            className="panel panel-body"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              if (await run("connect", Object.fromEntries(f))) form.reset();
            }}
          >
            <h2>Connect bunny.net</h2>
            <p>
              Use the storage zone password from bunny.net’s Access tab.
              Credentials are encrypted and never returned to the browser.
            </p>
            <div className="form-grid">
              <label className="field">
                Connection name
                <input
                  name="label"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Omnyvox media"
                />
              </label>
              <label className="field">
                Storage zone name
                <input
                  name="zone"
                  required
                  pattern="[a-zA-Z0-9][a-zA-Z0-9-]{1,62}"
                />
              </label>
              <label className="field">
                Primary storage region
                <select name="endpoint">
                  {regions.map(([host, label]) => (
                    <option key={host} value={host}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Storage zone password
                <input
                  name="accessKey"
                  type="password"
                  required
                  minLength={8}
                  maxLength={512}
                  autoComplete="new-password"
                />
              </label>
            </div>
            <button className="button" disabled={busy}>
              Save connection
            </button>
          </form>
          {data.providers.map((p) => (
            <section className="panel panel-body" key={p.id}>
              <h2>{p.label}</h2>
              <p style={{ overflowWrap: "anywhere" }}>
                {p.zone} · {p.endpoint}
              </p>
              <p>
                {p.tested_at
                  ? `Verified ${new Date(p.tested_at).toLocaleString()}`
                  : "Not yet verified"}
              </p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => run("test", { id: p.id })}
              >
                Test upload & download
              </button>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  if (
                    await run("rotate", {
                      id: p.id,
                      accessKey: new FormData(form).get("accessKey"),
                    })
                  )
                    form.reset();
                }}
              >
                <label className="field">
                  Replacement storage password
                  <input
                    name="accessKey"
                    type="password"
                    required
                    minLength={8}
                    maxLength={512}
                    autoComplete="new-password"
                  />
                </label>
                <button className="button secondary" disabled={busy}>
                  Verify & replace password
                </button>
              </form>
            </section>
          ))}
          <section className="panel panel-body">
            <h2>Move existing images</h2>
            <p>
              Each image is checked before the source is replaced. Closing this
              page pauses after the current batch. Choose VPS to move images
              back.
            </p>
            <label className="field">
              Move all images to
              <select
                disabled={busy}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">VPS database</option>
                {data.providers
                  .filter((p) => p.tested_at)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
              </select>
            </label>
            <button className="button" disabled={busy} onClick={migrate}>
              Start / resume migration
            </button>
            {busy && (
              <button
                className="button secondary"
                onClick={() => {
                  stop.current = true;
                }}
              >
                Pause migration
              </button>
            )}
            <p>
              Old remote objects awaiting cleanup: {data.cleanup}. Cleanup
              removes only unreferenced files, after a one-hour delay.
            </p>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => run("cleanup")}
            >
              Clean up old objects
            </button>
          </section>
        </>
      )}
    </div>
  );
}
