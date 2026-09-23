"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Link2Off,
  Table2,
  Rows3,
  Columns3,
  Trash2,
  Undo2,
  Redo2,
  Info,
  MousePointerClick,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Callout, CtaButton, Embed } from "@/lib/rich-text-extensions";
import { parseVideoUrl } from "@/lib/video";
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
function ToolbarButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rich-toolbar-btn"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
    >
      <Icon size={15} />
    </button>
  );
}
export function RichTextEditor({
  value,
  onChange,
  name,
  mediaEndpoint,
  label = "Content",
  allowVideo = true,
}: {
  value: string;
  onChange?: (html: string) => void;
  name?: string;
  mediaEndpoint?: string;
  label?: string;
  allowVideo?: boolean;
}) {
  const [html, setHtml] = useState(value);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TableKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Callout,
      CtaButton,
      Embed,
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
  return (
    <div className="rich-editor">
      <span className="field-label">{label}</span>
      {editor && (
        <div
          className="rich-toolbar"
          role="toolbar"
          aria-label="Text formatting"
        >
          <div className="rich-toolbar-group">
            <ToolbarButton
              icon={Undo2}
              label="Undo"
              onClick={() => editor.chain().focus().undo().run()}
            />
            <ToolbarButton
              icon={Redo2}
              label="Redo"
              onClick={() => editor.chain().focus().redo().run()}
            />
          </div>
          <div className="rich-toolbar-group">
            <ToolbarButton
              icon={Bold}
              label="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              icon={Italic}
              label="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <ToolbarButton
              icon={Underline}
              label="Underline"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
            <ToolbarButton
              icon={Strikethrough}
              label="Strikethrough"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
          </div>
          <div className="rich-toolbar-group">
            <ToolbarButton
              icon={Heading2}
              label="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            />
            <ToolbarButton
              icon={Heading3}
              label="Heading 3"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            />
            <ToolbarButton
              icon={Heading4}
              label="Heading 4"
              active={editor.isActive("heading", { level: 4 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
            />
          </div>
          <div className="rich-toolbar-group">
            <ToolbarButton
              icon={AlignLeft}
              label="Align left"
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            />
            <ToolbarButton
              icon={AlignCenter}
              label="Align center"
              active={editor.isActive({ textAlign: "center" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
            />
            <ToolbarButton
              icon={AlignRight}
              label="Align right"
              active={editor.isActive({ textAlign: "right" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("right").run()
              }
            />
          </div>
          <div className="rich-toolbar-group">
            <ToolbarButton
              icon={List}
              label="Bulleted list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              icon={ListOrdered}
              label="Numbered list"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
            <ToolbarButton
              icon={Quote}
              label="Quote"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
            <ToolbarButton
              icon={Info}
              label="Callout"
              active={editor.isActive("callout")}
              onClick={() => editor.chain().focus().toggleCallout().run()}
            />
            <ToolbarButton
              icon={Minus}
              label="Divider"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            />
          </div>
          <div className="rich-toolbar-group">
            <ToolbarButton
              icon={Link2}
              label="Link"
              active={editor.isActive("link")}
              onClick={() => {
                const href = prompt(
                  "Link URL (https://...)",
                  editor.getAttributes("link").href || "https://",
                );
                if (href && /^https?:\/\//.test(href))
                  editor.chain().focus().setLink({ href }).run();
              }}
            />
            <ToolbarButton
              icon={Link2Off}
              label="Remove link"
              onClick={() => editor.chain().focus().unsetLink().run()}
            />
            <ToolbarButton
              icon={MousePointerClick}
              label="Insert button"
              onClick={() => {
                const href = prompt("Button link (https://...)", "https://");
                if (!href || !/^https?:\/\//.test(href)) return;
                const buttonLabel =
                  prompt("Button text", "Learn more") || "Learn more";
                editor
                  .chain()
                  .focus()
                  .insertCtaButton({ href, label: buttonLabel })
                  .run();
              }}
            />
            {allowVideo && (
              <ToolbarButton
                icon={Video}
                label="Embed video"
                onClick={() => {
                  const url = prompt(
                    "Paste a YouTube, Vimeo or Cloudinary video link",
                  );
                  if (!url) return;
                  const video = parseVideoUrl(url);
                  if (!video) {
                    alert(
                      "That link isn't supported. Use a YouTube, Vimeo or Cloudinary video link.",
                    );
                    return;
                  }
                  editor
                    .chain()
                    .focus()
                    .insertEmbed({ src: video.src, kind: video.kind })
                    .run();
                }}
              />
            )}
          </div>
          <div className="rich-toolbar-group">
            <ToolbarButton
              icon={Table2}
              label="Insert table"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            />
            {editor.isActive("table") && (
              <>
                <ToolbarButton
                  icon={Rows3}
                  label="Add row"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                />
                <ToolbarButton
                  icon={Columns3}
                  label="Add column"
                  onClick={() =>
                    editor.chain().focus().addColumnAfter().run()
                  }
                />
                <ToolbarButton
                  icon={Trash2}
                  label="Delete table"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                />
              </>
            )}
          </div>
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
