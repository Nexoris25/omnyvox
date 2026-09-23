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
      insertEmbed: (attrs: { src: string; kind: "iframe" | "file" }) => ReturnType;
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

/** An allow-listed YouTube, Vimeo or Cloudinary video. Framed players use an
 * iframe; Cloudinary file URLs play in a native <video>. No arbitrary HTML. */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: "" },
      kind: { default: "iframe" },
    };
  },
  parseHTML() {
    return [
      {
        tag: "div.rich-embed",
        getAttrs: (el) => {
          const media = (el as HTMLElement).querySelector("iframe, video");
          if (!media) return false;
          return {
            src: media.getAttribute("src") || "",
            kind: media.tagName === "VIDEO" ? "file" : "iframe",
          };
        },
      },
    ];
  },
  renderHTML({ node }) {
    return [
      "div",
      { class: "rich-embed" },
      node.attrs.kind === "file"
        ? [
            "video",
            {
              src: node.attrs.src,
              controls: "true",
              preload: "metadata",
              playsinline: "true",
              title: "Embedded video",
            },
          ]
        : [
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
