"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cake, Grid3x3, IdCard, Mail, Plus, Rows3, ShieldCheck, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger, Segmented } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, ProgressBar } from "@/components/ui/metric-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { NewRecruitDialog } from "@/components/admin/create-dialogs";
import { agents } from "@/data/agents";
import { agentActivity } from "@/data/derived";
import { offices, officeName } from "@/data/offices";
import { onboarding } from "@/data/pipeline";
import { agreements, trainingRecords, userName } from "@/data/company";
import { compactUsd, dateMed, dateShort, daysUntil, num, titleCase } from "@/lib/format";
import type { Agent } from "@/types";
import { toast } from "sonner";

export default function AgentsPage() {
  const router = useRouter();
  const [view, setView] = React.useState<"table" | "cards">("table");

  const active = agents.filter((a) => a.status === "active");
  const onboardingAgents = agents.filter((a) => a.status === "onboarding");
  const expiring = agents.filter((a) => ["expiring", "expired"].includes(a.license.status));
  const overdueTraining = trainingRecords.filter((t) => t.status === "overdue");

  const upcomingDates = agents
    .map((a) => {
      const [m, d] = a.birthday.split("-").map(Number);
      const anniversary = new Date(a.joinDate);
      return {
        agent: a,
        birthday: new Date(2026, m - 1, d),
        anniversaryYears: 2026 - anniversary.getFullYear(),
        anniversaryDate: new Date(2026, anniversary.getMonth(), anniversary.getDate()),
      };
    })
    .flatMap((x) => [
      { agent: x.agent, kind: "Birthday", date: x.birthday },
      ...(x.anniversaryYears > 0 ? [{ agent: x.agent, kind: `${x.anniversaryYears}-year anniversary`, date: x.anniversaryDate }] : []),
    ])
    .filter((x) => {
      const diff = (x.date.getTime() - new Date("2026-08-26").getTime()) / 86400000;
      return diff >= 0 && diff <= 75;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const columns: Column<Agent>[] = [
    {
      id: "name", header: "Agent", width: "230px", accessor: (a) => a.name,
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={a.name} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{a.name}</p>
            <p className="truncate text-[11.5px] text-ink-4">{a.title}</p>
          </div>
        </div>
      ),
    },
    { id: "office", header: "Office", width: "140px", accessor: (a) => officeName(a.officeId), cell: (a) => officeName(a.officeId) },
    { id: "status", header: "Status", width: "116px", accessor: (a) => a.status, cell: (a) => <StatusBadge value={a.status} size="sm" /> },
    { id: "tier", header: "Tier", width: "104px", defaultHidden: true, accessor: (a) => a.tier, cell: (a) => <StatusBadge value={a.tier} size="sm" /> },
    { id: "volume", header: "YTD volume", width: "116px", align: "right", accessor: (a) => a.stats.ytdVolume, cell: (a) => compactUsd(a.stats.ytdVolume) },
    { id: "gci", header: "YTD GCI", width: "104px", align: "right", accessor: (a) => a.stats.ytdGci, cell: (a) => compactUsd(a.stats.ytdGci) },
    { id: "deals", header: "Active", width: "76px", align: "right", accessor: (a) => agentActivity(a.id).activeDeals, cell: (a) => agentActivity(a.id).activeDeals },
    { id: "listings", header: "Listings", width: "80px", align: "right", defaultHidden: true, accessor: (a) => agentActivity(a.id).activeListings, cell: (a) => agentActivity(a.id).activeListings },
    {
      id: "license", header: "License", width: "128px",
      accessor: (a) => a.license.expires,
      cell: (a) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge value={a.license.status} size="sm" />
          <span className="text-[11.5px] tabular text-ink-4">{dateShort(a.license.expires)}</span>
        </div>
      ),
    },
    { id: "mls", header: "MLS", width: "96px", defaultHidden: true, accessor: (a) => a.mls.status, cell: (a) => <StatusBadge value={a.mls.status} size="sm" /> },
    { id: "join", header: "Joined", width: "104px", defaultHidden: true, accessor: (a) => a.joinDate, cell: (a) => <span className="tabular">{dateShort(a.joinDate)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Agents & HR"
        description="Directory, licensing, onboarding, training and agreements for everyone on the roster."
        actions={
          <>
            <Button variant="secondary" asChild><Link href="/admin/pipeline"><UserPlus /> Onboarding</Link></Button>
            <NewRecruitDialog trigger={<Button variant="primary"><Plus /> Add candidate</Button>} />
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active agents" value={num(active.length)} sub={`${agents.length} on the roster`} />
        <MetricCard label="In onboarding" value={num(onboardingAgents.length)} sub="Not yet producing" />
        <MetricCard label="Licenses needing action" value={num(expiring.length)} sub="Expiring within 60 days or lapsed" icon={<IdCard />} />
        <MetricCard label="Overdue CE" value={num(overdueTraining.length)} sub="Course requirements past due" icon={<ShieldCheck />} />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="licenses">Licenses & MLS</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="directory">
            <div className="mb-3 flex justify-end">
              <Segmented value={view} onChange={setView} options={[{ value: "table", label: <><Rows3 /> Table</> }, { value: "cards", label: <><Grid3x3 /> Cards</> }]} />
            </div>
            {view === "table" ? (
              <DataTable
                data={agents}
                columns={columns}
                getRowId={(a) => a.id}
                onRowClick={(a) => router.push(`/admin/agents/${a.id}`)}
                searchKeys={(a) => `${a.name} ${a.email} ${a.title} ${a.neighborhoods.join(" ")} ${a.license.number}`}
                searchPlaceholder="Search agents, license numbers…"
                exportName="tru-agents"
                savedViews={[
                  { id: "v1", name: "Needs license action", filters: { license: ["expiring", "expired"] }, search: "" },
                  { id: "v2", name: "Onboarding", filters: { status: ["onboarding"] }, search: "" },
                  { id: "v3", name: "Top tier", filters: { tier: ["platinum", "gold"] }, search: "" },
                ]}
                filters={[
                  { id: "office", label: "Office", options: offices.map((o) => ({ value: o.id, label: o.name.replace(" — Headquarters", "") })), match: (a, v) => a.officeId === v },
                  { id: "status", label: "Status", options: ["active", "onboarding", "inactive", "offboarding"].map((s) => ({ value: s, label: titleCase(s) })), match: (a, v) => a.status === v },
                  { id: "tier", label: "Production tier", options: ["platinum", "gold", "silver", "emerging"].map((s) => ({ value: s, label: titleCase(s) })), match: (a, v) => a.tier === v },
                  { id: "license", label: "License", options: ["active", "expiring", "expired", "pending"].map((s) => ({ value: s, label: titleCase(s) })), match: (a, v) => a.license.status === v },
                  { id: "mls", label: "MLS", options: ["active", "pending", "inactive"].map((s) => ({ value: s, label: titleCase(s) })), match: (a, v) => a.mls.status === v },
                ]}
                bulkActions={[
                  { label: "Email selected", icon: <Mail />, onClick: (ids) => toast.success(`Draft started for ${ids.length} agents`) },
                  { label: "Request license update", icon: <IdCard />, onClick: (ids) => toast.success(`License request sent to ${ids.length} agents`) },
                ]}
                emptyTitle="No agents match those filters"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {agents.map((a) => (
                  <Link key={a.id} href={`/admin/agents/${a.id}`} className="rounded-xl border border-line bg-surface p-4 shadow-xs transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <Avatar name={a.name} size="xl" />
                      <StatusBadge value={a.status} size="sm" />
                    </div>
                    <p className="mt-3 text-[14px] font-semibold text-ink">{a.name}</p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-3">{a.title}</p>
                    <p className="mt-0.5 text-[12px] text-ink-4">{officeName(a.officeId)}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
                      <div>
                        <dt className="text-[10.5px] uppercase tracking-wider text-ink-4">YTD volume</dt>
                        <dd className="mt-0.5 text-[13px] font-medium tabular text-ink">{compactUsd(a.stats.ytdVolume)}</dd>
                      </div>
                      <div>
                        <dt className="text-[10.5px] uppercase tracking-wider text-ink-4">Active deals</dt>
                        <dd className="mt-0.5 text-[13px] font-medium tabular text-ink">{agentActivity(a.id).activeDeals}</dd>
                      </div>
                    </dl>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="licenses">
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>License & MLS status</CardTitle>
                    <p className="mt-0.5 text-[12.5px] text-ink-3">New York renewals run on a two-year cycle from the issue date.</p>
                  </div>
                </CardHeader>
                <ul className="divide-y divide-line">
                  {[...agents].sort((a, b) => a.license.expires.localeCompare(b.license.expires)).map((a) => {
                    const days = daysUntil(a.license.expires);
                    return (
                      <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                        <Avatar name={a.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <Link href={`/admin/agents/${a.id}`} className="truncate text-[13px] font-medium text-ink hover:underline">{a.name}</Link>
                          <p className="mt-0.5 truncate text-[11.5px] text-ink-4">
                            {a.license.type} · #{a.license.number} · {a.license.state}
                          </p>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-[12px] text-ink-3">MLS {a.mls.mlsId}</p>
                          <p className="text-[11px] text-ink-4">{a.mls.board}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12.5px] tabular text-ink-2">{dateShort(a.license.expires)}</p>
                          <p className={`text-[11px] tabular ${days < 0 ? "text-risk-500" : days < 60 ? "text-warn-700" : "text-ink-4"}`}>
                            {days < 0 ? `${-days} days ago` : `in ${days} days`}
                          </p>
                        </div>
                        <StatusBadge value={a.license.status} size="sm" />
                      </li>
                    );
                  })}
                </ul>
              </Card>
              <Card>
                <CardHeader><CardTitle>Action needed</CardTitle></CardHeader>
                {expiring.length === 0 ? (
                  <EmptyState title="Everyone is current" description="No license or MLS issues on the roster." className="m-4 border-dashed" />
                ) : (
                  <ul className="divide-y divide-line">
                    {expiring.map((a) => (
                      <li key={a.id} className="px-5 py-3">
                        <p className="text-[13px] font-medium text-ink">{a.name}</p>
                        <p className="mt-0.5 text-[12px] text-ink-3">
                          License {a.license.status === "expired" ? "expired" : "expires"} {dateMed(a.license.expires)}
                        </p>
                        <Button size="xs" variant="secondary" className="mt-2" onClick={() => toast.success(`Renewal reminder sent to ${a.name}`)}>
                          Send reminder
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="training">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Continuing education & training</CardTitle>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">
                    {trainingRecords.filter((t) => t.status === "completed").length} of {trainingRecords.length} course requirements complete across the roster.
                  </p>
                </div>
                <Badge tone={overdueTraining.length ? "risk" : "ok"} size="sm">{overdueTraining.length} overdue</Badge>
              </CardHeader>
              <CardBody className="space-y-4">
                {agents.map((a) => {
                  const mine = trainingRecords.filter((t) => t.agentId === a.id);
                  const done = mine.filter((t) => t.status === "completed").length;
                  const overdue = mine.filter((t) => t.status === "overdue").length;
                  return (
                    <div key={a.id} className="flex items-center gap-3">
                      <Avatar name={a.name} size="sm" />
                      <Link href={`/admin/agents/${a.id}`} className="w-[150px] shrink-0 truncate text-[13px] text-ink hover:underline">{a.name}</Link>
                      <ProgressBar value={(done / mine.length) * 100} tone={overdue ? "warn" : "brand"} className="flex-1" />
                      <span className="w-14 shrink-0 text-right text-[12px] tabular text-ink-3">{done}/{mine.length}</span>
                      {overdue > 0 && <Badge tone="risk" size="sm">{overdue} overdue</Badge>}
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="agreements">
            <Card>
              <CardHeader>
                <CardTitle>Agreements & contracts</CardTitle>
                <Badge tone="warn" size="sm">{agreements.filter((a) => a.status === "pending").length} pending signature</Badge>
              </CardHeader>
              <ul className="divide-y divide-line">
                {agreements.filter((ag) => ag.status === "pending").concat(agreements.filter((ag) => ag.status !== "pending").slice(0, 14)).map((ag) => {
                  const agent = agents.find((a) => a.id === ag.agentId)!;
                  return (
                    <li key={ag.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={agent.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{ag.name}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">{agent.name} · version {ag.version}</p>
                      </div>
                      <Badge tone="neutral" size="sm">{ag.type}</Badge>
                      <span className="text-[12px] tabular text-ink-3">{ag.signedOn ? dateShort(ag.signedOn) : "—"}</span>
                      <StatusBadge value={ag.status} size="sm" />
                    </li>
                  );
                })}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="milestones">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Birthdays & anniversaries</CardTitle>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">Next 75 days. A small note goes a long way with a 16-person roster.</p>
                </div>
                <Cake className="size-4 text-ink-4" />
              </CardHeader>
              {upcomingDates.length === 0 ? (
                <EmptyState icon={<Cake />} title="Nothing coming up" description="No birthdays or work anniversaries in the next 75 days." className="m-4 border-dashed" />
              ) : (
                <ul className="divide-y divide-line">
                  {upcomingDates.map((u, i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={u.agent.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{u.agent.name}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">{u.kind}</p>
                      </div>
                      <span className="text-[12.5px] tabular text-ink-3">
                        {u.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <Button size="xs" variant="secondary" onClick={() => toast.success(`Note queued for ${u.agent.firstName}`)}>Send a note</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
