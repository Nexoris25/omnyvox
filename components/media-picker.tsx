"use client";
import { useEffect, useState } from "react";
import { ImagePlus, Upload, X, Trash2 } from "lucide-react";
import { sampleImages } from "@/lib/sample-images";
import { isSampleImage } from "@/lib/model";

type LibraryItem = { id: string; alt: string };

/** Choose an image from the site's media library (with upload) or from the
 * bundled sample artwork. Works without an endpoint (demo) using samples. */
export function MediaPicker({
  endpoint,
  onSelect,
  label = "Choose or upload image",
  industry,
  iconOnly = false,
}: {
  endpoint?: string;
  onSelect: (url: string, alt?: string) => void;
  label?: string;
  industry?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState<"library" | "samples">(
      endpoint ? "library" : "samples",
    ),
    [items, setItems] = useState<LibraryItem[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open || !endpoint) return;
    fetch(endpoint)
      .then((r) => r.json().then((b) => (r.ok ? b : Promise.reject(b.error))))
      .then(setItems)
      .catch((e) => setError(String(e)));
  }, [open, endpoint]);
  async function upload(file: File) {
    if (!endpoint) return;
    setBusy(true);
    setError("");
    const f = new FormData();
    f.set("file", file);
    try {
      const r = await fetch(endpoint, { method: "POST", body: f });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      onSelect(b.url);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const groups = [...sampleImages].sort(
    (a, b) => Number(b.industry === industry) - Number(a.industry === industry),
  );
  return (
    <div className={"media-picker" + (iconOnly ? " is-icon" : "")}>
      <button
        type="button"
        className={iconOnly ? "rich-toolbar-btn" : "button secondary small"}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
      >
        <ImagePlus size={15} /> {!iconOnly && label}
      </button>
      {open && (
        <div className="media-panel" role="dialog" aria-label="Choose an image">
          <div className="media-panel-head">
            <div className="tabs" role="tablist">
              {endpoint && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "library"}
                  className={tab === "library" ? "active" : ""}
                  onClick={() => setTab("library")}
                >
                  Your library
                </button>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={tab === "samples"}
                className={tab === "samples" ? "active" : ""}
                onClick={() => setTab("samples")}
              >
                Sample images
              </button>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          {tab === "library" && endpoint ? (
            <>
              <label className="media-upload">
                <Upload size={18} />
                <span>
                  <b>{busy ? "Uploading…" : "Upload an image"}</b>
                  <small>JPEG, PNG or WebP, up to 5 MB</small>
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                  }}
                />
              </label>
              <div className="media-choice-grid">
                {items.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      onSelect("/api/media/" + m.id, m.alt);
                      setOpen(false);
                    }}
                  >
                    <img
                      src={"/api/media/" + m.id}
                      alt={m.alt || "Library image"}
                    />
                  </button>
                ))}
                {!items.length && (
                  <p className="muted">Your uploaded images appear here.</p>
                )}
              </div>
            </>
          ) : (
            <div className="sample-groups">
              <p className="muted" style={{ fontSize: 12 }}>
                Placeholder artwork to design with. Replace it with your own
                photographs before publishing.
              </p>
              {groups.map((g) => (
                <div key={g.industry}>
                  <h4>{g.industry[0].toUpperCase() + g.industry.slice(1)}</h4>
                  <div className="media-choice-grid">
                    {g.images.map((img) => (
                      <button
                        type="button"
                        key={img.src}
                        title={img.label}
                        onClick={() => {
                          onSelect(img.src, `${img.label} — sample image`);
                          setOpen(false);
                        }}
                      >
                        <img src={img.src} alt={img.label} loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Thumbnail + replace/remove + alt text: one control for any image slot. */
export function ImageField({
  image,
  alt,
  onChange,
  endpoint,
  industry,
  label = "Image",
}: {
  image?: string;
  alt?: string;
  onChange: (patch: { image: string; imageAlt: string }) => void;
  endpoint?: string;
  industry?: string;
  label?: string;
}) {
  const sample = isSampleImage(image);
  return (
    <div className="image-field">
      <span className="field-label">{label}</span>
      {image ? (
        <div className="image-field-row">
          <div className="image-field-thumb">
            <img src={image} alt="" />
            {sample && <span className="sample-badge">Sample</span>}
          </div>
          <div className="image-field-body">
            <label className="field">
              Image description (alt text)
              <input
                value={alt || ""}
                maxLength={300}
                placeholder="Describe what the image shows"
                aria-invalid={!sample && !alt}
                onChange={(e) =>
                  onChange({ image: image, imageAlt: e.target.value })
                }
              />
            </label>
            {!sample && !alt && (
              <p className="field-hint">
                Add a short description so screen readers and search engines
                understand the image.
              </p>
            )}
            {sample && (
              <p className="field-hint">
                Sample artwork — replace it with your own photograph.
              </p>
            )}
            <div className="image-field-actions">
              <MediaPicker
                endpoint={endpoint}
                industry={industry}
                label="Replace"
                onSelect={(src, a) =>
                  onChange({ image: src, imageAlt: a || "" })
                }
              />
              <button
                type="button"
                className="button secondary small"
                onClick={() => onChange({ image: "", imageAlt: "" })}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <MediaPicker
          endpoint={endpoint}
          industry={industry}
          label="Add image"
          onSelect={(src, a) => onChange({ image: src, imageAlt: a || "" })}
        />
      )}
    </div>
  );
}
