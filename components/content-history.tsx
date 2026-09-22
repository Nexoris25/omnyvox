"use client";
import { useState } from "react";
export function ContentHistory({
  siteId,
  recordId,
  onRestore,
}: {
  siteId: string;
  recordId: string;
  onRestore: (data: Record<string, unknown>) => void;
}) {
  const [versions, setVersions] = useState<
      { id: string; data: Record<string, unknown>; created_at: string }[]
    >([]),
    [message, setMessage] = useState("");
  return (
    <details className="panel panel-body">
      <summary>Previous versions</summary>
      <p>
        Load a previous version into the editor, review it, and save to restore
        it. Product inventory is managed separately.
      </p>
      <button
        type="button"
        className="button secondary small"
        onClick={async () => {
          try {
            const r = await fetch(`/api/sites/${siteId}/versions/${recordId}`);
            const b = await r.json();
            if (!r.ok) throw Error(b.error);
            setVersions(b);
            setMessage(b.length ? "" : "No previous versions yet.");
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        Load history
      </button>
      <p role="status">{message}</p>
      {versions.map((v) => (
        <p key={v.id}>
          <button
            type="button"
            className="button secondary small"
            onClick={() => onRestore(v.data)}
          >
            Load {new Date(v.created_at).toLocaleString()} ·{" "}
            {String(v.data.title)}
          </button>
        </p>
      ))}
    </details>
  );
}
