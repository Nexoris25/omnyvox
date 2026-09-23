"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";
type Data = { revision?: number } & Record<string, unknown>;
type Backup = { at: string; data: Data };

const DELAY = 2500;
const RETRY = 15000;
const backupKey = (id: string) => `omnyvox:draft:${id}`;
const withoutRevision = (d: Data) => JSON.stringify({ ...d, revision: undefined });

/**
 * Saves website drafts shortly after each change, keeps a local copy until
 * the server has it, and turns a revision conflict (the website was saved in
 * another tab or by a teammate) into an explicit choice instead of lost work.
 */
export function useAutosave<T extends Data>({
  id,
  data,
  enabled,
  save,
  load,
  apply,
}: {
  id?: string;
  data?: T;
  enabled: boolean;
  /** Persists `data`; resolves with the new revision or throws an Error with `status`. */
  save: (data: T) => Promise<number>;
  /** Fetches the latest saved data from the server. */
  load: () => Promise<T>;
  /** Replaces the local data without marking it as changed. */
  apply: (data: T) => void;
}) {
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [backup, setBackup] = useState<Backup | null>(null);
  const edits = useRef(0);
  const latest = useRef<T | undefined>(data);
  latest.current = data;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearBackup = useCallback(() => {
    if (!id) return;
    try {
      localStorage.removeItem(backupKey(id));
    } catch {}
  }, [id]);

  // A new website: reset, and offer any local copy the server never received.
  useEffect(() => {
    setState("idle");
    setSavedAt(null);
    setBackup(null);
    edits.current = 0;
    if (!id || !enabled || !latest.current) return;
    try {
      const stored = JSON.parse(localStorage.getItem(backupKey(id)) || "null") as Backup | null;
      if (stored?.data && withoutRevision(stored.data) !== withoutRevision(latest.current))
        setBackup(stored);
      else localStorage.removeItem(backupKey(id));
    } catch {}
    // Only when the website changes; `latest` is read from the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, enabled, !!data]);

  /** Call after every local edit. */
  const markDirty = useCallback(() => {
    edits.current++;
    setState((s) => (s === "conflict" ? s : "dirty"));
  }, []);

  // Keep a local copy of unsaved work so a closed tab or crash loses nothing.
  useEffect(() => {
    if (!enabled || !id || !data || (state !== "dirty" && state !== "error" && state !== "conflict")) return;
    try {
      localStorage.setItem(backupKey(id), JSON.stringify({ at: new Date().toISOString(), data }));
    } catch {}
  }, [data, state, id, enabled]);

  const saveNow = useCallback(async (): Promise<SaveState> => {
    clearTimeout(timer.current);
    const current = latest.current;
    if (!enabled || !current) return "saved";
    const version = edits.current;
    setState("saving");
    try {
      await save(current);
      const next = edits.current === version ? "saved" : "dirty";
      if (next === "saved") clearBackup();
      setSavedAt(new Date());
      setState(next);
      return next;
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 409) {
        setState("conflict");
        return "conflict";
      }
      setState("error");
      timer.current = setTimeout(() => setState((s) => (s === "error" ? "dirty" : s)), RETRY);
      return "error";
    }
  }, [enabled, save, clearBackup]);

  // Debounced autosave after the last edit.
  useEffect(() => {
    if (state !== "dirty" || !enabled) return;
    timer.current = setTimeout(saveNow, DELAY);
    return () => clearTimeout(timer.current);
  }, [state, data, enabled, saveNow]);

  // Warn before leaving with work the server does not have yet.
  useEffect(() => {
    if (!["dirty", "saving", "error", "conflict"].includes(state)) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);

  /** Conflict: overwrite the newer saved version with this tab's copy. */
  const keepMine = useCallback(async () => {
    const current = latest.current;
    if (!current) return;
    setState("saving");
    try {
      const server = await load();
      apply({ ...current, revision: server.revision });
      latest.current = { ...current, revision: server.revision };
      edits.current++;
      setState("dirty");
      await saveNow();
    } catch {
      setState("conflict");
    }
  }, [load, apply, saveNow]);

  /** Conflict: discard this tab's changes and continue from the saved version. */
  const useTheirs = useCallback(async () => {
    setState("saving");
    try {
      apply(await load());
      clearBackup();
      setSavedAt(new Date());
      setState("saved");
    } catch {
      setState("conflict");
    }
  }, [load, apply, clearBackup]);

  const restoreBackup = useCallback(() => {
    if (!backup || !latest.current) return;
    apply({ ...backup.data, revision: latest.current.revision } as T);
    setBackup(null);
    markDirty();
  }, [backup, apply, markDirty]);

  const discardBackup = useCallback(() => {
    clearBackup();
    setBackup(null);
  }, [clearBackup]);

  return { state, savedAt, backup, markDirty, saveNow, keepMine, useTheirs, restoreBackup, discardBackup };
}
