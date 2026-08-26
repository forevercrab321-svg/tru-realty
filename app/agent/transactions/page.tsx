"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { TransactionTable } from "@/components/admin/transaction-table";
import { NewTransactionDialog } from "@/components/admin/create-dialogs";
import { useStore } from "@/lib/store";
import { useCurrentAgent } from "@/lib/session";
import { compactUsd, num } from "@/lib/format";
import { sum } from "@/lib/utils";

export default function AgentTransactions() {
  const agent = useCurrentAgent();
  const { transactions } = useStore();
  if (!agent) return null;

  const mine = transactions.filter((t) => t.agentId === agent.id || t.coAgentId === agent.id);
  const open = mine.filter((t) => !["closed", "cancelled"].includes(t.stage));
  const closed = mine.filter((t) => t.stage === "closed");
  const docsNeeded = open.filter((t) => !t.complianceComplete);

  return (
    <>
      <PageHeader
        title="My deals"
        description="Every transaction you are on, with its milestones, documents and commission."
        actions={<NewTransactionDialog defaultAgentId={agent.id} trigger={<Button variant="primary"><Plus /> New deal</Button>} />}
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active deals" value={num(open.length)} sub={`${compactUsd(sum(open, (t) => t.salePrice || t.listPrice))} in pipeline`} />
        <MetricCard label="Expected net commission" value={compactUsd(sum(open, (t) => t.commission.netAgent))} sub="If every open file closes" />
        <MetricCard label="Closed, YTD" value={num(closed.length)} sub={`${compactUsd(sum(closed, (t) => t.salePrice))} volume`} />
        <MetricCard label="Files needing documents" value={num(docsNeeded.length)} sub="Missing a required item" />
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Active</TabsTrigger>
          <TabsTrigger value="docs">Needs documents</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="open">
            <TransactionTable
              rows={open} base="/agent" showAgent={false}
              emptyTitle="No active deals"
              emptyDescription="Open a transaction when your first offer goes out and it will show up here."
              emptyAction={<NewTransactionDialog defaultAgentId={agent.id} trigger={<Button variant="primary" size="sm"><Plus /> New deal</Button>} />}
            />
          </TabsContent>
          <TabsContent value="docs">
            <TransactionTable
              rows={docsNeeded} base="/agent" showAgent={false}
              emptyTitle="Every file is complete"
              emptyDescription="Nothing is missing a required document. Nice."
            />
          </TabsContent>
          <TabsContent value="closed">
            <TransactionTable rows={closed} base="/agent" showAgent={false} emptyTitle="Nothing closed yet this year" />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
