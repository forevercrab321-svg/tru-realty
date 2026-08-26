"use client";
import * as React from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, Download, FileText, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useStore } from "@/lib/store";
import { allPayouts, taxRecords } from "@/data/finance";
import { agentName, agents } from "@/data/agents";
import { compactUsd, dateMed, dateShort, num, titleCase, usd } from "@/lib/format";
import { sum } from "@/lib/utils";
import type { Payout, TaxRecord } from "@/types";
import { toast } from "sonner";

export default function PayoutsPage() {
  const { transactions } = useStore();
  const paid = allPayouts.filter((p) => p.status === "paid");
  const queued = allPayouts.filter((p) => p.status !== "paid");

  const payoutColumns: Column<Payout>[] = [
    { id: "agent", header: "Agent", width: "180px", accessor: (p) => agentName(p.agentId),
      cell: (p) => <div className="flex items-center gap-2"><Avatar name={agentName(p.agentId)} size="sm" /><Link href={`/admin/agents/${p.agentId}`} className="truncate hover:underline">{agentName(p.agentId)}</Link></div> },
    { id: "ref", header: "Reference", width: "128px", accessor: (p) => p.reference, cell: (p) => <span className="tabular text-ink-3">{p.reference}</span> },
    { id: "tx", header: "Transaction", width: "220px", accessor: (p) => p.transactionId ?? "",
      cell: (p) => {
        const t = transactions.find((x) => x.id === p.transactionId);
        return t ? <Link href={`/admin/transactions/${t.id}`} className="truncate hover:underline">{t.address}</Link> : <span className="text-ink-4">—</span>;
      } },
    { id: "gross", header: "Gross", width: "104px", align: "right", accessor: (p) => p.grossCommission, cell: (p) => usd(p.grossCommission) },
    { id: "ded", header: "Deductions", width: "112px", align: "right", accessor: (p) => p.deductions, cell: (p) => <span className="text-ink-3">− {usd(p.deductions)}</span> },
    { id: "net", header: "Net payout", width: "116px", align: "right", accessor: (p) => p.netPayout, cell: (p) => <span className="font-medium text-ink">{usd(p.netPayout)}</span> },
    { id: "method", header: "Method", width: "88px", accessor: (p) => p.method, cell: (p) => <Badge tone="neutral" size="sm">{p.method}</Badge> },
    { id: "issued", header: "Issued", width: "100px", accessor: (p) => p.issuedAt ?? "", cell: (p) => p.issuedAt ? <span className="tabular text-ink-3">{dateShort(p.issuedAt)}</span> : <span className="text-ink-4">—</span> },
    { id: "status", header: "Status", width: "104px", accessor: (p) => p.status, cell: (p) => <StatusBadge value={p.status} size="sm" /> },
  ];

  const taxColumns: Column<TaxRecord>[] = [
    { id: "agent", header: "Agent", width: "180px", accessor: (t) => agentName(t.agentId),
      cell: (t) => <div className="flex items-center gap-2"><Avatar name={agentName(t.agentId)} size="sm" /><span className="truncate">{agentName(t.agentId)}</span></div> },
    { id: "entity", header: "Payee entity", width: "200px", accessor: (t) => t.entityName, cell: (t) => t.entityName },
    { id: "tin", header: "TIN", width: "112px", accessor: (t) => t.tin, cell: (t) => <span className="tabular text-ink-3">{t.tin}</span> },
    { id: "ytdc", header: "YTD commission", width: "140px", align: "right", accessor: (t) => t.ytdCommission, cell: (t) => usd(t.ytdCommission) },
    { id: "ytdp", header: "YTD paid", width: "116px", align: "right", accessor: (t) => t.ytdPaid, cell: (t) => usd(t.ytdPaid) },
    { id: "pending", header: "Pending", width: "108px", align: "right", accessor: (t) => t.pending, cell: (t) => usd(t.pending) },
    { id: "status", header: "1099", width: "116px", accessor: (t) => t.form1099Status, cell: (t) => <StatusBadge value={t.form1099Status} size="sm" /> },
  ];

  return (
    <>
      <PageHeader
        title="Payouts & 1099s"
        description="Disbursement runs, commission statements and year-end tax reporting."
        actions={
          <>
            <Button variant="secondary" onClick={() => toast.success("Statements emailed to 16 agents")}><Send /> Send statements</Button>
            <Button variant="primary" onClick={() => toast.success("Wednesday release approved")}><CheckCircle2 /> Approve release</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Paid, YTD" value={compactUsd(sum(paid, (p) => p.netPayout))} sub={`${paid.length} disbursements`} tone="dark" icon={<Banknote />} />
        <MetricCard label="Queued for release" value={compactUsd(sum(queued, (p) => p.netPayout))} sub={`${queued.length} awaiting the next run`} />
        <MetricCard label="Next release" value="Sep 2" sub="Wednesday 2:00 PM ET" />
        <MetricCard label="1099s issued" value={num(taxRecords.filter((t) => t.form1099Status === "issued").length)} sub={`of ${taxRecords.length} payees`} icon={<FileText />} />
      </div>

      <Tabs defaultValue="payouts">
        <TabsList>
          <TabsTrigger value="payouts">Agent payouts</TabsTrigger>
          <TabsTrigger value="statements">Commission statements</TabsTrigger>
          <TabsTrigger value="history">Payment history</TabsTrigger>
          <TabsTrigger value="tax">1099 & tax documents</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="payouts">
            <DataTable
              data={allPayouts}
              columns={payoutColumns}
              getRowId={(p) => p.id}
              searchKeys={(p) => `${agentName(p.agentId)} ${p.reference} ${p.period}`}
              searchPlaceholder="Search payouts…"
              exportName="tru-payouts"
              pageSize={14}
              filters={[
                { id: "status", label: "Status", options: ["pending", "approved", "paid", "on_hold"].map((s) => ({ value: s, label: titleCase(s) })), match: (p, v) => p.status === v },
                { id: "agent", label: "Agent", options: agents.map((a) => ({ value: a.id, label: a.name })), match: (p, v) => p.agentId === v },
                { id: "method", label: "Method", options: ["ACH", "Check", "Wire"].map((s) => ({ value: s, label: s })), match: (p, v) => p.method === v },
              ]}
              savedViews={[{ id: "v1", name: "Awaiting release", filters: { status: ["pending", "approved"] }, search: "" }]}
              bulkActions={[
                { label: "Approve", icon: <CheckCircle2 />, onClick: (ids) => toast.success(`${ids.length} payouts approved`) },
                { label: "Export ACH file", icon: <Download />, onClick: (ids) => toast.success(`NACHA file generated for ${ids.length} payouts`) },
              ]}
              emptyTitle="No payouts"
            />
          </TabsContent>

          <TabsContent value="statements">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents.filter((a) => allPayouts.some((p) => p.agentId === a.id)).map((a) => {
                const mine = allPayouts.filter((p) => p.agentId === a.id);
                const tax = taxRecords.find((t) => t.agentId === a.id)!;
                return (
                  <Card key={a.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.name} size="md" />
                        <div>
                          <CardTitle>{a.name}</CardTitle>
                          <p className="mt-0.5 text-[11.5px] text-ink-4">{a.plan.name}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-2.5">
                      <Row label="YTD commission" value={usd(tax.ytdCommission)} />
                      <Row label="YTD payout" value={usd(tax.ytdPaid)} />
                      <Row label="Pending" value={usd(tax.pending)} />
                      <Row label="Disbursements" value={String(mine.length)} />
                      <Button size="sm" variant="secondary" full className="mt-2" onClick={() => toast.success(`Statement sent to ${a.firstName}`)}>
                        <Download /> Download statement
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Disbursement runs</CardTitle>
                <Badge tone="neutral" size="sm">{paid.length} completed</Badge>
              </CardHeader>
              <ul className="divide-y divide-line">
                {paid.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={agentName(p.agentId)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{agentName(p.agentId)}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">{p.reference} · {p.method} · issued {p.issuedAt ? dateMed(p.issuedAt) : "—"}</p>
                    </div>
                    <span className="text-[13px] font-medium tabular text-ink">{usd(p.netPayout)}</span>
                    <StatusBadge value={p.status} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="tax">
            <DataTable
              data={taxRecords}
              columns={taxColumns}
              getRowId={(t) => t.agentId}
              searchKeys={(t) => `${agentName(t.agentId)} ${t.entityName}`}
              searchPlaceholder="Search payees…"
              exportName="tru-1099"
              pageSize={16}
              filters={[{ id: "status", label: "1099 status", options: ["issued", "in_review", "not_started", "corrected"].map((s) => ({ value: s, label: titleCase(s) })), match: (t, v) => t.form1099Status === v }]}
              bulkActions={[{ label: "Generate 1099-NEC", icon: <FileText />, onClick: (ids) => toast.success(`${ids.length} forms queued for e-file`) }]}
              emptyTitle="No tax records"
            />
            <p className="mt-3 text-[12px] leading-relaxed text-ink-4">
              1099-NEC forms are generated for any payee receiving $600 or more in a calendar year. Figures shown are
              year-to-date through August 26, 2026 and are not final until the December close.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[12.5px] text-ink-3">{label}</p>
      <p className="text-[13px] font-medium tabular text-ink">{value}</p>
    </div>
  );
}
