"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Plus, Tag, UserPlus } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewClientDialog } from "@/components/admin/create-dialogs";
import { compactUsd, dateShort, relative, titleCase } from "@/lib/format";
import { agentName, agents } from "@/data/agents";
import type { Client } from "@/types";
import { toast } from "sonner";

export function ClientsTable({ rows, base, showAgent = true, defaultAgentId }: {
  rows: Client[]; base: string; showAgent?: boolean; defaultAgentId?: string;
}) {
  const router = useRouter();

  const columns: Column<Client>[] = [
    {
      id: "name", header: "Client", width: "220px", accessor: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{c.name}</p>
            <p className="truncate text-[11.5px] text-ink-4">{c.email}</p>
          </div>
        </div>
      ),
    },
    { id: "type", header: "Type", width: "96px", accessor: (c) => c.type, cell: (c) => <Badge tone="neutral" size="sm">{titleCase(c.type)}</Badge> },
    { id: "status", header: "Status", width: "128px", accessor: (c) => c.status, cell: (c) => <StatusBadge value={c.status} size="sm" /> },
    { id: "phone", header: "Phone", width: "126px", defaultHidden: true, accessor: (c) => c.phone, cell: (c) => <span className="tabular">{c.phone}</span> },
    {
      id: "budget", header: "Budget", width: "140px", align: "right", accessor: (c) => c.budgetMax,
      cell: (c) => c.budgetMax ? <span>{compactUsd(c.budgetMin)} – {compactUsd(c.budgetMax)}</span> : <span className="text-ink-4">—</span>,
    },
    { id: "areas", header: "Area", width: "160px", accessor: (c) => c.areas.join(", "), cell: (c) => <span className="truncate text-ink-3">{c.areas.join(", ") || "—"}</span> },
    ...(showAgent ? [{
      id: "agent", header: "Agent", width: "150px",
      accessor: (c: Client) => agentName(c.agentId),
      cell: (c: Client) => (
        <div className="flex items-center gap-2"><Avatar name={agentName(c.agentId)} size="xs" /><span className="truncate">{agentName(c.agentId)}</span></div>
      ),
    }] : []),
    { id: "source", header: "Source", width: "140px", defaultHidden: true, accessor: (c) => c.leadSource, cell: (c) => c.leadSource },
    { id: "last", header: "Last contact", width: "116px", accessor: (c) => c.lastContact, cell: (c) => <span className="tabular text-ink-3">{dateShort(c.lastContact)}</span> },
    {
      id: "next", header: "Next follow-up", width: "128px", accessor: (c) => c.nextFollowUp ?? "9999",
      cell: (c) => c.nextFollowUp
        ? <span className={`tabular ${c.nextFollowUp <= "2026-08-27" ? "font-medium text-risk-500" : "text-ink-2"}`}>{relative(c.nextFollowUp)}</span>
        : <span className="text-ink-4">—</span>,
    },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(c) => c.id}
      onRowClick={(c) => router.push(`${base}/clients/${c.id}`)}
      searchKeys={(c) => `${c.name} ${c.email} ${c.phone} ${c.areas.join(" ")} ${c.tags.join(" ")} ${agentName(c.agentId)}`}
      searchPlaceholder="Search clients, areas, tags…"
      exportName="tru-clients"
      savedViews={[
        { id: "v1", name: "Follow up now", filters: { status: ["new_lead", "active"] }, search: "" },
        { id: "v2", name: "Under contract", filters: { status: ["under_contract"] }, search: "" },
        { id: "v3", name: "Buyers only", filters: { type: ["buyer"] }, search: "" },
      ]}
      filters={[
        { id: "type", label: "Type", options: ["buyer", "seller", "both", "renter", "investor"].map((t) => ({ value: t, label: titleCase(t) })), match: (c, v) => c.type === v },
        { id: "status", label: "Status", options: ["new_lead", "nurturing", "active", "under_contract", "closed", "lost"].map((t) => ({ value: t, label: titleCase(t) })), match: (c, v) => c.status === v },
        ...(showAgent ? [{
          id: "agent", label: "Agent",
          options: agents.map((a) => ({ value: a.id, label: a.name })),
          match: (c: Client, v: string) => c.agentId === v,
        }] : []),
      ]}
      bulkActions={[
        { label: "Email", icon: <Mail />, onClick: (ids) => toast.success(`Draft started for ${ids.length} clients`) },
        { label: "Tag", icon: <Tag />, onClick: (ids) => toast.success(`${ids.length} clients tagged`) },
      ]}
      toolbarExtra={<NewClientDialog defaultAgentId={defaultAgentId} trigger={<Button size="sm" variant="primary"><Plus /> Add client</Button>} />}
      emptyTitle="No clients match those filters"
      emptyDescription="Adjust the filters, or add someone new to the database."
      emptyAction={<NewClientDialog defaultAgentId={defaultAgentId} trigger={<Button variant="primary" size="sm"><UserPlus /> Add a client</Button>} />}
    />
  );
}
