"use client";
import * as React from "react";
import { notFound } from "next/navigation";
import { CalendarDays, Check, Clock, Download, MapPin, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar, Stat } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { EventTypeBadge } from "@/components/admin/dashboard-widgets";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { agentName } from "@/data/agents";
import { dateLong, num } from "@/lib/format";
import { toast } from "sonner";

export function EventDetail({ id, base }: { id: string; base: string }) {
  const { events, eventRegistrations, rsvp, cancelRsvp } = useStore();
  const { account } = useSession();
  const event = events.find((e) => e.id === id);
  if (!event) return notFound();

  const regs = eventRegistrations.filter((r) => r.eventId === event.id);
  const mine = account?.agentId ? regs.find((r) => r.agentId === account.agentId) : undefined;
  const isPast = event.date < "2026-08-26";

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Events", href: `${base}/events` }, { label: event.name }]}
        title={event.name}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <EventTypeBadge type={event.type} />
            {event.ceCredits ? <Badge tone="brand" size="sm">{event.ceCredits} CE credits</Badge> : null}
            {isPast && <Badge tone="neutral" size="sm">Past event</Badge>}
          </div>
        }
        actions={
          account?.agentId && !isPast ? (
            mine ? (
              <>
                <Badge tone="ok" size="lg"><Check className="size-3" /> {mine.status === "waitlisted" ? "Waitlisted" : "Registered"}</Badge>
                <Button variant="secondary" onClick={() => cancelRsvp(event.id, account.agentId!)}>Cancel registration</Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => rsvp(event.id, account.agentId!)}>
                {event.registered >= event.capacity ? "Join waitlist" : "RSVP"}
              </Button>
            )
          ) : (
            <>
              <Button variant="secondary" onClick={() => toast.success("Attendance sheet exported")}><Download /> Export list</Button>
              <Button variant="primary" onClick={() => toast.success("Check-in link copied")}><UserCheck /> Check-in link</Button>
            </>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardBody>
              <dl className="grid gap-5 sm:grid-cols-2">
                <Stat label="Date" value={<span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-ink-4" />{dateLong(event.date)}</span>} />
                <Stat label="Time" value={<span className="flex items-center gap-1.5"><Clock className="size-3.5 text-ink-4" />{event.start} – {event.end}</span>} />
                <Stat label="Location" value={<span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-ink-4" />{event.location}</span>} />
                <Stat label="Host" value={<span className="flex items-center gap-1.5"><Avatar name={agentName(event.hostId)} size="xs" />{agentName(event.hostId)}</span>} />
                <Stat label="Audience" value={event.officeId === "all" ? "All offices" : event.officeId} />
                <Stat label="CE credits" value={event.ceCredits ? `${event.ceCredits} hours` : "None"} />
              </dl>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">Description</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{event.description}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isPast ? "Attendance" : "Registrations"}</CardTitle>
              <Badge tone="neutral" size="sm">{regs.length} people</Badge>
            </CardHeader>
            {regs.length === 0 ? (
              <EmptyState icon={<Users />} title="No registrations yet" description="Nobody has signed up — try sending a reminder in the weekly broker meeting." className="m-4 border-dashed" />
            ) : (
              <ul className="divide-y divide-line">
                {regs.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                    <Avatar name={agentName(r.agentId)} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{agentName(r.agentId)}</span>
                    <StatusBadge value={r.status} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Capacity</CardTitle></CardHeader>
            <CardBody>
              <p className="text-[24px] font-semibold tabular text-ink">{num(event.registered)}<span className="text-[15px] font-normal text-ink-4"> / {num(event.capacity)}</span></p>
              <ProgressBar value={(event.registered / event.capacity) * 100} className="mt-2" tone={event.registered >= event.capacity ? "warn" : "brand"} />
              <dl className="mt-4 space-y-2.5 border-t border-line pt-3">
                <div className="flex justify-between"><dt className="text-[13px] text-ink-3">Seats remaining</dt><dd className="text-[13px] tabular text-ink">{Math.max(0, event.capacity - event.registered)}</dd></div>
                <div className="flex justify-between"><dt className="text-[13px] text-ink-3">Waitlist</dt><dd className="text-[13px] tabular text-ink">{event.waitlist}</dd></div>
                {event.attended !== null && (
                  <div className="flex justify-between"><dt className="text-[13px] text-ink-3">Attended</dt><dd className="text-[13px] tabular text-ink">{event.attended}</dd></div>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
            {event.resources.length === 0 ? (
              <EmptyState title="No resources attached" description="Add a workbook or slide deck for attendees." className="m-4 border-dashed" />
            ) : (
              <ul className="divide-y divide-line">
                {event.resources.map((r) => (
                  <li key={r.name} className="flex items-center gap-2.5 px-5 py-3">
                    <Badge tone="neutral" size="sm">{r.type.toUpperCase()}</Badge>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{r.name}</span>
                    <Button size="iconSm" variant="ghost"><Download /></Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
