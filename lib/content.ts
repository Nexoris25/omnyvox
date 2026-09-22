import sanitizeHtml from "sanitize-html";
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
export function safeHtml(value: string) {
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
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: { ...attrs, rel: "noopener noreferrer" },
      }),
    },
    exclusiveFilter: (frame) =>
      frame.tag === "img" &&
      !/^\/(api\/media\/[a-f0-9-]+|marketing-[a-z-]+\.webp)$/.test(
        frame.attribs.src || "",
      ),
  });
}
export function plainText(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}
export const legalRecommendations: Record<
  string,
  { slug: string; title: string }[]
> = {
  general: [
    { slug: "privacy", title: "Privacy policy" },
    { slug: "terms", title: "Terms of service" },
  ],
  commerce: [
    { slug: "privacy", title: "Privacy policy" },
    { slug: "terms", title: "Terms of sale" },
    { slug: "refund", title: "Refund & returns policy" },
    { slug: "shipping", title: "Shipping & delivery policy" },
  ],
  services: [
    { slug: "privacy", title: "Privacy policy" },
    { slug: "terms", title: "Terms of service" },
    { slug: "cancellation", title: "Cancellation policy" },
  ],
  healthcare: [
    { slug: "privacy", title: "Privacy policy" },
    { slug: "terms", title: "Terms of use" },
    { slug: "medical-disclaimer", title: "Medical disclaimer" },
  ],
  education: [
    { slug: "privacy", title: "Privacy policy" },
    { slug: "terms", title: "Terms of enrolment" },
    { slug: "refund", title: "Refund & cancellation policy" },
  ],
};
