"use client";
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight, Banknote, Blocks, CalendarDays, Contact, FileSignature, Plus,
  Sparkles, TrendingUp, Upload, Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard, ProgressBar } from "@/components/ui/metric-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AnnouncementsWidget, EventsWidget, TaskQueue, TransactionMini,
} from "@/components/admin/dashboard-widgets";
import { NewClientDialog, NewTransactionDialog } from "@/components/admin/create-dialogs";
import { useStore } from "@/lib/store";
import { useCurrentAgent, useSession } from "@/lib/session";
import { announcements } from "@/data/company";
import { compactUsd, num, relative, usd } from "@/lib/format";
import { sum } from "@/lib/utils";

export default function AgentDashboard() {
  const { account } = useSession();
  const agent = useCurrentAgent();
  const { transactions, clients, events, eventRegistrations, rsvp } = useStore();

  if (!agent) return null;

  const myTx = transactions.filter((t) => t.agentId === agent.id || t.coAgentId === agent.id);
  const openTx = myTx.filter((t) => !["closed", "cancelled"].includes(t.stage));
  const closingSoon = openTx.filter((t) => ["loan", "final_walkthrough", "closing"].includes(t.stage));
  const myClients = clients.filter((c) => c.agentId === agent.id);
  const newLeads = myClients.filter((c) => c.status === "new_lead");
  const followUps = myClients.filter((c) => c.nextFollowUp && c.nextFollowUp <= "2026-08-31");

  const tasks = openTx.flatMap((tx) => tx.tasks.filter((t) => t.status !== "done").map((task) => ({ task, tx })))
    .sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate));

  const myRegs = eventRegistrations.filter((r) => r.agentId === agent.id).map((r) => r.eventId);
  const upcoming = events.filter((e) => e.date >= "2026-08-26").sort((a, b) => a.date.localeCompare(b.date));

  const pipelineNet = sum(openTx, (t) => t.commission.netAgent);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${account?.name.split(" ")[0]}`}
        description="Wednesday, August 26, 2026 · Here is what needs you today."
        actions={
          <>
            <NewClientDialog defaultAgentId={agent.id} trigger={<Button variant="secondary"><Contact /> Add client</Button>} />
            <NewTransactionDialog defaultAgentId={agent.id} trigger={<Button variant="primary"><Plus /> New deal</Button>} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Active deals" value={num(openTx.length)} sub={`${compactUsd(sum(openTx, (t) => t.salePrice || t.listPrice))} in pipeline`} tone="dark" />
        <MetricCard label="Pending closings" value={num(closingSoon.length)} sub="Loan or later" />
        <MetricCard label="YTD volume" value={compactUsd(agent.stats.ytdVolume)} sub={`${agent.stats.ytdClosings} closings`} />
        <MetricCard label="YTD commission" value={compactUsd(agent.stats.ytdGci)} sub="Gross, before splits" />
        <MetricCard label="New leads" value={num(newLeads.length)} sub={`${myClients.length} total clients`} />
        <MetricCard label="Upcoming events" value={num(upcoming.length)} sub={`${myRegs.length} registered`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>My deals</CardTitle>
                <p className="mt-0.5 text-[12.5px] text-ink-3">{compactUsd(pipelineNet)} in net commission across {openTx.length} open files.</p>
              </div>
              <Button variant="ghost" size="xs" asChild><Link href="/agent/transactions">All deals <ArrowRight /></Link></Button>
            </CardHeader>
            <CardBody className="space-y-2">
              {openTx.length === 0 ? (
                <EmptyState
                  title="No active deals yet"
                  description="When you open a transaction it will show up here with its milestones and commission."
                  action={<NewTransactionDialog defaultAgentId={agent.id} trigger={<Button variant="primary" size="sm"><Plus /> Open a deal</Button>} />}
                  className="border-dashed"
                />
              ) : (
                openTx.slice(0, 5).map((t) => <TransactionMini key={t.id} tx={t} base="/agent" />)
              )}
            </CardBody>
          </Card>

          <TaskQueue items={tasks} base="/agent" />

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Follow-ups due</CardTitle>
                <p className="mt-0.5 text-[12.5px] text-ink-3">Clients you told yourself you would call this week.</p>
              </div>
              <Button variant="ghost" size="xs" asChild><Link href="/agent/clients">All clients <ArrowRight /></Link></Button>
            </CardHeader>
            {followUps.length === 0 ? (
              <EmptyState title="Nothing due" description="No follow-ups scheduled through the end of the month." className="m-4 border-dashed" />
            ) : (
              <ul className="divide-y divide-line">
                {followUps.map((c) => (
                  <li key={c.id}>
                    <Link href={`/agent/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas">
                      <Avatar name={c.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{c.name}</p>
                        <p className="mt-0.5 truncate text-[11.5px] text-ink-4">
                          {c.areas.join(", ") || "No area"} · {c.budgetMax ? `${compactUsd(c.budgetMin)}–${compactUsd(c.budgetMax)}` : "budget TBD"}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[12px] tabular ${c.nextFollowUp! <= "2026-08-27" ? "text-risk-500" : "text-ink-3"}`}>
                        {relative(c.nextFollowUp!)}
                      </span>
                      <StatusBadge value={c.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Commission this year</CardTitle></CardHeader>
            <CardBody>
              <p className="text-[26px] font-semibold tabular tracking-[-0.025em] text-ink">{usd(agent.stats.ytdGci)}</p>
              <p className="mt-1 text-[12.5px] text-ink-3">Gross commission earned, {agent.stats.ytdClosings} closings</p>
              <div className="mt-4 border-t border-line pt-3.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-[12.5px] text-ink-2">Cap progress · {agent.plan.name}</p>
                  <p className="text-[12.5px] tabular text-ink-3">{usd(agent.plan.capYtd)} / {usd(agent.plan.cap)}</p>
                </div>
                <ProgressBar value={(agent.plan.capYtd / agent.plan.cap) * 100} className="mt-1.5" tone={agent.plan.capYtd >= agent.plan.cap ? "ok" : "brand"} />
                <p className="mt-2 text-[12px] text-ink-4">
                  {agent.plan.capYtd >= agent.plan.cap
                    ? "You are capped — you keep 100% of company dollar for the rest of the year."
                    : `${usd(agent.plan.cap - agent.plan.capYtd)} of company dollar left before you cap.`}
                </p>
              </div>
              <Button variant="secondary" size="sm" full className="mt-4" asChild>
                <Link href="/agent/commission"><Banknote /> Commission detail</Link>
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
            <CardBody className="grid grid-cols-2 gap-2">
              {[
                { label: "Project signing", href: "/agent/projects", icon: <Blocks /> },
                { label: "Event hub", href: "/agent/events", icon: <CalendarDays /> },
                { label: "Library", href: "/agent/library", icon: <Upload /> },
                { label: "My listings", href: "/agent/listings", icon: <TrendingUp /> },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-[9px] border border-line bg-canvas px-3 py-2.5 text-[12.5px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink [&_svg]:size-4 [&_svg]:text-ink-4">
                  {l.icon} {l.label}
                </Link>
              ))}
            </CardBody>
          </Card>

          <EventsWidget items={upcoming} base="/agent" registeredIds={myRegs} onRsvp={(id) => rsvp(id, agent.id)} />
          <AnnouncementsWidget items={announcements.filter((a) => a.audience !== "admins")} />
        </div>
      </div>
    </>
  );
}
