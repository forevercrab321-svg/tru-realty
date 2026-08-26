"use client";
import * as React from "react";
import { Download, FileText, Search, Star, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useStore } from "@/lib/store";
import { LIBRARY_CATEGORIES } from "@/data/library";
import { userName } from "@/data/company";
import { dateMed, fileSize, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_TONE: Record<string, string> = {
  pdf: "risk", docx: "info", xlsx: "ok", pptx: "warn", mp4: "plum", zip: "neutral",
};

export function LibraryView({ canManage }: { canManage?: boolean }) {
  const { libraryDocs, toggleFavoriteDoc } = useStore();
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<string>("All");
  const [favOnly, setFavOnly] = React.useState(false);

  const rows = libraryDocs
    .filter((d) => (cat === "All" ? true : d.category === cat))
    .filter((d) => (favOnly ? d.favorite : true))
    .filter((d) => !q || `${d.title} ${d.description} ${d.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  const counts = LIBRARY_CATEGORIES.map((c) => ({ c, n: libraryDocs.filter((d) => d.category === c).length }));

  return (
    <div className="grid gap-5 lg:grid-cols-[212px_1fr]">
      <aside className="space-y-1">
        <button
          onClick={() => { setCat("All"); setFavOnly(false); }}
          className={cn("flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors",
            cat === "All" && !favOnly ? "bg-surface font-medium text-ink shadow-xs ring-1 ring-line" : "text-ink-2 hover:bg-surface/70")}
        >
          All resources <span className="text-[11.5px] tabular text-ink-4">{libraryDocs.length}</span>
        </button>
        <button
          onClick={() => { setFavOnly(true); setCat("All"); }}
          className={cn("flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors",
            favOnly ? "bg-surface font-medium text-ink shadow-xs ring-1 ring-line" : "text-ink-2 hover:bg-surface/70")}
        >
          <span className="flex items-center gap-1.5"><Star className="size-3.5 text-warn-500" /> Favorites</span>
          <span className="text-[11.5px] tabular text-ink-4">{libraryDocs.filter((d) => d.favorite).length}</span>
        </button>
        <p className="px-2.5 pb-1 pt-4 text-[10.5px] font-medium uppercase tracking-[0.09em] text-ink-4">Categories</p>
        {counts.map(({ c, n }) => (
          <button
            key={c}
            onClick={() => { setCat(c); setFavOnly(false); }}
            className={cn("flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-left text-[13px] transition-colors",
              cat === c ? "bg-surface font-medium text-ink shadow-xs ring-1 ring-line" : "text-ink-2 hover:bg-surface/70")}
          >
            <span className="truncate">{c}</span>
            <span className="shrink-0 text-[11.5px] tabular text-ink-4">{n}</span>
          </button>
        ))}
      </aside>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input icon={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources…" className="h-8 max-w-[280px] text-[13px]" />
          <span className="text-[12.5px] text-ink-3">{rows.length} of {libraryDocs.length}</span>
          {canManage && (
            <Button size="sm" variant="primary" className="ml-auto" onClick={() => toast.success("Upload dialog would open here")}>
              <Upload /> Upload resource
            </Button>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="No resources found"
            description="Try a different search term or category. If something is missing, ask operations to add it."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {rows.map((d) => (
                <li key={d.id} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-canvas">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-subtle text-ink-4">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13.5px] font-medium text-ink">{d.title}</p>
                      <Badge tone={(TYPE_TONE[d.fileType] ?? "neutral") as "info"} size="sm">{d.fileType.toUpperCase()}</Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-3">{d.description}</p>
                    <p className="mt-1 text-[11.5px] text-ink-4">
                      {d.category} · {fileSize(d.sizeKb)} · updated {dateMed(d.updatedAt)} by {userName(d.uploadedById)} · {num(d.downloads)} downloads
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => toggleFavoriteDoc(d.id)} className="rounded-[6px] p-1.5 text-ink-4 transition-colors hover:bg-subtle" aria-label="Favorite">
                      <Star className={cn("size-4", d.favorite && "fill-warn-500 text-warn-500")} />
                    </button>
                    <Button size="iconSm" variant="ghost" onClick={() => toast.success(`${d.title} downloaded`)}><Download /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
