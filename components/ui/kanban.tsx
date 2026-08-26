"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export type KanbanColumn = { key: string; label: string; tone?: string };

export function KanbanBoard<T>({
  columns, items, columnOf, renderCard, onMove, getId, summary,
}: {
  columns: KanbanColumn[];
  items: T[];
  columnOf: (item: T) => string;
  getId: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  onMove?: (id: string, toColumn: string) => void;
  summary?: (items: T[]) => React.ReactNode;
}) {
  const [dragOver, setDragOver] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState<string | null>(null);

  return (
    <div className="thin-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
      {columns.map((col) => {
        const colItems = items.filter((i) => columnOf(i) === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
            onDragLeave={() => setDragOver((d) => (d === col.key ? null : d))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) onMove?.(id, col.key);
              setDragOver(null); setDragging(null);
            }}
            className={cn(
              "flex w-[286px] shrink-0 flex-col rounded-xl border bg-canvas/60 transition-colors",
              dragOver === col.key ? "border-brand-400 bg-brand-50/40" : "border-line"
            )}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">{col.label}</span>
                <span className="rounded-full bg-sunken px-1.5 text-[11px] font-medium tabular text-ink-3">{colItems.length}</span>
              </div>
              {summary && <div className="text-[11.5px] tabular text-ink-4">{summary(colItems)}</div>}
            </div>
            <div className="thin-scrollbar flex max-h-[calc(100vh-330px)] min-h-[120px] flex-col gap-2 overflow-y-auto px-2 pb-2">
              {colItems.map((item) => (
                <div
                  key={getId(item)}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", getId(item)); setDragging(getId(item)); }}
                  onDragEnd={() => setDragging(null)}
                  className={cn(
                    "cursor-grab rounded-[10px] border border-line bg-surface shadow-xs transition-all active:cursor-grabbing",
                    "hover:shadow-md", dragging === getId(item) && "opacity-40"
                  )}
                >
                  {renderCard(item)}
                </div>
              ))}
              {colItems.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded-[10px] border border-dashed border-line text-[12px] text-ink-4">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
