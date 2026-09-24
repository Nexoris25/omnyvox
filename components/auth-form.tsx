"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe2, Palette, ShieldCheck } from "lucide-react";
import { Brand } from "./brand";
import { PasswordField } from "./password-field";
export function AuthForm({ register = false }: { register?: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [policies,setPolicies]=useState<Record<string,string>>({});
  useEffect(()=>{if(register)fetch('/api/consent').then(async r=>{if(!r.ok)throw Error('Could not load platform policies.');return r.json();}).then((rows:{id:string;slug:string}[])=>setPolicies(Object.fromEntries(rows.map(r=>[r.slug,r.id])))).catch(e=>setError(e.message));},[register]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (register && data.password !== data.confirmPassword)
        throw Error("Passwords must match.");
      if (register) {
        const q = new URLSearchParams(location.search);
        try {
          sessionStorage.setItem(
            "omnyvox-start",
            JSON.stringify({
              template: q.get("template"),
              category: q.get("category"),
              tier: q.get("tier"),
            }),
          );
        } catch {
          /* Onboarding also works without browser storage. */
        }
      }
      const r = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...data,...(register?{consent:{terms:policies.terms,privacy:policies.privacy,accepted:data.accepted==='on'}}:{})}),
      });
      const b = await r.json();
      if (b.mfaRequired) setMfaRequired(true);
      if (!r.ok) throw Error(b.error);
      location.href = register ? "/onboarding" : b.next || "/dashboard";
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main id="main" className="auth-layout">
      <section className="auth-story">
        <span className="eyebrow">YOUR BUSINESS. YOUR NEXT CHAPTER.</span>
        <p className="auth-story-title">
          Your ambition.
          <br />A website to match.
        </p>
        <p>
          A professional website, a connected store and a simpler way to manage
          it all. Built around your business.
        </p>
        <div className="auth-benefits">
          <div>
            <Palette size={20} />
            <span>
              <strong>Make it unmistakably yours</strong>Templates, colours and
              content for your brand.
            </span>
          </div>
          <div>
            <Globe2 size={20} />
            <span>
              <strong>One place to keep moving</strong>Your pages, products and
              enquiries together.
            </span>
          </div>
          <div>
            <ShieldCheck size={20} />
            <span>
              <strong>Focus on your business</strong>Managed hosting and account
              security built in.
            </span>
          </div>
        </div>
        <small>Omnyvox by Nexoris Technologies Ltd.</small>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-topline">
          <Brand />
          <Link href="/">Back to website ↗</Link>
        </div>
        <form onSubmit={submit} className="auth-form">
          <span className="eyebrow">
            {register ? "GET STARTED" : "YOUR OMNYVOX WORKSPACE"}
          </span>
          <h1>{register ? "Create your Omnyvox account" : "Sign in to Omnyvox"}</h1>
          <p>
            {register
              ? "It’s free to start. Build and preview your website, then choose a plan when you’re ready to publish."
              : "Good to see you again. Manage your website, store and customers."}
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
        {register && <label className="field">Phone number<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={25} placeholder="e.g. +234 801 234 5678" /></label>}
        <PasswordField
            autoComplete={register ? "new-password" : "current-password"}
            requirements={register}
            onValueChange={setPassword}
          />
          {register && (
            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              confirmation={password}
            />
          )}
        {!register && mfaRequired && (
            <label className="field">
              Authenticator or recovery code
              <input
                name="code"
                autoComplete="one-time-code"
                maxLength={32}
                required
              />
            </label>
        )}
        {!register && mfaRequired && <p><Link href="/account/recover">Lost your authenticator and recovery codes?</Link></p>}
          {!register && (
            <Link href="/forgot-password" className="auth-forgot">
              Forgot your password?
            </Link>
          )}
          {register && (
            <p className="muted auth-note">
              Pre-launch workspace access is free. Paid subscriptions and public
              publishing open when commercial plans are configured.
            </p>
          )}
        {register && <label className="consent-check"><input type="checkbox" name="accepted" required/><span>I agree to the <Link href="/legal/terms" target="_blank">Terms</Link> and acknowledge the <Link href="/legal/privacy" target="_blank">Privacy notice</Link>.</span></label>}
        <button className="button" disabled={busy || register&&(!policies.terms||!policies.privacy)}>
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
