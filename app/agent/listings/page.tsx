"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListingsView } from "@/components/admin/listings-view";
import { useStore } from "@/lib/store";
import { useCurrentAgent } from "@/lib/session";
import { agentName } from "@/data/agents";
import { compactUsd, dateMed, num } from "@/lib/format";
import { sum, asset } from "@/lib/utils";
import Link from "next/link";

export default function AgentListings() {
  const agent = useCurrentAgent();
  const { listings } = useStore();
  if (!agent) return null;

  const mine = listings.filter((l) => l.listingAgentId === agent.id);
  const onMarket = mine.filter((l) => ["active", "coming_soon"].includes(l.status));
  const company = listings.filter((l) => l.listingAgentId !== agent.id);
  const openHouses = mine.flatMap((l) => l.openHouses.map((oh) => ({ oh, l })))
    .sort((a, b) => a.oh.date.localeCompare(b.oh.date));

  return (
    <>
      <PageHeader title="Listings" description="Your inventory, company inventory and everything on the open-house calendar." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="My listings" value={num(mine.length)} sub={`${onMarket.length} on market`} />
        <MetricCard label="Listed value" value={compactUsd(sum(onMarket, (l) => l.price))} sub="Active and coming soon" />
        <MetricCard label="Showings booked" value={num(sum(mine, (l) => l.showings))} sub="Across your listings" />
        <MetricCard label="Open houses" value={num(openHouses.length)} sub="Scheduled" />
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My listings</TabsTrigger>
          <TabsTrigger value="company">Company listings</TabsTrigger>
          <TabsTrigger value="openhouses">Open houses</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="mine"><ListingsView rows={mine} base="/agent" showAgent={false} defaultAgentId={agent.id} /></TabsContent>
          <TabsContent value="company"><ListingsView rows={company} base="/agent" defaultAgentId={agent.id} /></TabsContent>
          <TabsContent value="openhouses">
            {openHouses.length === 0 ? (
              <EmptyState title="No open houses scheduled" description="Schedule one from a listing to start collecting registrations." />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming open houses</CardTitle>
                  <Badge tone="neutral" size="sm">{openHouses.length}</Badge>
                </CardHeader>
                <ul className="divide-y divide-line">
                  {openHouses.map(({ oh, l }) => (
                    <li key={oh.id} className="flex items-center gap-3 px-5 py-3.5">
                      <img src={asset(l.images[0])} alt="" className="size-10 shrink-0 rounded-[7px] object-cover" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/agent/listings/${l.id}`} className="truncate text-[13px] font-medium text-ink hover:underline">
                          {l.address}{l.unit ? `, ${l.unit}` : ""}
                        </Link>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">{dateMed(oh.date)} · {oh.start}–{oh.end} · host {agentName(oh.hostAgentId)}</p>
                      </div>
                      <Badge tone="neutral" size="sm">{oh.registrations} registered</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
