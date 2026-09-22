"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useState } from "react";
export function MediaPicker({
  endpoint,
  onSelect,
}: {
  endpoint: string;
  onSelect: (url: string) => void;
}) {
  const [items, setItems] = useState<{ id: string; alt: string }[]>([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  async function load() {
    try {
      const r = await fetch(endpoint);
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setItems(b);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="media-picker">
      <button
        type="button"
        className="button secondary"
        onClick={() => {
          setOpen(!open);
          load();
        }}
      >
        Choose or upload image
      </button>
      {open && (
        <div className="media-panel">
          <p role="status">{error}</p>
          <label className="field">
            Upload an image (up to 5 MB)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
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
                }
              }}
            />
          </label>
          <div className="media-choice-grid">
            {items.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => {
                  onSelect("/api/media/" + m.id);
                  setOpen(false);
                }}
              >
                <img
                  src={"/api/media/" + m.id}
                  alt={m.alt || "Library image"}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export function RichTextEditor({
  value,
  onChange,
  name,
  mediaEndpoint,
  label = "Content",
}: {
  value: string;
  onChange?: (html: string) => void;
  name?: string;
  mediaEndpoint?: string;
  label?: string;
}) {
  const [html, setHtml] = useState(value);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TableKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const h = editor.getHTML();
      setHtml(h);
      onChange?.(h);
    },
    editorProps: {
      attributes: {
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
        class: "rich-content",
      },
    },
  });
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      setHtml(value);
    }
  }, [value, editor]);
  const action = (title: string, run: () => void) => (
    <button type="button" onClick={run} title={title} aria-label={title}>
      {title}
    </button>
  );
  return (
    <div className="rich-editor">
      <span className="field-label">{label}</span>
      {editor && (
        <div
          className="rich-toolbar"
          role="toolbar"
          aria-label="Text formatting"
        >
          {action("Bold", () => editor.chain().focus().toggleBold().run())}
          {action("Italic", () => editor.chain().focus().toggleItalic().run())}
          {action("Underline", () =>
            editor.chain().focus().toggleUnderline().run(),
          )}
          {action("Heading 2", () =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
          )}
          {action("Heading 3", () =>
            editor.chain().focus().toggleHeading({ level: 3 }).run(),
          )}
          {action("Align left", () =>
            editor.chain().focus().setTextAlign("left").run(),
          )}
          {action("Align center", () =>
            editor.chain().focus().setTextAlign("center").run(),
          )}
          {action("Align right", () =>
            editor.chain().focus().setTextAlign("right").run(),
          )}
          {action("Bullets", () =>
            editor.chain().focus().toggleBulletList().run(),
          )}
          {action("Numbered list", () =>
            editor.chain().focus().toggleOrderedList().run(),
          )}
          {action("Quote", () =>
            editor.chain().focus().toggleBlockquote().run(),
          )}
          {action("Link", () => {
            const href = prompt(
              "Link URL (https://...)",
              editor.getAttributes("link").href || "https://",
            );
            if (href && /^https?:\/\//.test(href))
              editor.chain().focus().setLink({ href }).run();
          })}
          {action("Remove link", () =>
            editor.chain().focus().unsetLink().run(),
          )}
          {action("Table", () =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
          )}
          {editor.isActive("table") && (
            <>
              {action("Add row", () =>
                editor.chain().focus().addRowAfter().run(),
              )}
              {action("Add column", () =>
                editor.chain().focus().addColumnAfter().run(),
              )}
              {action("Delete row", () =>
                editor.chain().focus().deleteRow().run(),
              )}
              {action("Delete table", () =>
                editor.chain().focus().deleteTable().run(),
              )}
            </>
          )}
          {action("Undo", () => editor.chain().focus().undo().run())}
          {action("Redo", () => editor.chain().focus().redo().run())}
        </div>
      )}
      <EditorContent editor={editor} />
      {name && <input type="hidden" name={name} value={html} />}{" "}
      {mediaEndpoint && (
        <MediaPicker
          endpoint={mediaEndpoint}
          onSelect={(src) =>
            editor?.chain().focus().setImage({ src, alt: "", title: "" }).run()
          }
        />
      )}
    </div>
  );
}
