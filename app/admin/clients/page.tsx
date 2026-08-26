"use client";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { ClientsTable } from "@/components/admin/clients-view";
import { useStore } from "@/lib/store";
import { num } from "@/lib/format";

export default function AdminClients() {
  const { clients } = useStore();
  const leads = clients.filter((c) => c.status === "new_lead");
  const active = clients.filter((c) => ["active", "nurturing"].includes(c.status));
  const contract = clients.filter((c) => c.status === "under_contract");
  const dueToday = clients.filter((c) => c.nextFollowUp && c.nextFollowUp <= "2026-08-27");

  return (
    <>
      <PageHeader
        title="Clients"
        description="Every buyer, seller and lead in the brokerage database, with the agent who owns the relationship."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total records" value={num(clients.length)} sub={`${leads.length} new leads`} />
        <MetricCard label="Working" value={num(active.length)} sub="Active or nurturing" />
        <MetricCard label="Under contract" value={num(contract.length)} sub="Currently in a transaction" />
        <MetricCard label="Follow-ups due" value={num(dueToday.length)} sub="Today or overdue" />
      </div>
      <ClientsTable rows={clients} base="/admin" />
    </>
  );
}
