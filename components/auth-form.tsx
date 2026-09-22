"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "./brand";
export function AuthForm({ register = false }: { register?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (register) {
      const q = new URLSearchParams(location.search);
      sessionStorage.setItem(
        "omnyvox-start",
        JSON.stringify({
          template: q.get("template"),
          category: q.get("category"),
          tier: q.get("tier"),
        }),
      );
    }
    try {
      const r = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      location.href = register ? "/onboarding" : "/dashboard";
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main id="main" className="auth-layout">
      <section className="auth-story">
        <span className="eyebrow" style={{ color: "#bf9eff" }}>
          YOUR BUSINESS BELONGS HERE
        </span>
        <h1>
          A home for your business.
          <br />
          Room for your ambition.
        </h1>
        <p>
          Create a website that feels like you. We’ll take care of what’s behind
          it.
        </p>
        <small>Omnyvox by Nexoris Technologies Ltd.</small>
      </section>
      <section className="auth-form-wrap">
        <Brand />
        <form onSubmit={submit} className="auth-form">
          <h2>{register ? "Start your next chapter." : "Welcome back."}</h2>
          <p>
            {register
              ? "Create your account and find your starting point."
              : "Your website. Your workspace. Right where you left it."}
          </p>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          {register && (
            <label className="field">
              Your full name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                placeholder="e.g. Ada Okafor"
              />
            </label>
          )}
          <label className="field">
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@yourbusiness.com"
            />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              name="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 8 : 1}
              maxLength={128}
              placeholder={
                register
                  ? "8+ characters, uppercase, number & symbol"
                  : "Your password"
              }
            />
          </label>
          {register && (
            <label className="field">
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </label>
          )}
          {!register && (
            <Link
              href="/forgot-password"
              style={{ fontSize: 12, color: "var(--primary)" }}
            >
              Forgot your password?
            </Link>
          )}
          {register && (
            <p className="muted" style={{ fontSize: 11 }}>
              Pre-launch workspace access is free. Paid subscriptions and public
              publishing open when commercial plans are configured.
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? "Please wait…"
              : register
                ? "Create your account"
                : "Log in"}
            <ArrowRight size={17} />
          </button>
          <p className="auth-link">
            {register ? "Already have an account?" : "New to Omnyvox?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "Log in" : "Create an account"}
            </Link>
          </p>
          <p className="auth-link">
            <Link href="/dashboard?demo=1">Explore the interactive demo →</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
