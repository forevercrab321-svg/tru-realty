"use client";
import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight, Building2, CalendarClock, CheckCircle2, Circle, CircleDot, Clock,
  Download, FileText, MessageSquarePlus, Paperclip, Plus, Send, Upload, User, Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Stat, ProgressBar } from "@/components/ui/metric-card";
import { Timeline, StageRail } from "@/components/ui/timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/input";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger } from "@/components/ui/dropdown";
import { AddTaskDialog, UploadDocumentDialog } from "@/components/admin/create-dialogs";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { TX_STAGES } from "@/data/transactions";
import { agentById, agentName } from "@/data/agents";
import { userName } from "@/data/company";
import { compactUsd, dateMed, fileSize, pct, relative, titleCase, usd } from "@/lib/format";
import { cn, asset } from "@/lib/utils";
import type { TxStage } from "@/types";

const OPEN_STAGES = TX_STAGES.filter((s) => s.key !== "cancelled");

export function TransactionDetail({ id, base }: { id: string; base: string }) {
  const { transactions, moveTransactionStage, toggleTask, addTransactionNote } = useStore();
  const { account, hasPermission } = useSession();
  const tx = transactions.find((t) => t.id === id);
  const [note, setNote] = React.useState("");

  if (!tx) return notFound();

  const agent = agentById(tx.agentId)!;
  const stageIdx = OPEN_STAGES.findIndex((s) => s.key === tx.stage);
  const doneTasks = tx.tasks.filter((t) => t.status === "done").length;
  const reqDocs = tx.documents.filter((d) => d.required);
  const reqDone = reqDocs.filter((d) => d.status !== "pending").length;
  const c = tx.commission;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Transactions", href: `${base}/transactions` }, { label: tx.ref }]}
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            {tx.address}{tx.unit ? `, ${tx.unit}` : ""}
            <StatusBadge value={tx.stage} />
          </span>
        }
        description={`${tx.city}, ${tx.state} ${tx.zip} · ${tx.propertyType} · ${titleCase(tx.side)} side`}
        actions={
          <>
            <Dropdown>
              <DropdownTrigger asChild><Button variant="secondary">Change stage</Button></DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>Move to stage</DropdownLabel>
                {TX_STAGES.map((s) => (
                  <DropdownItem key={s.key} onSelect={() => moveTransactionStage(tx.id, s.key as TxStage)}>
                    {s.key === tx.stage ? <CircleDot /> : <Circle />} {s.label}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
            <UploadDocumentDialog txId={tx.id} trigger={<Button variant="primary"><Upload /> Upload document</Button>} />
          </>
        }
      />

      {/* Summary rail */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img src={asset(tx.image)} alt="" className="h-[104px] w-full shrink-0 rounded-[10px] object-cover sm:w-[160px]" />
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat label="Sale price" value={<span className="tabular font-medium">{tx.salePrice ? usd(tx.salePrice) : `${usd(tx.listPrice)} (list)`}</span>} />
              <Stat label="Side commission" value={<span className="tabular font-medium">{usd(c.sideCommission)}</span>} />
              <Stat label="Closing date" value={<span className="tabular">{dateMed(tx.closingDate)}</span>} />
              <Stat label="Days to close" value={<span className="tabular">{Math.max(0, Math.round((new Date(tx.closingDate).getTime() - new Date("2026-08-26").getTime()) / 86400000))}</span>} />
              <Stat label="Agent" value={<Link href={`${base}/agents/${agent.id}`} className="hover:underline">{agent.name}</Link>} />
              <Stat label="Client" value={tx.counterparty} />
              <Stat label="Coordinator" value={userName(tx.coordinatorId)} />
              <Stat label="Other side" value={tx.counterpartyBrokerage} />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>File health</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-[12.5px] text-ink-2">Required documents</p>
                <p className="text-[12.5px] tabular text-ink-3">{reqDone}/{reqDocs.length}</p>
              </div>
              <ProgressBar value={reqDocs.length ? (reqDone / reqDocs.length) * 100 : 100} tone={reqDone === reqDocs.length ? "ok" : "warn"} className="mt-1.5" />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-[12.5px] text-ink-2">Tasks complete</p>
                <p className="text-[12.5px] tabular text-ink-3">{doneTasks}/{tx.tasks.length}</p>
              </div>
              <ProgressBar value={tx.tasks.length ? (doneTasks / tx.tasks.length) * 100 : 0} className="mt-1.5" />
            </div>
            {tx.riskFlags.length > 0 ? (
              <div className="flex flex-wrap gap-1 border-t border-line pt-3">
                {tx.riskFlags.map((f) => <Badge key={f} tone="warn" size="sm">{f}</Badge>)}
              </div>
            ) : (
              <p className="flex items-center gap-1.5 border-t border-line pt-3 text-[12.5px] text-ok-700">
                <CheckCircle2 className="size-3.5" /> Compliance file is complete
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {tx.stage !== "cancelled" && (
        <div className="mb-5 overflow-hidden rounded-xl border border-line bg-surface p-3 shadow-xs">
          <StageRail stages={OPEN_STAGES.map((s) => ({ key: s.key, label: s.label }))} currentIndex={stageIdx} />
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="documents">Documents <Count n={tx.documents.length} /></TabsTrigger>
          <TabsTrigger value="tasks">Tasks <Count n={tx.tasks.filter((t) => t.status !== "done").length} /></TabsTrigger>
          {hasPermission("commission.view") && <TabsTrigger value="commission">Commission</TabsTrigger>}
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          {/* ------------------------------------------------------- OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Transaction details</CardTitle></CardHeader>
                  <CardBody>
                    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
                      <Stat label="Reference" value={<span className="tabular">{tx.ref}</span>} />
                      <Stat label="Property type" value={tx.propertyType} />
                      <Stat label="Representation" value={`${titleCase(tx.side)} side`} />
                      <Stat label="List price" value={<span className="tabular">{usd(tx.listPrice)}</span>} />
                      <Stat label="Contract price" value={<span className="tabular">{tx.salePrice ? usd(tx.salePrice) : "—"}</span>} />
                      <Stat label="Commission rate" value={pct(tx.commissionPct, 2)} />
                      <Stat label="Contract date" value={tx.contractDate ? dateMed(tx.contractDate) : "Not yet executed"} />
                      <Stat label="Escrow deposit" value={<span className="tabular">{usd(tx.escrow)}</span>} />
                      <Stat label="Opened" value={dateMed(tx.createdAt)} />
                      <Stat label="Lender" value={tx.lender ?? "—"} />
                      <Stat label="Title company" value={tx.titleCompany ?? "—"} />
                      <Stat label="Co-broke" value={tx.counterpartyBrokerage} />
                    </dl>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Next up</CardTitle>
                    <AddTaskDialog txId={tx.id} trigger={<Button size="xs" variant="ghost"><Plus /> Add task</Button>} />
                  </CardHeader>
                  {tx.tasks.filter((t) => t.status !== "done").length === 0 ? (
                    <EmptyState title="No open tasks" description="Everything on this file is done." className="m-4 border-dashed" />
                  ) : (
                    <ul className="divide-y divide-line">
                      {tx.tasks.filter((t) => t.status !== "done").slice(0, 5).map((t) => (
                        <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                          <button onClick={() => toggleTask(tx.id, t.id)} className="shrink-0 text-ink-4 transition-colors hover:text-brand-600">
                            <Circle className="size-4" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] text-ink">{t.title}</p>
                            <p className="mt-0.5 text-[11.5px] text-ink-4">{titleCase(t.category)} · {userName(t.assigneeId) !== "—" ? userName(t.assigneeId) : agentName(t.assigneeId)}</p>
                          </div>
                          <span className={cn("text-[12px] tabular", t.status === "overdue" ? "text-risk-500" : "text-ink-3")}>{relative(t.dueDate)}</span>
                          <StatusBadge value={t.priority} size="sm" />
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Team</CardTitle></CardHeader>
                  <ul className="divide-y divide-line">
                    {[
                      { name: agent.name, role: "Listing / buyer agent", href: `${base}/agents/${agent.id}` },
                      ...(tx.coAgentId ? [{ name: agentName(tx.coAgentId), role: "Co-agent", href: `${base}/agents/${tx.coAgentId}` }] : []),
                      { name: userName(tx.coordinatorId), role: "Transaction coordinator" },
                      { name: tx.counterparty, role: `Counterparty · ${tx.counterpartyBrokerage}` },
                    ].map((p) => (
                      <li key={p.role} className="flex items-center gap-2.5 px-5 py-3">
                        <Avatar name={p.name} size="md" />
                        <div className="min-w-0">
                          {p.href
                            ? <Link href={p.href} className="block truncate text-[13px] font-medium text-ink hover:underline">{p.name}</Link>
                            : <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>}
                          <p className="truncate text-[11.5px] text-ink-4">{p.role}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Key dates</CardTitle></CardHeader>
                  <CardBody className="space-y-3">
                    {[
                      ["File opened", tx.createdAt],
                      ["Contract executed", tx.contractDate],
                      ["Target closing", tx.closingDate],
                    ].filter(([, d]) => d).map(([label, d]) => (
                      <div key={label as string} className="flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-[13px] text-ink-3"><CalendarClock className="size-3.5 text-ink-4" />{label}</p>
                        <p className="text-[13px] tabular text-ink">{dateMed(d as string)}</p>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* -------------------------------------------------------- CLIENTS */}
          <TabsContent value="clients">
            <ClientsTab txId={tx.id} base={base} />
          </TabsContent>

          {/* ------------------------------------------------------ DOCUMENTS */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Documents</CardTitle>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">{reqDone} of {reqDocs.length} required documents received.</p>
                </div>
                <UploadDocumentDialog txId={tx.id} trigger={<Button size="sm" variant="secondary"><Upload /> Upload</Button>} />
              </CardHeader>
              {tx.documents.length === 0 ? (
                <EmptyState
                  icon={<Paperclip />}
                  title="No documents yet"
                  description="Upload the agency disclosure and executed agreement to start the compliance file."
                  className="m-4 border-dashed"
                  action={<UploadDocumentDialog txId={tx.id} trigger={<Button variant="primary" size="sm"><Upload /> Upload a document</Button>} />}
                />
              ) : (
                <ul className="divide-y divide-line">
                  {tx.documents.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[7px] bg-subtle text-ink-4">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{d.name}</p>
                        <p className="mt-0.5 truncate text-[11.5px] text-ink-4">
                          {d.category} · {d.fileType.toUpperCase()} · {fileSize(d.sizeKb)} · {userName(d.uploadedBy) !== "—" ? userName(d.uploadedBy) : agentName(d.uploadedBy)} · {dateMed(d.uploadedAt)}
                        </p>
                      </div>
                      {d.required && <Badge tone="neutral" size="sm">Required</Badge>}
                      <StatusBadge value={d.status} size="sm" />
                      <Button size="iconSm" variant="ghost"><Download /></Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------------- TASKS */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">{doneTasks} of {tx.tasks.length} complete.</p>
                </div>
                <AddTaskDialog txId={tx.id} trigger={<Button size="sm" variant="secondary"><Plus /> Add task</Button>} />
              </CardHeader>
              {tx.tasks.length === 0 ? (
                <EmptyState title="No tasks on this file" description="Add the first milestone task to start the checklist." className="m-4 border-dashed" />
              ) : (
                <ul className="divide-y divide-line">
                  {tx.tasks.map((t) => (
                    <li key={t.id} className={cn("flex items-center gap-3 px-5 py-3", t.status === "done" && "bg-canvas/60")}>
                      <button onClick={() => toggleTask(tx.id, t.id)} className="shrink-0 transition-colors">
                        {t.status === "done"
                          ? <CheckCircle2 className="size-4 text-brand-600" />
                          : <Circle className="size-4 text-ink-4 hover:text-brand-600" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-[13px]", t.status === "done" ? "text-ink-4 line-through" : "text-ink")}>{t.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">
                          {titleCase(t.category)} · assigned to {userName(t.assigneeId) !== "—" ? userName(t.assigneeId) : agentName(t.assigneeId)}
                        </p>
                      </div>
                      <span className={cn("shrink-0 text-[12px] tabular", t.status === "overdue" ? "text-risk-500" : "text-ink-3")}>
                        {relative(t.dueDate)}
                      </span>
                      <StatusBadge value={t.status} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          {/* ----------------------------------------------------- COMMISSION */}
          {hasPermission("commission.view") && (
            <TabsContent value="commission">
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle>Commission breakdown</CardTitle>
                      <p className="mt-0.5 text-[12.5px] text-ink-3">
                        Calculated from {agent.plan.name}. Cap remaining: {usd(Math.max(0, agent.plan.cap - agent.plan.capYtd))}.
                      </p>
                    </div>
                    {hasPermission("commission.edit") && <Button size="sm" variant="secondary">Adjust splits</Button>}
                  </CardHeader>
                  <CardBody className="p-0">
                    <table className="w-full">
                      <tbody>
                        {[
                          ["Sale price", usd(c.salePrice), false],
                          [`Gross commission (${pct(c.grossCommissionPct, 2)})`, usd(c.grossCommission), false],
                          [`Our side (${tx.side === "dual" ? "100%" : "50%"})`, usd(c.sideCommission), true],
                          ...(c.referralFee ? [[`Referral fee out (${pct(c.referralFeePct, 0)})`, `− ${usd(c.referralFee)}`, false] as const] : []),
                          [`Brokerage split (${pct(c.brokerageSplitPct, 0)})`, `− ${usd(c.brokerageSplit)}`, false],
                          ...(c.teamSplit ? [["Team split", `− ${usd(c.teamSplit)}`, false] as const] : []),
                          ["Transaction fee", `− ${usd(c.transactionFee)}`, false],
                          ...(c.companyFee ? [["Company fee", `− ${usd(c.companyFee)}`, false] as const] : []),
                          ["Net to agent", usd(c.netAgent), true],
                          ["Net to brokerage", usd(c.netBrokerage), true],
                        ].map(([label, value, strong], i) => (
                          <tr key={i} className={cn("border-b border-line last:border-0", strong && "bg-canvas")}>
                            <td className={cn("px-5 py-2.5 text-[13px]", strong ? "font-medium text-ink" : "text-ink-2")}>{label}</td>
                            <td className={cn("px-5 py-2.5 text-right text-[13px] tabular", strong ? "font-semibold text-ink" : "text-ink-2")}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardBody>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>Disbursement</CardTitle></CardHeader>
                    <CardBody className="space-y-3">
                      <Stat label="Status" value={<StatusBadge value={tx.stage === "closed" ? "paid" : "pending"} size="sm" />} />
                      <Stat label="Method" value="ACH · next Wednesday release" />
                      <Stat label="CDA" value={tx.documents.some((d) => d.name.includes("Disbursement")) ? "On file" : "Not yet prepared"} />
                      <Stat label="Title contact" value={tx.titleCompany ?? "—"} />
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Agent plan</CardTitle></CardHeader>
                    <CardBody className="space-y-3">
                      <Stat label="Plan" value={agent.plan.name} />
                      <Stat label="Company dollar cap" value={<span className="tabular">{usd(agent.plan.cap)}</span>} />
                      <div>
                        <div className="flex items-baseline justify-between">
                          <p className="text-[12.5px] text-ink-2">Cap progress</p>
                          <p className="text-[12.5px] tabular text-ink-3">{usd(agent.plan.capYtd)} / {usd(agent.plan.cap)}</p>
                        </div>
                        <ProgressBar value={(agent.plan.capYtd / agent.plan.cap) * 100} className="mt-1.5" tone={agent.plan.capYtd >= agent.plan.cap ? "ok" : "brand"} />
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}

          {/* -------------------------------------------------------- TIMELINE */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
              <CardBody>
                <Timeline items={tx.timeline.map((t) => ({ id: t.id, label: t.label, date: t.date, done: t.done, detail: t.detail }))} />
              </CardBody>
            </Card>
          </TabsContent>

          {/* ----------------------------------------------------------- NOTES */}
          <TabsContent value="notes">
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardBody>
                <div className="flex gap-3">
                  <Avatar name={account?.name ?? ""} size="md" />
                  <div className="flex-1">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note for the file — the coordinator and agent both see this."
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!note.trim()}
                        onClick={() => { addTransactionNote(tx.id, note.trim(), account?.userId ?? "usr_tc_reeves"); setNote(""); }}
                      >
                        <Send /> Post note
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
              {tx.notes.length === 0 ? (
                <EmptyState icon={<MessageSquarePlus />} title="No notes yet" description="Anything the next person needs to know goes here." className="m-4 border-dashed" />
              ) : (
                <ul className="divide-y divide-line border-t border-line">
                  {tx.notes.map((n) => (
                    <li key={n.id} className="flex gap-3 px-5 py-4">
                      <Avatar name={userName(n.authorId) !== "—" ? userName(n.authorId) : agentName(n.authorId)} size="md" />
                      <div className="min-w-0">
                        <p className="text-[13px]">
                          <span className="font-medium text-ink">{userName(n.authorId) !== "—" ? userName(n.authorId) : agentName(n.authorId)}</span>
                          <span className="ml-2 text-[11.5px] text-ink-4">{relative(n.createdAt)} · {n.type}</span>
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{n.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          {/* -------------------------------------------------------- ACTIVITY */}
          <TabsContent value="activity">
            <Card>
              <CardHeader><CardTitle>Activity log</CardTitle></CardHeader>
              <CardBody>
                <Timeline
                  items={[
                    ...tx.timeline.map((t) => ({ id: t.id, label: t.label, date: t.date, done: true, detail: `Stage milestone · ${agentName(tx.agentId)}` })),
                    ...tx.documents.slice(-4).map((d) => ({ id: d.id, label: `${d.name} uploaded`, date: d.uploadedAt, done: true, detail: `${d.category} · ${fileSize(d.sizeKb)}` })),
                    ...tx.notes.map((n) => ({ id: n.id, label: "Note added to file", date: n.createdAt, done: true, detail: n.body })),
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

function ClientsTab({ txId, base }: { txId: string; base: string }) {
  const { transactions, clients } = useStore();
  const tx = transactions.find((t) => t.id === txId)!;
  const client = clients.find((c) => c.id === tx.clientId);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Our client</CardTitle>
          <Badge tone="brand" size="sm">{titleCase(tx.side)} side</Badge>
        </CardHeader>
        {client ? (
          <CardBody>
            <div className="flex items-center gap-3">
              <Avatar name={client.name} size="xl" />
              <div className="min-w-0">
                <Link href={`${base}/clients/${client.id}`} className="text-[15px] font-semibold text-ink hover:underline">{client.name}</Link>
                <p className="mt-0.5 text-[12.5px] text-ink-3">{titleCase(client.type)} · {titleCase(client.status)}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <Stat label="Email" value={client.email} />
              <Stat label="Phone" value={client.phone} />
              <Stat label="Lead source" value={client.leadSource} />
              <Stat label="Lender" value={client.lender ?? "—"} />
              <Stat label="Target areas" value={client.areas.join(", ") || "—"} />
              <Stat label="Budget" value={client.budgetMax ? `${compactUsd(client.budgetMin)} – ${compactUsd(client.budgetMax)}` : "—"} />
            </dl>
            <Button variant="secondary" size="sm" className="mt-5" asChild>
              <Link href={`${base}/clients/${client.id}`}>Open client record <ArrowRight /></Link>
            </Button>
          </CardBody>
        ) : (
          <EmptyState icon={<User />} title="No client linked" description="Link a CRM record so activity and documents stay together." className="m-4 border-dashed" />
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle>Other side</CardTitle></CardHeader>
        <CardBody>
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-full bg-subtle text-ink-4"><Building2 className="size-6" /></span>
            <div>
              <p className="text-[15px] font-semibold text-ink">{tx.counterparty}</p>
              <p className="mt-0.5 text-[12.5px] text-ink-3">{tx.counterpartyBrokerage}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <Stat label="Co-broke" value={tx.counterpartyBrokerage} />
            <Stat label="Title company" value={tx.titleCompany ?? "—"} />
            <Stat label="Lender" value={tx.lender ?? "—"} />
            <Stat label="Escrow held" value={<span className="tabular">{usd(tx.escrow)}</span>} />
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}

function Count({ n }: { n: number }) {
  if (!n) return null;
  return <span className="ml-1.5 rounded-[5px] bg-sunken px-1.5 text-[11px] tabular text-ink-3">{n}</span>;
}
