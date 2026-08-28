"use client";
import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Eye, Heart, Megaphone, Pencil, Share2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { MetricCard, Stat } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Timeline } from "@/components/ui/timeline";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger } from "@/components/ui/dropdown";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { ownsRecord } from "@/lib/record-access";
import { NoAccess } from "@/components/shared/no-access";
import { LISTING_STATUS_LABEL } from "@/data/listings";
import { agentById, agentName } from "@/data/agents";
import { compactUsd, dateMed, num, pct, usd } from "@/lib/format";
import { toast } from "sonner";
import type { ListingStatus } from "@/types";
import { asset } from "@/lib/utils";

export function ListingDetail({ id, base }: { id: string; base: string }) {
  const { account } = useSession();
  const { listings, updateListingStatus, transactions } = useStore();
  const listing = listings.find((l) => l.id === id);
  if (!listing) return notFound();
  if (!ownsRecord(account, base, [listing.listingAgentId])) {
    return (
      <NoAccess
        role={account?.role ?? "agent"}
        backHref={`${base}/listings`}
        backLabel="Back to your listings"
      />
    );
  }

  const agent = agentById(listing.listingAgentId)!;
  const tx = transactions.find((t) => t.address === listing.address);
  const ppsf = Math.round(listing.price / listing.sqft);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Listings", href: `${base}/listings` }, { label: listing.address }]}
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            {listing.address}{listing.unit ? `, ${listing.unit}` : ""}
            <StatusBadge value={listing.status} label={LISTING_STATUS_LABEL[listing.status]} />
          </span>
        }
        description={`${listing.neighborhood}, ${listing.city} · MLS ${listing.mlsId} · listed ${dateMed(listing.listedOn)}`}
        actions={
          <>
            <Dropdown>
              <DropdownTrigger asChild><Button variant="secondary">Change status</Button></DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>Listing status</DropdownLabel>
                {Object.entries(LISTING_STATUS_LABEL).map(([v, label]) => (
                  <DropdownItem key={v} onSelect={() => updateListingStatus(listing.id, v as ListingStatus)}>{label}</DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
            <Button variant="secondary" asChild><Link href={`/properties/${listing.id}`}>View public page</Link></Button>
            <Button variant="primary" onClick={() => toast.success("Listing sent to editor")}><Pencil /> Edit listing</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Asking price" value={usd(listing.price)} sub={listing.price < listing.originalPrice ? `Reduced from ${usd(listing.originalPrice)}` : `${usd(ppsf)} per sq ft`} />
        <MetricCard label="Days on market" value={num(listing.daysOnMarket)} sub={`Listed ${dateMed(listing.listedOn)}`} />
        <MetricCard label="Views" value={num(listing.views)} sub={`${listing.saves} saves`} icon={<Eye />} />
        <MetricCard label="Showings / offers" value={`${listing.showings} / ${listing.offers}`} sub="Since launch" icon={<Users />} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="openhouses">Open houses</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <Card>
                  <CardBody className="p-0">
                    <img src={asset(listing.images[0])} alt="" className="aspect-[16/9] w-full object-cover" />
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Property details</CardTitle></CardHeader>
                  <CardBody>
                    <dl className="grid gap-5 sm:grid-cols-3">
                      <Stat label="Property type" value={listing.propertyType} />
                      <Stat label="Bedrooms" value={num(listing.beds)} />
                      <Stat label="Bathrooms" value={`${listing.baths}${listing.halfBaths ? ` + ${listing.halfBaths} half` : ""}`} />
                      <Stat label="Interior" value={`${num(listing.sqft)} sq ft`} />
                      <Stat label="Lot" value={listing.lotSqft ? `${num(listing.lotSqft)} sq ft` : "—"} />
                      <Stat label="Year built" value={num(listing.yearBuilt)} />
                      <Stat label="Price per sq ft" value={usd(ppsf)} />
                      <Stat label={listing.hoa ? "Common charges" : "Maintenance"} value={listing.hoa ? `${usd(listing.hoa)}/mo` : "—"} />
                      <Stat label="Annual taxes" value={listing.taxes ? usd(listing.taxes) : "—"} />
                    </dl>
                    <div className="mt-5 border-t border-line pt-4">
                      <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">Description</p>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{listing.description}</p>
                    </div>
                    <div className="mt-5 border-t border-line pt-4">
                      <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">Features</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {listing.features.map((f) => <Badge key={f} tone="neutral" size="sm">{f}</Badge>)}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Listing team</CardTitle></CardHeader>
                  <CardBody className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={agent.name} size="lg" />
                      <div className="min-w-0">
                        <Link href={`${base}/agents/${agent.id}`} className="truncate text-[14px] font-medium text-ink hover:underline">{agent.name}</Link>
                        <p className="text-[12px] text-ink-4">Listing agent</p>
                      </div>
                    </div>
                    <Stat label="Pricing" value={`${pct((listing.price / listing.originalPrice) * 100 - 100, 1)} vs. original`} />
                    <Stat label="Linked transaction" value={tx ? <Link href={`${base}/transactions/${tx.id}`} className="text-brand-700 hover:underline">{tx.ref}</Link> : "None yet"} />
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Syndication</CardTitle></CardHeader>
                  <CardBody className="space-y-2.5">
                    {["REBNY RLS", "StreetEasy", "Zillow", "Realtor.com", "trurealty.com"].map((p) => (
                      <div key={p} className="flex items-center justify-between">
                        <p className="text-[13px] text-ink-2">{p}</p>
                        <Badge tone={listing.status === "active" ? "ok" : "neutral"} size="sm" dot>
                          {listing.status === "active" ? "Live" : "Held"}
                        </Badge>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listing.images.map((img, i) => (
                <Card key={i} className="overflow-hidden">
                  <img src={asset(img)} alt="" className="aspect-[4/3] w-full object-cover" />
                  <CardBody className="flex items-center justify-between py-2.5">
                    <p className="text-[12.5px] text-ink-2">{i === 0 ? "Hero image" : `Photo ${i + 1}`}</p>
                    <Button size="xs" variant="ghost"><Share2 /></Button>
                  </CardBody>
                </Card>
              ))}
            </div>
            <p className="mt-4 text-[12.5px] text-ink-4">
              Photography by Northlight Property Media. Full sets sync from the MLS media feed once connected.
            </p>
          </TabsContent>

          <TabsContent value="documents">
            <EmptyState
              title="No listing documents yet"
              description="Upload the executed listing agreement, floor plan and any building documents."
              action={<Button variant="primary" size="sm" onClick={() => toast.success("Upload dialog would open here")}>Upload document</Button>}
            />
          </TabsContent>

          <TabsContent value="openhouses">
            {listing.openHouses.length === 0 ? (
              <EmptyState
                icon={<CalendarPlus />}
                title="No open houses scheduled"
                description="Schedule one to start collecting registrations from the public site."
                action={<Button variant="primary" size="sm" onClick={() => toast.success("Open house scheduled")}>Schedule open house</Button>}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Open houses</CardTitle>
                  <Button size="sm" variant="secondary" onClick={() => toast.success("Open house scheduled")}><CalendarPlus /> Schedule</Button>
                </CardHeader>
                <ul className="divide-y divide-line">
                  {listing.openHouses.map((oh) => (
                    <li key={oh.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-[8px] border border-line bg-canvas">
                        <span className="text-[9.5px] uppercase tracking-wider text-ink-4">{new Date(oh.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}</span>
                        <span className="text-[13px] font-semibold leading-none tabular text-ink">{new Date(oh.date + "T12:00:00").getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{oh.start} – {oh.end}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">Hosted by {agentName(oh.hostAgentId)}</p>
                      </div>
                      <Badge tone="neutral" size="sm">{oh.registrations} registered</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="marketing">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Just Listed postcard", status: "Mailed to 1,200 addresses", tone: "ok" },
                { name: "Instagram carousel", status: "Scheduled for Saturday", tone: "info" },
                { name: "Broker email blast", status: "Sent to 4,100 agents", tone: "ok" },
                { name: "Print — NYT Real Estate", status: "Not scheduled", tone: "neutral" },
                { name: "Video walkthrough", status: "In production", tone: "warn" },
                { name: "Building signage", status: "Not applicable", tone: "neutral" },
              ].map((m) => (
                <Card key={m.name}>
                  <CardBody>
                    <Megaphone className="size-4 text-ink-4" />
                    <p className="mt-3 text-[13.5px] font-medium text-ink">{m.name}</p>
                    <p className="mt-1 text-[12.5px] text-ink-3">{m.status}</p>
                    <Badge tone={m.tone as "ok"} size="sm" className="mt-3" dot>{m.tone === "ok" ? "Complete" : m.tone === "warn" ? "In progress" : m.tone === "info" ? "Scheduled" : "Not started"}</Badge>
                  </CardBody>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="offers">
            {listing.offers === 0 ? (
              <EmptyState
                icon={<Heart />}
                title="No offers received"
                description="Offers submitted through the listing agent will be tracked here with a net-to-seller comparison."
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Offers</CardTitle>
                  <Badge tone="brand" size="sm">{listing.offers} received</Badge>
                </CardHeader>
                <ul className="divide-y divide-line">
                  {Array.from({ length: listing.offers }).map((_, i) => {
                    const price = Math.round(listing.price * (0.94 + i * 0.03));
                    return (
                      <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-ink">{["Cash buyer — no contingencies", "Financed, 20% down", "Financed, 10% down + inspection"][i % 3]}</p>
                          <p className="mt-0.5 text-[11.5px] text-ink-4">Submitted {dateMed("2026-08-2" + (i + 1))} · {["Corcoran", "Compass", "Douglas Elliman"][i % 3]}</p>
                        </div>
                        <span className="text-[13px] tabular text-ink-3">{pct(((price / listing.price) - 1) * 100, 1)}</span>
                        <span className="w-24 text-right text-[13.5px] font-medium tabular text-ink">{compactUsd(price)}</span>
                        <StatusBadge value={i === 0 ? "under_contract" : "pending"} label={i === 0 ? "Accepted" : "Under review"} size="sm" />
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader><CardTitle>Listing activity</CardTitle></CardHeader>
              <CardBody>
                <Timeline
                  items={[
                    { id: "1", label: "Listing agreement executed", date: listing.listedOn, done: true, detail: `${agent.name} · ${usd(listing.originalPrice)}` },
                    { id: "2", label: "Photography delivered", date: listing.listedOn, done: true, detail: "Northlight Property Media" },
                    { id: "3", label: "Syndicated to portals", date: listing.listedOn, done: true, detail: "RLS, StreetEasy, Zillow, Realtor.com" },
                    ...(listing.price < listing.originalPrice
                      ? [{ id: "4", label: "Price improved", date: "2026-08-06", done: true, detail: `${usd(listing.originalPrice)} → ${usd(listing.price)}` }] : []),
                    ...listing.openHouses.map((oh) => ({ id: oh.id, label: "Open house", date: oh.date, done: oh.date < "2026-08-26", detail: `${oh.start}–${oh.end} · ${oh.registrations} registered` })),
                  ].sort((a, b) => b.date.localeCompare(a.date))}
                />
              </CardBody>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
