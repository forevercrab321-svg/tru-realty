"use client";
import * as React from "react";
import { Camera, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Stat } from "@/components/ui/metric-card";
import { Toggle } from "@/components/ui/misc";
import { useCurrentAgent } from "@/lib/session";
import { officeById, officeName } from "@/data/offices";
import { agreements, trainingRecords } from "@/data/company";
import { dateMed, phoneFmt } from "@/lib/format";
import { toast } from "sonner";
import Link from "next/link";

export default function AgentProfile() {
  const agent = useCurrentAgent();
  const [notify, setNotify] = React.useState({ email: true, sms: true, newLead: true, closing: true, events: false });
  if (!agent) return null;
  const office = officeById(agent.officeId)!;
  const myAgreements = agreements.filter((a) => a.agentId === agent.id);
  const myTraining = trainingRecords.filter((t) => t.agentId === agent.id);

  return (
    <>
      <PageHeader
        title="My profile"
        description="Your public profile, license details, agreements and notification preferences."
        actions={<Button variant="primary" onClick={() => toast.success("Profile saved")}><Save /> Save changes</Button>}
      />

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Avatar name={agent.name} size="3xl" />
            <button className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full border border-line bg-surface text-ink-3 shadow-sm hover:text-ink" onClick={() => toast.success("Photo upload would open here")}>
              <Camera className="size-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">{agent.name}</h2>
            <p className="mt-0.5 text-[13.5px] text-ink-3">{agent.title} · {officeName(agent.officeId)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusBadge value={agent.status} size="sm" />
              <StatusBadge value={agent.tier} size="sm" />
              <Badge tone="neutral" size="sm">{agent.plan.name}</Badge>
            </div>
            <Button variant="link" size="sm" className="mt-3" asChild>
              <Link href={`/agents/${agent.id}`}>View my public profile →</Link>
            </Button>
          </div>
        </CardBody>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Public profile</TabsTrigger>
          <TabsTrigger value="license">License & MLS</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle>Public profile</CardTitle></CardHeader>
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field label="First name"><Input defaultValue={agent.firstName} /></Field>
                <Field label="Last name"><Input defaultValue={agent.lastName} /></Field>
                <Field label="Title"><Input defaultValue={agent.title} /></Field>
                <Field label="Email"><Input defaultValue={agent.email} /></Field>
                <Field label="Phone"><Input defaultValue={phoneFmt(agent.phone)} /></Field>
                <Field label="Office"><Input defaultValue={officeName(agent.officeId)} disabled /></Field>
                <Field label="Neighborhoods" hint="Comma separated" className="sm:col-span-2">
                  <Input defaultValue={agent.neighborhoods.join(", ")} />
                </Field>
                <Field label="Specialties" hint="Comma separated" className="sm:col-span-2">
                  <Input defaultValue={agent.specialties.join(", ")} />
                </Field>
                <Field label="Languages" className="sm:col-span-2"><Input defaultValue={agent.languages.join(", ")} /></Field>
                <Field label="Bio" hint="Shown on trurealty.com" className="sm:col-span-2">
                  <Textarea defaultValue={agent.bio} className="min-h-[120px]" />
                </Field>
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="license">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>License</CardTitle></CardHeader>
                <CardBody className="space-y-3">
                  <Stat label="License number" value={<span className="tabular">{agent.license.number}</span>} />
                  <Stat label="Type" value={agent.license.type} />
                  <Stat label="State" value={agent.license.state} />
                  <Stat label="Issued" value={dateMed(agent.license.issued)} />
                  <Stat label="Expires" value={dateMed(agent.license.expires)} />
                  <Stat label="Status" value={<StatusBadge value={agent.license.status} size="sm" />} />
                  {agent.license.status === "expiring" && (
                    <p className="rounded-[8px] bg-warn-50 px-3 py-2 text-[12.5px] leading-relaxed text-warn-700">
                      Your license renews within 60 days. Upload your renewal certificate as soon as the state issues it —
                      an expired license pauses your ability to take new listings.
                    </p>
                  )}
                  <Button variant="secondary" size="sm" full onClick={() => toast.success("Renewal certificate upload started")}>Upload renewal certificate</Button>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>MLS & association</CardTitle></CardHeader>
                <CardBody className="space-y-3">
                  <Stat label="MLS ID" value={<span className="tabular">{agent.mls.mlsId}</span>} />
                  <Stat label="Board" value={agent.mls.board} />
                  <Stat label="Status" value={<StatusBadge value={agent.mls.status} size="sm" />} />
                  <Stat label="Dues" value={agent.mls.associationDuesPaid ? "Paid through 2026" : "Outstanding"} />
                  <Stat label="Last sync" value={dateMed(agent.mls.lastSync)} />
                  <div className="border-t border-line pt-3">
                    <Stat label="Office" value={office.name.replace(" — Headquarters", "")} />
                    <p className="mt-1 text-[12.5px] text-ink-4">{office.street}, {office.city}, {office.state} {office.zip}</p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agreements">
            <Card>
              <CardHeader><CardTitle>My agreements</CardTitle></CardHeader>
              <ul className="divide-y divide-line">
                {myAgreements.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">{a.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">
                        {a.type} · version {a.version} · {a.signedOn ? `signed ${dateMed(a.signedOn)}` : "awaiting your signature"}
                      </p>
                    </div>
                    <StatusBadge value={a.status} size="sm" />
                    <Button size="xs" variant="ghost" onClick={() => toast.success("Copy emailed to you")}>Download</Button>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle>Training & CE</CardTitle>
                <Badge tone="neutral" size="sm">
                  {myTraining.filter((t) => t.status === "completed").reduce((s, t) => s + t.ceCredits, 0)} credits earned
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
                      {t.completedOn ? dateMed(t.completedOn) : t.dueOn ? `due ${dateMed(t.dueOn)}` : "—"}
                    </span>
                    <StatusBadge value={t.status} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle>Notification preferences</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                {[
                  ["email", "Email notifications", "Daily digest plus anything urgent."],
                  ["sms", "Text messages", "Closing reminders and new leads only."],
                  ["newLead", "New lead assigned", "The moment a lead is routed to you."],
                  ["closing", "Closing reminders", "Three days and one day before every closing."],
                  ["events", "Event announcements", "Every time a new event is published."],
                ].map(([key, label, help]) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] text-ink">{label}</p>
                      <p className="mt-0.5 text-[12px] text-ink-4">{help}</p>
                    </div>
                    <Toggle
                      checked={notify[key as keyof typeof notify]}
                      onChange={(v) => setNotify((n) => ({ ...n, [key]: v }))}
                      label={label}
                    />
                  </div>
                ))}
              </CardBody>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
