"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  /** Plain text used for searching and sorting when render returns JSX. */
  text?: (row: T) => string;
  className?: string;
};

const PAGE = 25;

/** Searchable, filterable, paginated table for internal administration. */
export function AdminTable<T extends Record<string, unknown>>({
  rows,
  columns,
  rowKey,
  status,
  onOpen,
  empty = "Nothing here yet.",
  searchLabel = "Search",
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Optional status filter: how to read a row's status and how to label it. */
  status?: { get: (row: T) => string; labels?: Record<string, string> };
  onOpen?: (row: T) => void;
  empty?: string;
  searchLabel?: string;
}) {
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [page, setPage] = useState(0);
  const textOf = (row: T, c: Column<T>) =>
    c.text ? c.text(row) : String(row[c.key] ?? "");
  const statuses = useMemo(
    () => (status ? [...new Set(rows.map(status.get).filter(Boolean))].sort() : []),
    [rows, status],
  );
  const shown = rows.filter(
    (r) =>
      (!filter || status?.get(r) === filter) &&
      (!q ||
        columns.some((c) => textOf(r, c).toLowerCase().includes(q.toLowerCase()))),
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages - 1);
  const slice = shown.slice(current * PAGE, current * PAGE + PAGE);
  return (
    <div className="admin-table-wrap">
      <div className="admin-table-tools">
        <label className="admin-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            value={q}
            placeholder={searchLabel}
            aria-label={searchLabel}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </label>
        {status && statuses.length > 1 && (
          <select
            aria-label="Filter by status"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {status.labels?.[s] || s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        )}
        <span className="admin-count">
          {shown.length} {shown.length === 1 ? "record" : "records"}
        </span>
      </div>
      {slice.length ? (
        <div className="table-wrap">
          <table className="data-table admin-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={c.className}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr
                  key={rowKey(r)}
                  className={onOpen ? "clickable" : undefined}
                  onClick={(e) => {
                    if (!onOpen || (e.target as HTMLElement).closest("a,button,select,input")) return;
                    onOpen(r);
                  }}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={c.className} data-label={c.label}>
                      {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">{q || filter ? "No records match your search." : empty}</p>
      )}
      {pages > 1 && (
        <nav className="admin-pagination" aria-label="Pagination">
          <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {current + 1} of {pages}
          </span>
          <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}

export const fmtDate = (v: unknown) =>
  v
    ? new Date(String(v)).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "—";
export const fmtDateTime = (v: unknown) =>
  v
    ? new Date(String(v)).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
export const fmtNaira = (kobo: unknown) =>
  typeof kobo === "number"
    ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100)
    : "—";

const tones: Record<string, string> = {
  active: "good", verified: "good", published: "good", paid: "good", resolved: "good", true: "good", enabled: "good",
  pending: "warn", draft: "warn", in_progress: "warn", new: "info", verification_required: "warn", review_required: "warn",
  rejected: "bad", suspended: "bad", cancelled: "bad", expired: "bad", false: "muted", inactive: "muted",
};
export function StatusBadge({ value, label }: { value: unknown; label?: string }) {
  const key = String(value ?? "");
  return (
    <span className={`status-badge ${tones[key] || "muted"}`}>
      {label || (key ? key.replaceAll("_", " ") : "—")}
    </span>
  );
}
