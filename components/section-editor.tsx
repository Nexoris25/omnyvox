"use client";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CircleCheck,
} from "lucide-react";
import {
  Section,
  sectionTypes,
  sectionTypeLabels,
} from "@/lib/model";
import { RichTextEditor } from "./rich-text-editor";
import { ImageField } from "./media-picker";
import { parseVideoUrl, videoHelp } from "@/lib/video";

type Item = NonNullable<Section["items"]>[number];
const ITEM_TYPES = ["services", "features", "steps", "team", "gallery"];
const MEDIA_TYPES = ["hero", "text"];
const itemNoun: Record<string, string> = {
  services: "card",
  features: "highlight",
  steps: "step",
  team: "person",
  gallery: "image",
};
const providerName = { youtube: "YouTube", vimeo: "Vimeo", cloudinary: "Cloudinary" };

function starter(type: Section["type"]): Section {
  const blank = (title: string): Item => ({ title, text: "" });
  return {
    id: crypto.randomUUID(),
    type,
    title: sectionTypeLabels[type],
    body: "",
    visible: true,
    ...(ITEM_TYPES.includes(type)
      ? {
          items: [1, 2, 3].map((n) =>
            blank(type === "team" ? "Full name" : `${itemNoun[type][0].toUpperCase()}${itemNoun[type].slice(1)} ${n}`),
          ),
        }
      : {}),
    ...(type === "faq" ? { faqs: [{ question: "Your question", answer: "" }] } : {}),
    ...(type === "cta" ? { ctas: [{ label: "Get in touch", href: "#contact" }] } : {}),
    ...(type === "hero" || type === "text" ? { layout: "row" as const } : {}),
  };
}

export function SectionEditor({
  sections,
  onChange,
  mediaEndpoint,
  allowVideo = false,
  industry,
  allowed,
}: {
  /** Section types the website's template supports; all when omitted. */
  allowed?: readonly string[];
  sections: Section[];
  onChange: (sections: Section[]) => void;
  mediaEndpoint?: string;
  allowVideo?: boolean;
  industry?: string;
}) {
  /** Any content edit counts as the owner reviewing the starter copy. */
  function change(id: string, patch: Partial<Section>) {
    onChange(
      sections.map((s) =>
        s.id === id
          ? { ...s, ...patch, ...("visible" in patch ? {} : { sample: false }) }
          : s,
      ),
    );
  }
  function move<T>(list: T[], from: number, to: number) {
    const next = [...list];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  }
  return (
    <div className="editor-sections">
      <p className="editor-count">
        {sections.length} / 15 sections
        {sections.some((s) => s.sample && s.visible) && (
          <span className="sample-badge">
            {sections.filter((s) => s.sample && s.visible).length} to review
          </span>
        )}
      </p>
      {sections.map((s, i) => {
        const items = s.items || [];
        const setItems = (next: Item[]) => change(s.id, { items: next });
        const setItem = (j: number, patch: Partial<Item>) =>
          setItems(items.map((it, k) => (k === j ? { ...it, ...patch } : it)));
        const video = s.video ? parseVideoUrl(s.video) : null;
        return (
          <details className="section-editor" key={s.id} open={i === 0}>
            <summary>
              <span className="section-editor-title">
                <small>{sectionTypeLabels[s.type]}</small>
                {s.title || "Untitled section"}
              </span>
              {!s.visible && <span className="state-badge">Hidden</span>}
              {s.sample && <span className="sample-badge">Sample</span>}
            </summary>
            {s.sample && (
              <div className="sample-review">
                <p>
                  This is starter content. Replace it with accurate details
                  about your business — publishing is paused until you do.
                </p>
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => change(s.id, {})}
                >
                  <CircleCheck size={14} /> Mark as reviewed
                </button>
              </div>
            )}
            {s.type !== "cta" && (
              <label className="field">
                Label above heading
                <input
                  value={s.eyebrow || ""}
                  maxLength={60}
                  placeholder="e.g. Our services"
                  onChange={(e) => change(s.id, { eyebrow: e.target.value })}
                />
              </label>
            )}
            <label className="field">
              Heading
              <input
                value={s.title}
                maxLength={160}
                onChange={(e) => change(s.id, { title: e.target.value })}
              />
            </label>
            <RichTextEditor
              label={ITEM_TYPES.includes(s.type) ? "Introduction" : "Text"}
              value={s.body}
              onChange={(body) => {
                if (body !== s.body) change(s.id, { body });
              }}
              mediaEndpoint={mediaEndpoint}
              allowVideo={allowVideo}
            />

            {ITEM_TYPES.includes(s.type) && (
              <div className="items-editor">
                <span className="field-label">
                  {itemNoun[s.type][0].toUpperCase() + itemNoun[s.type].slice(1)}s
                </span>
                {items.map((item, j) => (
                  <div className="item-editor" key={j}>
                    <div className="item-editor-head">
                      <b>
                        {j + 1}. {item.title || `Untitled ${itemNoun[s.type]}`}
                      </b>
                      <div className="icon-row">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={j === 0}
                          onClick={() => setItems(move(items, j, j - 1))}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={j === items.length - 1}
                          onClick={() => setItems(move(items, j, j + 1))}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${itemNoun[s.type]}`}
                          onClick={() => setItems(items.filter((_, k) => k !== j))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <label className="field">
                      {s.type === "team" ? "Name" : "Title"}
                      <input
                        value={item.title}
                        maxLength={120}
                        onChange={(e) => setItem(j, { title: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      {s.type === "team" ? "Role" : "Description"}
                      <textarea
                        rows={s.type === "team" ? 1 : 2}
                        value={item.text}
                        maxLength={600}
                        onChange={(e) => setItem(j, { text: e.target.value })}
                      />
                    </label>
                    {s.type !== "features" && s.type !== "steps" && (
                      <>
                        <label className="field">
                          Link (optional)
                          <input
                            value={item.href || ""}
                            placeholder="/services or https://…"
                            onChange={(e) => setItem(j, { href: e.target.value })}
                          />
                        </label>
                        <ImageField
                          label={s.type === "team" ? "Portrait" : "Image"}
                          image={item.image}
                          alt={item.imageAlt}
                          endpoint={mediaEndpoint}
                          industry={industry}
                          onChange={(p) => setItem(j, p)}
                        />
                      </>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="button secondary small"
                  disabled={items.length >= 12}
                  onClick={() =>
                    setItems([
                      ...items,
                      { title: s.type === "team" ? "Full name" : "", text: "" },
                    ])
                  }
                >
                  <Plus size={14} /> Add {itemNoun[s.type]}
                </button>
              </div>
            )}

            {MEDIA_TYPES.includes(s.type) && (
              <>
                <label className="field">
                  Layout
                  <select
                    value={s.layout || "column"}
                    onChange={(e) =>
                      change(s.id, { layout: e.target.value as Section["layout"] })
                    }
                  >
                    <option value="row">Text left, media right</option>
                    <option value="row-reverse">Media left, text right</option>
                    <option value="column">Text above media</option>
                    <option value="column-reverse">Media above text</option>
                  </select>
                </label>
                <ImageField
                  image={s.image}
                  alt={s.imageAlt}
                  endpoint={mediaEndpoint}
                  industry={industry}
                  onChange={(p) => change(s.id, p)}
                />
                {allowVideo ? (
                  <div className="video-field">
                    <label className="field">
                      Video URL (optional)
                      <input
                        type="url"
                        inputMode="url"
                        value={s.video || ""}
                        placeholder="https://www.youtube.com/watch?v=… or https://res.cloudinary.com/…"
                        aria-invalid={!!s.video && !video}
                        onChange={(e) =>
                          change(s.id, { video: e.target.value.trim() })
                        }
                      />
                      <small>{videoHelp} A video replaces this section’s image.</small>
                    </label>
                    {s.video &&
                      (video ? (
                        <>
                          <p className="field-ok">
                            ✓ {providerName[video.provider]} video will be
                            embedded.
                          </p>
                          <label className="field">
                            Video description (for screen readers)
                            <input
                              value={s.videoTitle || ""}
                              maxLength={160}
                              onChange={(e) =>
                                change(s.id, { videoTitle: e.target.value })
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className="button secondary small"
                            onClick={() =>
                              change(s.id, { video: "", videoTitle: "" })
                            }
                          >
                            Remove video
                          </button>
                        </>
                      ) : (
                        <p className="field-error" role="alert">
                          Use a YouTube, Vimeo or Cloudinary video link.
                        </p>
                      ))}
                  </div>
                ) : s.video ? (
                  <div className="video-locked" role="alert">
                    <p style={{ margin: "0 0 8px" }}>
                      This section has a video that isn’t shown on your
                      current plan. Remove it to save changes, or upgrade to
                      Growth to show it again.
                    </p>
                    <button
                      type="button"
                      onClick={() => change(s.id, { video: "", videoTitle: "" })}
                    >
                      Remove video
                    </button>
                  </div>
                ) : (
                  <p className="muted video-locked">
                    Embedded YouTube and Cloudinary videos are available on
                    Growth and Advanced.
                  </p>
                )}
              </>
            )}

            {s.type === "contact" && (
              <p className="field-hint">
                Phone, address, opening hours and WhatsApp are taken from
                Business information and Brand settings, so they stay the same
                everywhere on your site.
              </p>
            )}

            {s.type === "faq" && (
              <div className="items-editor">
                <span className="field-label">Questions</span>
                {(s.faqs || []).map((f, j) => (
                  <div className="item-editor" key={j}>
                    <label className="field">
                      Question
                      <input
                        value={f.question}
                        onChange={(e) =>
                          change(s.id, {
                            faqs: s.faqs!.map((v, k) =>
                              k === j ? { ...v, question: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Answer
                      <textarea
                        rows={2}
                        value={f.answer}
                        onChange={(e) =>
                          change(s.id, {
                            faqs: s.faqs!.map((v, k) =>
                              k === j ? { ...v, answer: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="button secondary small"
                      onClick={() =>
                        change(s.id, { faqs: s.faqs!.filter((_, k) => k !== j) })
                      }
                    >
                      <Trash2 size={14} /> Remove question
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button secondary small"
                  disabled={(s.faqs?.length || 0) >= 30}
                  onClick={() =>
                    change(s.id, {
                      faqs: [...(s.faqs || []), { question: "", answer: "" }],
                    })
                  }
                >
                  <Plus size={14} /> Add question
                </button>
              </div>
            )}

            {s.type !== "contact" && (
              <div className="items-editor">
                <span className="field-label">Buttons</span>
                {(s.ctas || []).map((c, j) => (
                  <div className="form-grid cta-row" key={j}>
                    <label className="field">
                      Label
                      <input
                        value={c.label}
                        maxLength={60}
                        onChange={(e) =>
                          change(s.id, {
                            ctas: s.ctas!.map((v, k) =>
                              k === j ? { ...v, label: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Links to
                      <input
                        value={c.href}
                        placeholder="/contact, #services or https://…"
                        onChange={(e) =>
                          change(s.id, {
                            ctas: s.ctas!.map((v, k) =>
                              k === j ? { ...v, href: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Remove button"
                      onClick={() =>
                        change(s.id, { ctas: s.ctas!.filter((_, k) => k !== j) })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button secondary small"
                  disabled={(s.ctas?.length || 0) >= 3}
                  onClick={() =>
                    change(s.id, {
                      ctas: [
                        ...(s.ctas || []),
                        { label: "Get in touch", href: "/contact" },
                      ],
                    })
                  }
                >
                  <Plus size={14} /> Add button
                </button>
              </div>
            )}

            <div className="section-tools">
              <button
                type="button"
                onClick={() => change(s.id, { visible: !s.visible })}
              >
                {s.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                {s.visible ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                disabled={sections.length >= 15}
                onClick={() =>
                  onChange([
                    ...sections.slice(0, i + 1),
                    { ...s, id: crypto.randomUUID() },
                    ...sections.slice(i + 1),
                  ])
                }
              >
                <Copy size={14} /> Duplicate
              </button>
              <button
                type="button"
                disabled={i === 0}
                onClick={() => onChange(move(sections, i, i - 1))}
              >
                <ArrowUp size={14} /> Up
              </button>
              <button
                type="button"
                disabled={i === sections.length - 1}
                onClick={() => onChange(move(sections, i, i + 1))}
              >
                <ArrowDown size={14} /> Down
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  if (confirm(`Remove the “${s.title || sectionTypeLabels[s.type]}” section?`))
                    onChange(sections.filter((v) => v.id !== s.id));
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </details>
        );
      })}
      <label className="field add-section">
        Add a section
        <select
          value=""
          disabled={sections.length >= 15}
          onChange={(e) => {
            const type = e.target.value as Section["type"];
            if (type && sections.length < 15) onChange([...sections, starter(type)]);
          }}
        >
          <option value="">Choose a section type…</option>
          {sectionTypes.filter((t) => !allowed || allowed.includes(t)).map((t) => (
            <option key={t} value={t}>
              {sectionTypeLabels[t]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
