"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, Rows3, SlidersHorizontal } from "lucide-react";
import { PageHero } from "@/components/public/section";
import { PropertyCard } from "@/components/public/cards";
import { PropertySearch } from "@/components/public/property-search";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { listings } from "@/data/listings";
import { num, usd } from "@/lib/format";
import Link from "next/link";
import { asset } from "@/lib/utils";

function Results() {
  const params = useSearchParams();
  const [sort, setSort] = React.useState("newest");
  const [view, setView] = React.useState<"grid" | "list">("grid");

  const q = (params.get("q") ?? "").toLowerCase();
  const price = params.get("price");
  const beds = Number(params.get("beds") ?? 0);
  const baths = Number(params.get("baths") ?? 0);
  const type = params.get("type");

  let rows = listings.filter((l) => !["sold", "withdrawn", "expired"].includes(l.status));
  if (q) rows = rows.filter((l) => `${l.address} ${l.city} ${l.neighborhood} ${l.zip}`.toLowerCase().includes(q));
  if (price) { const [lo, hi] = price.split("-").map(Number); rows = rows.filter((l) => l.price >= lo && l.price <= hi); }
  if (beds) rows = rows.filter((l) => l.beds >= beds);
  if (baths) rows = rows.filter((l) => l.baths >= baths);
  if (type) rows = rows.filter((l) => l.propertyType === type);

  rows = [...rows].sort((a, b) =>
    sort === "price-asc" ? a.price - b.price
      : sort === "price-desc" ? b.price - a.price
      : sort === "sqft" ? b.sqft - a.sqft
      : a.daysOnMarket - b.daysOnMarket
  );

  const activeChips = [
    q && `“${q}”`, price && `${usd(Number(price.split("-")[0]))}–${usd(Number(price.split("-")[1]))}`,
    beds && `${beds}+ bd`, baths && `${baths}+ ba`, type,
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHero
        eyebrow="Homes for sale"
        title="Find your place in New York"
        description="Every listing below is represented by a Tru agent. Filters run against live inventory across Manhattan, Brooklyn, Queens and Long Island."
        compact
      >
        <PropertySearch variant="inline" />
      </PageHero>

      <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] text-ink-2">
              <span className="font-semibold text-ink tabular">{num(rows.length)}</span> {rows.length === 1 ? "home" : "homes"}
            </p>
            {activeChips.map((c) => <Badge key={c} tone="neutral" size="sm">{c}</Badge>)}
            {activeChips.length > 0 && (
              <Button variant="link" size="sm" asChild><Link href="/properties">Clear filters</Link></Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NativeSelect value={sort} onChange={(e) => setSort(e.target.value)} className="h-8 w-[168px] text-[13px]">
              <option value="newest">Newest first</option>
              <option value="price-desc">Price: high to low</option>
              <option value="price-asc">Price: low to high</option>
              <option value="sqft">Largest</option>
            </NativeSelect>
            <Segmented
              value={view}
              onChange={setView}
              options={[{ value: "grid", label: <LayoutGrid /> }, { value: "list", label: <Rows3 /> }]}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal />}
            title="No homes match those filters"
            description="Try widening the price range or removing a filter. Our agents also have off-market inventory that never reaches a portal."
            action={<Button variant="primary" asChild><Link href="/contact">Talk to an agent</Link></Button>}
          />
        ) : view === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((l) => <PropertyCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {rows.map((l) => (
              <Link key={l.id} href={`/properties/${l.id}`} className="flex gap-4 p-4 transition-colors hover:bg-canvas">
                <img src={asset(l.images[0])} alt="" className="h-[104px] w-[150px] shrink-0 rounded-[8px] object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[17px] font-semibold tabular text-ink">{usd(l.price)}</p>
                    <Badge tone="neutral" size="sm">{l.propertyType}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[13.5px] text-ink-2">{l.address}{l.unit ? `, ${l.unit}` : ""} · {l.neighborhood}</p>
                  <p className="mt-1.5 text-[12.5px] text-ink-3">{l.beds} bd · {l.baths} ba · {num(l.sqft)} sf · {l.daysOnMarket} days on market</p>
                  <p className="mt-2 line-clamp-1 text-[12.5px] text-ink-3">{l.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function PropertiesPage() {
  return <React.Suspense fallback={<div className="min-h-screen" />}><Results /></React.Suspense>;
}
