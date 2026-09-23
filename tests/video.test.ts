import test from "node:test";
import assert from "node:assert/strict";
import { parseVideoUrl, containsVideo, isAllowedVideoSrc } from "../lib/video";
import { safeHtml } from "../lib/content";
import { entitled, sectionSchema } from "../lib/model";

test("YouTube links become privacy-enhanced embeds", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
  ])
    assert.deepEqual(parseVideoUrl(url), {
      provider: "youtube",
      kind: "iframe",
      src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    });
});

test("Cloudinary file URLs play natively and player URLs are framed", () => {
  const file =
    "https://res.cloudinary.com/demo-co/video/upload/v1712/samples/promo.mp4";
  assert.deepEqual(parseVideoUrl(file), {
    provider: "cloudinary",
    kind: "file",
    src: file,
  });
  const player = parseVideoUrl(
    "https://player.cloudinary.com/embed/?cloud_name=demo-co&public_id=samples/promo&profile=cld-default",
  );
  assert.equal(player?.kind, "iframe");
  assert.equal(
    player?.src,
    "https://player.cloudinary.com/embed/?cloud_name=demo-co&public_id=samples%2Fpromo",
  );
  assert.ok(isAllowedVideoSrc(player!.src, "iframe"));
});

test("Untrusted or lookalike video links are rejected", () => {
  for (const url of [
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://evil.example/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
    "https://res.cloudinary.com/demo/image/upload/photo.jpg",
    "https://res.cloudinary.com/demo/video/upload/a.mp4\"onerror=alert(1)",
    "javascript:alert(1)",
    "https://player.cloudinary.com/embed/?cloud_name=<x>&public_id=a",
    "",
  ])
    assert.equal(parseVideoUrl(url), null, url);
});

test("Sanitiser keeps only allow-listed video and strips it when disabled", () => {
  const html =
    '<div class="rich-embed"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe></div>' +
    '<div class="rich-embed"><video src="https://res.cloudinary.com/demo/video/upload/a.mp4" controls></video></div>' +
    '<iframe src="https://www.youtube-nocookie.com/embed/x"></iframe>' +
    '<video src="https://evil.example/a.mp4"></video>';
  const allowed = safeHtml(html);
  assert.match(allowed, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.match(allowed, /res\.cloudinary\.com\/demo\/video\/upload\/a\.mp4/);
  assert.doesNotMatch(allowed, /embed\/x"/);
  assert.doesNotMatch(allowed, /evil\.example/);
  const stripped = safeHtml(html, { video: false });
  assert.doesNotMatch(stripped, /<(iframe|video)/);
});

test("Video is a Growth and Advanced entitlement", () => {
  assert.equal(entitled("basic", "video"), false);
  assert.equal(entitled("growth", "video"), true);
  assert.equal(entitled("advanced", "video"), true);
  assert.ok(containsVideo({ sections: [{ body: "", video: "x" }] }));
  assert.ok(containsVideo({ body: "<p>a</p><iframe></iframe>" }));
  assert.ok(!containsVideo({ body: "<p>video tips</p>", sections: [] }));
});

test("Section schema rejects unsupported video links", () => {
  const base = { id: "a", type: "text", title: "T", body: "" } as const;
  assert.ok(
    sectionSchema.safeParse({ ...base, video: "https://youtu.be/dQw4w9WgXcQ" })
      .success,
  );
  assert.ok(!sectionSchema.safeParse({ ...base, video: "https://x.test/v" }).success);
  assert.ok(sectionSchema.safeParse({ ...base, video: "" }).success);
});
