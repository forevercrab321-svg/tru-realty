"use client";
import * as React from "react";
import Link from "next/link";
import { Download, Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, Stat } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { BarSeries } from "@/components/charts";
import { useStore } from "@/lib/store";
import { agentCharges } from "@/data/finance";
import { agentName, agents } from "@/data/agents";
import { monthlySeries } from "@/data/performance";
import { compactUsd, dateMed, dateShort, num, pct, titleCase, usd } from "@/lib/format";
import { sum } from "@/lib/utils";
import type { AgentCharge, Transaction } from "@/types";
import { toast } from "sonner";

export default function AccountingPage() {
  const { transactions } = useStore();
  const closed = transactions.filter((t) => t.stage === "closed");
  const pipeline = transactions.filter((t) => !["closed", "cancelled"].includes(t.stage));

  const grossYtd = sum(closed, (t) => t.commission.sideCommission);
  const brokerageYtd = sum(closed, (t) => t.commission.netBrokerage);
  const agentYtd = sum(closed, (t) => t.commission.netAgent);
  const pipelineGci = sum(pipeline, (t) => t.commission.sideCommission);
  const chargesOutstanding = sum(agentCharges.filter((c) => c.status !== "paid" && c.status !== "waived"), (c) => c.amount);

  const txColumns: Column<Transaction>[] = [
    {
      id: "property", header: "Transaction", width: "260px", accessor: (t) => t.address,
      cell: (t) => (
        <div className="min-w-0">
          <Link href={`/admin/transactions/${t.id}`} className="block truncate font-medium text-ink hover:underline">{t.address}{t.unit ? `, ${t.unit}` : ""}</Link>
          <p className="truncate text-[11.5px] text-ink-4">{t.ref} · closed {dateShort(t.closingDate)}</p>
        </div>
      ),
    },
    { id: "agent", header: "Agent", width: "150px", accessor: (t) => agentName(t.agentId), cell: (t) => <div className="flex items-center gap-2"><Avatar name={agentName(t.agentId)} size="xs" />{agentName(t.agentId)}</div> },
    { id: "price", header: "Sale price", width: "112px", align: "right", accessor: (t) => t.salePrice, cell: (t) => usd(t.salePrice) },
    { id: "gross", header: "Gross", width: "104px", align: "right", accessor: (t) => t.commission.grossCommission, cell: (t) => usd(t.commission.grossCommission) },
    { id: "side", header: "Our side", width: "104px", align: "right", accessor: (t) => t.commission.sideCommission, cell: (t) => usd(t.commission.sideCommission) },
    { id: "brokerage", header: "Brokerage", width: "104px", align: "right", accessor: (t) => t.commission.netBrokerage, cell: (t) => usd(t.commission.netBrokerage) },
    { id: "agentnet", header: "Agent net", width: "108px", align: "right", accessor: (t) => t.commission.netAgent, cell: (t) => usd(t.commission.netAgent) },
    { id: "fee", header: "Txn fee", width: "88px", align: "right", defaultHidden: true, accessor: (t) => t.commission.transactionFee, cell: (t) => usd(t.commission.transactionFee) },
  ];

  const chargeColumns: Column<AgentCharge>[] = [
    { id: "agent", header: "Agent", width: "170px", accessor: (c) => agentName(c.agentId), cell: (c) => <div className="flex items-center gap-2"><Avatar name={agentName(c.agentId)} size="xs" /><span className="truncate">{agentName(c.agentId)}</span></div> },
    { id: "desc", header: "Charge", width: "260px", accessor: (c) => c.description, cell: (c) => c.description },
    { id: "cat", header: "Category", width: "116px", accessor: (c) => c.category, cell: (c) => <Badge tone="neutral" size="sm">{c.category}</Badge> },
    { id: "amount", header: "Amount", width: "100px", align: "right", accessor: (c) => c.amount, cell: (c) => usd(c.amount) },
    { id: "date", header: "Billed", width: "104px", accessor: (c) => c.date, cell: (c) => <span className="tabular text-ink-3">{dateShort(c.date)}</span> },
    { id: "status", header: "Status", width: "110px", accessor: (c) => c.status, cell: (c) => <StatusBadge value={c.status} size="sm" /> },
  ];

  return (
    <>
      <PageHeader
        title="Accounting"
        description="Commission math, company revenue, agent billing and the ledger behind every disbursement."
        actions={<Button variant="secondary" onClick={() => toast.success("Ledger exported")}><Download /> Export ledger</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Gross commission, YTD" value={compactUsd(grossYtd)} sub={`${closed.length} closed files`} tone="dark" />
        <MetricCard label="Net brokerage revenue" value={compactUsd(brokerageYtd)} sub={`${pct((brokerageYtd / Math.max(1, grossYtd)) * 100, 1)} of gross`} />
        <MetricCard label="Paid to agents" value={compactUsd(agentYtd)} sub="After splits and fees" />
        <MetricCard label="Pipeline GCI" value={compactUsd(pipelineGci)} sub="Not yet earned" />
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transaction accounting</TabsTrigger>
          <TabsTrigger value="breakdown">Commission breakdown</TabsTrigger>
          <TabsTrigger value="fees">Company fees</TabsTrigger>
          <TabsTrigger value="charges">Agent charges</TabsTrigger>
          <TabsTrigger value="records">Payment records</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="transactions">
            <DataTable
              data={closed}
              columns={txColumns}
              getRowId={(t) => t.id}
              searchKeys={(t) => `${t.address} ${t.ref} ${agentName(t.agentId)}`}
              searchPlaceholder="Search closed transactions…"
              exportName="tru-transaction-accounting"
              filters={[{ id: "agent", label: "Agent", options: agents.map((a) => ({ value: a.id, label: a.name })), match: (t, v) => t.agentId === v }]}
              emptyTitle="No closed transactions"
              emptyDescription="Commission accounting appears once a file closes."
            />
          </TabsContent>

          <TabsContent value="breakdown">
            <div className="grid gap-4 lg:grid-cols-2">
              {closed.slice(0, 4).map((t) => {
                const c = t.commission;
                return (
                  <Card key={t.id}>
                    <CardHeader>
                      <div>
                        <CardTitle>{t.address}{t.unit ? `, ${t.unit}` : ""}</CardTitle>
                        <p className="mt-0.5 text-[12px] text-ink-4">{t.ref} · {agentName(t.agentId)} · closed {dateMed(t.closingDate)}</p>
                      </div>
                      <Button size="xs" variant="ghost" asChild><Link href={`/admin/transactions/${t.id}`}>Open</Link></Button>
                    </CardHeader>
                    <CardBody className="p-0">
                      <table className="w-full">
                        <tbody>
                          {[
                            ["Sale price", usd(c.salePrice), false],
                            [`Gross commission (${pct(c.grossCommissionPct, 2)})`, usd(c.grossCommission), false],
                            ["Our side", usd(c.sideCommission), true],
                            ...(c.referralFee ? [[`Referral fee (${pct(c.referralFeePct, 0)})`, `− ${usd(c.referralFee)}`, false] as const] : []),
                            [`Brokerage split (${pct(c.brokerageSplitPct, 0)})`, `− ${usd(c.brokerageSplit)}`, false],
                            ...(c.teamSplit ? [["Team split", `− ${usd(c.teamSplit)}`, false] as const] : []),
                            ["Transaction fee", `− ${usd(c.transactionFee)}`, false],
                            ...(c.companyFee ? [["Company fee", `− ${usd(c.companyFee)}`, false] as const] : []),
                            ["Net agent commission", usd(c.netAgent), true],
                            ["Net brokerage revenue", usd(c.netBrokerage), true],
                          ].map(([label, value, strong], i) => (
                            <tr key={i} className={`border-b border-line last:border-0 ${strong ? "bg-canvas" : ""}`}>
                              <td className={`px-5 py-2 text-[12.5px] ${strong ? "font-medium text-ink" : "text-ink-2"}`}>{label}</td>
                              <td className={`px-5 py-2 text-right text-[12.5px] tabular ${strong ? "font-semibold text-ink" : "text-ink-2"}`}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="fees">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <Card>
                <CardHeader><CardTitle>Company revenue by month</CardTitle></CardHeader>
                <CardBody><BarSeries data={monthlySeries} xKey="month" yKey="gci" name="GCI" money height={250} /></CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Revenue composition, YTD</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <Stat label="Brokerage split" value={<span className="tabular text-[17px] font-semibold">{usd(sum(closed, (t) => t.commission.brokerageSplit))}</span>} />
                  <Stat label="Transaction fees" value={<span className="tabular text-[17px] font-semibold">{usd(sum(closed, (t) => t.commission.transactionFee))}</span>} />
                  <Stat label="Company fees" value={<span className="tabular text-[17px] font-semibold">{usd(sum(closed, (t) => t.commission.companyFee))}</span>} />
                  <Stat label="Agent billing" value={<span className="tabular text-[17px] font-semibold">{usd(sum(agentCharges.filter((c) => c.status === "paid"), (c) => c.amount))}</span>} />
                  <p className="border-t border-line pt-3 text-[12px] leading-relaxed text-ink-4">
                    Agent billing covers E&amp;O, technology, desk and MLS pass-throughs. It is recorded as an offset to
                    operating expense rather than as commission revenue.
                  </p>
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="charges">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Outstanding" value={usd(chargesOutstanding)} sub="Billed but unpaid" icon={<Receipt />} />
              <MetricCard label="Past due" value={usd(sum(agentCharges.filter((c) => c.status === "past_due"), (c) => c.amount))} sub="More than 30 days" />
              <MetricCard label="Collected, YTD" value={usd(sum(agentCharges.filter((c) => c.status === "paid"), (c) => c.amount))} sub="Agent billing" />
            </div>
            <DataTable
              data={agentCharges}
              columns={chargeColumns}
              getRowId={(c) => c.id}
              searchKeys={(c) => `${agentName(c.agentId)} ${c.description} ${c.category}`}
              searchPlaceholder="Search charges…"
              exportName="tru-agent-charges"
              pageSize={14}
              filters={[
                { id: "status", label: "Status", options: ["billed", "paid", "past_due", "waived"].map((s) => ({ value: s, label: titleCase(s) })), match: (c, v) => c.status === v },
                { id: "cat", label: "Category", options: ["E&O", "Technology", "Marketing", "Desk Fee", "MLS", "Training", "Other"].map((s) => ({ value: s, label: s })), match: (c, v) => c.category === v },
              ]}
              bulkActions={[{ label: "Mark paid", onClick: (ids) => toast.success(`${ids.length} charges marked paid`) }]}
              emptyTitle="No charges"
            />
          </TabsContent>

          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>Payment records</CardTitle>
                <Button size="sm" variant="secondary" onClick={() => toast.success("Reconciliation report generated")}><Download /> Reconciliation</Button>
              </CardHeader>
              <ul className="divide-y divide-line">
                {closed.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{t.address}{t.unit ? `, ${t.unit}` : ""}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">
                        {t.titleCompany ?? "—"} · funded {dateMed(t.closingDate)} · DISB-{t.ref.split("-")[2]}
                      </p>
                    </div>
                    <span className="hidden text-[12.5px] tabular text-ink-3 sm:block">gross {usd(t.commission.sideCommission)}</span>
                    <span className="w-24 text-right text-[13px] font-medium tabular text-ink">{usd(t.commission.netBrokerage)}</span>
                    <StatusBadge value="paid" size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
