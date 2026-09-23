"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CornerDownRight,
  Menu,
  MousePointerClick,
  Plus,
  Trash2,
} from "lucide-react";
import type { Brand, Section } from "@/lib/model";
import type { Module } from "@/lib/industry";
import { collectionKinds } from "@/lib/industry-routes";
import { MediaPicker } from "./media-picker";

type Entry = NonNullable<Brand["navigation"]>[number];
type Child = NonNullable<Entry["children"]>[number];
type Destination = { value: string; label: string; group: string };

const CUSTOM = "__custom";

/** Encodes a link as a single <select> value: page:<id> or href:<url>. */
const encode = (l: { pageId?: string; href: string }) =>
  l.pageId ? `page:${l.pageId}` : `href:${l.href}`;

function DestinationField({
  link,
  onPick,
  destinations,
  customOpen,
  setCustomOpen,
}: {
  destinations: Destination[];
  customOpen: boolean;
  setCustomOpen: (open: boolean) => void;
  link: { pageId?: string; href: string };
  onPick: (patch: { pageId: string; href: string }, label?: string) => void;
}) {
  const value = encode(link);
  const known = destinations.some((d) => d.value === value);
  const custom = customOpen || !known;
  const groups = [...new Set(destinations.map((d) => d.group))];
  return (
    <div className="nav-destination">
      <label className="field">
        Links to
        <select
          value={custom ? CUSTOM : value}
          onChange={(e) => {
            if (e.target.value === CUSTOM) {
              setCustomOpen(true);
              return;
            }
            setCustomOpen(false);
            const [kind, ...rest] = e.target.value.split(":");
            const target = rest.join(":");
            onPick(
              kind === "page"
                ? { pageId: target, href: "/" }
                : { pageId: "", href: target },
              destinations
                .find((d) => d.value === e.target.value)
                ?.label.replace(/ \(.*\)$/, ""),
            );
          }}
        >
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {destinations
                .filter((d) => d.group === g)
                .map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
            </optgroup>
          ))}
          <option value={CUSTOM}>Another website or custom link…</option>
        </select>
      </label>
      {custom && (
        <label className="field">
          Web address
          <input
            value={link.pageId ? "" : link.href}
            placeholder="https://example.com or /page-address"
            onChange={(e) => onPick({ pageId: "", href: e.target.value })}
          />
        </label>
      )}
    </div>
  );
}

export function NavigationEditor({
  siteId,
  brand,
  sections = [],
  modules = [],
  category = "corporate",
  onChange,
  demo,
}: {
  siteId: string;
  brand: Brand;
  sections?: Section[];
  modules?: Module[];
  category?: string;
  onChange: (brand: Brand) => void;
  demo: boolean;
}) {
  const [pages, setPages] = useState<
    { id: string; data: { title: string; status: string } }[]
  >([]);
  const [customOpen, setCustomOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!demo)
      fetch(`/api/sites/${siteId}/pages`)
        .then((r) => r.json())
        .then((b) => {
          if (Array.isArray(b)) setPages(b);
        });
  }, [siteId, demo]);

  const destinations = useMemo<Destination[]>(() => {
    const list: Destination[] = [
      { value: "href:/", label: "Home", group: "Website" },
    ];
    for (const p of pages)
      list.push({
        value: `page:${p.id}`,
        label: p.data.title + (p.data.status === "published" ? "" : " (draft)"),
        group: "Your pages",
      });
    if (category === "commerce")
      list.push({ value: "href:/shop", label: "Shop", group: "Website" });
    for (const m of modules)
      if (m.state === "enabled" && collectionKinds.includes(m.key))
        list.push({ value: `href:/${m.key}`, label: m.label, group: "Website" });
    if (modules.some((m) => m.key === "articles" && m.state === "enabled"))
      list.push({ value: "href:/insights", label: "Insights", group: "Website" });
    for (const s of sections.filter((s) => s.visible)) {
      const anchor =
        s.type === "services"
          ? "services"
          : s.type === "contact"
            ? "contact"
            : s.type === "cta"
              ? "get-started"
              : s.id;
      if (s.type !== "hero")
        list.push({
          value: `href:#${anchor}`,
          label: `${s.title || s.type} (homepage section)`,
          group: "Homepage sections",
        });
    }
    return list;
  }, [pages, modules, sections, category]);

  const links = brand.navigation || [];
  const set = (navigation: Entry[]) => onChange({ ...brand, navigation });
  const update = (i: number, patch: Partial<Entry>) =>
    set(links.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  const move = <T,>(list: T[], a: number, b: number) => {
    const next = [...list];
    [next[a], next[b]] = [next[b], next[a]];
    return next;
  };
  const labelFor = (value: string) =>
    destinations.find((d) => d.value === value)?.label.replace(/ \(.*\)$/, "");

  return (
    <section className="panel panel-body nav-editor">
      <div className="nav-editor-head">
        <div>
          <h2>Navigation</h2>
          <p className="muted">
            Build the menu at the top of your website. Links to your pages
            update automatically when a page address changes, and draft pages
            stay hidden until published.
          </p>
        </div>
      </div>

      <div className="nav-outline" aria-label="Menu preview">
        <Menu size={15} />
        {links.filter((l) => !l.footer).length ? (
          links
            .filter((l) => !l.footer)
            .map((l, i) => (
              <span key={i}>
                {l.label}
                {!!l.children?.length && <ChevronRight size={12} className="rot" />}
              </span>
            ))
        ) : (
          <span className="muted">No menu links yet</span>
        )}
        {brand.navCta?.label && (
          <span className="nav-outline-cta">{brand.navCta.label}</span>
        )}
      </div>

      {links.map((link, i) => (
        <div className="nav-item" key={i}>
          <div className="nav-item-head">
            <b>{link.label || "Untitled link"}</b>
            <div className="icon-row">
              <button
                type="button"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => set(move(links, i, i - 1))}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={i === links.length - 1}
                onClick={() => set(move(links, i, i + 1))}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                aria-label={`Remove ${link.label}`}
                onClick={() => set(links.filter((_, j) => j !== i))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              Menu label
              <input
                value={link.label}
                maxLength={60}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </label>
            <DestinationField
              destinations={destinations}
              customOpen={!!customOpen[`${i}`]}
              setCustomOpen={(open) =>
                setCustomOpen({ ...customOpen, [`${i}`]: open })
              }
              link={link}
              onPick={(patch) => update(i, patch)}
            />
          </div>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={link.footer}
              onChange={(e) => update(i, { footer: e.target.checked })}
            />
            Show in the footer instead of the top menu
          </label>

          {!!link.children?.length && (
            <div className="nav-children">
              <span className="field-label">
                Dropdown links under “{link.label}”
              </span>
              {link.children.map((child, j) => {
                const setChild = (patch: Partial<Child>) =>
                  update(i, {
                    children: link.children!.map((c, k) =>
                      k === j ? { ...c, ...patch } : c,
                    ),
                  });
                return (
                  <div className="nav-child" key={j}>
                    <CornerDownRight size={15} className="muted" />
                    <div className="form-grid">
                      <label className="field">
                        Label
                        <input
                          value={child.label}
                          maxLength={60}
                          onChange={(e) => setChild({ label: e.target.value })}
                        />
                      </label>
                      <DestinationField
                        destinations={destinations}
                        customOpen={!!customOpen[`${i}-${j}`]}
                        setCustomOpen={(open) =>
                          setCustomOpen({ ...customOpen, [`${i}-${j}`]: open })
                        }
                        link={child}
                        onPick={(patch, label) =>
                          setChild({
                            ...patch,
                            ...(label && (!child.label || child.label === "New link")
                              ? { label }
                              : {}),
                          })
                        }
                      />
                    </div>
                    <div className="icon-row">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={j === 0}
                        onClick={() =>
                          update(i, { children: move(link.children!, j, j - 1) })
                        }
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${child.label}`}
                        onClick={() =>
                          update(i, {
                            children: link.children!.filter((_, k) => k !== j),
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button
            type="button"
            className="button secondary small"
            disabled={(link.children?.length || 0) >= 8 || link.footer}
            onClick={() =>
              update(i, {
                children: [
                  ...(link.children || []),
                  { label: "New link", href: "/", pageId: "" },
                ],
              })
            }
          >
            <Plus size={14} />
            {link.children?.length ? "Add dropdown link" : "Turn into a dropdown menu"}
          </button>
        </div>
      ))}

      <div className="nav-add">
        <label className="field">
          Add to menu
          <select
            value=""
            disabled={links.length >= 12}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              if (v === CUSTOM) {
                set([
                  ...links,
                  { label: "New link", href: "https://", footer: false },
                ]);
                setCustomOpen({ ...customOpen, [`${links.length}`]: true });
                return;
              }
              const [kind, ...rest] = v.split(":");
              const target = rest.join(":");
              set([
                ...links,
                {
                  label: labelFor(v) || "New link",
                  footer: false,
                  ...(kind === "page"
                    ? { pageId: target, href: "/" }
                    : { href: target, pageId: "" }),
                },
              ]);
            }}
          >
            <option value="">Choose a page or section…</option>
            {[...new Set(destinations.map((d) => d.group))].map((g) => (
              <optgroup key={g} label={g}>
                {destinations
                  .filter((d) => d.group === g)
                  .map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
              </optgroup>
            ))}
            <option value={CUSTOM}>Another website or custom link…</option>
          </select>
        </label>
        <small className="muted">{links.length} / 12 links</small>
      </div>

      <div className="nav-cta-editor">
        <h3>
          <MousePointerClick size={16} /> Header button
        </h3>
        <p className="muted">
          A prominent button at the right of your menu — use it for your most
          important action, such as booking or contacting you.
        </p>
        <div className="form-grid">
          <label className="field">
            Button text
            <input
              value={brand.navCta?.label || ""}
              maxLength={40}
              placeholder="e.g. Book a consultation"
              onChange={(e) =>
                onChange({
                  ...brand,
                  navCta: {
                    label: e.target.value,
                    href: brand.navCta?.href || "/contact",
                  },
                })
              }
            />
          </label>
          <DestinationField
            destinations={destinations}
            customOpen={!!customOpen.cta}
            setCustomOpen={(open) => setCustomOpen({ ...customOpen, cta: open })}
            link={{ href: brand.navCta?.href || "/contact" }}
            onPick={(patch) =>
              onChange({
                ...brand,
                navCta: { label: brand.navCta?.label || "", href: patch.href },
              })
            }
          />
        </div>
        <small className="muted">Leave the text empty to hide the button.</small>
      </div>

      <div className="nav-cta-editor">
        <h3>Browser icon</h3>
        {brand.favicon ? (
          <div className="favicon-row">
            <img src={brand.favicon} width={40} height={40} alt="Browser icon" />
            <button
              type="button"
              className="button secondary small"
              onClick={() => onChange({ ...brand, favicon: "" })}
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        ) : (
          !demo && (
            <MediaPicker
              endpoint={`/api/sites/${siteId}/media`}
              label="Choose browser icon"
              onSelect={(favicon) => onChange({ ...brand, favicon })}
            />
          )
        )}
      </div>
      <p className="muted">
        Save your changes, then publish your website to update the live menu.
      </p>
    </section>
  );
}
