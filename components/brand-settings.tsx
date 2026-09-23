"use client";
import { Brand } from "@/lib/model";
import { palettes, contrast, foreground } from "@/lib/theme";
export function BrandSettings({
  brand,
  onChange,
}: {
  brand: Brand;
  onChange: (brand: Brand) => void;
}) {
  return (
    <div className="panel panel-body">
      <h2>A palette that feels like you</h2>
      <p>
        Start with a coordinated palette, then fine-tune your colours. Your
        website keeps its own identity.
      </p>
      <div
        className="palette-options"
        role="group"
        aria-label="Website colour palettes"
      >
        {palettes.map((p) => (
          <button
            type="button"
            className="palette-option"
            key={p.id}
            aria-pressed={
              brand.primary.toLowerCase() === p.primary.toLowerCase() &&
              brand.background.toLowerCase() === p.background.toLowerCase()
            }
            onClick={() =>
              onChange({
                ...brand,
                primary: p.primary,
                secondary: p.secondary,
                background: p.background,
                text: p.text,
              })
            }
          >
            <span className="palette-swatches" aria-hidden="true">
              {[p.primary, p.secondary, p.background, p.text].map((c, i) => (
                <i style={{ background: c }} key={i} />
              ))}
            </span>
            <strong>{p.name}</strong>
          </button>
        ))}
      </div>
      <p className="brand-contrast-note">
        Text contrast:{" "}
        <strong>{contrast(brand.text, brand.background).toFixed(1)}:1</strong> ·
        Button text adjusts automatically for readability.
      </p>
      <div
        className="palette-live"
        style={{
          background: brand.background,
          color: brand.text,
          borderColor: brand.primary,
        }}
      >
        <strong>Your brand in focus</strong>
        <p>A clear message. A recognisable colour. A confident next step.</p>
        <span
          style={{
            background: brand.primary,
            color: foreground(brand.primary),
          }}
        >
          Your primary action ↗
        </span>
      </div>
      <h3>Contact, social & legal settings</h3>
      <label className="field">
        Approved colour palette
        <select
          defaultValue=""
          onChange={(e) => {
            const p = palettes.find((p) => p.id === e.target.value);
            if (p)
              onChange({
                ...brand,
                primary: p.primary,
                secondary: p.secondary,
                background: p.background,
                text: p.text,
              });
          }}
        >
          <option value="" disabled>
            Choose a palette
          </option>
          {palettes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <p>
        Manage and verify your private contact recipient in{" "}
        <a href="/dashboard/enquiries">Forms & enquiries</a>. Your public
        business email is configured separately.
      </p>
      <p>
        Your required legal pages are based on your industry. Track and create
        them in <a href="/dashboard/legal">Legal pages</a>; published policies
        appear in your footer.
      </p>
      {[
        "facebook",
        "instagram",
        "linkedin",
        "x",
        "youtube",
        "tiktok",
        "whatsapp",
      ].map((n) => (
        <label key={n} className="field">
          {n} URL
          <input
            type="url"
            value={(brand.socials as Record<string, string>)?.[n] || ""}
            placeholder="https://…"
            onChange={(e) =>
              onChange({
                ...brand,
                socials: { ...brand.socials, [n]: e.target.value },
              })
            }
          />
        </label>
      ))}
    </div>
  );
}
export function RobotsSettings({
  brand,
  onChange,
}: {
  brand: Brand;
  onChange: (brand: Brand) => void;
}) {
  const robots = brand.robots || { index: true, follow: true, rules: "" };
  return (
    <div className="panel panel-body">
      <h2>Crawling & indexing</h2>
      <label>
        <input
          type="checkbox"
          checked={robots.index}
          onChange={(e) =>
            onChange({
              ...brand,
              robots: { ...robots, index: e.target.checked },
            })
          }
        />{" "}
        Allow search engines to index this website
      </label>
      <label>
        <input
          type="checkbox"
          checked={robots.follow}
          onChange={(e) =>
            onChange({
              ...brand,
              robots: { ...robots, follow: e.target.checked },
            })
          }
        />{" "}
        Allow search engines to follow links
      </label>
      <label className="field">
        Additional robots.txt rules
        <textarea
          value={robots.rules}
          maxLength={4000}
          placeholder={"User-agent: ExampleBot\nDisallow: /"}
          onChange={(e) =>
            onChange({ ...brand, robots: { ...robots, rules: e.target.value } })
          }
        />
      </label>
      <p>
        Page indexing can also be disabled in each page or article. robots.txt
        controls crawling; noindex controls search inclusion.
      </p>
    </div>
  );
}
