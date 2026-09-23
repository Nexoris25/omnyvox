"use client";
import { useEffect, useState } from "react";
import { readCart } from "@/lib/cart";
type Product = {
  id: string;
  data: {
    title: string;
    price?: number;
    stock?: number;
    image?: string;
    body: string;
    category?: string;
    slug?: string;
  };
};
export function StoreCheckout({
  site,
  products,
  delivery = 0,
  base = "",
  hideImages = false,
  preview = false,
  featuredProductId,
}: {
  site: string;
  products: Product[];
  delivery?: number;
  base?: string;
  hideImages?: boolean;
  preview?: boolean;
  featuredProductId?: string;
}) {
  const [cart, setCart] = useState<Record<string, number>>({}),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [sort, setSort] = useState("name");
  const [loadedSite, setLoadedSite] = useState("");
  useEffect(() => {
    try {
      setCart(readCart(localStorage.getItem(`omnyvox:cart:${site}`)));
    } catch {
      setCart({});
    }
    setLoadedSite(site);
  }, [site]);
  useEffect(() => {
    if (loadedSite !== site || preview) return;
    try {
      localStorage.setItem(`omnyvox:cart:${site}`, JSON.stringify(cart));
    } catch {
      /* Private browsing can disable storage; checkout still works. */
    }
  }, [cart, loadedSite, site, preview]);
  const selected = products.filter((p) => cart[p.id] > 0);
  if (preview)
    return (
      <section className="rendered-section">
        <h2>Shop preview</h2>
        <p>Checkout is available on your published website.</p>
        {products.map((p) => (
          <article key={p.id}>
            <h3>{p.data.title}</h3>
            <p>{p.data.body.replace(/<[^>]*>/g, "")}</p>
          </article>
        ))}
      </section>
    );
  const format = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
  return (
    <section className="rendered-section storefront" id="shop">
      <div className="store-heading">
        <div>
          <span className="eyebrow">THE COLLECTION</span>
          <h2>Find your everyday essentials.</h2>
        </div>
        <a className="button" href="#cart">
          Cart · {Object.values(cart).reduce((a, b) => a + b, 0)}
        </a>
      </div>
      <div className="store-tools">
        <label className="field">
          Search products
          <input
            type="search"
            value={search}
            placeholder="What are you looking for?"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="field">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {[
              ...new Set(products.map((p) => p.data.category).filter(Boolean)),
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Product name</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>
      {!products.length && (
        <p className="panel panel-body">
          The catalogue is being prepared. Contact the business for product
          enquiries.
        </p>
      )}
      {!!products.length &&
        !products.some(
          (p) =>
            p.data.title.toLowerCase().includes(search.toLowerCase()) &&
            (!category || p.data.category === category),
        ) && <p>No matching products. Try another search or category.</p>}
      <div className="template-grid">
        {products
          .filter((p) => !featuredProductId || p.id === featuredProductId)
          .filter(
            (p) =>
              p.data.title.toLowerCase().includes(search.toLowerCase()) &&
              (!category || p.data.category === category),
          )
          .sort((a, b) =>
            sort === "name"
              ? a.data.title.localeCompare(b.data.title)
              : sort === "low"
                ? (a.data.price || 0) - (b.data.price || 0)
                : (b.data.price || 0) - (a.data.price || 0),
          )
          .map((p) => (
            <article className="panel panel-body" key={p.id}>
              {p.data.image && !hideImages && (
                <img
                  src={p.data.image}
                  alt={p.data.title}
                  width={400}
                  height={300}
                />
              )}
              <h3 style={{ fontSize: 23, marginTop: 18 }}>
                {p.data.slug ? (
                  <a href={`${base}/shop/${p.data.slug}`}>{p.data.title}</a>
                ) : (
                  p.data.title
                )}
              </h3>
              <p>{p.data.body.replace(/<[^>]*>/g, "").slice(0, 150)}</p>
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
                        50,
                        Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      ),
                    })
                  }
                />
                <small>{p.data.stock || 0} available</small>
              </label>
            </article>
          ))}
      </div>
      {!selected.length && (
        <div id="cart" className="panel panel-body">
          <h3>Your cart is empty</h3>
          <p>Choose a product quantity above to start your order.</p>
        </div>
      )}
      {selected.length > 0 && (
        <form
          id="cart"
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
              <button
                type="button"
                className="button secondary small"
                aria-label={`Remove ${p.data.title} from cart`}
                onClick={() => setCart({ ...cart, [p.id]: 0 })}
              >
                Remove
              </button>
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
