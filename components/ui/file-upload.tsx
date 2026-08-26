"use client";
import * as React from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileSize } from "@/lib/format";

export function FileUpload({
  onFiles, hint = "PDF, DOCX, JPG or XLSX up to 25 MB", className,
}: { onFiles?: (files: { name: string; sizeKb: number }[]) => void; hint?: string; className?: string }) {
  const [over, setOver] = React.useState(false);
  const [queued, setQueued] = React.useState<{ name: string; sizeKb: number }[]>([]);
  const input = React.useRef<HTMLInputElement>(null);

  function add(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) }));
    const next = [...queued, ...files];
    setQueued(next);
    onFiles?.(next);
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed px-4 py-7 text-center transition-colors",
          over ? "border-brand-400 bg-brand-50/50" : "border-line-strong bg-canvas hover:border-ink-4"
        )}
      >
        <Upload className="mb-2 size-5 text-ink-4" />
        <p className="text-[13px] font-medium text-ink">Drop files here or click to browse</p>
        <p className="mt-0.5 text-[12px] text-ink-4">{hint}</p>
        <input ref={input} type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      </div>
      {queued.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {queued.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-[8px] border border-line bg-surface px-2.5 py-2">
              <FileText className="size-4 text-ink-4" />
              <span className="truncate text-[13px] text-ink">{f.name}</span>
              <span className="ml-auto shrink-0 text-[11.5px] tabular text-ink-4">{fileSize(f.sizeKb)}</span>
              <button onClick={() => setQueued((q) => q.filter((_, j) => j !== i))} className="rounded p-0.5 text-ink-4 hover:bg-subtle hover:text-ink">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
