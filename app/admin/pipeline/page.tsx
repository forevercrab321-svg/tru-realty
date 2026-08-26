"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, LayoutGrid, Plus, Rows3, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger, Segmented } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanBoard } from "@/components/ui/kanban";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ProgressBar } from "@/components/ui/metric-card";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { NewRecruitDialog, NewTransactionDialog } from "@/components/admin/create-dialogs";
import { TransactionTable } from "@/components/admin/transaction-table";
import { useStore } from "@/lib/store";
import { RECRUIT_STAGES, ONBOARDING_STAGES, onboarding } from "@/data/pipeline";
import { TX_STAGES } from "@/data/transactions";
import { agentById, agentName } from "@/data/agents";
import { officeName } from "@/data/offices";
import { userName } from "@/data/company";
import { compactUsd, dateShort, num, relative, titleCase } from "@/lib/format";
import { sum, asset } from "@/lib/utils";
import type { RecruitCandidate, Transaction } from "@/types";

type View = "kanban" | "table";

export default function PipelinePage() {
  const { recruits, transactions, moveRecruitStage, moveTransactionStage } = useStore();
  const router = useRouter();
  const [recruitView, setRecruitView] = React.useState<View>("kanban");
  const [txView, setTxView] = React.useState<View>("kanban");

  const openTx = transactions.filter((t) => !["closed", "cancelled"].includes(t.stage));
  const activeRecruits = recruits.filter((r) => !["joined", "not_interested"].includes(r.stage));
  const allTasks = openTx.flatMap((tx) => tx.tasks.filter((t) => t.status !== "done").map((task) => ({ ...task, tx })));

  const viewToggle = (v: View, set: (v: View) => void) => (
    <Segmented
      value={v}
      onChange={set}
      options={[{ value: "kanban", label: <><Columns3 /> Board</> }, { value: "table", label: <><Rows3 /> Table</> }]}
    />
  );

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Recruiting, onboarding and transaction flow in one place. Drag a card to move a stage."
        actions={
          <>
            <NewRecruitDialog trigger={<Button variant="secondary"><UserPlus /> Add candidate</Button>} />
            <NewTransactionDialog trigger={<Button variant="primary"><Plus /> New transaction</Button>} />
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Candidates in play" value={num(activeRecruits.length)} sub={`${compactUsd(sum(activeRecruits, (r) => r.productionVolume))} of trailing production`} />
        <MetricCard label="Offers outstanding" value={num(recruits.filter((r) => r.stage === "offer_sent").length)} sub="Awaiting a decision" />
        <MetricCard label="Agents onboarding" value={num(onboarding.filter((o) => o.stage !== "active").length)} sub="Not yet activated" />
        <MetricCard label="Open follow-ups" value={num(allTasks.length)} sub={`${allTasks.filter((t) => t.status === "overdue").length} overdue`} />
      </div>

      <Tabs defaultValue="recruiting">
        <TabsList>
          <TabsTrigger value="recruiting">Recruiting</TabsTrigger>
          <TabsTrigger value="onboarding">Agent onboarding</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="followups">Follow-up tasks</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {/* ---------------------------------------------------- RECRUITING */}
          <TabsContent value="recruiting">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] text-ink-3">{recruits.length} candidates · {recruits.filter((r) => r.stage === "joined").length} joined this year</p>
              {viewToggle(recruitView, setRecruitView)}
            </div>
            {recruitView === "kanban" ? (
              <KanbanBoard
                columns={RECRUIT_STAGES}
                items={recruits}
                getId={(r) => r.id}
                columnOf={(r) => r.stage}
                onMove={(id, stage) => moveRecruitStage(id, stage as RecruitCandidate["stage"])}
                summary={(items) => compactUsd(sum(items, (r) => r.productionVolume))}
                renderCard={(r) => <RecruitCard r={r} />}
              />
            ) : (
              <RecruitTable rows={recruits} />
            )}
          </TabsContent>

          {/* ---------------------------------------------------- ONBOARDING */}
          <TabsContent value="onboarding">
            <div className="grid gap-4 lg:grid-cols-2">
              {onboarding.map((o) => {
                const agent = agentById(o.agentId)!;
                const done = o.checklist.filter((c) => c.done).length;
                const stageIdx = ONBOARDING_STAGES.findIndex((s) => s.key === o.stage);
                return (
                  <Card key={o.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={agent.name} size="md" />
                        <div>
                          <CardTitle>{agent.name}</CardTitle>
                          <p className="mt-0.5 text-[12px] text-ink-4">{officeName(agent.officeId)} · target {dateShort(o.targetActivation)}</p>
                        </div>
                      </div>
                      <StatusBadge value={o.stage} size="sm" />
                    </CardHeader>
                    <CardBody>
                      <div className="mb-4 flex items-center gap-1">
                        {ONBOARDING_STAGES.map((s, i) => (
                          <span key={s.key} className={`h-1 flex-1 rounded-full ${i <= stageIdx ? "bg-brand-600" : "bg-sunken"}`} />
                        ))}
                      </div>
                      <div className="mb-3 flex items-baseline justify-between">
                        <p className="text-[12.5px] text-ink-2">Checklist</p>
                        <p className="text-[12.5px] tabular text-ink-3">{done}/{o.checklist.length}</p>
                      </div>
                      <ProgressBar value={(done / o.checklist.length) * 100} />
                      <ul className="mt-4 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                        {o.checklist.map((c) => (
                          <li key={c.key} className="flex items-center gap-1.5 text-[12.5px]">
                            <span className={`size-1.5 shrink-0 rounded-full ${c.done ? "bg-brand-600" : c.required ? "bg-warn-500" : "bg-line-strong"}`} />
                            <span className={c.done ? "text-ink-4 line-through" : "text-ink-2"}>{c.label}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                        <p className="text-[12px] text-ink-4">Owner · {userName(o.assignedTo)}</p>
                        <Button size="xs" variant="secondary" asChild><Link href={`/admin/agents/${agent.id}`}>Open profile</Link></Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* -------------------------------------------------- TRANSACTIONS */}
          <TabsContent value="transactions">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] text-ink-3">{openTx.length} open files · {compactUsd(sum(openTx, (t) => t.salePrice || t.listPrice))}</p>
              {viewToggle(txView, setTxView)}
            </div>
            {txView === "kanban" ? (
              <KanbanBoard
                columns={TX_STAGES.filter((s) => s.key !== "closed")}
                items={transactions.filter((t) => t.stage !== "closed")}
                getId={(t) => t.id}
                columnOf={(t) => t.stage}
                onMove={(id, stage) => moveTransactionStage(id, stage as Transaction["stage"])}
                summary={(items) => compactUsd(sum(items, (t) => t.salePrice || t.listPrice))}
                renderCard={(t) => <TxCard t={t} onOpen={() => router.push(`/admin/transactions/${t.id}`)} />}
              />
            ) : (
              <TransactionTable rows={openTx} base="/admin" />
            )}
          </TabsContent>

          {/* ----------------------------------------------------- FOLLOW-UPS */}
          <TabsContent value="followups">
            {allTasks.length === 0 ? (
              <EmptyState title="No open follow-ups" description="Every task across active files is complete." />
            ) : (
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Follow-up tasks</CardTitle>
                    <p className="mt-0.5 text-[12.5px] text-ink-3">Across every open transaction, ordered by due date.</p>
                  </div>
                  <Badge tone={allTasks.some((t) => t.status === "overdue") ? "risk" : "ok"} size="sm">
                    {allTasks.filter((t) => t.status === "overdue").length} overdue
                  </Badge>
                </CardHeader>
                <ul className="divide-y divide-line">
                  {[...allTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((t) => (
                    <li key={t.id}>
                      <Link href={`/admin/transactions/${t.tx.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas">
                        <StatusBadge value={t.priority} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-ink">{t.title}</p>
                          <p className="mt-0.5 truncate text-[11.5px] text-ink-4">
                            {t.tx.address} · {t.tx.ref} · {agentName(t.tx.agentId)}
                          </p>
                        </div>
                        <span className="hidden text-[12px] text-ink-3 sm:block">{titleCase(t.category)}</span>
                        <span className={`shrink-0 text-[12px] tabular ${t.status === "overdue" ? "text-risk-500" : "text-ink-3"}`}>
                          {relative(t.dueDate)}
                        </span>
                        <StatusBadge value={t.status} size="sm" />
                      </Link>
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

function RecruitCard({ r }: { r: RecruitCandidate }) {
  return (
    <div className="p-3">
      <div className="flex items-start gap-2.5">
        <Avatar name={r.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{r.name}</p>
          <p className="truncate text-[11.5px] text-ink-4">{r.currentBrokerage} · {r.yearsExperience} yrs</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[12.5px] font-medium tabular text-ink">{compactUsd(r.productionVolume)}</span>
        <span className="text-[11.5px] text-ink-4">{r.productionUnits} units</span>
      </div>
      <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-ink-3">{r.notes}</p>
      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
        <span className="flex items-center gap-1.5 text-[11px] text-ink-4">
          <Avatar name={agentName(r.recruiterId)} size="xs" /> {agentName(r.recruiterId).split(" ")[0]}
        </span>
        {r.nextFollowUp && <span className="text-[11px] tabular text-ink-4">{relative(r.nextFollowUp)}</span>}
      </div>
    </div>
  );
}

function TxCard({ t, onOpen }: { t: Transaction; onOpen: () => void }) {
  return (
    <div className="p-3" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      <div className="flex items-start gap-2.5">
        <img src={asset(t.image)} alt="" className="size-9 shrink-0 rounded-[6px] object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{t.address}{t.unit ? `, ${t.unit}` : ""}</p>
          <p className="truncate text-[11.5px] text-ink-4">{t.ref} · {t.city}</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[12.5px] font-medium tabular text-ink">{compactUsd(t.salePrice || t.listPrice)}</span>
        <Badge tone="neutral" size="sm">{titleCase(t.side)}</Badge>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
        <span className="flex items-center gap-1.5 text-[11px] text-ink-4">
          <Avatar name={agentName(t.agentId)} size="xs" /> {agentName(t.agentId).split(" ")[0]}
        </span>
        <span className="text-[11px] tabular text-ink-4">{dateShort(t.closingDate)}</span>
      </div>
      {t.riskFlags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {t.riskFlags.slice(0, 1).map((f) => <Badge key={f} tone="warn" size="sm">{f}</Badge>)}
        </div>
      )}
    </div>
  );
}

function RecruitTable({ rows }: { rows: RecruitCandidate[] }) {
  const columns: Column<RecruitCandidate>[] = [
    { id: "name", header: "Candidate", width: "200px", accessor: (r) => r.name,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{r.name}</p>
            <p className="truncate text-[11.5px] text-ink-4">{r.email}</p>
          </div>
        </div>
      ) },
    { id: "brokerage", header: "Current brokerage", width: "160px", accessor: (r) => r.currentBrokerage, cell: (r) => r.currentBrokerage },
    { id: "exp", header: "Years", width: "70px", align: "right", accessor: (r) => r.yearsExperience, cell: (r) => r.yearsExperience },
    { id: "volume", header: "T12 volume", width: "112px", align: "right", accessor: (r) => r.productionVolume, cell: (r) => compactUsd(r.productionVolume) },
    { id: "units", header: "Units", width: "70px", align: "right", accessor: (r) => r.productionUnits, cell: (r) => r.productionUnits },
    { id: "source", header: "Source", width: "120px", accessor: (r) => r.leadSource, cell: (r) => <Badge tone="neutral" size="sm">{r.leadSource}</Badge> },
    { id: "recruiter", header: "Recruiter", width: "140px", accessor: (r) => agentName(r.recruiterId), cell: (r) => agentName(r.recruiterId) },
    { id: "office", header: "Target office", width: "130px", defaultHidden: true, accessor: (r) => officeName(r.targetOfficeId), cell: (r) => officeName(r.targetOfficeId) },
    { id: "stage", header: "Stage", width: "150px", accessor: (r) => RECRUIT_STAGES.findIndex((s) => s.key === r.stage), cell: (r) => <StatusBadge value={r.stage} size="sm" /> },
    { id: "next", header: "Next follow-up", width: "120px", accessor: (r) => r.nextFollowUp ?? "", cell: (r) => r.nextFollowUp ? <span className="tabular">{dateShort(r.nextFollowUp)}</span> : <span className="text-ink-4">—</span> },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchKeys={(r) => `${r.name} ${r.currentBrokerage} ${r.email} ${agentName(r.recruiterId)}`}
      searchPlaceholder="Search candidates…"
      exportName="tru-recruiting"
      filters={[
        { id: "stage", label: "Stage", options: RECRUIT_STAGES.map((s) => ({ value: s.key, label: s.label })), match: (r, v) => r.stage === v },
        { id: "source", label: "Source", options: ["Referral", "Inbound", "Event", "Cold Outreach", "LinkedIn", "MLS Data"].map((s) => ({ value: s, label: s })), match: (r, v) => r.leadSource === v },
      ]}
      emptyTitle="No candidates match"
      emptyDescription="Adjust the filters or add a new candidate to the pipeline."
    />
  );
}
