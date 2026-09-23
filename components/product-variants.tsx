"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ImageField } from "./media-picker";
import {
  MAX_OPTIONS,
  MAX_VARIANTS,
  type ProductOption,
  type ProductVariant,
} from "@/lib/store";

/** Stable ID for a new combination, so rows keep focus while typing. */
function comboId(key: string) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return "v" + (h >>> 0).toString(36).padStart(7, "0");
}
const comboKey = (options: ProductOption[], values: Record<string, string>) =>
  options.map((o) => values[o.name]).join("|");

/** Every combination of the option values, in the order they were entered. */
function combinations(options: ProductOption[]) {
  let combos: Record<string, string>[] = [{}];
  for (const o of options)
    combos = combos.flatMap((c) => o.values.map((v) => ({ ...c, [o.name]: v })));
  return options.length ? combos : [];
}

/** Options (Size, Colour…) and one row per combination with its own SKU,
 * price, stock and image. Submitted as hidden JSON with the product form. */
export function ProductVariants({
  initial,
  basePrice,
  mediaEndpoint,
}: {
  initial?: { sku?: string; options?: ProductOption[]; variants?: ProductVariant[] };
  basePrice: number;
  mediaEndpoint?: string;
}) {
  const [enabled, setEnabled] = useState(!!initial?.variants?.length);
  const [sku, setSku] = useState(initial?.sku || "");
  const [options, setOptions] = useState<{ name: string; values: string }[]>(
    initial?.options?.map((o) => ({ name: o.name, values: o.values.join(", ") })) || [
      { name: "Size", values: "" },
    ],
  );
  const [rows, setRows] = useState<ProductVariant[]>(initial?.variants || []);
  const parsed: ProductOption[] = useMemo(
    () =>
      options
        .map((o) => ({
          name: o.name.trim(),
          values: [...new Set(o.values.split(",").map((v) => v.trim()).filter(Boolean))],
        }))
        .filter((o) => o.name && o.values.length),
    [options],
  );
  const combos = combinations(parsed);
  const tooMany = combos.length > MAX_VARIANTS;
  // Rows follow the options; existing rows keep their SKU, price and stock.
  const variants: ProductVariant[] = tooMany
    ? []
    : combos.map((values) => {
        // Match by values in option order, so renaming "Color" to "Colour"
        // keeps each row's SKU, price and stock.
        const existing = rows.find(
          (r) => Object.values(r.options).join("|") === comboKey(parsed, values),
        );
        return existing
          ? { ...existing, options: values }
          : { id: comboId(comboKey(parsed, values)), options: values, sku: "", stock: 0 };
      });
  const update = (id: string, patch: Partial<ProductVariant>) =>
    setRows(() => {
      const current = variants;
      return current.map((v) => (v.id === id ? { ...v, ...patch } : v));
    });
  const names = parsed.map((o) => o.name.toLowerCase());
  const duplicateName = new Set(names).size !== names.length;
  const value = enabled && !tooMany && !duplicateName
    ? { options: parsed, variants }
    : { options: [], variants: [] };
  return (
    <div className="field full product-variants">
      <input type="hidden" name="variants" value={JSON.stringify(value)} />
      {!enabled && (
        <label className="field">
          <span>SKU <span className="optional">(optional)</span></span>
          <input
            name="sku"
            value={sku}
            maxLength={64}
            placeholder="e.g. TEE-BLK-001"
            onChange={(e) => setSku(e.target.value)}
          />
        </label>
      )}
      <label className="checkbox-line">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        This product comes in options such as size or colour
      </label>
      {enabled && (
        <>
          <p className="field-hint">
            Each combination gets its own stock, SKU and, if you like, a different
            price and image. The stock quantity above is ignored for products with
            options.
          </p>
          <div className="variant-options">
            {options.map((o, i) => (
              <div key={i} className="variant-option">
                <label className="field">
                  Option name
                  <input
                    value={o.name}
                    maxLength={30}
                    placeholder={i === 0 ? "Size" : i === 1 ? "Colour" : "Material"}
                    onChange={(e) =>
                      setOptions(options.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                    }
                  />
                </label>
                <label className="field">
                  Values, separated by commas
                  <input
                    value={o.values}
                    placeholder={i === 0 ? "S, M, L, XL" : "Black, White"}
                    onChange={(e) =>
                      setOptions(options.map((x, j) => (j === i ? { ...x, values: e.target.value } : x)))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove option ${o.name || i + 1}`}
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                className="button secondary small"
                onClick={() => setOptions([...options, { name: "", values: "" }])}
              >
                <Plus size={16} /> Add another option
              </button>
            )}
          </div>
          {duplicateName && (
            <p className="field-error" role="alert">
              Two options have the same name. Give each option a different name.
            </p>
          )}
          {tooMany && (
            <p className="field-error" role="alert">
              These options make {combos.length} combinations. A product can have up
              to {MAX_VARIANTS}; remove some values.
            </p>
          )}
          {!!variants.length && !duplicateName && (
            <div className="variant-table" role="table" aria-label="Variants">
              <div className="variant-row head" role="row">
                <span role="columnheader">Variant</span>
                <span role="columnheader">SKU</span>
                <span role="columnheader">Price (NGN)</span>
                <span role="columnheader">Stock</span>
                <span role="columnheader">Image</span>
              </div>
              {variants.map((v) => {
                const label = parsed.map((o) => v.options[o.name]).join(" / ");
                return (
                  <div className="variant-row" role="row" key={v.id}>
                    <b role="cell">{label}</b>
                    <input
                      role="cell"
                      aria-label={`SKU for ${label}`}
                      value={v.sku}
                      maxLength={64}
                      onChange={(e) => update(v.id, { sku: e.target.value })}
                    />
                    <input
                      role="cell"
                      aria-label={`Price for ${label}`}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={(basePrice / 100).toString()}
                      value={v.price === undefined ? "" : v.price / 100}
                      onChange={(e) =>
                        update(v.id, {
                          price:
                            e.target.value === ""
                              ? undefined
                              : Math.max(0, Math.round(Number(e.target.value) * 100)),
                        })
                      }
                    />
                    <input
                      role="cell"
                      aria-label={`Stock for ${label}`}
                      type="number"
                      min={0}
                      step={1}
                      value={v.stock}
                      onChange={(e) =>
                        update(v.id, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                      }
                    />
                    <details role="cell" className="variant-image">
                      <summary>
                        {v.image ? <img src={v.image} alt="" width={32} height={32} /> : "Add"}
                      </summary>
                      <ImageField
                        label={`Image for ${label}`}
                        image={v.image}
                        endpoint={mediaEndpoint}
                        onChange={(p) => update(v.id, { image: p.image || undefined })}
                      />
                    </details>
                  </div>
                );
              })}
              <p className="field-hint">
                Leave the price empty to use the product price. Total stock:{" "}
                {variants.reduce((s, v) => s + v.stock, 0)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
