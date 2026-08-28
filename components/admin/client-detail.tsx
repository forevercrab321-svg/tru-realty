"use client";
import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Mail, MessageSquarePlus, Phone, Plus, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Stat } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Timeline } from "@/components/ui/timeline";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { NewTransactionDialog } from "@/components/admin/create-dialogs";
import { PropertyCard } from "@/components/public/cards";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { ownsRecord } from "@/lib/record-access";
import { NoAccess } from "@/components/shared/no-access";
import { agentName } from "@/data/agents";
import { userName } from "@/data/company";
import { compactUsd, dateMed, relative, titleCase, usd } from "@/lib/format";
import { toast } from "sonner";
import { asset } from "@/lib/utils";

export function ClientDetail({ id, base }: { id: string; base: string }) {
  const { clients, transactions, listings, addClientNote, updateClient } = useStore();
  const { account } = useSession();
  const client = clients.find((c) => c.id === id);
  const [note, setNote] = React.useState("");
  const [noteType, setNoteType] = React.useState("note");

  if (!client) return notFound();
  if (!ownsRecord(account, base, [client.agentId])) {
    return (
      <NoAccess
        role={account?.role ?? "agent"}
        backHref={`${base}/clients`}
        backLabel="Back to your clients"
      />
    );
  }


  const myTx = transactions.filter((t) => t.clientId === client.id);
  const matches = listings
    .filter((l) => ["active", "coming_soon"].includes(l.status))
    .filter((l) => (client.budgetMax ? l.price >= client.budgetMin * 0.9 && l.price <= client.budgetMax * 1.1 : true))
    .filter((l) => (client.areas.length ? client.areas.some((a) => l.neighborhood.includes(a) || l.city.includes(a)) : true))
    .slice(0, 3);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Clients", href: `${base}/clients` }, { label: client.name }]}
        title={<span className="flex flex-wrap items-center gap-2.5">{client.name}<StatusBadge value={client.status} /></span>}
        description={`${titleCase(client.type)} · ${client.areas.join(", ") || "No target area set"} · sourced from ${client.leadSource}`}
        actions={
          <>
            <Button variant="secondary" asChild><a href={`mailto:${client.email}`}><Mail /> Email</a></Button>
            <NewTransactionDialog trigger={<Button variant="primary"><Plus /> Open transaction</Button>} defaultAgentId={client.agentId} />
          </>
        }
      />

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <Avatar name={client.name} size="2xl" className="shrink-0" />
          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Email" value={<span className="break-all text-[13px]">{client.email}</span>} />
            <Stat label="Phone" value={<span className="tabular">{client.phone}</span>} />
            <Stat label="Budget" value={client.budgetMax ? <span className="tabular">{compactUsd(client.budgetMin)} – {compactUsd(client.budgetMax)}</span> : "—"} />
            <Stat label="Property type" value={`${client.propertyType}${client.beds ? ` · ${client.beds} bd` : ""}`} />
            <Stat label="Agent" value={<Link href={`${base}/agents/${client.agentId}`} className="hover:underline">{agentName(client.agentId)}</Link>} />
            <Stat label="Next follow-up" value={client.nextFollowUp ? relative(client.nextFollowUp) : "Not scheduled"} />
          </dl>
        </CardBody>
        {client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-line px-5 py-3">
            {client.tags.map((t) => <Badge key={t} tone="neutral" size="sm">{t}</Badge>)}
            {client.preApproved && <Badge tone="ok" size="sm" dot>Pre-approved{client.lender ? ` · ${client.lender}` : ""}</Badge>}
          </div>
        )}
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Search criteria</CardTitle></CardHeader>
                  <CardBody>
                    <dl className="grid gap-5 sm:grid-cols-3">
                      <Stat label="Budget" value={client.budgetMax ? `${usd(client.budgetMin)} – ${usd(client.budgetMax)}` : "Not set"} />
                      <Stat label="Bedrooms" value={client.beds ? `${client.beds}+` : "—"} />
                      <Stat label="Property type" value={client.propertyType} />
                      <Stat label="Target areas" value={client.areas.join(", ") || "—"} />
                      <Stat label="Lead source" value={client.leadSource} />
                      <Stat label="In database since" value={dateMed(client.createdAt)} />
                    </dl>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent notes</CardTitle>
                    <Badge tone="neutral" size="sm">{client.notes.length}</Badge>
                  </CardHeader>
                  {client.notes.length === 0 ? (
                    <EmptyState icon={<MessageSquarePlus />} title="No activity logged" description="Log a call or a showing to start the history." className="m-4 border-dashed" />
                  ) : (
                    <ul className="divide-y divide-line">
                      {client.notes.slice(0, 4).map((n) => (
                        <li key={n.id} className="flex gap-3 px-5 py-3.5">
                          <Avatar name={agentName(n.authorId)} size="md" />
                          <div className="min-w-0">
                            <p className="text-[12.5px]">
                              <span className="font-medium text-ink">{agentName(n.authorId)}</span>
                              <span className="ml-2 text-[11.5px] text-ink-4">{relative(n.createdAt)} · {n.type}</span>
                            </p>
                            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{n.body}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
                  <CardBody className="space-y-2">
                    <Button variant="secondary" full size="sm" onClick={() => toast.success("Call logged")}><Phone /> Log a call</Button>
                    <Button variant="secondary" full size="sm" onClick={() => toast.success("Showing request sent")}><CalendarPlus /> Schedule a showing</Button>
                    <Button variant="secondary" full size="sm" onClick={() => updateClient(client.id, { nextFollowUp: "2026-09-02" })}>
                      <Send /> Set follow-up for Sep 2
                    </Button>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Suggested listings</CardTitle></CardHeader>
                  {matches.length === 0 ? (
                    <EmptyState title="No matches yet" description="Nothing in inventory fits this budget and area right now." className="m-4 border-dashed" />
                  ) : (
                    <ul className="divide-y divide-line">
                      {matches.map((l) => (
                        <li key={l.id}>
                          <Link href={`${base}/listings/${l.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas">
                            <img src={asset(l.images[0])} alt="" className="size-10 shrink-0 rounded-[7px] object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-ink">{l.address}</p>
                              <p className="text-[11.5px] text-ink-4">{l.beds} bd · {l.neighborhood}</p>
                            </div>
                            <span className="text-[13px] tabular text-ink">{compactUsd(l.price)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader><CardTitle>Log activity</CardTitle></CardHeader>
              <CardBody>
                <div className="flex gap-3">
                  <Avatar name={account?.name ?? ""} size="md" />
                  <div className="flex-1">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened, and what is the next step?" />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <NativeSelect value={noteType} onChange={(e) => setNoteType(e.target.value)} className="h-8 w-[140px] text-[13px]">
                        <option value="note">Note</option><option value="call">Call</option>
                        <option value="email">Email</option><option value="showing">Showing</option>
                        <option value="meeting">Meeting</option>
                      </NativeSelect>
                      <Button
                        size="sm" variant="primary" disabled={!note.trim()}
                        onClick={() => { addClientNote(client.id, { body: note.trim(), authorId: client.agentId, type: noteType as never }); setNote(""); }}
                      >
                        <Send /> Log it
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
              {client.notes.length > 0 && (
                <ul className="divide-y divide-line border-t border-line">
                  {client.notes.map((n) => (
                    <li key={n.id} className="flex gap-3 px-5 py-4">
                      <Avatar name={agentName(n.authorId)} size="md" />
                      <div className="min-w-0">
                        <p className="text-[13px]">
                          <span className="font-medium text-ink">{agentName(n.authorId)}</span>
                          <span className="ml-2 text-[11.5px] text-ink-4">{relative(n.createdAt)} · {n.type}</span>
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{n.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardHeader><CardTitle>Activity timeline</CardTitle></CardHeader>
              <CardBody>
                <Timeline
                  items={[
                    { id: "created", label: "Added to the database", date: client.createdAt, done: true, detail: `Source: ${client.leadSource}` },
                    ...client.notes.map((n) => ({ id: n.id, label: titleCase(n.type), date: n.createdAt, done: true, detail: n.body })),
                    ...myTx.map((t) => ({ id: t.id, label: `Transaction opened — ${t.address}`, date: t.createdAt, done: true, detail: t.ref })),
                  ].sort((a, b) => b.date.localeCompare(a.date))}
                />
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="properties">
            {matches.length === 0 ? (
              <EmptyState title="No matched properties" description="Adjust the client's budget or areas to surface inventory." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map((l) => <PropertyCard key={l.id} listing={l} href={`${base}/listings/${l.id}`} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deals">
            {myTx.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                description="When this client goes under contract, the file will live here."
                action={<NewTransactionDialog trigger={<Button variant="primary" size="sm"><Plus /> Open a transaction</Button>} defaultAgentId={client.agentId} />}
              />
            ) : (
              <Card>
                <ul className="divide-y divide-line">
                  {myTx.map((t) => (
                    <li key={t.id}>
                      <Link href={`${base}/transactions/${t.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas">
                        <img src={asset(t.image)} alt="" className="size-10 shrink-0 rounded-[7px] object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-ink">{t.address}{t.unit ? `, ${t.unit}` : ""}</p>
                          <p className="mt-0.5 text-[11.5px] text-ink-4">{t.ref} · closes {dateMed(t.closingDate)}</p>
                        </div>
                        <span className="text-[13px] tabular text-ink">{usd(t.salePrice || t.listPrice)}</span>
                        <StatusBadge value={t.stage} size="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents">
            {myTx.flatMap((t) => t.documents).length === 0 ? (
              <EmptyState title="No documents" description="Documents attached to this client's transactions will appear here." />
            ) : (
              <Card>
                <ul className="divide-y divide-line">
                  {myTx.flatMap((t) => t.documents.map((d) => ({ d, t }))).map(({ d, t }) => (
                    <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{d.name}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">{t.address} · {d.category} · {userName(d.uploadedBy) !== "—" ? userName(d.uploadedBy) : agentName(d.uploadedBy)}</p>
                      </div>
                      <StatusBadge value={d.status} size="sm" />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks">
            {myTx.flatMap((t) => t.tasks).length === 0 ? (
              <EmptyState title="No tasks" description="Tasks from this client's transactions will show up here." />
            ) : (
              <Card>
                <ul className="divide-y divide-line">
                  {myTx.flatMap((t) => t.tasks.map((k) => ({ k, t }))).map(({ k, t }) => (
                    <li key={k.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{k.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">{t.address} · due {relative(k.dueDate)}</p>
                      </div>
                      <StatusBadge value={k.status} size="sm" />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
