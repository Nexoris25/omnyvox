"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Security = {
  mfaEnabled: boolean;
  adminRequiresMfa: boolean;
  currentSession: string;
  sessions: {
    id: string;
    created_at: string;
    expires: string;
    mfa_verified: boolean;
  }[];
};
export function SecuritySettings() {
  const [data, setData] = useState<Security>();
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  async function load() {
    const r = await fetch("/api/security");
    const b = await r.json();
    if (!r.ok) throw Error(b.error);
    setData(b);
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  async function act(action: string, extra: Record<string, string> = {}) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/security/" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code, ...extra }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      if (b.secret) setSecret(b.secret);
      if (b.recoveryCodes) {
        setCodes(b.recoveryCodes);
        setSecret("");
      }
      setCode("");
      setMessage("Security settings updated.");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main
      id="main"
      className="section"
      style={{ maxWidth: 850, margin: "auto" }}
    >
      <Link href="/dashboard">← Your workspace</Link>
      <h1>Account security</h1>
      <p>Protect your account and manage signed-in sessions.</p>
      <p role="status">{message}</p>
      <section className="panel panel-body stack">
        <h2>Confirm it’s you</h2>
        <label className="field">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {data?.mfaEnabled && (
          <label className="field">
            Fresh authenticator or recovery code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              maxLength={32}
            />
          </label>
        )}
        <p>
          Enter these details before changing security settings. Each
          authenticator code can be used once.
        </p>
      </section>
      <section className="panel panel-body stack">
        <h2>Two-factor authentication</h2>
        <p>
          {data?.mfaEnabled
            ? "Enabled: sign-in requires your password and a second factor."
            : "Add an authenticator app to protect your account."}
        </p>
        {data?.adminRequiresMfa && (
          <p>Platform administrators must enable two-factor authentication.</p>
        )}
        {!data?.mfaEnabled && !secret && (
          <button
            className="button"
            disabled={busy || !password}
            onClick={() => act("setup")}
          >
            Set up authenticator
          </button>
        )}
        {secret && (
          <>
            <p>
              In your authenticator app, choose “Enter a setup key”, use your
              Omnyvox email as the account, and choose time-based codes. This
              setup expires in ten minutes.
            </p>
            <code style={{ overflowWrap: "anywhere" }}>{secret}</code>
            <label className="field">
              Six-digit code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
            </label>
            <button
              disabled={busy || code.length !== 6}
              className="button"
              onClick={() => act("enable")}
            >
              Enable two-factor authentication
            </button>
          </>
        )}
        {codes.length > 0 && (
          <div className="notice">
            <h3>Save your recovery codes now</h3>
            <p>
              Keep these privately. Each works once; they will not be shown
              again after you leave this page.
            </p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{codes.join("\n")}</pre>
            <button className="button secondary" onClick={() => setCodes([])}>
              I saved my codes
            </button>
          </div>
        )}
        {data?.mfaEnabled && (
          <>
            <p>
              Replace your recovery codes if they are running low or were
              exposed. This invalidates every previous recovery code and signs
              out your other sessions.
            </p>
            <button
              className="button secondary"
              disabled={busy || !password || !code}
              onClick={() => act("recovery-codes")}
            >
              Generate new recovery codes
            </button>
          </>
        )}
        {data?.mfaEnabled && !data.adminRequiresMfa && (
          <button
            className="button secondary"
            disabled={busy || !password || !code}
            onClick={() => act("disable")}
          >
            Disable two-factor authentication
          </button>
        )}
        {data?.mfaEnabled && data.adminRequiresMfa && (
          <Link href="/admin">Open platform administration</Link>
        )}
      </section>
      <section className="panel panel-body stack">
        <h2>Change password</h2>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            act("password", {
              newPassword: String(f.get("newPassword")),
              confirmPassword: String(f.get("confirmPassword")),
            });
          }}
        >
          <label className="field">
            New password
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </label>
          <label className="field">
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </label>
          <p>
            Use at least eight characters, including an uppercase letter, number
            and symbol. Changing your password signs out all other sessions.
          </p>
          <button className="button" disabled={busy || !password}>
            Change password
          </button>
        </form>
      </section>
      <section className="panel panel-body stack">
        <h2>Signed-in sessions</h2>
        <button
          className="button secondary"
          disabled={busy || !password}
          onClick={() => act("revoke-others")}
        >
          Sign out all other sessions
        </button>
        {data?.sessions.map((s) => (
          <article key={s.id}>
            <p>
              {s.id === data.currentSession ? "This session" : "Other session"}{" "}
              · Started {new Date(s.created_at).toLocaleString()} · Expires{" "}
              {new Date(s.expires).toLocaleString()}
            </p>
            {s.id !== data.currentSession && (
              <button
                className="button secondary"
                disabled={busy || !password}
                onClick={() => act("revoke", { sessionId: s.id })}
              >
                Sign out this session
              </button>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
