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
  allowVideo = false,
  allowedSections,
}: {
  allowedSections?: readonly string[];
  siteId: string;
  kind: string;
  allowVideo?: boolean;
  initial?: {
    sections?: Section[];
    indexing?: { index: boolean; follow: boolean };
    authorId?: string;
    image?: string;
    imageAlt?: string;
    seoTitle?: string;
    description?: string;
    socialImage?: string;
    publishAt?: string;
    policyType?: string;
    policyReviewed?: boolean;
    details?: { label: string; value: string }[];
  };
  demo?: boolean;
}) {
  const [sections, setSections] = useState(initial.sections || []),
    [details, setDetails] = useState(initial.details || []),
    [socialImage, setSocialImage] = useState(initial.socialImage || ""),
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
      {[
        "products",
        "offerings",
        "projects",
        "people",
        "properties",
        "facilities",
        "programmes",
        "locations",
      ].includes(kind) && (
        <section>
          <h3>Verified details</h3>
          <p>
            Add relevant facts such as location, materials, programme duration
            or professional role. Do not enter invented credentials or claims.
          </p>
          {details.map((d, i) => (
            <div className="form-grid" key={i}>
              <label className="field">
                Label
                <input
                  value={d.label}
                  maxLength={80}
                  onChange={(e) =>
                    setDetails(
                      details.map((x, j) =>
                        i === j ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Value
                <input
                  value={d.value}
                  maxLength={500}
                  onChange={(e) =>
                    setDetails(
                      details.map((x, j) =>
                        i === j ? { ...x, value: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                onClick={() => setDetails(details.filter((_, j) => i !== j))}
              >
                Remove detail
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={details.length >= 15}
            onClick={() => setDetails([...details, { label: "", value: "" }])}
          >
            Add detail
          </button>
          <input type="hidden" name="details" value={JSON.stringify(details)} />
        </section>
      )}
      {kind === "legal" && (
        <>
          <label className="field">
            Policy type
            <select
              name="policyType"
              defaultValue={initial.policyType || "other"}
            >
              {[
                "terms",
                "privacy",
                "cookies",
                "refund",
                "shipping",
                "returns",
                "fulfilment",
                "other",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              name="policyReviewed"
              defaultChecked={initial.policyReviewed}
            />{" "}
            I reviewed this policy and confirm it describes our actual business
            practices.
          </label>
        </>
      )}
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
      <label className="field">
        Search result title
        <input
          name="seoTitle"
          maxLength={100}
          defaultValue={initial.seoTitle || ""}
          placeholder="Uses the page title when empty"
        />
      </label>
      <label className="field">
        Search description
        <textarea
          name="description"
          maxLength={300}
          defaultValue={initial.description || ""}
          placeholder="Summarise this page for search and social sharing"
        />
      </label>
      <label className="field">
        Social sharing image
        {!demo && (
          <MediaPicker
            endpoint={`/api/sites/${siteId}/media`}
            onSelect={setSocialImage}
          />
        )}
        <input type="hidden" name="socialImage" value={socialImage} />
      </label>
      {socialImage && (
        <>
          <img
            className="editor-thumb"
            src={socialImage}
            alt="Social sharing preview"
          />
          <button type="button" onClick={() => setSocialImage("")}>
            Use featured image instead
          </button>
        </>
      )}
      {["pages", "articles", "legal"].includes(kind) && (
        <label className="field">
          Publish at (UTC; Growth and Advanced)
          <input
            type="datetime-local"
            name="publishAt"
            defaultValue={
              initial.publishAt
                ? new Date(initial.publishAt).toISOString().slice(0, 16)
                : ""
            }
          />
          <small>
            Choose Scheduled as the status to publish automatically at this
            time.
          </small>
        </label>
      )}
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
            allowVideo={allowVideo}
            allowed={allowedSections}
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
