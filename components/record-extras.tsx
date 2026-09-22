"use client";
import { useEffect, useState } from "react";
import { Section } from "@/lib/model";
import { SectionEditor } from "./section-editor";
import { MediaPicker } from "./rich-text-editor";
export function RecordExtras({
  siteId,
  kind,
  initial = {},
  demo = false,
}: {
  siteId: string;
  kind: string;
  initial?: {
    sections?: Section[];
    indexing?: { index: boolean; follow: boolean };
    authorId?: string;
    image?: string;
    imageAlt?: string;
  };
  demo?: boolean;
}) {
  const [sections, setSections] = useState(initial.sections || []),
    [image, setImage] = useState(initial.image || ""),
    [authors, setAuthors] = useState<{ id: string; data: { title: string } }[]>(
      [],
    ),
    [categories, setCategories] = useState<
      { id: string; data: { title: string; slug: string } }[]
    >([]);
  useEffect(() => {
    if (!demo)
      fetch(`/api/sites/${siteId}/categories`)
        .then((r) => r.json())
        .then((b) => {
          if (Array.isArray(b)) setCategories(b);
        });
    if (!demo && kind === "articles")
      fetch(`/api/sites/${siteId}/authors`)
        .then((r) => r.json())
        .then((b) => {
          if (Array.isArray(b)) setAuthors(b);
        });
  }, [siteId, kind, demo]);
  return (
    <div className="full">
      <datalist id="site-category-options">
        {categories.map((c) => (
          <option key={c.id} value={c.data.slug}>
            {c.data.title}
          </option>
        ))}
      </datalist>
      <label className="field">
        Featured image
        {!demo && (
          <MediaPicker
            endpoint={`/api/sites/${siteId}/media`}
            onSelect={setImage}
          />
        )}
        <input type="hidden" name="image" value={image} />
        {image && (
          <>
            <img className="editor-thumb" src={image} alt="Featured image" />
            <button type="button" onClick={() => setImage("")}>
              Remove image
            </button>
          </>
        )}
      </label>
      <label className="field">
        Image description
        <input name="imageAlt" defaultValue={initial.imageAlt || ""} />
      </label>
      {kind === "articles" && (
        <label className="field">
          Author
          <select name="authorId" defaultValue={initial.authorId || ""}>
            <option value="">Account owner</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.data.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        <input
          type="checkbox"
          name="index"
          defaultChecked={initial.indexing?.index !== false}
        />{" "}
        Allow search engines to index this page
      </label>
      <label>
        <input
          type="checkbox"
          name="follow"
          defaultChecked={initial.indexing?.follow !== false}
        />{" "}
        Follow links on this page
      </label>
      {kind === "pages" && (
        <>
          <h3>Page sections</h3>
          <SectionEditor
            sections={sections}
            onChange={setSections}
            mediaEndpoint={demo ? undefined : `/api/sites/${siteId}/media`}
          />
          <input
            type="hidden"
            name="sections"
            value={JSON.stringify(sections)}
          />
        </>
      )}
    </div>
  );
}
