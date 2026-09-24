import { webpSource } from "./brand-assets";
import sanitizeHtml from "sanitize-html";
import { isAllowedVideoSrc } from "./video";
export function referencedMediaIds(value: unknown): string[] {
  const ids = new Set<string>();
  function walk(v: unknown) {
    if (typeof v === "string") {
      for (const text of [v, safeHtml(v)])
        for (const m of text.matchAll(/\/api\/media\/([a-f0-9-]{36})/g))
          ids.add(m[1]);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  }
  walk(value);
  return [...ids];
}
export function safeHtml(value: string, { video = true } = {}) {
  value ??= "";
  const input = /<\/?[a-z][\s\S]*>/i.test(value)
    ? value
    : `<p>${value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>")}</p>`;
  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "hr",
      "br",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "pre",
      "code",
      "div",
      "iframe",
      "video",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "title"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      div: ["class"],
      iframe: ["src", "loading", "allowfullscreen", "frameborder", "title"],
      video: ["src", "controls", "preload", "playsinline", "title"],
    },
    allowedClasses: {
      a: ["cta-button"],
      div: ["callout", "rich-embed"],
    },
    allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    allowedIframeHostnames: [
      "www.youtube-nocookie.com",
      "player.vimeo.com",
      "player.cloudinary.com",
    ],
    allowIframeRelativeUrls: false,
    transformTags: {
      img: (_tag, attrs) => ({
        tagName: "img",
        attribs: { ...attrs, src: webpSource(attrs.src || "") },
      }),
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: { ...attrs, rel: "noopener noreferrer" },
      }),
    },
    exclusiveFilter: (frame) =>
      (frame.tag === "img" &&
        !/^\/(api\/media\/[a-f0-9-]+|marketing-[a-z0-9-]+\.webp|samples\/[a-z0-9-]+\.(?:svg|webp))$/.test(
          frame.attribs.src || "",
        )) ||
      ((frame.tag === "iframe" || frame.tag === "video") &&
        (!video ||
          !isAllowedVideoSrc(
            frame.attribs.src || "",
            frame.tag === "video" ? "file" : "iframe",
          ))),
  });
}
export function plainText(value: string | undefined) {
  return sanitizeHtml(value || "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}
