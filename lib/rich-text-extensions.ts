import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: () => ReturnType;
    };
    ctaButton: {
      insertCtaButton: (attrs: { href: string; label: string }) => ReturnType;
    };
    embed: {
      insertEmbed: (attrs: { src: string }) => ReturnType;
    };
  }
}

/** A short highlighted note box, distinct from a blockquote. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "div.callout" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "callout" }),
      0,
    ];
  },
  addCommands() {
    return {
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});

/** A standalone call-to-action link styled as a button. */
export const CtaButton = Node.create({
  name: "ctaButton",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      href: { default: "#" },
      label: { default: "Learn more" },
    };
  },
  parseHTML() {
    return [{ tag: "a.cta-button" }];
  },
  renderHTML({ node }) {
    return [
      "a",
      {
        href: node.attrs.href,
        class: "cta-button",
        contenteditable: "false",
      },
      node.attrs.label,
    ];
  },
  addCommands() {
    return {
      insertCtaButton:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs })
            .createParagraphNear()
            .run(),
    };
  },
});

/** An allow-listed YouTube/Vimeo embed. No arbitrary iframe HTML. */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  addAttributes() {
    return { src: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div.rich-embed iframe" }];
  },
  renderHTML({ node }) {
    return [
      "div",
      { class: "rich-embed" },
      [
        "iframe",
        {
          src: node.attrs.src,
          loading: "lazy",
          allowfullscreen: "true",
          frameborder: "0",
          title: "Embedded video",
        },
      ],
    ];
  },
  addCommands() {
    return {
      insertEmbed:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs })
            .createParagraphNear()
            .run(),
    };
  },
});

const YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/;

/** Turns a pasted YouTube/Vimeo URL into a safe embeddable URL, or null. */
export function embedSrcFor(input: string): string | null {
  const url = input.trim();
  const yt = url.match(YOUTUBE);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(VIMEO);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
