"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, CircleAlert, Clock3, Lock, MailCheck, Search } from "lucide-react";
import { Brand } from "./brand";
import { companyTypes, type CacRecord, type CompanyType } from "@/lib/kyb";

type Status = {
  email: string;
  emailVerified: boolean;
  business: null | {
    business_name: string | null;
    cac_number: string;
    company_type: CompanyType | null;
    status: "pending" | "verified" | "rejected";
    registered_name: string | null;
    review_note: string | null;
    verified_via: "registry" | "manual" | null;
  };
};
type Lookup =
  | { status: "found"; record: CacRecord }
  | { status: "not_found" }
  | { status: "unavailable" };

const formatDate = (d?: string) => {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? d
    : date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
};

export function Onboarding() {
  const [data, setData] = useState<Status | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [companyType, setCompanyType] = useState<CompanyType>("RC"),
    [cacNumber, setCacNumber] = useState(""),
    [lookup, setLookup] = useState<Lookup | null>(null),
    [confirmed, setConfirmed] = useState(false);
  async function load() {
    const r = await fetch("/api/onboarding");
    const b = await r.json();
    if (!r.ok) throw Error(b.error);
    setData(b);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function post(path: string, body: unknown) {
    const r = await fetch("/api/onboarding/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const b = await r.json();
    if (!r.ok) throw Error(b.error || "Something went wrong. Please try again.");
    return b;
  }
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const business = data?.business;
  const verified = business?.status === "verified";
  const pending = business?.status === "pending";
  return (
    <main className="onboarding-page">
      <Brand />
      <h1>Let’s get your business ready.</h1>
      <p className="onboarding-lead">
        Two quick checks keep Omnyvox safe for you and your customers: confirm your
        email address, then verify your business with its CAC registration.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {data && (
        <>
          <section className="panel onboarding-step">
            <h2>
              <span className={`step-badge${data.emailVerified ? " done" : ""}`}>
                {data.emailVerified ? <BadgeCheck size={18} /> : "1"}
              </span>
              Verify your email
            </h2>
            {data.emailVerified ? (
              <p className="step-done">
                <MailCheck size={18} /> {data.email} is verified.
              </p>
            ) : (
              <>
                <p>
                  Enter the six-digit code we sent to <b>{data.email}</b>. Codes expire
                  after 10 minutes.
                </p>
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = new FormData(e.currentTarget).get("code");
                    run(async () => {
                      await post("otp", { code });
                      setMessage("Your email address is verified.");
                      await load();
                    });
                  }}
                >
                  <label className="field">
                    Verification code
                    <input
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                    />
                  </label>
                  <button className="button" disabled={busy}>
                    Verify email
                  </button>
                </form>
                <button
                  type="button"
                  className="link-button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await post("resend", {});
                      setMessage("A new code is on its way to your inbox.");
                    })
                  }
                >
                  Send another code
                </button>
              </>
            )}
          </section>

          <section className="panel onboarding-step">
            <h2>
              <span className={`step-badge${verified ? " done" : ""}`}>
                {verified ? <BadgeCheck size={18} /> : "2"}
              </span>
              Verify your business
            </h2>
            {verified && business && (
              <div className="kyb-result verified">
                <Building2 size={22} aria-hidden />
                <div>
                  <span className="kyb-label">Registered business name</span>
                  <b>{business.registered_name || business.business_name}</b>
                  <span>
                    {business.cac_number} ·{" "}
                    {business.verified_via === "registry"
                      ? "Verified on the CAC registry"
                      : "Verified by our compliance team"}
                  </span>
                </div>
              </div>
            )}
            {pending && business && (
              <div className="kyb-result pending" role="status">
                <Clock3 size={22} aria-hidden />
                <div>
                  <span className="kyb-label">Under review</span>
                  <b>{business.registered_name || business.business_name || business.cac_number}</b>
                  <span>
                    {business.review_note ||
                      "Our compliance team will confirm your registration with the CAC and email you. You can build your website meanwhile."}
                  </span>
                </div>
              </div>
            )}
            {business?.status === "rejected" && (
              <div className="kyb-result rejected" role="alert">
                <CircleAlert size={22} aria-hidden />
                <div>
                  <span className="kyb-label">Corrections needed</span>
                  <span>{business.review_note}</span>
                </div>
              </div>
            )}
            {!verified && !pending && (
              <>
                {!data.emailVerified && (
                  <p className="field-hint">Verify your email first to unlock this step.</p>
                )}
                <form
                  className="kyb-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      setConfirmed(false);
                      setLookup(await post("cac-lookup", { companyType, cacNumber }));
                    });
                  }}
                >
                  <label className="field">
                    Registration type
                    <select
                      value={companyType}
                      disabled={!data.emailVerified}
                      onChange={(e) => {
                        setCompanyType(e.target.value as CompanyType);
                        setLookup(null);
                      }}
                    >
                      {Object.entries(companyTypes).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    CAC registration number
                    <span className="cac-input">
                      <span aria-hidden>{companyType}</span>
                      <input
                        value={cacNumber}
                        inputMode="numeric"
                        required
                        disabled={!data.emailVerified}
                        placeholder="1234567"
                        pattern="(RC|BN|IT|rc|bn|it)?\s*[0-9]{4,10}"
                        title="The digits of your CAC number, for example 1234567"
                        onChange={(e) => {
                          setCacNumber(e.target.value);
                          setLookup(null);
                        }}
                      />
                    </span>
                  </label>
                  <button className="button secondary" disabled={busy || !data.emailVerified}>
                    <Search size={16} /> {busy && !lookup ? "Searching the registry…" : "Find my business"}
                  </button>
                </form>

                {lookup?.status === "found" && (
                  <div className="kyb-confirm">
                    <label className="field">
                      <span>
                        Registered business name <Lock size={13} aria-label="From the CAC registry; cannot be edited" />
                      </span>
                      <input value={lookup.record.name} readOnly aria-readonly="true" className="locked" />
                      <small>
                        Returned by the CAC registry. If it is wrong, check the number
                        and registration type above.
                      </small>
                    </label>
                    <dl className="kyb-facts">
                      <div>
                        <dt>CAC number</dt>
                        <dd>{lookup.record.reference}</dd>
                      </div>
                      {lookup.record.registeredOn && (
                        <div>
                          <dt>Registered</dt>
                          <dd>{formatDate(lookup.record.registeredOn)}</dd>
                        </div>
                      )}
                      {lookup.record.entityStatus && (
                        <div>
                          <dt>Registry status</dt>
                          <dd>{lookup.record.entityStatus}</dd>
                        </div>
                      )}
                      {lookup.record.address && (
                        <div className="wide">
                          <dt>Registered address</dt>
                          <dd>{lookup.record.address}</dd>
                        </div>
                      )}
                    </dl>
                    <label className="consent-check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      <span>
                        This is my business, and I am authorised to act for it. I agree
                        to Omnyvox verifying these details with the CAC.
                      </span>
                    </label>
                    <button
                      type="button"
                      className="button"
                      disabled={busy || !confirmed}
                      onClick={() =>
                        run(async () => {
                          const r = await post("business", { companyType, cacNumber, consent: true });
                          setMessage(
                            r.status === "verified"
                              ? "Your business is verified."
                              : "Thanks. Our compliance team will review your registration.",
                          );
                          setLookup(null);
                          await load();
                        })
                      }
                    >
                      Confirm and verify
                    </button>
                  </div>
                )}
                {lookup?.status === "not_found" && (
                  <p className="notice error" role="alert">
                    We couldn’t find {companyType}
                    {cacNumber.replace(/\D/g, "")} on the CAC registry. Check the number
                    and registration type on your certificate and try again.
                  </p>
                )}
                {lookup?.status === "unavailable" && (
                  <div className="kyb-manual" role="status">
                    <p>
                      The CAC registry isn’t responding right now. You can try again in
                      a few minutes, or send your number to our compliance team to
                      confirm manually.
                    </p>
                    <label className="consent-check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      <span>
                        I am authorised to act for this business and agree to Omnyvox
                        verifying its registration with the CAC.
                      </span>
                    </label>
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy || !confirmed}
                      onClick={() =>
                        run(async () => {
                          await post("business", { companyType, cacNumber, consent: true, manual: true });
                          setMessage("Sent for manual review. We’ll email you when it’s done.");
                          setLookup(null);
                          await load();
                        })
                      }
                    >
                      Send for manual review
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
          <Link className="button secondary" href="/dashboard">
            Continue to your workspace →
          </Link>
        </>
      )}
    </main>
  );
}
