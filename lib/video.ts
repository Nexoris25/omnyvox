/**
 * Externally hosted video. Subscribers upload to YouTube, Vimeo or their own
 * Cloudinary account and paste the link; nothing is stored in plan storage.
 * Only these hosts are accepted so a pasted URL can never inject arbitrary
 * frames or scripts.
 */
export type VideoSource = {
  provider: "youtube" | "vimeo" | "cloudinary";
  /** "iframe" players are framed; "file" sources play in a native <video>. */
  kind: "iframe" | "file";
  src: string;
};

const YOUTUBE =
  /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,20})/;
const VIMEO = /^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d{4,12})/;
const CLOUDINARY_FILE =
  /^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]{1,64}\/video\/upload\/[\w\-/.,:%~]{1,400}$/i;
const CLOUDINARY_PLAYER = /^https:\/\/player\.cloudinary\.com\/embed\/\?/;

export const videoHelp =
  "Paste a YouTube, Vimeo or Cloudinary video link. The video is streamed from that service, so it does not use your plan storage.";

export function parseVideoUrl(input: string): VideoSource | null {
  const url = input.trim();
  if (!url || url.length > 500 || /[\s"'<>]/.test(url)) return null;
  const yt = url.match(YOUTUBE);
  if (yt)
    return {
      provider: "youtube",
      kind: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${yt[1]}`,
    };
  const vimeo = url.match(VIMEO);
  if (vimeo)
    return {
      provider: "vimeo",
      kind: "iframe",
      src: `https://player.vimeo.com/video/${vimeo[1]}`,
    };
  if (CLOUDINARY_FILE.test(url))
    return { provider: "cloudinary", kind: "file", src: url };
  if (CLOUDINARY_PLAYER.test(url)) {
    const params = new URL(url).searchParams;
    const cloud = params.get("cloud_name") || "";
    const id = params.get("public_id") || "";
    if (!/^[a-z0-9_-]{1,64}$/i.test(cloud) || !/^[\w\-/.]{1,300}$/.test(id))
      return null;
    return {
      provider: "cloudinary",
      kind: "iframe",
      src: `https://player.cloudinary.com/embed/?cloud_name=${encodeURIComponent(cloud)}&public_id=${encodeURIComponent(id)}`,
    };
  }
  return null;
}

const CANONICAL_IFRAME = [
  /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{6,20}$/,
  /^https:\/\/player\.vimeo\.com\/video\/\d{4,12}$/,
  /^https:\/\/player\.cloudinary\.com\/embed\/\?cloud_name=[\w-]{1,64}&public_id=[\w%.-]{1,400}$/,
];

/** Checks a stored embed src is one this module produced, so saved HTML is
 * re-validated at render time rather than trusted. */
export function isAllowedVideoSrc(src: string, kind: VideoSource["kind"]) {
  return kind === "file"
    ? CLOUDINARY_FILE.test(src)
    : CANONICAL_IFRAME.some((r) => r.test(src));
}

/** True when saved content embeds video, via a section video URL or an
 * iframe/video element in rich text. Used for server-side plan checks. */
export function containsVideo(content: {
  body?: string;
  sections?: { body: string; video?: string }[];
}) {
  const embedded = /<(iframe|video)\b/i;
  return (
    (!!content.body && embedded.test(content.body)) ||
    (content.sections || []).some(
      (s) => !!s.video || embedded.test(s.body),
    )
  );
}

export const videoUpgradeMessage =
  "Embedded videos are available on Growth and Advanced. Remove the video or upgrade your plan.";
