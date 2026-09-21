"use client";
import { useState } from "react";
type Product = {
  id: string;
  data: {
    title: string;
    price?: number;
    stock?: number;
    image?: string;
    body: string;
  };
};
export function StoreCheckout({
  site,
  products,
  delivery = 0,
}: {
  site: string;
  products: Product[];
  delivery?: number;
}) {
  const [cart, setCart] = useState<Record<string, number>>({}),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const selected = products.filter((p) => cart[p.id] > 0);
  const format = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
  return (
    <section className="rendered-section">
      <h2>Your next favourite, right here.</h2>
      <div className="template-grid">
        {products.map((p) => (
          <article className="panel panel-body" key={p.id}>
            {p.data.image && (
              <img
                src={p.data.image}
                alt={p.data.title}
                width={400}
                height={300}
              />
            )}
            <h3 style={{ fontSize: 23, marginTop: 18 }}>{p.data.title}</h3>
            <p>{p.data.body.slice(0, 150)}</p>
            <strong>{format(p.data.price || 0)}</strong>
            <label className="field" style={{ marginTop: 20 }}>
              Quantity
              <input
                type="number"
                min={0}
                max={Math.min(p.data.stock || 0, 50)}
                value={cart[p.id] || 0}
                onChange={(e) =>
                  setCart({
                    ...cart,
                    [p.id]: Math.min(
                      p.data.stock || 0,
                      Math.max(0, Number(e.target.value)),
                    ),
                  })
                }
              />
              <small>{p.data.stock || 0} available</small>
            </label>
          </article>
        ))}
      </div>
      {selected.length > 0 && (
        <form
          className="panel panel-body"
          style={{ maxWidth: 650, marginTop: 30 }}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            try {
              const r = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                  site,
                  items: selected.map((p) => ({
                    id: p.id,
                    quantity: cart[p.id],
                  })),
                }),
              });
              const b = await r.json();
              if (!r.ok) throw new Error(b.error);
              location.href = b.url;
            } catch (e) {
              setMessage((e as Error).message);
              setBusy(false);
            }
          }}
        >
          <h2>Checkout</h2>
          {selected.map((p) => (
            <p key={p.id}>
              {cart[p.id]} × {p.data.title} —{" "}
              {format((p.data.price || 0) * cart[p.id])}
            </p>
          ))}
          <p>Delivery: {format(delivery)}</p>
          <h3>
            Total:{" "}
            {format(
              selected.reduce(
                (sum, p) => sum + (p.data.price || 0) * cart[p.id],
                delivery,
              ),
            )}
          </h3>
          <div className="form-grid">
            <label className="field">
              Full name
              <input name="name" required minLength={2} autoComplete="name" />
            </label>
            <label className="field">
              Email
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className="field">
              Phone
              <input name="phone" required minLength={7} autoComplete="tel" />
            </label>
            <label className="field full">
              Delivery address
              <textarea
                name="address"
                required
                minLength={5}
                autoComplete="street-address"
              />
            </label>
          </div>
          {message && (
            <p className="notice error" role="alert">
              {message}
            </p>
          )}
          <button className="button" disabled={busy} style={{ marginTop: 22 }}>
            {busy ? "Opening secure checkout…" : "Continue to secure payment →"}
          </button>
          <p style={{ fontSize: 11, marginTop: 12 }}>
            Your total and availability are checked again before payment.
          </p>
        </form>
      )}
    </section>
  );
}
