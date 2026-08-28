"use client";
import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Cake, IdCard, Mail, MapPin, Phone, Send, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { MetricCard, ProgressBar, Stat } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Timeline } from "@/components/ui/timeline";
import { AreaTrend } from "@/components/charts";
import { TransactionTable } from "@/components/admin/transaction-table";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { agentById, teamById } from "@/data/agents";
import { officeById, officeName } from "@/data/offices";
import { agreements, trainingRecords, userName } from "@/data/company";
import { chargesByAgent, payoutsByAgent, taxForAgent } from "@/data/finance";
import { onboardingByAgent, ONBOARDING_STAGES } from "@/data/pipeline";
import { monthlySeries } from "@/data/performance";
import { compactUsd, dateMed, dateShort, daysUntil, num, pct, phoneFmt, titleCase, usd } from "@/lib/format";
import { LISTING_STATUS_LABEL } from "@/data/listings";
import { toast } from "sonner";
import { asset } from "@/lib/utils";

export function AgentProfile({ id }: { id: string }) {
  const { hasPermission } = useSession();
  const agent = agentById(id);
  const { transactions, clients, listings } = useStore();
  if (!agent) return notFound();

  const office = officeById(agent.officeId)!;
  const team = teamById(agent.teamId);
  const myTx = transactions.filter((t) => t.agentId === agent.id || t.coAgentId === agent.id);
  const myClients = clients.filter((c) => c.agentId === agent.id);
  const myListings = listings.filter((l) => l.listingAgentId === agent.id);
  const myPayouts = payoutsByAgent(agent.id);
  const myCharges = chargesByAgent(agent.id);
  const tax = taxForAgent(agent.id);
  const myTraining = trainingRecords.filter((t) => t.agentId === agent.id);
  const myAgreements = agreements.filter((a) => a.agentId === agent.id);
  const ob = onboardingByAgent(agent.id);

  const series = monthlySeries.map((m) => ({
    month: m.month,
    volume: Math.round(m.volume * (agent.stats.ytdVolume / 238_000_000)),
  }));

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Agents & HR", href: "/admin/agents" }, { label: agent.name }]}
        title={<span className="flex flex-wrap items-center gap-2.5">{agent.name}<StatusBadge value={agent.status} /></span>}
        description={`${agent.title} · ${officeName(agent.officeId)}${team ? ` · ${team.name}` : ""}`}
        actions={
          <>
            <Button variant="secondary" asChild><a href={`mailto:${agent.email}`}><Mail /> Email</a></Button>
            <Button variant="primary" onClick={() => toast.success(`Message drafted to ${agent.firstName}`)}><Send /> Message</Button>
          </>
        }
      />

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <Avatar name={agent.name} size="2xl" className="shrink-0" />
          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Email" value={<span className="break-all text-[13px]">{agent.email}</span>} />
            <Stat label="Phone" value={phoneFmt(agent.phone)} />
            <Stat label="License #" value={<span className="tabular">{agent.license.number}</span>} />
            <Stat label="MLS ID" value={<span className="tabular">{agent.mls.mlsId}</span>} />
            <Stat label="Joined" value={dateMed(agent.joinDate)} />
          </dl>
        </CardBody>
      </Card>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="YTD volume" value={compactUsd(agent.stats.ytdVolume)} sub={`${agent.stats.ytdClosings} closings`} />
        <MetricCard label="YTD GCI" value={compactUsd(agent.stats.ytdGci)} sub={agent.plan.name} />
        <MetricCard label="Active deals" value={num(myTx.filter((t) => !["closed", "cancelled"].includes(t.stage)).length)} sub={`${myListings.filter((l) => !["sold", "withdrawn", "expired"].includes(l.status)).length} live listings`} />
        <MetricCard
          label="Cap progress"
          value={pct((agent.plan.capYtd / agent.plan.cap) * 100, 0)}
          sub={`${usd(agent.plan.capYtd)} of ${usd(agent.plan.cap)}`}
          footer={<ProgressBar value={(agent.plan.capYtd / agent.plan.cap) * 100} tone={agent.plan.capYtd >= agent.plan.cap ? "ok" : "brand"} />}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Bio</CardTitle></CardHeader>
                  <CardBody>
                    <p className="text-[13.5px] leading-relaxed text-ink-2">{agent.bio}</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <Stat label="Neighborhoods" value={<span className="text-[13px]">{agent.neighborhoods.join(", ")}</span>} />
                      <Stat label="Specialties" value={<span className="text-[13px]">{agent.specialties.join(", ")}</span>} />
                      <Stat label="Languages" value={<span className="text-[13px]">{agent.languages.join(", ")}</span>} />
                    </div>
                  </CardBody>
                </Card>

                {ob && ob.stage !== "active" && (
                  <Card>
                    <CardHeader>
                      <div>
                        <CardTitle>Onboarding</CardTitle>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">Target activation {dateMed(ob.targetActivation)} · owner {userName(ob.assignedTo)}</p>
                      </div>
                      <StatusBadge value={ob.stage} size="sm" />
                    </CardHeader>
                    <CardBody>
                      <div className="mb-4 flex items-center gap-1">
                        {ONBOARDING_STAGES.map((s, i) => (
                          <span key={s.key} className={`h-1 flex-1 rounded-full ${i <= ONBOARDING_STAGES.findIndex((x) => x.key === ob.stage) ? "bg-brand-600" : "bg-sunken"}`} />
                        ))}
                      </div>
                      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        {ob.checklist.map((c) => (
                          <li key={c.key} className="flex items-center justify-between gap-2 text-[12.5px]">
                            <span className="flex items-center gap-1.5">
                              <span className={`size-1.5 rounded-full ${c.done ? "bg-brand-600" : c.required ? "bg-warn-500" : "bg-line-strong"}`} />
                              <span className={c.done ? "text-ink-4 line-through" : "text-ink-2"}>{c.label}</span>
                            </span>
                            <span className="shrink-0 text-[11px] text-ink-4">{c.owner}</span>
                          </li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>
                )}

                <Card>
                  <CardHeader><CardTitle>Production trend</CardTitle></CardHeader>
                  <CardBody><AreaTrend data={series} xKey="month" yKey="volume" name="Closed volume" height={200} /></CardBody>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>License & MLS</CardTitle></CardHeader>
                  <CardBody className="space-y-3">
                    <Stat label="License" value={<span className="flex items-center gap-2"><span className="tabular">{agent.license.number}</span><StatusBadge value={agent.license.status} size="sm" /></span>} />
                    <Stat label="Type" value={agent.license.type} />
                    <Stat label="Issued" value={dateMed(agent.license.issued)} />
                    <Stat label="Expires" value={<span className={daysUntil(agent.license.expires) < 60 ? "text-warn-700" : ""}>{dateMed(agent.license.expires)}</span>} />
                    <Stat label="Verified" value={agent.license.verifiedOn ? `${dateMed(agent.license.verifiedOn)} by ${agent.license.verifiedBy}` : "Not yet verified"} />
                    <div className="border-t border-line pt-3">
                      <Stat label="MLS" value={<span className="flex items-center gap-2"><span className="tabular">{agent.mls.mlsId}</span><StatusBadge value={agent.mls.status} size="sm" /></span>} />
                      <p className="mt-1 text-[12px] text-ink-4">{agent.mls.board} · dues {agent.mls.associationDuesPaid ? "paid" : "outstanding"}</p>
                    </div>
                    <Button size="sm" variant="secondary" full onClick={() => toast.success("License verification requested")}>
                      <IdCard /> Request verification
                    </Button>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Office & team</CardTitle></CardHeader>
                  <CardBody className="space-y-3">
                    <Stat label="Office" value={<span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-ink-4" />{office.name.replace(" — Headquarters", "")}</span>} />
                    <Stat label="Address" value={<span className="flex gap-1.5 text-[13px]"><MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-4" />{office.street}, {office.city}</span>} />
                    <Stat label="Managing broker" value={office.managingBroker} />
                    <Stat label="Team" value={team ? <span className="flex items-center gap-1.5"><Users className="size-3.5 text-ink-4" />{team.name}{team.leadAgentId === agent.id ? " (lead)" : ""}</span> : "Individual agent"} />
                    <Stat label="Birthday" value={<span className="flex items-center gap-1.5"><Cake className="size-3.5 text-ink-4" />{new Date(`2026-${agent.birthday}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span>} />
                  </CardBody>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionTable
              rows={myTx}
              base="/admin"
              showAgent={false}
              emptyTitle={`${agent.firstName} has no transactions yet`}
              emptyDescription="New files will appear here as soon as the first offer goes out."
            />
          </TabsContent>

          <TabsContent value="listings">
            {myListings.length === 0 ? (
              <EmptyState title="No listings" description={`${agent.firstName} has no listings on file.`} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myListings.map((l) => (
                  <Link key={l.id} href={`/admin/listings/${l.id}`} className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-shadow hover:shadow-md">
                    <img src={asset(l.images[0])} alt="" className="aspect-[16/10] w-full object-cover" />
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] font-semibold tabular text-ink">{usd(l.price)}</p>
                        <StatusBadge value={l.status} label={LISTING_STATUS_LABEL[l.status]} size="sm" />
                      </div>
                      <p className="mt-1 truncate text-[13px] text-ink-2">{l.address}{l.unit ? `, ${l.unit}` : ""}</p>
                      <p className="mt-0.5 text-[12px] text-ink-4">{l.beds} bd · {l.baths} ba · {num(l.sqft)} sf · {l.daysOnMarket} DOM</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clients">
            {myClients.length === 0 ? (
              <EmptyState title="No clients assigned" description="Client records assigned to this agent will show up here." />
            ) : (
              <Card>
                <ul className="divide-y divide-line">
                  {myClients.map((c) => (
                    <li key={c.id}>
                      <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas">
                        <Avatar name={c.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-ink">{c.name}</p>
                          <p className="mt-0.5 truncate text-[11.5px] text-ink-4">{titleCase(c.type)} · {c.areas.join(", ") || "No area set"}</p>
                        </div>
                        <span className="hidden text-[12.5px] tabular text-ink-3 sm:block">
                          {c.budgetMax ? `${compactUsd(c.budgetMin)}–${compactUsd(c.budgetMax)}` : "—"}
                        </span>
                        <StatusBadge value={c.status} size="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="commission">
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <Card>
                <CardHeader>
                  <CardTitle>Payout history</CardTitle>
                  <Badge tone="neutral" size="sm">{myPayouts.length} disbursements</Badge>
                </CardHeader>
                {myPayouts.length === 0 ? (
                  <EmptyState title="No payouts yet" description="Disbursements appear here once the first file closes." className="m-4 border-dashed" />
                ) : (
                  <ul className="divide-y divide-line">
                    {myPayouts.map((p) => {
                      const tx = transactions.find((t) => t.id === p.transactionId);
                      return (
                        <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] text-ink">{tx?.address ?? p.reference}</p>
                            <p className="mt-0.5 text-[11.5px] text-ink-4">{p.reference} · {p.period} · {p.method}</p>
                          </div>
                          <span className="text-[13px] tabular text-ink-3">− {usd(p.deductions)}</span>
                          <span className="w-24 text-right text-[13px] font-medium tabular text-ink">{usd(p.netPayout)}</span>
                          <StatusBadge value={p.status} size="sm" />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Commission plan</CardTitle></CardHeader>
                  <CardBody className="space-y-3">
                    {hasPermission("commission.view") ? (
                      <>
                        <Stat label="Plan" value={agent.plan.name} />
                        <Stat label="Agent split" value={pct(agent.plan.agentSplit, 0)} />
                        <Stat label="Transaction fee" value={usd(agent.plan.transactionFee)} />
                        <Stat label="Annual cap" value={usd(agent.plan.cap)} />
                        <Stat label="Cap paid YTD" value={usd(agent.plan.capYtd)} />
                      </>
                    ) : (
                      <p className="text-[13px] text-ink-3">Commission plans are restricted to accounting and brokerage administration.</p>
                    )}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Tax & 1099</CardTitle></CardHeader>
                  <CardBody className="space-y-3">
                    {/* The route guard closed /admin/payouts to a coordinator and to HR.
                        Both hold agents.view, so the identical TIN, entity and YTD figures
                        were still one URL away here — sixteen agents, sixteen URLs. */}
                    {hasPermission("payouts.view") ? (
                      <>
                        <Stat label="Entity" value={tax?.entityName ?? agent.name} />
                        <Stat label="TIN" value={<span className="tabular">{tax?.tin ?? "—"}</span>} />
                        <Stat label="YTD commission" value={<span className="tabular">{usd(tax?.ytdCommission ?? 0)}</span>} />
                        <Stat label="YTD paid" value={<span className="tabular">{usd(tax?.ytdPaid ?? 0)}</span>} />
                        <Stat label="1099 status" value={<StatusBadge value={tax?.form1099Status ?? "not_started"} size="sm" />} />
                      </>
                    ) : (
                      <p className="text-[13px] text-ink-3">Tax identification and 1099 figures are restricted to accounting.</p>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Agent file</CardTitle>
                <Badge tone="neutral" size="sm">{myAgreements.length} documents</Badge>
              </CardHeader>
              <ul className="divide-y divide-line">
                {myAgreements.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{a.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">{a.type} · version {a.version}</p>
                    </div>
                    <span className="text-[12px] tabular text-ink-3">{a.signedOn ? dateShort(a.signedOn) : "—"}</span>
                    <StatusBadge value={a.status} size="sm" />
                  </li>
                ))}
                {myCharges.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{c.description}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">{c.category} charge · {dateMed(c.date)}</p>
                    </div>
                    <span className="text-[13px] tabular text-ink-2">{usd(c.amount)}</span>
                    <StatusBadge value={c.status} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle>Training record</CardTitle>
                <Badge tone="neutral" size="sm">
                  {myTraining.filter((t) => t.status === "completed").reduce((s, t) => s + t.ceCredits, 0)} CE credits earned
                </Badge>
              </CardHeader>
              <ul className="divide-y divide-line">
                {myTraining.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{t.course}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">{t.provider} · {t.ceCredits} credits</p>
                    </div>
                    <span className="text-[12px] tabular text-ink-3">
                      {t.completedOn ? dateShort(t.completedOn) : t.dueOn ? `due ${dateShort(t.dueOn)}` : "—"}
                    </span>
                    <StatusBadge value={t.status} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="agreements">
            <Card>
              <CardHeader><CardTitle>Agreements</CardTitle></CardHeader>
              <ul className="divide-y divide-line">
                {myAgreements.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{a.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">
                        {a.type} · {a.signedOn ? `signed ${dateMed(a.signedOn)}` : "awaiting signature"}
                        {a.expiresOn ? ` · expires ${dateMed(a.expiresOn)}` : ""}
                      </p>
                    </div>
                    <StatusBadge value={a.status} size="sm" />
                    <Button size="xs" variant="ghost" onClick={() => toast.success("Copy sent")}>Send copy</Button>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Closed volume by month</CardTitle></CardHeader>
                <CardBody><AreaTrend data={series} xKey="month" yKey="volume" name="Volume" height={240} /></CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Key metrics</CardTitle></CardHeader>
                <CardBody>
                  <dl className="grid grid-cols-2 gap-5">
                    <Stat label="Lifetime volume" value={<span className="tabular text-[17px] font-semibold">{compactUsd(agent.stats.lifetimeVolume)}</span>} />
                    <Stat label="YTD closings" value={<span className="tabular text-[17px] font-semibold">{agent.stats.ytdClosings}</span>} />
                    <Stat label="List-to-sale ratio" value={<span className="tabular text-[17px] font-semibold">{pct(agent.stats.listToSaleRatio)}</span>} />
                    <Stat label="Avg. days on market" value={<span className="tabular text-[17px] font-semibold">{agent.stats.avgDaysOnMarket}</span>} />
                    <Stat label="Client satisfaction" value={<span className="tabular text-[17px] font-semibold">{agent.stats.satisfaction.toFixed(1)} / 5</span>} />
                    <Stat label="Production tier" value={<StatusBadge value={agent.tier} size="lg" />} />
                  </dl>
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
              <CardBody>
                <Timeline
                  items={[
                    { id: "j", label: "Joined Tru Realty", date: agent.joinDate, done: true, detail: `${officeName(agent.officeId)} office` },
                    ...myTx.slice(0, 6).map((t) => ({ id: t.id, label: `${t.address} — ${titleCase(t.stage)}`, date: t.createdAt, done: true, detail: `${t.ref} · ${compactUsd(t.salePrice || t.listPrice)}` })),
                    ...myPayouts.slice(0, 3).map((p) => ({ id: p.id, label: `Payout ${p.reference}`, date: p.issuedAt ?? p.period + "-01", done: p.status === "paid", detail: usd(p.netPayout) })),
                  ].sort((a, b) => b.date.localeCompare(a.date))}
                />
              </CardBody>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
