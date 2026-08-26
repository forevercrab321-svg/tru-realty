"use client";
import * as React from "react";
import Link from "next/link";
import { Download, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, ProgressBar } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status";
import { AreaTrend, BarSeries, Funnel, LineCompare } from "@/components/charts";
import { DataTable, type Column } from "@/components/ui/data-table";
import { monthlySeries, officeComparison, recruitingFunnel, sourceMix, topAgents } from "@/data/performance";
import { agents } from "@/data/agents";
import { officeName } from "@/data/offices";
import { compactUsd, num, pct, usd } from "@/lib/format";
import { sum } from "@/lib/utils";
import type { Agent } from "@/types";
import { toast } from "sonner";

export default function PerformancePage() {
  const ytdVolume = sum(agents, (a) => a.stats.ytdVolume);
  const ytdGci = sum(agents, (a) => a.stats.ytdGci);
  const ytdClosings = sum(agents, (a) => a.stats.ytdClosings);
  const avgVolume = ytdVolume / agents.filter((a) => a.stats.ytdVolume > 0).length;

  const columns: Column<Agent>[] = [
    {
      id: "rank", header: "#", width: "44px", align: "right", sortable: false,
      accessor: (a) => topAgents.findIndex((x) => x.id === a.id) + 1,
      cell: (a) => <span className="text-ink-4">{topAgents.findIndex((x) => x.id === a.id) + 1}</span>,
    },
    {
      id: "agent", header: "Agent", width: "210px", accessor: (a) => a.name,
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={a.name} size="sm" />
          <div className="min-w-0">
            <Link href={`/admin/agents/${a.id}`} className="block truncate font-medium text-ink hover:underline">{a.name}</Link>
            <p className="truncate text-[11.5px] text-ink-4">{officeName(a.officeId)}</p>
          </div>
        </div>
      ),
    },
    { id: "tier", header: "Tier", width: "104px", accessor: (a) => a.tier, cell: (a) => <StatusBadge value={a.tier} size="sm" /> },
    { id: "volume", header: "YTD volume", width: "120px", align: "right", accessor: (a) => a.stats.ytdVolume, cell: (a) => compactUsd(a.stats.ytdVolume) },
    { id: "gci", header: "YTD GCI", width: "110px", align: "right", accessor: (a) => a.stats.ytdGci, cell: (a) => compactUsd(a.stats.ytdGci) },
    { id: "closings", header: "Closings", width: "88px", align: "right", accessor: (a) => a.stats.ytdClosings, cell: (a) => a.stats.ytdClosings },
    { id: "avg", header: "Avg. price", width: "108px", align: "right", accessor: (a) => (a.stats.ytdClosings ? a.stats.ytdVolume / a.stats.ytdClosings : 0), cell: (a) => a.stats.ytdClosings ? compactUsd(a.stats.ytdVolume / a.stats.ytdClosings) : "—" },
    { id: "ratio", header: "List : sale", width: "94px", align: "right", accessor: (a) => a.stats.listToSaleRatio, cell: (a) => a.stats.listToSaleRatio ? pct(a.stats.listToSaleRatio) : "—" },
    { id: "dom", header: "Avg. DOM", width: "94px", align: "right", accessor: (a) => a.stats.avgDaysOnMarket, cell: (a) => a.stats.avgDaysOnMarket || "—" },
  ];

  return (
    <>
      <PageHeader
        title="Performance"
        description="Production, rankings and recruiting conversion across the brokerage."
        actions={<Button variant="secondary" onClick={() => toast.success("Report queued — it will land in your inbox")}><Download /> Export report</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="YTD sales volume" value={compactUsd(ytdVolume)} delta={18.4} sub="vs. same period 2025" tone="dark" />
        <MetricCard label="YTD gross commission" value={compactUsd(ytdGci)} delta={16.2} sub="Company-wide GCI" />
        <MetricCard label="YTD closings" value={num(ytdClosings)} delta={11.5} sub="Units closed" />
        <MetricCard label="Avg. volume per producing agent" value={compactUsd(avgVolume)} sub={`${agents.filter((a) => a.stats.ytdVolume > 0).length} producing agents`} />
      </div>

      <Tabs defaultValue="production">
        <TabsList>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="offices">Offices</TabsTrigger>
          <TabsTrigger value="recruiting">Recruiting</TabsTrigger>
          <TabsTrigger value="sources">Lead sources</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="production">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Monthly sales volume</CardTitle></CardHeader>
                <CardBody><AreaTrend data={monthlySeries} xKey="month" yKey="volume" name="Volume" height={250} /></CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Monthly closings</CardTitle></CardHeader>
                <CardBody><BarSeries data={monthlySeries} xKey="month" yKey="closings" name="Closings" height={250} /></CardBody>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div>
                    <CardTitle>GCI vs. active listings</CardTitle>
                    <p className="mt-0.5 text-[12.5px] text-ink-3">Commission income tracks listing intake with roughly a two-month lag.</p>
                  </div>
                </CardHeader>
                <CardBody>
                  <LineCompare data={monthlySeries} xKey="month" money dualAxis series={[{ key: "gci", name: "GCI" }, { key: "listings", name: "Active listings" }]} height={260} />
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rankings">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Top producers</CardTitle>
                <Trophy className="size-4 text-warn-500" />
              </CardHeader>
              <CardBody className="space-y-3">
                {topAgents.slice(0, 5).map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="w-4 text-[12px] tabular text-ink-4">{i + 1}</span>
                    <Avatar name={a.name} size="sm" />
                    <Link href={`/admin/agents/${a.id}`} className="w-[160px] shrink-0 truncate text-[13px] text-ink hover:underline">{a.name}</Link>
                    <ProgressBar value={(a.stats.ytdVolume / topAgents[0].stats.ytdVolume) * 100} className="flex-1" tone={i === 0 ? "brand" : "ink"} />
                    <span className="w-16 shrink-0 text-right text-[13px] font-medium tabular text-ink">{compactUsd(a.stats.ytdVolume)}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
            <DataTable
              data={topAgents}
              columns={columns}
              getRowId={(a) => a.id}
              searchKeys={(a) => `${a.name} ${officeName(a.officeId)}`}
              searchPlaceholder="Search agents…"
              exportName="tru-rankings"
              pageSize={16}
              emptyTitle="No production data"
            />
          </TabsContent>

          <TabsContent value="offices">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Volume by office</CardTitle></CardHeader>
                <CardBody><BarSeries data={officeComparison} xKey="office" yKey="volume" name="YTD volume" money horizontal height={230} /></CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Office detail</CardTitle></CardHeader>
                <CardBody className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.06em] text-ink-4">
                        <th className="px-5 py-2 font-medium">Office</th>
                        <th className="px-3 py-2 text-right font-medium">Agents</th>
                        <th className="px-3 py-2 text-right font-medium">Closings</th>
                        <th className="px-3 py-2 text-right font-medium">Volume</th>
                        <th className="px-5 py-2 text-right font-medium">Per agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {officeComparison.map((o) => (
                        <tr key={o.office} className="border-b border-line/70 text-[13px] last:border-0">
                          <td className="px-5 py-2.5 font-medium text-ink">{o.office}</td>
                          <td className="px-3 py-2.5 text-right tabular text-ink-2">{o.agents}</td>
                          <td className="px-3 py-2.5 text-right tabular text-ink-2">{o.closings}</td>
                          <td className="px-3 py-2.5 text-right tabular text-ink-2">{compactUsd(o.volume)}</td>
                          <td className="px-5 py-2.5 text-right tabular text-ink-2">{compactUsd(o.volume / Math.max(1, o.agents))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recruiting">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Recruiting funnel, trailing 12 months</CardTitle>
                    <p className="mt-0.5 text-[12.5px] text-ink-3">
                      {pct((recruitingFunnel[5].count / recruitingFunnel[0].count) * 100, 1)} lead-to-join conversion.
                    </p>
                  </div>
                </CardHeader>
                <CardBody><Funnel data={recruitingFunnel} /></CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Conversion by stage</CardTitle></CardHeader>
                <CardBody className="space-y-3.5">
                  {recruitingFunnel.slice(0, -1).map((s, i) => {
                    const next = recruitingFunnel[i + 1];
                    const rate = (next.count / s.count) * 100;
                    return (
                      <div key={s.stage}>
                        <div className="flex items-baseline justify-between">
                          <p className="text-[13px] text-ink-2">{s.stage} → {next.stage}</p>
                          <p className="text-[12.5px] tabular text-ink-3">{pct(rate, 0)}</p>
                        </div>
                        <ProgressBar value={rate} className="mt-1.5" tone={rate > 50 ? "ok" : rate > 30 ? "warn" : "risk"} />
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sources">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Closed volume by lead source</CardTitle></CardHeader>
                <CardBody><BarSeries data={sourceMix} xKey="source" yKey="volume" name="Volume" money horizontal height={260} /></CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Deals by source</CardTitle></CardHeader>
                <CardBody className="space-y-3.5">
                  {sourceMix.map((s) => (
                    <div key={s.source}>
                      <div className="flex items-baseline justify-between">
                        <p className="text-[13px] text-ink-2">{s.source}</p>
                        <p className="text-[12.5px] tabular text-ink-3">{s.deals} deals · {compactUsd(s.volume)}</p>
                      </div>
                      <ProgressBar value={(s.deals / sourceMix[0].deals) * 100} className="mt-1.5" />
                    </div>
                  ))}
                  <p className="border-t border-line pt-3 text-[12px] leading-relaxed text-ink-4">
                    Sphere and past-client business still produces the highest average sale price. Portal leads convert
                    at roughly a third of the rate but fill the top of the funnel.
                  </p>
                </CardBody>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
