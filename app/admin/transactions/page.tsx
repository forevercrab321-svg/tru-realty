"use client";
import * as React from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { TransactionTable } from "@/components/admin/transaction-table";
import { NewTransactionDialog } from "@/components/admin/create-dialogs";
import { useStore } from "@/lib/store";
import { compactUsd, num } from "@/lib/format";
import { sum } from "@/lib/utils";

export default function AdminTransactions() {
  const { transactions } = useStore();
  const open = transactions.filter((t) => !["closed", "cancelled"].includes(t.stage));
  const active = open.filter((t) => ["lead", "offer", "accepted"].includes(t.stage));
  const underContract = open.filter((t) => !["lead", "offer", "accepted"].includes(t.stage));
  const closed = transactions.filter((t) => t.stage === "closed");
  const cancelled = transactions.filter((t) => t.stage === "cancelled");

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every file across the brokerage, from first offer through disbursement."
        actions={<NewTransactionDialog trigger={<Button variant="primary"><Plus /> New transaction</Button>} />}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Open files" value={num(open.length)} sub={`${compactUsd(sum(open, (t) => t.salePrice || t.listPrice))} in pipeline`} />
        <MetricCard label="Under contract or later" value={num(underContract.length)} sub="Past the acceptance milestone" />
        <MetricCard label="Closed, YTD" value={num(closed.length)} sub={`${compactUsd(sum(closed, (t) => t.salePrice))} closed volume`} />
        <MetricCard label="Compliance gaps" value={num(open.filter((t) => !t.complianceComplete).length)} sub="Files missing a required document" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All open <Count n={open.length} /></TabsTrigger>
          <TabsTrigger value="active">Early stage <Count n={active.length} /></TabsTrigger>
          <TabsTrigger value="contract">Under contract <Count n={underContract.length} /></TabsTrigger>
          <TabsTrigger value="closed">Closed <Count n={closed.length} /></TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled <Count n={cancelled.length} /></TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="all"><TransactionTable rows={open} base="/admin" /></TabsContent>
          <TabsContent value="active">
            <TransactionTable rows={active} base="/admin"
              emptyTitle="No early-stage files"
              emptyDescription="Nothing is sitting in lead, offer or accepted right now." />
          </TabsContent>
          <TabsContent value="contract"><TransactionTable rows={underContract} base="/admin" /></TabsContent>
          <TabsContent value="closed"><TransactionTable rows={closed} base="/admin" /></TabsContent>
          <TabsContent value="cancelled">
            <TransactionTable rows={cancelled} base="/admin"
              emptyTitle="No cancelled transactions"
              emptyDescription="Nothing has fallen through this year." />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1.5 rounded-[5px] bg-sunken px-1.5 text-[11px] tabular text-ink-3">{n}</span>;
}
