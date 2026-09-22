"use client";
import { AIDrafts } from "./ai-drafts";
import { useEffect, useState } from "react";
export function BusinessProfile({ siteId }: { siteId: string }) {
  const [data, setData] = useState<Record<string, unknown>>({}),
    [message, setMessage] = useState("");
  useEffect(() => {
    fetch(`/api/sites/${siteId}/business`)
      .then((r) => r.json())
      .then(setData);
  }, [siteId]);
  return (
    <>
      <AIDrafts siteId={siteId} />
      <form
        className="panel panel-body"
        key={siteId + JSON.stringify(data)}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = Object.fromEntries(new FormData(e.currentTarget));
          const r = await fetch(`/api/sites/${siteId}/business`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...f,
              showAddress: f.showAddress === "on",
              factsConfirmed: f.factsConfirmed === "on",
            }),
          });
          const b = await r.json();
          setMessage(r.ok ? "Business information saved." : b.error);
        }}
      >
        <h2>Your business, in your own words</h2>
        <p>
          Provide facts you can confirm. These are the source for your website
          and optional draft-writing assistance.
        </p>
        {[
          ["summary", "What does your business do?", 1500],
          ["services", "Actual services or products", 2000],
          ["audience", "Who do you serve?", 500],
          ["city", "City / service area", 100],
          ["phone", "Contact phone / WhatsApp", 40],
          ["address", "Business address", 300],
          ["hours", "Operating hours", 300],
        ].map(([name, label, max]) => (
          <label key={String(name)} className="field">
            {label}
            <textarea
              name={String(name)}
              maxLength={Number(max)}
              defaultValue={String(data[String(name)] || "")}
            />
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            name="showAddress"
            defaultChecked={!!data.showAddress}
          />{" "}
          Display business address
        </label>
        <label className="field">
          Fulfilment type
          <select
            name="fulfilment"
            defaultValue={String(data.fulfilment || "physical")}
          >
            <option value="physical">Physical goods</option>
            <option value="digital">Digital goods</option>
            <option value="services">Services</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            name="factsConfirmed"
            defaultChecked={!!data.factsConfirmed}
          />{" "}
          I have reviewed these business facts for accuracy.
        </label>
        <p role="status">{message}</p>
        <button className="button">Save business information</button>
      </form>
    </>
  );
}
