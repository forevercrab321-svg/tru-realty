"use client";
import * as React from "react";
import Link from "next/link";
import {
  Building2, CalendarDays, CheckCircle2, ClipboardList, DollarSign, FileSignature,
  Plus, TrendingUp, UserPlus, Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { AreaTrend, BarSeries } from "@/components/charts";
import {
  AnnouncementsWidget, ClosingsWidget, EventsWidget, RiskList, StageBreakdown, TaskQueue,
} from "@/components/admin/dashboard-widgets";
import { NewTransactionDialog } from "@/components/admin/create-dialogs";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { compactUsd, num, pct, usd } from "@/lib/format";
import { agents } from "@/data/agents";
import { announcements } from "@/data/company";
import { monthlySeries, officeComparison, topAgents } from "@/data/performance";
import { sum } from "@/lib/utils";

export default function AdminDashboard() {
  const { account } = useSession();
  const { transactions, events, recruits, signatureRequests } = useStore();

  const open = transactions.filter((t) => !["closed", "cancelled"].includes(t.stage));
  const closed = transactions.filter((t) => t.stage === "closed");
  const pendingClosings = open.filter((t) => ["closing", "final_walkthrough", "loan"].includes(t.stage));

  const tasks = open.flatMap((tx) => tx.tasks.filter((t) => t.status !== "done").map((task) => ({ task, tx })))
    .sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate));

  const riskFiles = open.filter((t) => t.riskFlags.length > 0);

  // Month-to-date figures come from the closed-ledger series so the KPI row and the
  // volume chart can never disagree. Replace with a SUM() over closed transactions
  // once the accounting ledger is the source of truth.
  const thisMonth = monthlySeries[monthlySeries.length - 1];
  const lastMonth = monthlySeries[monthlySeries.length - 2];
  const monthVolume = thisMonth.volume;
  const monthGci = thisMonth.gci;
  const volumeDelta = ((thisMonth.volume - lastMonth.volume) / lastMonth.volume) * 100;
  const gciDelta = ((thisMonth.gci - lastMonth.gci) / lastMonth.gci) * 100;
  const pipelineValue = sum(open, (t) => t.salePrice || t.listPrice);

  const stageGroups = [
    { label: "Lead & offer", tone: "ink", keys: ["lead", "offer"] },
    { label: "Accepted & under contract", tone: "brand", keys: ["accepted", "under_contract"] },
    { label: "Diligence (inspection · appraisal · loan)", tone: "warn", keys: ["inspection", "appraisal", "loan"] },
    { label: "Closing", tone: "ok", keys: ["final_walkthrough", "closing"] },
  ].map((g) => {
    const items = open.filter((t) => g.keys.includes(t.stage));
    return { label: g.label, tone: g.tone, count: items.length, value: sum(items, (t) => t.salePrice || t.listPrice) };
  });

  const activeAgents = agents.filter((a) => a.status === "active");
  const onboardingAgents = agents.filter((a) => a.status === "onboarding");
  const expiring = agents.filter((a) => ["expiring", "expired"].includes(a.license.status));

  return (
    <>
      <PageHeader
        title={`Good morning, ${account?.name.split(" ")[0]}`}
        description="Wednesday, August 26, 2026 · Here is where the brokerage stands this morning."
        actions={
          <>
            <Button variant="secondary" asChild><Link href="/admin/pipeline"><UserPlus /> Recruiting</Link></Button>
            <NewTransactionDialog trigger={<Button variant="primary"><Plus /> New transaction</Button>} />
          </>
        }
      />

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Monthly sales volume" value={compactUsd(monthVolume)} delta={volumeDelta} sub="August 2026 vs. July" icon={<TrendingUp />} tone="dark" />
        <MetricCard label="Monthly GCI" value={compactUsd(monthGci)} delta={gciDelta} sub="Gross commission income, August" icon={<DollarSign />} />
        <MetricCard label="Active transactions" value={num(open.length)} sub={`${compactUsd(pipelineValue)} in pipeline`} icon={<FileSignature />} />
        <MetricCard label="Pending closings" value={num(pendingClosings.length)} sub="Loan, walkthrough or closing stage" icon={<CheckCircle2 />} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total agents" value={num(agents.length)} sub={`${activeAgents.length} active · ${onboardingAgents.length} onboarding`} icon={<Users />} />
        <MetricCard label="Recruiting pipeline" value={num(recruits.filter((r) => !["joined", "not_interested"].includes(r.stage)).length)} sub={`${recruits.filter((r) => r.stage === "offer_sent").length} offers out`} icon={<UserPlus />} />
        <MetricCard label="Open tasks" value={num(tasks.length)} sub={`${tasks.filter((t) => t.task.status === "overdue").length} overdue`} icon={<ClipboardList />} />
        <MetricCard label="Signatures pending" value={num(signatureRequests.filter((s) => ["sent", "viewed"].includes(s.status)).length)} sub="Sent or viewed, not signed" icon={<FileSignature />} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sales volume</CardTitle>
              <p className="mt-0.5 text-[12.5px] text-ink-3">Closed volume by month, trailing twelve.</p>
            </div>
            <Badge tone="ok" size="sm" dot>+18.4% YoY</Badge>
          </CardHeader>
          <CardBody><AreaTrend data={monthlySeries} xKey="month" yKey="volume" name="Closed volume" height={240} /></CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Pipeline by stage</CardTitle>
              <p className="mt-0.5 text-[12.5px] text-ink-3">{open.length} open files · {compactUsd(pipelineValue)}</p>
            </div>
          </CardHeader>
          <CardBody><StageBreakdown groups={stageGroups} total={open.length} /></CardBody>
        </Card>
      </div>

      {/* Operational widgets */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <TaskQueue items={tasks} base="/admin" />
          <ClosingsWidget items={[...open].sort((a, b) => a.closingDate.localeCompare(b.closingDate))} base="/admin" />
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Office comparison</CardTitle>
                <p className="mt-0.5 text-[12.5px] text-ink-3">Year-to-date closed volume by office.</p>
              </div>
              <Button variant="ghost" size="xs" asChild><Link href="/admin/performance">Performance</Link></Button>
            </CardHeader>
            <CardBody><BarSeries data={officeComparison} xKey="office" yKey="volume" name="YTD volume" money horizontal height={190} /></CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <RiskList items={riskFiles} base="/admin" />
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Agent overview</CardTitle>
                <p className="mt-0.5 text-[12.5px] text-ink-3">Headcount and license health.</p>
              </div>
              <Button variant="ghost" size="xs" asChild><Link href="/admin/agents">Directory</Link></Button>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-y-4">
              {[
                ["Active agents", num(activeAgents.length), "ok"],
                ["In onboarding", num(onboardingAgents.length), "info"],
                ["Joined this month", num(agents.filter((a) => a.joinDate >= "2026-08-01").length), "brand"],
                ["Licenses expiring", num(expiring.length), expiring.length ? "warn" : "neutral"],
              ].map(([label, value, tone]) => (
                <div key={label}>
                  <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">{label}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-[19px] font-semibold tabular text-ink">{value}</p>
                    <Badge tone={tone as "ok"} size="sm" dot />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top producers, YTD</CardTitle>
              <Button variant="ghost" size="xs" asChild><Link href="/admin/performance">Rankings</Link></Button>
            </CardHeader>
            <ul className="divide-y divide-line">
              {topAgents.slice(0, 5).map((a, i) => (
                <li key={a.id}>
                  <Link href={`/admin/agents/${a.id}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-canvas">
                    <span className="w-4 shrink-0 text-[12px] tabular text-ink-4">{i + 1}</span>
                    <Avatar name={a.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{a.name}</p>
                      <p className="text-[11.5px] text-ink-4">{a.stats.ytdClosings} closings</p>
                    </div>
                    <span className="shrink-0 text-[13px] font-medium tabular text-ink">{compactUsd(a.stats.ytdVolume)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <EventsWidget items={events.filter((e) => e.date >= "2026-08-26").sort((a, b) => a.date.localeCompare(b.date))} base="/admin" />
          <AnnouncementsWidget items={announcements} />
        </div>
      </div>
    </>
  );
}
