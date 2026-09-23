"use client";
import { AlertTriangle, Check, CloudOff, History, Loader2 } from "lucide-react";
import type { SaveState } from "./use-autosave";

const time = (d: Date) =>
  d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });

/** Compact indicator shown beside the Save and Publish buttons. */
export function SaveStatus({ state, savedAt }: { state: SaveState; savedAt: Date | null }) {
  const [icon, text] =
    state === "saving"
      ? [<Loader2 key="i" size={14} className="spin" />, "Saving…"]
      : state === "dirty"
        ? [<span key="i" className="save-dot" />, "Unsaved changes"]
        : state === "error"
          ? [<CloudOff key="i" size={14} />, "Couldn’t save. Retrying…"]
          : state === "conflict"
            ? [<AlertTriangle key="i" size={14} />, "Not saved: newer version exists"]
            : savedAt
              ? [<Check key="i" size={14} />, `Saved ${time(savedAt)}`]
              : [null, ""];
  if (!text) return null;
  return (
    <span className={`save-status ${state}`} role="status" aria-live="polite">
      {icon}
      {text}
    </span>
  );
}

/** Explains a revision conflict and offers both safe ways forward. */
export function ConflictBanner({
  onKeepMine,
  onUseTheirs,
}: {
  onKeepMine: () => void;
  onUseTheirs: () => void;
}) {
  return (
    <div className="save-banner conflict" role="alert">
      <AlertTriangle size={20} aria-hidden />
      <div>
        <b>This website was saved somewhere else while you were editing.</b>
        <p>
          It may be open in another tab, or a teammate saved changes. Your edits are
          safe in this tab. Choose which version to keep.
        </p>
      </div>
      <div className="save-banner-actions">
        <button type="button" className="button small" onClick={onKeepMine}>
          Keep my copy
        </button>
        <button type="button" className="button secondary small" onClick={onUseTheirs}>
          Use the saved version
        </button>
      </div>
    </div>
  );
}

/** Offers work that was kept on this device but never reached the server. */
export function RestoreBanner({
  at,
  onRestore,
  onDiscard,
}: {
  at: string;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  const when = new Date(at).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <div className="save-banner" role="status">
      <History size={20} aria-hidden />
      <div>
        <b>You have unsaved changes from {when}.</b>
        <p>They were kept on this device when the editor closed before saving.</p>
      </div>
      <div className="save-banner-actions">
        <button type="button" className="button small" onClick={onRestore}>
          Restore changes
        </button>
        <button type="button" className="button secondary small" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
