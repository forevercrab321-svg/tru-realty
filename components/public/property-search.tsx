"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "buy", label: "Buy" },
  { key: "rent", label: "Rent" },
  { key: "new", label: "New Development" },
] as const;

export function PropertySearch({ variant = "hero" }: { variant?: "hero" | "inline" }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<(typeof TABS)[number]["key"]>("buy");
  const [q, setQ] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [beds, setBeds] = React.useState("");
  const [baths, setBaths] = React.useState("");
  const [type, setType] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "new") return router.push("/new-development");
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (price) p.set("price", price);
    if (beds) p.set("beds", beds);
    if (baths) p.set("baths", baths);
    if (type) p.set("type", type);
    router.push(`/properties?${p.toString()}`);
  }

  return (
    <div className={cn(variant === "hero" && "rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-md")}>
      <div className={cn("flex gap-1", variant === "hero" ? "px-2 pt-1" : "mb-2")}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-t-[8px] px-3 py-2 text-[13px] font-medium transition-colors",
              variant === "hero"
                ? tab === t.key ? "bg-surface text-ink" : "text-white/70 hover:text-white"
                : tab === t.key ? "bg-subtle text-ink" : "text-ink-3 hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={submit}
        className={cn(
          "flex flex-col gap-2 rounded-xl bg-surface p-2 sm:flex-row sm:items-center",
          variant === "hero" ? "rounded-tl-none shadow-lg" : "border border-line shadow-xs"
        )}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Neighborhood, city, ZIP or address"
            className="h-10 w-full rounded-[8px] bg-transparent pl-9 pr-3 text-[14px] text-ink outline-none placeholder:text-ink-4"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <NativeSelect value={price} onChange={(e) => setPrice(e.target.value)} className="h-10 sm:w-[132px]" aria-label="Price">
            <option value="">Any price</option>
            <option value="0-1000000">Up to $1M</option>
            <option value="1000000-2000000">$1M – $2M</option>
            <option value="2000000-4000000">$2M – $4M</option>
            <option value="4000000-99000000">$4M+</option>
          </NativeSelect>
          <NativeSelect value={beds} onChange={(e) => setBeds(e.target.value)} className="h-10 sm:w-[98px]" aria-label="Beds">
            <option value="">Beds</option>
            <option value="1">1+</option><option value="2">2+</option>
            <option value="3">3+</option><option value="4">4+</option>
          </NativeSelect>
          <NativeSelect value={baths} onChange={(e) => setBaths(e.target.value)} className="h-10 sm:w-[100px]" aria-label="Baths">
            <option value="">Baths</option>
            <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option>
          </NativeSelect>
          <NativeSelect value={type} onChange={(e) => setType(e.target.value)} className="h-10 sm:w-[136px]" aria-label="Property type">
            <option value="">All types</option>
            <option value="Condo">Condo</option><option value="Co-op">Co-op</option>
            <option value="Townhouse">Townhouse</option><option value="Single Family">Single Family</option>
            <option value="Loft">Loft</option><option value="Multi-Family">Multi-Family</option>
          </NativeSelect>
        </div>
        <Button type="submit" variant="primary" size="lg" className="h-10 sm:px-6">Search</Button>
      </form>
    </div>
  );
}
