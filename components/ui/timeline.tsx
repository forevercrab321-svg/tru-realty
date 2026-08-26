import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateMed } from "@/lib/format";

export function Timeline({ items }: {
  items: { id: string; label: string; date: string; done: boolean; detail?: string; meta?: React.ReactNode }[];
}) {
  return (
    <ol className="relative">
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < items.length - 1 && (
            <span className={cn("absolute left-[9px] top-5 h-full w-px", it.done ? "bg-brand-200" : "bg-line")} />
          )}
          <span className={cn(
            "relative z-10 mt-0.5 flex size-[19px] shrink-0 items-center justify-center rounded-full border",
            it.done ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface"
          )}>
            {it.done ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-ink-4" />}
          </span>
          <div className="min-w-0 flex-1 pt-px">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className={cn("text-[13px] font-medium", it.done ? "text-ink" : "text-ink-3")}>{it.label}</p>
              <p className="text-[11.5px] tabular text-ink-4">{dateMed(it.date)}</p>
            </div>
            {it.detail && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-3">{it.detail}</p>}
            {it.meta}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function StageRail({ stages, currentIndex, className }: {
  stages: { key: string; label: string }[]; currentIndex: number; className?: string;
}) {
  return (
    <div className={cn("thin-scrollbar flex items-center gap-1 overflow-x-auto", className)}>
      {stages.map((s, i) => (
        <div key={s.key} className="flex shrink-0 items-center gap-1">
          <div className={cn(
            "flex h-6 items-center rounded-[6px] px-2 text-[11.5px] font-medium transition-colors",
            i < currentIndex ? "bg-brand-50 text-brand-700"
              : i === currentIndex ? "bg-ink text-white"
              : "bg-subtle text-ink-4"
          )}>
            {s.label}
          </div>
          {i < stages.length - 1 && <span className={cn("h-px w-3", i < currentIndex ? "bg-brand-200" : "bg-line-strong")} />}
        </div>
      ))}
    </div>
  );
}
