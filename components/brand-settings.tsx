"use client";
import { Brand } from "@/lib/model";
import { legalRecommendations } from "@/lib/content";
export function BrandSettings({
  brand,
  onChange,
}: {
  brand: Brand;
  onChange: (brand: Brand) => void;
}) {
  return (
    <div className="panel panel-body">
      <h2>Contact, social & legal settings</h2>
      <label className="field">
        Contact form recipient
        <input
          type="email"
          value={brand.notificationEmail || ""}
          placeholder={brand.email}
          onChange={(e) =>
            onChange({ ...brand, notificationEmail: e.target.value })
          }
        />
        <small>
          New enquiries are sent here. Leave blank to use your business email.
        </small>
      </label>
      <label className="field">
        Nature of business
        <select
          value={brand.businessNature || "general"}
          onChange={(e) =>
            onChange({
              ...brand,
              businessNature: e.target.value as Brand["businessNature"],
            })
          }
        >
          {["general", "commerce", "services", "healthcare", "education"].map(
            (n) => (
              <option key={n}>{n}</option>
            ),
          )}
        </select>
      </label>
      <p>
        Recommended legal pages:{" "}
        {(legalRecommendations[brand.businessNature || "general"] || [])
          .map((p) => p.title)
          .join(", ")}
        . Create and publish these in Legal pages; published policies appear in
        your footer.
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
