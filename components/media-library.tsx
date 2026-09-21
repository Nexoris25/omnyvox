"use client";
import { useEffect, useState } from "react";
type Media = { id: string; alt: string; size: number };
export function MediaLibrary({ site, demo }: { site: string; demo: boolean }) {
  const [media, setMedia] = useState<Media[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    if (demo) return;
    const r = await fetch(`/api/sites/${site}/media`);
    const b = await r.json();
    if (r.ok) setMedia(b);
    else setMessage(b.error);
  }
  useEffect(() => {
    load();
  }, [site, demo]);
  return (
    <div className="stack">
      <section className="panel panel-body">
        <h2 style={{ fontSize: 22 }}>Your images. Ready for the web.</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Images are resized, compressed, and saved as WebP. Maximum file size:
          5 MB.
        </p>
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (demo) {
              setMessage("Create an account to upload your images.");
              return;
            }
            const form = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const r = await fetch(`/api/sites/${site}/media`, {
                method: "POST",
                body: form,
              });
              const b = await r.json();
              if (!r.ok) throw new Error(b.error);
              await load();
              setMessage("Your image is ready to use.");
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            <label className="field">
              Image
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
              />
            </label>
            <label className="field">
              Image description
              <input
                name="alt"
                maxLength={300}
                required
                placeholder="Describe the image for visitors"
              />
            </label>
          </div>
          <button disabled={busy} className="button" style={{ marginTop: 22 }}>
            Upload image
          </button>
        </form>
      </section>
      <div className="template-grid">
        {media.map((m) => (
          <article className="panel panel-body" key={m.id}>
            <img
              src={`/api/media/${m.id}`}
              alt={m.alt}
              width={400}
              height={280}
            />
            <p style={{ fontSize: 13, marginTop: 15 }}>{m.alt}</p>
            <small className="muted">
              WebP · {Math.ceil(m.size / 1024)} KB
            </small>
            <label className="field" style={{ marginTop: 12 }}>
              Image path
              <input
                readOnly
                value={`/api/media/${m.id}`}
                onFocus={(e) => e.currentTarget.select()}
              />
              <small>Use this path in your page or product image field.</small>
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}
