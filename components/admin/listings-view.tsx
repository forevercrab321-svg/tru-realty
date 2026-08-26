"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Grid3x3, Plus, Rows3, TrendingDown } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Segmented } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NewListingDialog } from "@/components/admin/create-dialogs";
import { LISTING_STATUS_LABEL } from "@/data/listings";
import { agentName, agents } from "@/data/agents";
import { compactUsd, dateShort, num, usd } from "@/lib/format";
import type { Listing } from "@/types";
import { toast } from "sonner";
import { asset } from "@/lib/utils";

export function ListingsView({ rows, base, showAgent = true, defaultAgentId }: {
  rows: Listing[]; base: string; showAgent?: boolean; defaultAgentId?: string;
}) {
  const router = useRouter();
  const [view, setView] = React.useState<"table" | "grid">("table");

  const columns: Column<Listing>[] = [
    {
      id: "address", header: "Property", width: "280px", accessor: (l) => l.address,
      cell: (l) => (
        <div className="flex items-center gap-2.5">
          <img src={asset(l.images[0])} alt="" className="size-8 shrink-0 rounded-[6px] object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{l.address}{l.unit ? `, ${l.unit}` : ""}</p>
            <p className="truncate text-[11.5px] text-ink-4">{l.neighborhood}, {l.city} · {l.mlsId}</p>
          </div>
        </div>
      ),
    },
    { id: "status", header: "Status", width: "132px", accessor: (l) => l.status, cell: (l) => <StatusBadge value={l.status} label={LISTING_STATUS_LABEL[l.status]} size="sm" /> },
    {
      id: "price", header: "Price", width: "126px", align: "right", accessor: (l) => l.price,
      cell: (l) => (
        <span className="inline-flex items-center gap-1">
          {l.price < l.originalPrice && <TrendingDown className="size-3 text-risk-500" />}
          {usd(l.price)}
        </span>
      ),
    },
    { id: "type", header: "Type", width: "116px", accessor: (l) => l.propertyType, cell: (l) => <Badge tone="neutral" size="sm">{l.propertyType}</Badge> },
    { id: "beds", header: "Bd / Ba", width: "88px", align: "right", accessor: (l) => l.beds, cell: (l) => `${l.beds} / ${l.baths}` },
    { id: "sqft", header: "Sq ft", width: "84px", align: "right", accessor: (l) => l.sqft, cell: (l) => num(l.sqft) },
    { id: "ppsf", header: "$/sf", width: "80px", align: "right", defaultHidden: true, accessor: (l) => Math.round(l.price / l.sqft), cell: (l) => usd(Math.round(l.price / l.sqft)) },
    { id: "dom", header: "DOM", width: "70px", align: "right", accessor: (l) => l.daysOnMarket, cell: (l) => l.daysOnMarket },
    ...(showAgent ? [{
      id: "agent", header: "Agent", width: "150px",
      accessor: (l: Listing) => agentName(l.listingAgentId),
      cell: (l: Listing) => (
        <div className="flex items-center gap-2"><Avatar name={agentName(l.listingAgentId)} size="xs" /><span className="truncate">{agentName(l.listingAgentId)}</span></div>
      ),
    }] : []),
    { id: "activity", header: "Views / Showings", width: "128px", align: "right", defaultHidden: true, accessor: (l) => l.views, cell: (l) => `${num(l.views)} / ${l.showings}` },
    { id: "listed", header: "Listed", width: "100px", accessor: (l) => l.listedOn, cell: (l) => <span className="tabular text-ink-3">{dateShort(l.listedOn)}</span> },
  ];

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] text-ink-3">{rows.length} listings · {compactUsd(rows.reduce((s, l) => s + l.price, 0))} in aggregate value</p>
        <div className="flex items-center gap-2">
          <Segmented value={view} onChange={setView} options={[{ value: "table", label: <><Rows3 /> Table</> }, { value: "grid", label: <><Grid3x3 /> Grid</> }]} />
          <NewListingDialog defaultAgentId={defaultAgentId} trigger={<Button size="sm" variant="primary"><Plus /> New listing</Button>} />
        </div>
      </div>

      {view === "table" ? (
        <DataTable
          data={rows}
          columns={columns}
          getRowId={(l) => l.id}
          onRowClick={(l) => router.push(`${base}/listings/${l.id}`)}
          searchKeys={(l) => `${l.address} ${l.unit ?? ""} ${l.neighborhood} ${l.city} ${l.mlsId} ${agentName(l.listingAgentId)}`}
          searchPlaceholder="Search address, MLS ID, neighborhood…"
          exportName="tru-listings"
          savedViews={[
            { id: "v1", name: "On market", filters: { status: ["active", "coming_soon"] }, search: "" },
            { id: "v2", name: "In contract", filters: { status: ["under_contract", "pending"] }, search: "" },
          ]}
          filters={[
            { id: "status", label: "Status", options: Object.entries(LISTING_STATUS_LABEL).map(([value, label]) => ({ value, label })), match: (l, v) => l.status === v },
            { id: "type", label: "Property type", options: ["Condo", "Co-op", "Townhouse", "Single Family", "Multi-Family", "Loft"].map((t) => ({ value: t, label: t })), match: (l, v) => l.propertyType === v },
            ...(showAgent ? [{
              id: "agent", label: "Agent",
              options: agents.map((a) => ({ value: a.id, label: a.name })),
              match: (l: Listing, v: string) => l.listingAgentId === v,
            }] : []),
          ]}
          bulkActions={[
            { label: "Push to portals", icon: <Eye />, onClick: (ids) => toast.success(`${ids.length} listings re-syndicated`) },
          ]}
          emptyTitle="No listings match those filters"
          emptyAction={<NewListingDialog defaultAgentId={defaultAgentId} trigger={<Button variant="primary" size="sm"><Plus /> Create a listing</Button>} />}
        />
      ) : rows.length === 0 ? (
        <EmptyState title="No listings yet" description="Create your first listing to get it on the board." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((l) => (
            <Link key={l.id} href={`${base}/listings/${l.id}`} className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-shadow hover:shadow-md">
              <div className="relative aspect-[16/10]">
                <img src={asset(l.images[0])} alt="" className="size-full object-cover" />
                <div className="absolute left-2.5 top-2.5"><StatusBadge value={l.status} label={LISTING_STATUS_LABEL[l.status]} size="sm" /></div>
              </div>
              <div className="p-4">
                <p className="text-[16px] font-semibold tabular text-ink">{usd(l.price)}</p>
                <p className="mt-1 truncate text-[13px] text-ink-2">{l.address}{l.unit ? `, ${l.unit}` : ""}</p>
                <p className="mt-0.5 truncate text-[12px] text-ink-4">{l.neighborhood} · {l.beds} bd · {num(l.sqft)} sf</p>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11.5px] text-ink-4">
                  <span className="flex items-center gap-1.5"><Avatar name={agentName(l.listingAgentId)} size="xs" />{agentName(l.listingAgentId).split(" ")[0]}</span>
                  <span className="tabular">{l.daysOnMarket} DOM</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
