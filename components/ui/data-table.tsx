"use client";
import * as React from "react";
import {
  ArrowDownUp, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Columns3,
  Download, Search, SlidersHorizontal, X, Check, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Dropdown, DropdownContent, DropdownTrigger, DropdownCheckItem, DropdownLabel, DropdownSeparator, DropdownItem } from "./dropdown";
import { EmptyState } from "./empty-state";

export type Column<T> = {
  id: string;
  header: string;
  /** value used for sorting / search / export */
  accessor?: (row: T) => string | number;
  cell: (row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  defaultHidden?: boolean;
  sticky?: boolean;
};

export type FilterDef<T> = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
};

export type SavedView = { id: string; name: string; filters: Record<string, string[]>; search: string };

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  filters?: FilterDef<T>[];
  searchPlaceholder?: string;
  searchKeys?: (row: T) => string;
  onRowClick?: (row: T) => void;
  bulkActions?: { label: string; icon?: React.ReactNode; onClick: (ids: string[]) => void; destructive?: boolean }[];
  pageSize?: number;
  savedViews?: SavedView[];
  toolbarExtra?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  dense?: boolean;
  exportName?: string;
};

export function DataTable<T>({
  data, columns, getRowId, filters = [], searchPlaceholder = "Search…", searchKeys,
  onRowClick, bulkActions = [], pageSize = 12, savedViews = [], toolbarExtra,
  emptyTitle = "Nothing here yet", emptyDescription, emptyAction, dense, exportName = "export",
}: Props<T>) {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<{ id: string; dir: "asc" | "desc" } | null>(null);
  const [active, setActive] = React.useState<Record<string, string[]>>({});
  const [hidden, setHidden] = React.useState<string[]>(columns.filter((c) => c.defaultHidden).map((c) => c.id));
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [viewName, setViewName] = React.useState<string | null>(null);

  const visible = columns.filter((c) => !hidden.includes(c.id));

  const filtered = React.useMemo(() => {
    let rows = data;
    for (const f of filters) {
      const vals = active[f.id];
      if (vals?.length) rows = rows.filter((r) => vals.some((v) => f.match(r, v)));
    }
    if (search.trim() && searchKeys) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => searchKeys(r).toLowerCase().includes(q));
    }
    if (sort) {
      const col = columns.find((c) => c.id === sort.id);
      if (col?.accessor) {
        rows = [...rows].sort((a, b) => {
          const av = col.accessor!(a), bv = col.accessor!(b);
          const r = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? r : -r;
        });
      }
    }
    return rows;
  }, [data, filters, active, search, searchKeys, sort, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * pageSize, current * pageSize + pageSize);
  const activeFilterCount = Object.values(active).flat().length;

  // Reset pagination whenever the result set changes, during render rather than in an effect.
  const filterKey = JSON.stringify(active) + "|" + search;
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (lastFilterKey !== filterKey) { setLastFilterKey(filterKey); setPage(0); }

  function toggleFilter(fid: string, value: string) {
    setViewName(null);
    setActive((prev) => {
      const cur = prev[fid] ?? [];
      return { ...prev, [fid]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  }

  function exportCsv() {
    const head = visible.map((c) => `"${c.header}"`).join(",");
    const body = filtered.map((r) =>
      visible.map((c) => `"${String(c.accessor ? c.accessor(r) : "").replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[head, ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${exportName}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.includes(getRowId(r)));

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        {searchKeys && (
          <Input
            icon={<Search />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full max-w-[260px] text-[13px] sm:w-[260px]"
          />
        )}

        {filters.map((f) => (
          <Dropdown key={f.id}>
            <DropdownTrigger asChild>
              <Button size="sm" variant={active[f.id]?.length ? "subtle" : "secondary"}>
                <SlidersHorizontal /> {f.label}
                {active[f.id]?.length ? (
                  <span className="ml-0.5 rounded-full bg-ink px-1.5 text-[10px] font-semibold text-white">{active[f.id].length}</span>
                ) : null}
              </Button>
            </DropdownTrigger>
            <DropdownContent align="start">
              <DropdownLabel>{f.label}</DropdownLabel>
              {f.options.map((o) => (
                <DropdownCheckItem
                  key={o.value}
                  checked={active[f.id]?.includes(o.value) ?? false}
                  onSelect={(e) => { e.preventDefault(); toggleFilter(f.id, o.value); }}
                >
                  {o.label}
                </DropdownCheckItem>
              ))}
            </DropdownContent>
          </Dropdown>
        ))}

        {activeFilterCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { setActive({}); setViewName(null); }}>
            <X /> Clear
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {toolbarExtra}
          {savedViews.length > 0 && (
            <Dropdown>
              <DropdownTrigger asChild>
                <Button size="sm" variant="secondary"><Bookmark /> {viewName ?? "Views"}</Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>Saved views</DropdownLabel>
                {savedViews.map((v) => (
                  <DropdownItem key={v.id} onSelect={() => { setActive(v.filters); setSearch(v.search); setViewName(v.name); }}>
                    {viewName === v.name && <Check />} {v.name}
                  </DropdownItem>
                ))}
                <DropdownSeparator />
                <DropdownItem onSelect={() => { setActive({}); setSearch(""); setViewName(null); }}>Reset to all</DropdownItem>
              </DropdownContent>
            </Dropdown>
          )}
          <Dropdown>
            <DropdownTrigger asChild>
              <Button size="sm" variant="secondary"><Columns3 /> Columns</Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownLabel>Visible columns</DropdownLabel>
              {columns.map((c) => (
                <DropdownCheckItem
                  key={c.id}
                  checked={!hidden.includes(c.id)}
                  onSelect={(e) => { e.preventDefault(); setHidden((h) => h.includes(c.id) ? h.filter((x) => x !== c.id) : [...h, c.id]); }}
                >
                  {c.header}
                </DropdownCheckItem>
              ))}
            </DropdownContent>
          </Dropdown>
          <Button size="sm" variant="secondary" onClick={exportCsv}><Download /> Export</Button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="animate-in-up mb-3 flex items-center gap-3 rounded-[10px] border border-ink/10 bg-ink px-3 py-2 text-white">
          <span className="text-[12.5px] font-medium">{selected.length} selected</span>
          <div className="ml-auto flex items-center gap-1.5">
            {bulkActions.map((a) => (
              <button
                key={a.label}
                onClick={() => { a.onClick(selected); setSelected([]); }}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[12.5px] font-medium transition-colors [&_svg]:size-3.5",
                  a.destructive ? "text-risk-50 hover:bg-risk-500/25" : "text-white/85 hover:bg-white/12 hover:text-white"
                )}
              >
                {a.icon} {a.label}
              </button>
            ))}
            <button onClick={() => setSelected([])} className="rounded-[6px] p-1 text-white/60 hover:bg-white/12 hover:text-white">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-line bg-canvas/70">
                {bulkActions.length > 0 && (
                  <th className="w-9 px-3 py-0">
                    <input
                      type="checkbox"
                      aria-label="Select all on page"
                      checked={allOnPageSelected}
                      onChange={(e) =>
                        setSelected(e.target.checked
                          ? Array.from(new Set([...selected, ...rows.map(getRowId)]))
                          : selected.filter((id) => !rows.map(getRowId).includes(id)))
                      }
                      className="size-3.5 cursor-pointer rounded-[3px] accent-brand-700"
                    />
                  </th>
                )}
                {visible.map((c) => (
                  <th
                    key={c.id}
                    style={{ width: c.width }}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-4",
                      c.align === "right" && "text-right", c.align === "center" && "text-center",
                      c.align !== "right" && c.align !== "center" && "text-left"
                    )}
                  >
                    {c.sortable !== false && c.accessor ? (
                      <button
                        onClick={() => setSort((s) => s?.id === c.id ? (s.dir === "asc" ? { id: c.id, dir: "desc" } : null) : { id: c.id, dir: "asc" })}
                        className={cn("inline-flex items-center gap-1 transition-colors hover:text-ink-2",
                          c.align === "right" && "flex-row-reverse")}
                      >
                        {c.header}
                        {sort?.id === c.id
                          ? (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)
                          : <ArrowDownUp className="size-3 opacity-0 transition-opacity group-hover/th:opacity-40" />}
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = getRowId(row);
                const isSel = selected.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "group border-b border-line/70 last:border-0 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-canvas",
                      isSel && "bg-brand-50/50"
                    )}
                  >
                    {bulkActions.length > 0 && (
                      <td className="px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={isSel}
                          onChange={() => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])}
                          className="size-3.5 cursor-pointer rounded-[3px] accent-brand-700"
                        />
                      </td>
                    )}
                    {visible.map((c) => (
                      <td
                        key={c.id}
                        className={cn(
                          "px-3 align-middle text-[13px] text-ink-2",
                          dense ? "py-2" : "py-2.5",
                          c.align === "right" && "text-right tabular",
                          c.align === "center" && "text-center"
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} className="border-0" />
        )}

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between border-t border-line px-3 py-2.5">
            <p className="text-[12.5px] text-ink-3">
              <span className="tabular text-ink-2">{current * pageSize + 1}–{Math.min((current + 1) * pageSize, filtered.length)}</span>
              {" of "}<span className="tabular">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button size="iconSm" variant="ghost" disabled={current === 0} onClick={() => setPage(current - 1)}>
                <ChevronLeft />
              </Button>
              <span className="px-1.5 text-[12.5px] tabular text-ink-3">{current + 1} / {pages}</span>
              <Button size="iconSm" variant="ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
