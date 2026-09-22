"use client";
import { useEffect, useState } from "react";
import type { Brand } from "@/lib/model";
import { MediaPicker } from "./rich-text-editor";
type Entry = NonNullable<Brand["navigation"]>[number];
export function NavigationEditor({
  siteId,
  brand,
  onChange,
  demo,
}: {
  siteId: string;
  brand: Brand;
  onChange: (brand: Brand) => void;
  demo: boolean;
}) {
  const [pages, setPages] = useState<{ id: string; data: { title: string } }[]>(
    [],
  );
  useEffect(() => {
    if (!demo)
      fetch(`/api/sites/${siteId}/pages`)
        .then((r) => r.json())
        .then((b) => {
          if (Array.isArray(b)) setPages(b);
        });
  }, [siteId, demo]);
  const links = brand.navigation || [];
  function update(index: number, patch: Partial<Entry>) {
    onChange({
      ...brand,
      navigation: links.map((n, i) => (i === index ? { ...n, ...patch } : n)),
    });
  }
  function fields(
    item: Pick<Entry, "label" | "href" | "pageId">,
    change: (patch: Partial<Entry>) => void,
  ) {
    return (
      <div className="form-grid">
        <label className="field">
          Link label
          <input
            value={item.label}
            maxLength={60}
            onChange={(e) => change({ label: e.target.value })}
          />
        </label>
        <label className="field">
          Destination
          <select
            value={item.pageId || ""}
            onChange={(e) => change({ pageId: e.target.value })}
          >
            <option value="">Website address or section</option>
            {pages.map((p) => (
              <option value={p.id} key={p.id}>
                {p.data.title}
              </option>
            ))}
          </select>
        </label>
        {!item.pageId && (
          <label className="field full">
            Link
            <input
              value={item.href}
              placeholder="/about or https://example.com"
              onChange={(e) => change({ href: e.target.value })}
            />
          </label>
        )}
      </div>
    );
  }
  return (
    <section className="panel panel-body">
      <h2>Navigation & favicon</h2>
      <p>
        Page links follow the page when its URL changes. Unpublished pages are
        hidden from public menus.
      </p>
      <label className="field">
        Browser icon
        {!demo && (
          <MediaPicker
            endpoint={`/api/sites/${siteId}/media`}
            onSelect={(favicon) => onChange({ ...brand, favicon })}
          />
        )}
      </label>
      {brand.favicon && (
        <div>
          <img src={brand.favicon} width={40} height={40} alt="Browser icon" />
          <button
            type="button"
            className="button secondary small"
            onClick={() => onChange({ ...brand, favicon: "" })}
          >
            Remove browser icon
          </button>
        </div>
      )}
      {links.map((link, i) => (
        <div className="panel panel-body" key={i}>
          {fields(link, (patch) => update(i, patch))}
          <label>
            <input
              type="checkbox"
              checked={link.footer}
              onChange={(e) => update(i, { footer: e.target.checked })}
            />{" "}
            Show in footer
          </label>
          {(link.children || []).map((child, j) => (
            <div className="panel-body" key={j}>
              {fields(child, (patch) =>
                update(i, {
                  children: link.children!.map((n, k) =>
                    k === j ? { ...n, ...patch } : n,
                  ),
                }),
              )}
              <button
                type="button"
                onClick={() =>
                  update(i, {
                    children: link.children!.filter((_, k) => k !== j),
                  })
                }
              >
                Remove dropdown link
              </button>
            </div>
          ))}
          <div className="form-actions">
            <button
              type="button"
              className="button secondary small"
              disabled={(link.children?.length || 0) >= 8}
              onClick={() =>
                update(i, {
                  children: [
                    ...(link.children || []),
                    { label: "New link", href: "/", pageId: "" },
                  ],
                })
              }
            >
              Add dropdown link
            </button>
            <button
              type="button"
              className="button secondary small"
              disabled={i === 0}
              onClick={() => {
                const next = [...links];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                onChange({ ...brand, navigation: next });
              }}
            >
              Move up
            </button>
            <button
              type="button"
              className="button secondary small"
              onClick={() =>
                onChange({
                  ...brand,
                  navigation: links.filter((_, j) => i !== j),
                })
              }
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="button secondary"
        disabled={links.length >= 12}
        onClick={() =>
          onChange({
            ...brand,
            navigation: [
              ...links,
              { label: "New link", href: "/", footer: false, children: [] },
            ],
          })
        }
      >
        Add menu link
      </button>
      <p className="muted">
        Save your brand settings, then publish the website to apply these
        changes.
      </p>
    </section>
  );
}
