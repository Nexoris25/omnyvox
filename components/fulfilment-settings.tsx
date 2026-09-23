"use client";
import { useEffect, useState } from "react";
import { MapPin, Plus, Store, Trash2, Truck } from "lucide-react";
import type { FulfilmentSettings as Settings } from "@/lib/store";

type Zone = Settings["zones"][number];
type Pickup = Settings["pickup"][number];
const newId = () => Math.random().toString(36).slice(2, 10).padEnd(6, "0");
const naira = (kobo: number) => (kobo / 100).toString();
const money = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

/** Merchant settings for where the store delivers, what it charges and
 * where customers can collect orders. */
export function FulfilmentSettings({ site, demo }: { site: string; demo: boolean }) {
  const [zones, setZones] = useState<Zone[]>([]),
    [pickup, setPickup] = useState<Pickup[]>([]),
    [flatFee, setFlatFee] = useState(0),
    [pickupOnly, setPickupOnly] = useState(false),
    [loaded, setLoaded] = useState(false),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    if (demo) {
      setZones([
        { id: "lagosmain", name: "Lagos Mainland", fee: 250000, eta: "1–2 working days", areas: "Yaba, Surulere, Ikeja" },
        { id: "lagosisl", name: "Lagos Island", fee: 350000, eta: "1–2 working days", areas: "Lekki, VI, Ikoyi" },
      ]);
      setPickup([
        { id: "showroom", name: "Showroom pickup", address: "12 Admiralty Way, Lekki Phase 1, Lagos", hours: "Mon–Sat, 9am–6pm", instructions: "Bring your order reference." },
      ]);
      setLoaded(true);
      return;
    }
    fetch(`/api/sites/${site}/fulfilment`)
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        setZones(b.zones);
        setPickup(b.pickup);
        setPickupOnly(b.pickupOnly);
        setFlatFee(b.flatFee);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  }, [site, demo]);
  const edit = <T,>(set: (fn: (x: T[]) => T[]) => void, i: number, patch: Partial<T>) => {
    set((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    setDirty(true);
    setMessage("");
  };
  async function save() {
    setError("");
    setMessage("");
    if (demo) return setError("Sign in with your own account to save delivery settings.");
    const bad = zones.find((z) => z.name.trim().length < 2) || pickup.find((p) => p.name.trim().length < 2);
    if (bad) return setError("Give every delivery area and pickup location a name.");
    if (pickupOnly && !pickup.length)
      return setError("Add a pickup location before turning off delivery.");
    if (pickup.some((p) => p.address.trim().length < 5))
      return setError("Add the full address for every pickup location.");
    setBusy(true);
    try {
      const r = await fetch(`/api/sites/${site}/fulfilment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones, pickup, pickupOnly: pickupOnly && pickup.length > 0 }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setDirty(false);
      setMessage("Delivery and pickup options saved. Checkout uses them straight away.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!loaded) return <section className="panel panel-body" aria-busy />;
  return (
    <div className="fulfilment-settings">
      <section className="panel panel-body">
        <div className="fulfilment-head">
          <div>
            <h2>
              <Truck size={20} /> Delivery areas
            </h2>
            <p className="muted">
              Charge a different fee for each area you deliver to. Customers pick
              their area at checkout and the fee is added to their total.
            </p>
          </div>
          <button
            type="button"
            className="button secondary small"
            disabled={pickupOnly || zones.length >= 20}
            onClick={() => {
              setZones([...zones, { id: newId(), name: "", fee: 0, eta: "", areas: "" }]);
              setDirty(true);
            }}
          >
            <Plus size={16} /> Add area
          </button>
        </div>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={pickupOnly}
            onChange={(e) => {
              setPickupOnly(e.target.checked);
              setDirty(true);
            }}
          />
          We don’t deliver — customers collect every order
        </label>
        {!pickupOnly && !zones.length && (
          <p className="fulfilment-empty">
            No delivery areas yet, so checkout offers one standard delivery at your
            flat fee of <b>{money(flatFee)}</b> (set in Store payments).
          </p>
        )}
        {!pickupOnly && zones.map((z, i) => (
          <fieldset key={z.id} className="fulfilment-row">
            <legend className="sr-only">Delivery area {i + 1}</legend>
            <label className="field">
              Area name
              <input
                value={z.name}
                maxLength={60}
                placeholder="e.g. Lagos Mainland"
                onChange={(e) => edit(setZones, i, { name: e.target.value })}
              />
            </label>
            <label className="field">
              Fee (NGN)
              <input
                type="number"
                min={0}
                step="50"
                value={naira(z.fee)}
                onChange={(e) =>
                  edit(setZones, i, { fee: Math.max(0, Math.round(Number(e.target.value) * 100) || 0) })
                }
              />
              <small>Enter 0 for free delivery.</small>
            </label>
            <label className="field">
              Delivery time
              <input
                value={z.eta}
                maxLength={60}
                placeholder="e.g. 1–2 working days"
                onChange={(e) => edit(setZones, i, { eta: e.target.value })}
              />
            </label>
            <label className="field wide">
              <span>Areas covered <span className="optional">(optional)</span></span>
              <input
                value={z.areas}
                maxLength={300}
                placeholder="e.g. Yaba, Surulere, Ikeja"
                onChange={(e) => edit(setZones, i, { areas: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove ${z.name || "this delivery area"}`}
              onClick={() => {
                setZones(zones.filter((_, j) => j !== i));
                setDirty(true);
              }}
            >
              <Trash2 size={18} />
            </button>
          </fieldset>
        ))}
      </section>
      <section className="panel panel-body">
        <div className="fulfilment-head">
          <div>
            <h2>
              <Store size={20} /> Pickup locations
            </h2>
            <p className="muted">
              Let customers collect orders for free from your shop, office or
              showroom.
            </p>
          </div>
          <button
            type="button"
            className="button secondary small"
            disabled={pickup.length >= 10}
            onClick={() => {
              setPickup([...pickup, { id: newId(), name: "", address: "", hours: "", instructions: "" }]);
              setDirty(true);
            }}
          >
            <Plus size={16} /> Add location
          </button>
        </div>
        {!pickup.length && <p className="fulfilment-empty">Pickup is not offered.</p>}
        {pickup.map((p, i) => (
          <fieldset key={p.id} className="fulfilment-row">
            <legend className="sr-only">Pickup location {i + 1}</legend>
            <label className="field">
              Location name
              <input
                value={p.name}
                maxLength={60}
                placeholder="e.g. Lekki showroom"
                onChange={(e) => edit(setPickup, i, { name: e.target.value })}
              />
            </label>
            <label className="field">
              Opening hours
              <input
                value={p.hours}
                maxLength={120}
                placeholder="e.g. Mon–Sat, 9am–6pm"
                onChange={(e) => edit(setPickup, i, { hours: e.target.value })}
              />
            </label>
            <label className="field wide">
              <span>
                <MapPin size={14} aria-hidden /> Address
              </span>
              <input
                value={p.address}
                maxLength={300}
                placeholder="Street, area and city"
                onChange={(e) => edit(setPickup, i, { address: e.target.value })}
              />
            </label>
            <label className="field wide">
              <span>Collection instructions <span className="optional">(optional)</span></span>
              <input
                value={p.instructions}
                maxLength={300}
                placeholder="e.g. Bring your order reference and a valid ID."
                onChange={(e) => edit(setPickup, i, { instructions: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove ${p.name || "this pickup location"}`}
              onClick={() => {
                setPickup(pickup.filter((_, j) => j !== i));
                setDirty(true);
              }}
            >
              <Trash2 size={18} />
            </button>
          </fieldset>
        ))}
      </section>
      <div className="fulfilment-save">
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
        <button type="button" className="button" disabled={busy || !dirty} onClick={save}>
          {busy ? "Saving…" : "Save delivery options"}
        </button>
      </div>
    </div>
  );
}
