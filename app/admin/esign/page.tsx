"use client";
import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Copy, FileSignature, Plus, Send, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useStore } from "@/lib/store";
import { signatureTemplates } from "@/data/esign";
import { agentName } from "@/data/agents";
import { dateMed, num, relative } from "@/lib/format";
import type { SignatureRequest } from "@/types";
import { toast } from "sonner";

export default function EsignPage() {
  const { signatureRequests, transactions } = useStore();
  const pending = signatureRequests.filter((s) => ["sent", "viewed", "signed"].includes(s.status));
  const completed = signatureRequests.filter((s) => s.status === "completed");
  const problems = signatureRequests.filter((s) => ["expired", "declined"].includes(s.status));
  const drafts = signatureRequests.filter((s) => s.status === "draft");

  return (
    <>
      <PageHeader
        title="E-Signature"
        description="Every document out for signature, who has signed, and what is stuck."
        actions={<Button variant="primary" onClick={() => toast.success("Signature request builder would open here")}><Plus /> New signature request</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Out for signature" value={num(pending.length)} sub="Sent, viewed or partially signed" icon={<Clock />} />
        <MetricCard label="Completed" value={num(completed.length)} sub="All parties signed" icon={<CheckCircle2 />} />
        <MetricCard label="Expired or declined" value={num(problems.length)} sub="Needs to be re-sent" icon={<XCircle />} />
        <MetricCard label="Templates" value={num(signatureTemplates.length)} sub="Reusable field maps" icon={<FileSignature />} />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">For signature</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="problems">Needs attention</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="pending"><RequestList rows={pending} transactions={transactions} /></TabsContent>
          <TabsContent value="completed"><RequestList rows={completed} transactions={transactions} /></TabsContent>
          <TabsContent value="problems">
            <RequestList rows={problems} transactions={transactions} emptyTitle="Nothing stuck" emptyDescription="No expired or declined signature requests." />
          </TabsContent>
          <TabsContent value="drafts">
            <RequestList rows={drafts} transactions={transactions} emptyTitle="No drafts" emptyDescription="Requests you start but do not send will show up here." />
          </TabsContent>
          <TabsContent value="templates">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {signatureTemplates.map((t) => (
                <Card key={t.id}>
                  <CardBody>
                    <FileSignature className="size-4 text-ink-4" />
                    <p className="mt-3 text-[14px] font-medium text-ink">{t.name}</p>
                    <p className="mt-1 text-[12.5px] text-ink-3">{t.category} · {t.fields} mapped fields</p>
                    <p className="mt-3 border-t border-line pt-3 text-[11.5px] text-ink-4">
                      Used {num(t.usageCount)} times · updated {dateMed(t.updatedAt)}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="primary" full onClick={() => toast.success(`Prepared "${t.name}" for sending`)}><Send /> Use</Button>
                      <Button size="iconSm" variant="secondary" onClick={() => toast.success("Template duplicated")}><Copy /></Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

function RequestList({ rows, transactions, emptyTitle, emptyDescription }: {
  rows: SignatureRequest[]; transactions: any[]; emptyTitle?: string; emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState icon={<FileSignature />} title={emptyTitle ?? "Nothing here"} description={emptyDescription ?? "No signature requests in this view."} />;
  }
  return (
    <Card>
      <ul className="divide-y divide-line">
        {rows.map((s) => {
          const tx = transactions.find((t) => t.id === s.transactionId);
          const signed = s.recipients.filter((r) => r.signed).length;
          return (
            <li key={s.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">{s.documentName}</p>
                  <p className="mt-0.5 text-[12px] text-ink-4">
                    {agentName(s.agentId)}
                    {tx && <> · <Link href={`/admin/transactions/${tx.id}`} className="text-brand-700 hover:underline">{tx.ref}</Link></>}
                    {s.sentAt ? ` · sent ${dateMed(s.sentAt)}` : " · not sent"}
                    {s.status !== "completed" && ` · expires ${relative(s.expiresAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral" size="sm">{signed}/{s.recipients.length} signed</Badge>
                  <StatusBadge value={s.status} size="sm" />
                  {["sent", "viewed"].includes(s.status) && (
                    <Button size="xs" variant="secondary" onClick={() => toast.success("Reminder sent")}>Remind</Button>
                  )}
                  {s.status === "expired" && (
                    <Button size="xs" variant="primary" onClick={() => toast.success("Request re-sent")}>Re-send</Button>
                  )}
                </div>
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                {s.recipients.map((r) => (
                  <li key={r.email} className="flex items-center gap-2">
                    <Avatar name={r.name} size="xs" />
                    <div>
                      <p className="text-[12.5px] text-ink-2">{r.name} <span className="text-ink-4">· {r.role}</span></p>
                      <p className="text-[11px] text-ink-4">{r.signed ? `Signed ${dateMed(r.signedAt!)}` : "Awaiting signature"}</p>
                    </div>
                    {r.signed ? <CheckCircle2 className="size-3.5 text-ok-500" /> : <Clock className="size-3.5 text-ink-4" />}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
