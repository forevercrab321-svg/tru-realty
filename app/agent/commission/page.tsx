"use client";
import Link from "next/link";
import { Banknote, Download, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, ProgressBar, Stat } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/empty-state";
import { AreaTrend } from "@/components/charts";
import { useStore } from "@/lib/store";
import { useCurrentAgent } from "@/lib/session";
import { payoutsByAgent, chargesByAgent, taxForAgent } from "@/data/finance";
import { monthlySeries } from "@/data/performance";
import { compactUsd, dateMed, num, pct, usd } from "@/lib/format";
import { sum } from "@/lib/utils";

export default function AgentCommission() {
  const agent = useCurrentAgent();
  const { transactions } = useStore();
  if (!agent) return null;

  const mine = transactions.filter((t) => t.agentId === agent.id);
  const open = mine.filter((t) => !["closed", "cancelled"].includes(t.stage));
  const closed = mine.filter((t) => t.stage === "closed");
  const payouts = payoutsByAgent(agent.id);
  const charges = chargesByAgent(agent.id);
  const tax = taxForAgent(agent.id)!;

  const series = monthlySeries.map((m) => ({
    month: m.month,
    commission: Math.round(m.gci * (agent.stats.ytdGci / 12_000_000)),
  }));

  return (
    <>
      <PageHeader
        title="Commission"
        description="What you have earned, what is coming, and exactly how each deal was calculated."
        actions={<Button variant="secondary"><Download /> Download statement</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="YTD commission" value={compactUsd(tax.ytdCommission)} sub={`${closed.length} closed files`} tone="dark" icon={<Banknote />} />
        <MetricCard label="YTD paid out" value={compactUsd(tax.ytdPaid)} sub="Net, after splits and fees" />
        <MetricCard label="Pending payout" value={compactUsd(tax.pending)} sub="Approved but not released" />
        <MetricCard label="In pipeline" value={compactUsd(sum(open, (t) => t.commission.netAgent))} sub="If every open file closes" icon={<TrendingUp />} />
      </div>

      <Tabs defaultValue="deals">
        <TabsList>
          <TabsTrigger value="deals">By deal</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="charges">My charges</TabsTrigger>
          <TabsTrigger value="plan">Plan & taxes</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="deals">
            {mine.length === 0 ? (
              <EmptyState title="No commission yet" description="Commission breakdowns appear as soon as your first deal is opened." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {mine.map((t) => {
                  const c = t.commission;
                  return (
                    <Card key={t.id}>
                      <CardHeader>
                        <div className="min-w-0">
                          <CardTitle>
                            <Link href={`/agent/transactions/${t.id}`} className="hover:underline">
                              {t.address}{t.unit ? `, ${t.unit}` : ""}
                            </Link>
                          </CardTitle>
                          <p className="mt-0.5 text-[12px] text-ink-4">{t.ref} · closes {dateMed(t.closingDate)}</p>
                        </div>
                        <StatusBadge value={t.stage} size="sm" />
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
                              ["Net to you", usd(c.netAgent), true],
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
            )}
          </TabsContent>

          <TabsContent value="payouts">
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <Card>
                <CardHeader>
                  <CardTitle>Payout history</CardTitle>
                  <Badge tone="neutral" size="sm">{payouts.length} disbursements</Badge>
                </CardHeader>
                {payouts.length === 0 ? (
                  <EmptyState title="No payouts yet" description="Your first disbursement will land the Wednesday after your first closing." className="m-4 border-dashed" />
                ) : (
                  <ul className="divide-y divide-line">
                    {payouts.map((p) => {
                      const t = transactions.find((x) => x.id === p.transactionId);
                      return (
                        <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] text-ink">{t?.address ?? p.reference}</p>
                            <p className="mt-0.5 text-[11.5px] text-ink-4">{p.reference} · {p.method} · {p.issuedAt ? dateMed(p.issuedAt) : "not yet issued"}</p>
                          </div>
                          <span className="hidden text-[12.5px] tabular text-ink-3 sm:block">− {usd(p.deductions)}</span>
                          <span className="w-24 text-right text-[13px] font-medium tabular text-ink">{usd(p.netPayout)}</span>
                          <StatusBadge value={p.status} size="sm" />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
              <Card>
                <CardHeader><CardTitle>Commission trend</CardTitle></CardHeader>
                <CardBody><AreaTrend data={series} xKey="month" yKey="commission" name="Commission" height={200} /></CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="charges">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>My charges</CardTitle>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">
                    {usd(sum(charges.filter((c) => c.status !== "paid" && c.status !== "waived"), (c) => c.amount))} outstanding
                  </p>
                </div>
              </CardHeader>
              <ul className="divide-y divide-line">
                {charges.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{c.description}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">{c.category} · {dateMed(c.date)}</p>
                    </div>
                    <span className="text-[13px] tabular text-ink-2">{usd(c.amount)}</span>
                    <StatusBadge value={c.status} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="plan">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Your commission plan</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <dl className="grid grid-cols-2 gap-5">
                    <Stat label="Plan" value={agent.plan.name} />
                    <Stat label="Your split" value={pct(agent.plan.agentSplit, 0)} />
                    <Stat label="Transaction fee" value={usd(agent.plan.transactionFee)} />
                    <Stat label="Annual cap" value={usd(agent.plan.cap)} />
                  </dl>
                  <div className="border-t border-line pt-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-[12.5px] text-ink-2">Company dollar paid this year</p>
                      <p className="text-[12.5px] tabular text-ink-3">{usd(agent.plan.capYtd)} / {usd(agent.plan.cap)}</p>
                    </div>
                    <ProgressBar value={(agent.plan.capYtd / agent.plan.cap) * 100} className="mt-1.5" tone={agent.plan.capYtd >= agent.plan.cap ? "ok" : "brand"} />
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-4">
                      {agent.plan.capYtd >= agent.plan.cap
                        ? "You have capped for 2026. Every closing from here keeps 100% of company dollar, less the transaction fee."
                        : `${usd(agent.plan.cap - agent.plan.capYtd)} remaining before you cap for 2026.`}
                    </p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Tax & 1099</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <dl className="grid grid-cols-2 gap-5">
                    <Stat label="Payee entity" value={tax.entityName} />
                    <Stat label="TIN on file" value={<span className="tabular">{tax.tin}</span>} />
                    <Stat label="YTD commission" value={<span className="tabular">{usd(tax.ytdCommission)}</span>} />
                    <Stat label="YTD paid" value={<span className="tabular">{usd(tax.ytdPaid)}</span>} />
                    <Stat label="Pending" value={<span className="tabular">{usd(tax.pending)}</span>} />
                    <Stat label="1099 status" value={<StatusBadge value={tax.form1099Status} size="sm" />} />
                  </dl>
                  <p className="border-t border-line pt-3 text-[12px] leading-relaxed text-ink-4">
                    You are paid as an independent contractor. Tru does not withhold taxes — set aside for quarterly
                    estimates. Your 1099-NEC is issued by January 31.
                  </p>
                  <Button variant="secondary" size="sm" full><Download /> Download 2025 1099</Button>
                </CardBody>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
