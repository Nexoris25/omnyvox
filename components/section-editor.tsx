"use client";
import { Section } from "@/lib/model";
import { RichTextEditor, MediaPicker } from "./rich-text-editor";
export function SectionEditor({
  sections,
  onChange,
  mediaEndpoint,
}: {
  sections: Section[];
  onChange: (sections: Section[]) => void;
  mediaEndpoint?: string;
}) {
  function change(id: string, patch: Partial<Section>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  return (
    <div className="editor-sections">
      <p>{sections.length} / 15 sections</p>
      {sections.map((s, i) => (
        <details className="section-editor" key={s.id} open={i === 0}>
          <summary>
            {i + 1}. {s.title || s.type}
          </summary>
          <label className="field">
            Heading
            <input
              value={s.title}
              maxLength={160}
              onChange={(e) => change(s.id, { title: e.target.value })}
            />
          </label>
          <RichTextEditor
            value={s.body}
            onChange={(body) => change(s.id, { body })}
            mediaEndpoint={mediaEndpoint}
          />
          <label className="field">
            Image and text layout
            <select
              value={s.layout || "column"}
              onChange={(e) =>
                change(s.id, { layout: e.target.value as Section["layout"] })
              }
            >
              <option value="column">Text above image</option>
              <option value="column-reverse">Image above text</option>
              <option value="row">Text left, image right</option>
              <option value="row-reverse">Image left, text right</option>
            </select>
          </label>
          {mediaEndpoint && (
            <MediaPicker
              endpoint={mediaEndpoint}
              onSelect={(image) => change(s.id, { image })}
            />
          )}
          {s.image && (
            <>
              <img
                src={s.image}
                alt={s.imageAlt || ""}
                className="editor-thumb"
              />
              <label className="field">
                Image description
                <input
                  value={s.imageAlt || ""}
                  onChange={(e) => change(s.id, { imageAlt: e.target.value })}
                />
              </label>
              <button type="button" onClick={() => change(s.id, { image: "" })}>
                Remove image
              </button>
            </>
          )}
          {(s.ctas || []).map((c, j) => (
            <div className="form-grid" key={j}>
              <label className="field">
                Button label
                <input
                  value={c.label}
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
                Button destination
                <input
                  value={c.href}
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
                onClick={() =>
                  change(s.id, { ctas: s.ctas!.filter((_, k) => k !== j) })
                }
              >
                Remove button
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={(s.ctas?.length || 0) >= 3}
            onClick={() =>
              change(s.id, {
                ctas: [
                  ...(s.ctas || []),
                  { label: "Get in touch", href: "#contact" },
                ],
              })
            }
          >
            Add CTA button
          </button>
          {s.type === "faq" && (
            <>
              {(s.faqs || []).map((f, j) => (
                <div key={j}>
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
                    onClick={() =>
                      change(s.id, { faqs: s.faqs!.filter((_, k) => k !== j) })
                    }
                  >
                    Remove question
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={(s.faqs?.length || 0) >= 30}
                onClick={() =>
                  change(s.id, {
                    faqs: [
                      ...(s.faqs || []),
                      { question: "Your question", answer: "" },
                    ],
                  })
                }
              >
                Add question
              </button>
            </>
          )}
          <div className="section-tools">
            <button
              type="button"
              onClick={() => change(s.id, { visible: !s.visible })}
            >
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
              Duplicate
            </button>
            <button
              type="button"
              disabled={i === 0}
              onClick={() => {
                const a = [...sections];
                [a[i - 1], a[i]] = [a[i], a[i - 1]];
                onChange(a);
              }}
            >
              Move up
            </button>
            <button
              type="button"
              onClick={() => onChange(sections.filter((v) => v.id !== s.id))}
            >
              Remove
            </button>
          </div>
        </details>
      ))}
      <label className="field">
        Add a section
        <select
          value=""
          disabled={sections.length >= 15}
          onChange={(e) => {
            if (e.target.value && sections.length < 15)
              onChange([
                ...sections,
                {
                  id: crypto.randomUUID(),
                  type: e.target.value as Section["type"],
                  title: "Your new section",
                  body: "",
                  visible: true,
                },
              ]);
          }}
        >
          <option value="">Choose a section type</option>
          {["hero", "text", "services", "cta", "faq", "insights"].map((t) => (
            <option key={t} value={t}>
              {t === "cta" ? "Call to action" : t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
