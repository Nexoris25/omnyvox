"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import {
  hasVariants,
  lineKey,
  MAX_LINE_QUANTITY,
  parseLineKey,
  priceRange,
  readCart,
  resolveLine,
  totalStock,
  type FulfilmentSettings,
  type StoreProduct,
} from "@/lib/store";

type Product = StoreProduct & { data: StoreProduct["data"] & { body: string } };
type Cart = Record<string, number>;

const money = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    kobo / 100,
  );
const storageKey = (site: string) => `omnyvox:cart:${site}`;
const CHANGED = "omnyvox:cart-changed";

/** One cart per store, shared by every tab and every cart widget on a page.
 * Only product IDs, variant IDs and quantities are stored. */
export function useCart(site: string) {
  const [cart, setCartState] = useState<Cart>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => {
      try {
        setCartState(readCart(localStorage.getItem(storageKey(site))));
      } catch {
        setCartState({});
      }
    };
    load();
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(site)) load();
    };
    const onLocal = (e: Event) => {
      if ((e as CustomEvent).detail === site) load();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGED, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGED, onLocal);
    };
  }, [site]);
  const setCart = useCallback(
    (update: (current: Cart) => Cart) => {
      setCartState((current) => {
        const next = Object.fromEntries(
          Object.entries(update(current)).filter(([, q]) => q > 0),
        );
        try {
          localStorage.setItem(storageKey(site), JSON.stringify(next));
        } catch {
          /* Private browsing can disable storage; the cart still works in this tab. */
        }
        queueMicrotask(() =>
          window.dispatchEvent(new CustomEvent(CHANGED, { detail: site })),
        );
        return next;
      });
    },
    [site],
  );
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  return { cart, setCart, count, ready };
}

/** Header link with the live item count. */
export function CartLink({ site, base }: { site: string; base: string }) {
  const { count, ready } = useCart(site);
  return (
    <a
      className="site-cart-link"
      href={`${base}/cart`}
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <ShoppingBag size={20} aria-hidden />
      {ready && count > 0 && <span className="site-cart-count">{count}</span>}
    </a>
  );
}

function Stepper({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const limit = Math.max(1, Math.min(max, MAX_LINE_QUANTITY));
  return (
    <div className="qty-stepper" role="group" aria-label={`Quantity for ${label}`}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} />
      </button>
      <input
        inputMode="numeric"
        aria-label="Quantity"
        value={value}
        onChange={(e) => {
          const n = Math.floor(Number(e.target.value.replace(/\D/g, "")) || 1);
          onChange(Math.min(limit, Math.max(1, n)));
        }}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= limit}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function priceLabel(p: Product) {
  const [low, high] = priceRange(p);
  return low === high ? money(low) : `From ${money(low)}`;
}

/** Product grid with search, filters and quick add. */
export function StoreCheckout({
  site,
  products,
  base = "",
  page = false,
}: {
  site: string;
  products: Product[];
  base?: string;
  preview?: boolean;
  /** The dedicated /shop page rather than a section on the home page. */
  page?: boolean;
}) {
  const { cart, setCart } = useCart(site);
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [sort, setSort] = useState("name"),
    [added, setAdded] = useState("");
  const categories = [
    ...new Set(products.map((p) => p.data.category).filter(Boolean)),
  ] as string[];
  const visible = products
    .filter(
      (p) =>
        p.data.title.toLowerCase().includes(search.toLowerCase()) &&
        (!category || p.data.category === category),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.data.title.localeCompare(b.data.title)
        : sort === "low"
          ? priceRange(a)[0] - priceRange(b)[0]
          : priceRange(b)[0] - priceRange(a)[0],
    );
  const add = (p: Product) => {
    const line = resolveLine(p);
    if (!line) return;
    setCart((c) => ({
      ...c,
      [p.id]: Math.min((c[p.id] || 0) + 1, line.stock, MAX_LINE_QUANTITY),
    }));
    setAdded(p.id);
    setTimeout(() => setAdded((x) => (x === p.id ? "" : x)), 2500);
  };
  return (
    <section className="rendered-section storefront" id="shop">
      <div className="store-heading">
        <div>
          <span className="eyebrow">Shop</span>
          {page ? <h1>All products</h1> : <h2>Browse the collection</h2>}
        </div>
      </div>
      {products.length > 3 && (
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
          {categories.length > 1 && (
            <label className="field">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name">Product name</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>
      )}
      {!products.length && (
        <p className="store-empty">
          The catalogue is being prepared. Contact the business for product
          enquiries.
        </p>
      )}
      {!!products.length && !visible.length && (
        <p className="store-empty">No matching products. Try another search or category.</p>
      )}
      <div className="product-grid">
        {visible.map((p) => {
          const url = p.data.slug ? `${base}/shop/${p.data.slug}` : undefined;
          const stock = totalStock(p);
          const inCart = Object.keys(cart).some((k) => parseLineKey(k).id === p.id);
          return (
            <article className="product-card" key={p.id}>
              <a className="product-card-media" href={url} tabIndex={-1} aria-hidden>
                {p.data.image ? (
                  <img src={p.data.image} alt="" width={400} height={400} loading="lazy" />
                ) : (
                  <span className="product-card-placeholder">
                    <ShoppingBag size={32} />
                  </span>
                )}
                {stock === 0 && <span className="product-badge">Sold out</span>}
              </a>
              <div className="product-card-body">
                {p.data.category && <small>{p.data.category}</small>}
                <h3>{url ? <a href={url}>{p.data.title}</a> : p.data.title}</h3>
                <strong>{priceLabel(p)}</strong>
              </div>
              {stock === 0 ? (
                <button type="button" className="button secondary" disabled>
                  Sold out
                </button>
              ) : hasVariants(p) ? (
                <a className="button secondary" href={url}>
                  Choose options
                </a>
              ) : (
                <button type="button" className="button" onClick={() => add(p)}>
                  {added === p.id ? (
                    <>
                      <Check size={16} /> Added
                    </>
                  ) : (
                    "Add to cart"
                  )}
                </button>
              )}
              {added === p.id && inCart && (
                <a className="product-card-view" href={`${base}/cart`} role="status">
                  View cart →
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Option pickers, price, availability and add to cart on a product page. */
export function ProductPurchase({
  site,
  product,
  base,
}: {
  site: string;
  product: Product;
  base: string;
}) {
  const { setCart, cart } = useCart(site);
  const options = product.data.options || [];
  const variants = product.data.variants || [];
  const firstAvailable = variants.find((v) => v.stock > 0) || variants[0];
  const [choice, setChoice] = useState<Record<string, string>>(
    firstAvailable?.options || {},
  );
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const variant = variants.find((v) =>
    options.every((o) => v.options[o.name] === choice[o.name]),
  );
  const line = resolveLine(product, variant?.id);
  const key = lineKey(product.id, variant?.id);
  const already = cart[key] || 0;
  const available = line ? line.stock - already : 0;
  const inStock = (name: string, value: string) =>
    variants.some(
      (v) =>
        v.stock > 0 &&
        v.options[name] === value &&
        options.every((o) => o.name === name || v.options[o.name] === choice[o.name]),
    );
  return (
    <div className="product-purchase">
      <p className="product-price">
        {line ? money(line.price) : priceLabel(product)}
      </p>
      {options.map((o) => (
        <fieldset key={o.name} className="option-group">
          <legend>
            {o.name}
            {choice[o.name] && <span>: {choice[o.name]}</span>}
          </legend>
          <div className="option-values">
            {o.values.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={choice[o.name] === value}
                className={inStock(o.name, value) ? "" : "unavailable"}
                title={inStock(o.name, value) ? undefined : "Sold out with the current selection"}
                disabled={!variants.some((v) => v.options[o.name] === value)}
                onClick={() => {
                  // Keep the other choices when that combination is in stock;
                  // otherwise move to the closest combination that is.
                  const next = { ...choice, [o.name]: value };
                  const exact = variants.find(
                    (v) => v.stock > 0 && options.every((x) => v.options[x.name] === next[x.name]),
                  );
                  const fallback = variants.find(
                    (v) => v.stock > 0 && v.options[o.name] === value,
                  );
                  setChoice(exact || !fallback ? next : { ...fallback.options });
                  setQuantity(1);
                  setStatus("");
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <p className={`product-stock${line && line.stock > 0 ? "" : " out"}`}>
        {!line
          ? "This combination is not available."
          : line.stock === 0
            ? "Out of stock"
            : line.stock <= 5
              ? `Only ${line.stock} left`
              : "In stock"}
        {line?.sku && <span className="product-sku">SKU {line.sku}</span>}
      </p>
      {line && line.stock > 0 && (
        <div className="product-actions">
          <Stepper
            value={Math.min(quantity, Math.max(available, 1))}
            max={available}
            label={product.data.title}
            onChange={setQuantity}
          />
          <button
            type="button"
            className="button"
            disabled={available < 1}
            onClick={() => {
              const n = Math.min(quantity, available);
              setCart((c) => ({ ...c, [key]: (c[key] || 0) + n }));
              setStatus(`${n} added to your cart.`);
              setQuantity(1);
            }}
          >
            {available < 1 ? "All available stock is in your cart" : "Add to cart"}
          </button>
        </div>
      )}
      {status && (
        <p className="product-added" role="status">
          <Check size={16} /> {status} <a href={`${base}/cart`}>View cart and check out →</a>
        </p>
      )}
    </div>
  );
}

type Line = {
  key: string;
  product: Product;
  label: string;
  price: number;
  stock: number;
  image?: string;
  quantity: number;
};
function useLines(cart: Cart, products: Product[]) {
  return useMemo(() => {
    const lines: Line[] = [];
    const stale: string[] = [];
    for (const [key, quantity] of Object.entries(cart)) {
      const { id, variant } = parseLineKey(key);
      const product = products.find((p) => p.id === id);
      const line = product && resolveLine(product, variant);
      if (!product || !line || line.stock < 1) stale.push(key);
      else
        lines.push({
          key,
          product,
          quantity: Math.min(quantity, line.stock),
          ...line,
        });
    }
    return { lines, stale };
  }, [cart, products]);
}

function Summary({
  lines,
  fee,
  feeLabel,
  pending = "Calculated at checkout",
}: {
  lines: Line[];
  fee?: number;
  feeLabel?: string;
  pending?: string;
}) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  return (
    <dl className="order-totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{money(subtotal)}</dd>
      </div>
      <div>
        <dt>{feeLabel || "Delivery"}</dt>
        <dd>{fee === undefined ? pending : fee === 0 ? "Free" : money(fee)}</dd>
      </div>
      <div className="order-total">
        <dt>Total</dt>
        <dd>{money(subtotal + (fee || 0))}</dd>
      </div>
    </dl>
  );
}

export function CartPage({
  site,
  products,
  base,
}: {
  site: string;
  products: Product[];
  base: string;
}) {
  const { cart, setCart, ready } = useCart(site);
  const { lines, stale } = useLines(cart, products);
  useEffect(() => {
    if (ready && stale.length)
      setCart((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !stale.includes(k))));
  }, [ready, stale, setCart]);
  if (!ready) return <section className="rendered-section store-page" aria-busy />;
  return (
    <section className="rendered-section store-page">
      <h1>Your cart</h1>
      {stale.length > 0 && (
        <p className="store-notice" role="status">
          Some items are no longer available and were removed from your cart.
        </p>
      )}
      {!lines.length ? (
        <div className="store-empty">
          <ShoppingBag size={36} aria-hidden />
          <h2>Your cart is empty</h2>
          <p>Browse the shop and add the items you would like to order.</p>
          <a className="button" href={`${base}/shop`}>
            Continue shopping
          </a>
        </div>
      ) : (
        <div className="store-layout">
          <ul className="cart-lines">
            {lines.map((l) => (
              <li key={l.key} className="cart-line">
                {l.image ? (
                  <img src={l.image} alt="" width={96} height={96} />
                ) : (
                  <span className="cart-line-placeholder" aria-hidden>
                    <ShoppingBag size={24} />
                  </span>
                )}
                <div className="cart-line-info">
                  <a href={l.product.data.slug ? `${base}/shop/${l.product.data.slug}` : undefined}>
                    {l.product.data.title}
                  </a>
                  {l.label && <small>{l.label}</small>}
                  <span>{money(l.price)}</span>
                  {l.stock <= 5 && <small className="low">Only {l.stock} left</small>}
                </div>
                <Stepper
                  value={l.quantity}
                  max={l.stock}
                  label={l.product.data.title}
                  onChange={(n) => setCart((c) => ({ ...c, [l.key]: n }))}
                />
                <strong className="cart-line-total">{money(l.price * l.quantity)}</strong>
                <button
                  type="button"
                  className="cart-remove"
                  aria-label={`Remove ${l.product.data.title}${l.label ? `, ${l.label}` : ""}`}
                  onClick={() =>
                    setCart((c) => {
                      const next = { ...c };
                      delete next[l.key];
                      return next;
                    })
                  }
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <Summary lines={lines} />
            <a className="button" href={`${base}/checkout`}>
              Continue to checkout
            </a>
            <a className="store-back" href={`${base}/shop`}>
              Continue shopping
            </a>
          </aside>
        </div>
      )}
    </section>
  );
}

export function CheckoutPage({
  site,
  products,
  base,
  options,
  payments,
  preview = false,
  policies = {},
}: {
  site: string;
  products: Product[];
  base: string;
  options: Pick<FulfilmentSettings, "zones" | "pickup">;
  payments: boolean;
  preview?: boolean;
  /** Links to this store's own published policies. */
  policies?: { terms?: string; refund?: string; privacy?: string };
}) {
  const { cart, setCart, ready } = useCart(site);
  const { lines } = useLines(cart, products);
  const [method, setMethod] = useState<"delivery" | "pickup">(
    options.zones.length ? "delivery" : "pickup",
  );
  const [zone, setZone] = useState(options.zones.length === 1 ? options.zones[0].id : "");
  const [location, setLocation] = useState(
    options.pickup.length === 1 ? options.pickup[0].id : "",
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const chosenZone = options.zones.find((z) => z.id === zone);
  const fee = method === "pickup" ? 0 : chosenZone?.fee;
  if (!ready) return <section className="rendered-section store-page" aria-busy />;
  if (!lines.length)
    return (
      <section className="rendered-section store-page">
        <div className="store-empty">
          <ShoppingBag size={36} aria-hidden />
          <h1>There is nothing to check out yet</h1>
          <p>Add items to your cart first.</p>
          <a className="button" href={`${base}/shop`}>
            Go to the shop
          </a>
        </div>
      </section>
    );
  return (
    <section className="rendered-section store-page">
      <a className="store-back" href={`${base}/cart`}>
        ← Back to cart
      </a>
      <h1>Checkout</h1>
      {(!payments || preview) && (
        <p className="store-notice" role="status">
          {preview
            ? "This is a preview. Payments are only taken on your published website."
            : "This store is not taking online payments yet. Please contact the business to order."}
        </p>
      )}
      <form
        className="store-layout"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (method === "delivery" && !chosenZone) return setError("Choose a delivery area.");
          if (method === "pickup" && !location) return setError("Choose a pickup location.");
          setBusy(true);
          const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
          try {
            const r = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                site,
                name: form.name,
                email: form.email,
                phone: form.phone,
                address: method === "delivery" ? form.address : undefined,
                note: form.note || undefined,
                consent: form.consent === "on",
                fulfilment:
                  method === "delivery"
                    ? { method, zone }
                    : { method, location },
                items: lines.map((l) => {
                  const { id, variant } = parseLineKey(l.key);
                  return { id, ...(variant ? { variant } : {}), quantity: l.quantity };
                }),
              }),
            });
            const b = await r.json();
            if (!r.ok) throw new Error(b.error || "Checkout could not start.");
            // Stock is now reserved for this order; start the next cart fresh.
            setCart(() => ({}));
            window.location.href = b.url;
          } catch (err) {
            setError((err as Error).message);
            setBusy(false);
          }
        }}
      >
        <div className="checkout-steps">
          <fieldset className="checkout-step">
            <legend>
              <span>1</span> Contact details
            </legend>
            <div className="form-grid">
              <label className="field">
                Full name
                <input name="name" required minLength={2} maxLength={100} autoComplete="name" />
              </label>
              <label className="field">
                Phone
                <input name="phone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" />
              </label>
              <label className="field full">
                Email
                <input type="email" name="email" required autoComplete="email" />
                <small>Your receipt and order updates are sent here.</small>
              </label>
            </div>
          </fieldset>
          <fieldset className="checkout-step">
            <legend>
              <span>2</span> Delivery or pickup
            </legend>
            {options.zones.length > 0 && options.pickup.length > 0 && (
              <div className="method-switch" role="radiogroup" aria-label="How you receive your order">
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === "delivery"}
                  onClick={() => setMethod("delivery")}
                >
                  <Truck size={18} /> Delivery
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === "pickup"}
                  onClick={() => setMethod("pickup")}
                >
                  <Store size={18} /> Pickup
                </button>
              </div>
            )}
            {method === "delivery" ? (
              <>
                <div className="choice-list">
                  {options.zones.map((z) => (
                    <label key={z.id} className={`choice${zone === z.id ? " selected" : ""}`}>
                      <input
                        type="radio"
                        name="zone"
                        value={z.id}
                        checked={zone === z.id}
                        onChange={() => setZone(z.id)}
                      />
                      <span>
                        <b>{z.name}</b>
                        {(z.eta || z.areas) && (
                          <small>{[z.eta, z.areas].filter(Boolean).join(" · ")}</small>
                        )}
                      </span>
                      <strong>{z.fee ? money(z.fee) : "Free"}</strong>
                    </label>
                  ))}
                </div>
                <label className="field full">
                  Delivery address
                  <textarea
                    name="address"
                    required
                    minLength={5}
                    maxLength={500}
                    autoComplete="street-address"
                    placeholder="House number, street, area, city and any landmark"
                  />
                </label>
              </>
            ) : (
              <div className="choice-list">
                {options.pickup.map((p) => (
                  <label key={p.id} className={`choice${location === p.id ? " selected" : ""}`}>
                    <input
                      type="radio"
                      name="location"
                      value={p.id}
                      checked={location === p.id}
                      onChange={() => setLocation(p.id)}
                    />
                    <span>
                      <b>{p.name}</b>
                      <small>{p.address}</small>
                      {p.hours && <small>{p.hours}</small>}
                      {p.instructions && <small>{p.instructions}</small>}
                    </span>
                    <strong>Free</strong>
                  </label>
                ))}
              </div>
            )}
            <label className="field full">
              <span>Order note <span className="optional">(optional)</span></span>
              <textarea name="note" maxLength={500} rows={2} placeholder="Anything the store should know" />
            </label>
          </fieldset>
        </div>
        <aside className="order-summary">
          <h2>Order summary</h2>
          <ul className="summary-lines">
            {lines.map((l) => (
              <li key={l.key}>
                <span>
                  {l.quantity} × {l.product.data.title}
                  {l.label && <small>{l.label}</small>}
                </span>
                <span>{money(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <Summary
            lines={lines}
            fee={fee}
            feeLabel={method === "pickup" ? "Pickup" : "Delivery"}
            pending="Choose an area"
          />
          <label className="store-consent">
            <input type="checkbox" name="consent" required />
            <span>
              I agree to the{" "}
              {[
                policies.terms && ["terms of sale", policies.terms],
                policies.refund && ["refund policy", policies.refund],
                policies.privacy && ["privacy policy", policies.privacy],
              ]
                .filter((x): x is [string, string] => !!x)
                .map(([label, href], i, all) => (
                  <span key={label}>
                    {i > 0 && (i === all.length - 1 ? " and " : ", ")}
                    <a href={href} target="_blank" rel="noopener">
                      {label}
                    </a>
                  </span>
                ))}
              {!policies.terms && !policies.refund && !policies.privacy &&
                "store’s terms of sale, refund policy and privacy policy"}
              .
            </span>
          </label>
          {error && (
            <p className="store-error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy || !payments || preview}>
            <PackageCheck size={18} />
            {busy ? "Opening secure payment…" : "Pay securely"}
          </button>
          <small className="store-fineprint">
            Prices and availability are checked again before payment. Payment is
            processed securely by Paystack.
          </small>
        </aside>
      </form>
    </section>
  );
}
