"use client";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTable } from "@/components/admin/clients-view";
import { useStore } from "@/lib/store";
import { useCurrentAgent } from "@/lib/session";
import { num } from "@/lib/format";

export default function AgentClients() {
  const agent = useCurrentAgent();
  const { clients } = useStore();
  if (!agent) return null;

  const mine = clients.filter((c) => c.agentId === agent.id);
  const buyers = mine.filter((c) => ["buyer", "both", "investor", "renter"].includes(c.type));
  const sellers = mine.filter((c) => ["seller", "both"].includes(c.type));
  const leads = mine.filter((c) => c.status === "new_lead" || c.status === "nurturing");
  const due = mine.filter((c) => c.nextFollowUp && c.nextFollowUp <= "2026-08-31");

  return (
    <>
      <PageHeader title="Clients" description="Your book of business — buyers, sellers, leads and everyone you are nurturing." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total clients" value={num(mine.length)} sub={`${buyers.length} buyers · ${sellers.length} sellers`} />
        <MetricCard label="New & nurturing" value={num(leads.length)} sub="Not yet in a transaction" />
        <MetricCard label="Under contract" value={num(mine.filter((c) => c.status === "under_contract").length)} sub="Currently in a deal" />
        <MetricCard label="Follow-ups this month" value={num(due.length)} sub="Scheduled through Aug 31" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="all"><ClientsTable rows={mine} base="/agent" showAgent={false} defaultAgentId={agent.id} /></TabsContent>
          <TabsContent value="buyers"><ClientsTable rows={buyers} base="/agent" showAgent={false} defaultAgentId={agent.id} /></TabsContent>
          <TabsContent value="sellers"><ClientsTable rows={sellers} base="/agent" showAgent={false} defaultAgentId={agent.id} /></TabsContent>
          <TabsContent value="leads"><ClientsTable rows={leads} base="/agent" showAgent={false} defaultAgentId={agent.id} /></TabsContent>
          <TabsContent value="followups"><ClientsTable rows={due} base="/agent" showAgent={false} defaultAgentId={agent.id} /></TabsContent>
        </div>
      </Tabs>
    </>
  );
}
