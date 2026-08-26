"use client";
import * as React from "react";
import { Building2, Check, Clock, FileText, Percent, Plus, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { BuyerRegistrationDialog } from "@/components/admin/create-dialogs";
import { useStore } from "@/lib/store";
import { useCurrentAgent } from "@/lib/session";
import { projects } from "@/data/projects";
import { compactUsd, dateMed, num, relative, titleCase } from "@/lib/format";
import { toast } from "sonner";
import { asset } from "@/lib/utils";

export default function ProjectSigning() {
  const agent = useCurrentAgent();
  const { buyerRegistrations, clients } = useStore();
  if (!agent) return null;

  const mine = buyerRegistrations.filter((r) => r.agentId === agent.id);
  const active = mine.filter((r) => ["submitted", "approved", "signed"].includes(r.status));

  return (
    <>
      <PageHeader
        title="Project signing"
        description="New development projects Tru represents, with published commission terms and buyer registration."
        actions={<BuyerRegistrationDialog trigger={<Button variant="primary"><Plus /> Register a buyer</Button>} />}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Projects available" value={num(projects.length)} sub={`${projects.reduce((s, p) => s + p.availableUnits, 0)} residences`} />
        <MetricCard label="My registrations" value={num(mine.length)} sub={`${active.length} active`} />
        <MetricCard label="Approved" value={num(mine.filter((r) => r.status === "approved").length)} sub="Commission protected" />
        <MetricCard label="Avg. co-broke" value={`${(projects.reduce((s, p) => s + p.commissionPct, 0) / projects.length).toFixed(1)}%`} sub="Across all projects" />
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="registrations">My registrations</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="projects">
            <div className="grid gap-4 lg:grid-cols-2">
              {projects.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="relative aspect-[16/9]">
                    <img src={asset(p.image)} alt={p.name} className="size-full object-cover" />
                    <Badge tone="solid" size="sm" className="absolute left-3 top-3">{titleCase(p.status)}</Badge>
                    {p.bonus && <Badge tone="warn" size="sm" className="absolute right-3 top-3">Bonus available</Badge>}
                  </div>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold tracking-[-0.015em] text-ink">{p.name}</p>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">{p.neighborhood}, {p.city} · {p.developer}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[14px] font-medium tabular text-ink">{compactUsd(p.priceMin)}–{compactUsd(p.priceMax)}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">{p.availableUnits} available</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{p.description}</p>

                    <div className="mt-3.5 overflow-hidden rounded-[8px] border border-line">
                      <table className="w-full">
                        <tbody>
                          {p.unitMix.map((u) => (
                            <tr key={u.type} className="border-b border-line/70 text-[12.5px] last:border-0">
                              <td className="px-3 py-1.5 font-medium text-ink">{u.type}</td>
                              <td className="px-3 py-1.5 tabular text-ink-3">{u.sqft} sf</td>
                              <td className="px-3 py-1.5 tabular text-ink-2">{u.price}</td>
                              <td className="px-3 py-1.5 text-right tabular text-ink-3">{u.available} left</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-ink-2">
                      <span className="flex items-center gap-1.5"><Percent className="size-3.5 text-ink-4" />{p.commissionPct}% co-broke</span>
                      <span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-ink-4" />{p.completion}</span>
                      {p.registrationRequired && <span className="flex items-center gap-1.5 text-warn-700"><FileText className="size-3.5" />Registration required</span>}
                    </div>
                    {p.bonus && <p className="mt-2 text-[12.5px] text-brand-700">{p.bonus}</p>}

                    <div className="mt-4 flex gap-2">
                      <BuyerRegistrationDialog projectId={p.id} trigger={<Button size="sm" variant="primary" full>Register a buyer</Button>} />
                      <Button size="sm" variant="secondary" onClick={() => toast.success("Offering plan requested from the sponsor")}>
                        <Upload /> Materials
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="registrations">
            {mine.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                title="No buyer registrations yet"
                description="Register a client with a sponsor before their first tour — it is what protects your commission."
                action={<BuyerRegistrationDialog trigger={<Button variant="primary" size="sm"><Plus /> Register a buyer</Button>} />}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Registration status</CardTitle>
                  <Badge tone="neutral" size="sm">{mine.length} total</Badge>
                </CardHeader>
                <ul className="divide-y divide-line">
                  {mine.map((r) => {
                    const project = projects.find((p) => p.id === r.projectId)!;
                    const client = clients.find((c) => c.id === r.clientId);
                    const uploaded = r.documents.filter((d) => d.uploaded).length;
                    return (
                      <li key={r.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium text-ink">{client?.name ?? "Unknown client"} · {project.name}</p>
                            <p className="mt-0.5 text-[12px] text-ink-4">
                              {r.unitInterest} · submitted {dateMed(r.submittedAt)} · expires {relative(r.expiresAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone="neutral" size="sm">{uploaded}/{r.documents.length} docs</Badge>
                            <StatusBadge value={r.status} size="sm" />
                          </div>
                        </div>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">{r.note}</p>
                        <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                          {r.documents.map((d) => (
                            <li key={d.name} className="flex items-center gap-1.5 text-[12px]">
                              {d.uploaded
                                ? <Check className="size-3 text-ok-500" />
                                : <X className="size-3 text-risk-500" />}
                              <span className={d.uploaded ? "text-ink-3" : "text-ink-2"}>{d.name}</span>
                            </li>
                          ))}
                        </ul>
                        {r.status === "expired" && (
                          <Button size="xs" variant="primary" className="mt-3" onClick={() => toast.success("Re-registration submitted")}>
                            <Clock /> Re-register
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
