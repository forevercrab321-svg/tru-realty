"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, FileSignature, UserCog } from "lucide-react";
import { DataTable, type Column, type FilterDef } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactUsd, dateShort, titleCase, usd } from "@/lib/format";
import { agentName } from "@/data/agents";
import { userName } from "@/data/company";
import { TX_STAGES } from "@/data/transactions";
import type { Transaction } from "@/types";
import { toast } from "sonner";
import { asset } from "@/lib/utils";

export function TransactionTable({
  rows, base, showAgent = true, emptyTitle, emptyDescription, emptyAction, toolbarExtra,
}: {
  rows: Transaction[]; base: string; showAgent?: boolean;
  emptyTitle?: string; emptyDescription?: string; emptyAction?: React.ReactNode; toolbarExtra?: React.ReactNode;
}) {
  const router = useRouter();

  const columns: Column<Transaction>[] = [
    {
      id: "property", header: "Property", width: "300px",
      accessor: (t) => t.address,
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <img src={asset(t.image)} alt="" className="size-8 shrink-0 rounded-[6px] object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{t.address}{t.unit ? `, ${t.unit}` : ""}</p>
            <p className="truncate text-[11.5px] text-ink-4">{t.ref} · {t.city}, {t.state}</p>
          </div>
        </div>
      ),
    },
    ...(showAgent ? [{
      id: "agent", header: "Agent", width: "160px",
      accessor: (t: Transaction) => agentName(t.agentId),
      cell: (t: Transaction) => (
        <div className="flex items-center gap-2">
          <Avatar name={agentName(t.agentId)} size="xs" />
          <span className="truncate">{agentName(t.agentId)}</span>
        </div>
      ),
    }] : []),
    { id: "client", header: "Client", width: "150px", accessor: (t) => t.counterparty, cell: (t) => <span className="truncate">{t.counterparty}</span> },
    { id: "side", header: "Side", width: "84px", accessor: (t) => t.side, cell: (t) => <Badge tone="neutral" size="sm">{titleCase(t.side)}</Badge> },
    { id: "price", header: "Sale price", width: "112px", align: "right", accessor: (t) => t.salePrice || t.listPrice, cell: (t) => (t.salePrice ? usd(t.salePrice) : <span className="text-ink-4">{usd(t.listPrice)} list</span>) },
    { id: "gci", header: "Side GCI", width: "104px", align: "right", accessor: (t) => t.commission.sideCommission, cell: (t) => compactUsd(t.commission.sideCommission) },
    { id: "net", header: "Net agent", width: "104px", align: "right", defaultHidden: true, accessor: (t) => t.commission.netAgent, cell: (t) => compactUsd(t.commission.netAgent) },
    { id: "stage", header: "Status", width: "150px", accessor: (t) => TX_STAGES.findIndex((s) => s.key === t.stage), cell: (t) => <StatusBadge value={t.stage} size="sm" /> },
    { id: "closing", header: "Closing", width: "100px", accessor: (t) => t.closingDate, cell: (t) => <span className="tabular text-ink-2">{dateShort(t.closingDate)}</span> },
    {
      id: "coordinator", header: "Coordinator", width: "150px", defaultHidden: true,
      accessor: (t) => userName(t.coordinatorId),
      cell: (t) => <span className="truncate text-ink-3">{userName(t.coordinatorId)}</span>,
    },
    {
      id: "compliance", header: "File", width: "72px", align: "center", sortable: false,
      accessor: (t) => (t.complianceComplete ? "Complete" : "Incomplete"),
      cell: (t) => t.complianceComplete
        ? <CheckCircle2 className="mx-auto size-4 text-ok-500" />
        : <span className="mx-auto block size-2 rounded-full bg-warn-500" />,
    },
  ];

  const filters: FilterDef<Transaction>[] = [
    {
      id: "stage", label: "Stage",
      options: TX_STAGES.map((s) => ({ value: s.key, label: s.label })),
      match: (t, v) => t.stage === v,
    },
    {
      id: "side", label: "Side",
      options: [
        { value: "buyer", label: "Buyer side" }, { value: "listing", label: "Listing side" },
        { value: "dual", label: "Both sides" }, { value: "rental", label: "Rental" },
      ],
      match: (t, v) => t.side === v,
    },
    ...(showAgent ? [{
      id: "agent", label: "Agent",
      options: Array.from(new Set(rows.map((t) => t.agentId))).map((id) => ({ value: id, label: agentName(id) })),
      match: (t: Transaction, v: string) => t.agentId === v,
    }] : []),
    {
      id: "compliance", label: "File status",
      options: [{ value: "complete", label: "Compliance complete" }, { value: "gap", label: "Has a gap" }],
      match: (t, v) => (v === "complete" ? t.complianceComplete : !t.complianceComplete),
    },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      filters={filters}
      getRowId={(t) => t.id}
      searchKeys={(t) => `${t.address} ${t.unit ?? ""} ${t.ref} ${t.city} ${agentName(t.agentId)} ${t.counterparty} ${t.counterpartyBrokerage}`}
      searchPlaceholder="Search address, ref or client…"
      onRowClick={(t) => router.push(`${base}/transactions/${t.id}`)}
      exportName="tru-transactions"
      toolbarExtra={toolbarExtra}
      savedViews={[
        { id: "v1", name: "Closing this month", filters: { stage: ["closing", "final_walkthrough", "loan"] }, search: "" },
        { id: "v2", name: "Compliance gaps", filters: { compliance: ["gap"] }, search: "" },
        { id: "v3", name: "Listing side only", filters: { side: ["listing"] }, search: "" },
      ]}
      bulkActions={[
        { label: "Assign coordinator", icon: <UserCog />, onClick: (ids) => toast.success(`Coordinator assigned to ${ids.length} file${ids.length > 1 ? "s" : ""}`) },
        { label: "Request documents", icon: <FileSignature />, onClick: (ids) => toast.success(`Document request sent for ${ids.length} file${ids.length > 1 ? "s" : ""}`) },
        { label: "Export selected", icon: <Download />, onClick: (ids) => toast.success(`${ids.length} rows exported`) },
      ]}
      emptyTitle={emptyTitle ?? "No transactions match those filters"}
      emptyDescription={emptyDescription ?? "Adjust the filters above, or open a new transaction to get started."}
      emptyAction={emptyAction}
    />
  );
}
