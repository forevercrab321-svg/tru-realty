"use client";
import * as React from "react";
import Link from "next/link";
import { CalendarDays, Check, MapPin, Users } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/metric-card";
import { EventTypeBadge } from "@/components/admin/dashboard-widgets";
import { agentName } from "@/data/agents";
import { dateMed, num } from "@/lib/format";
import type { BrokerageEvent } from "@/types";
import { cn } from "@/lib/utils";

export function EventGrid({
  events, base, registeredIds, onRsvp, onCancel, emptyTitle, emptyDescription,
}: {
  events: BrokerageEvent[]; base: string; registeredIds?: string[];
  onRsvp?: (id: string) => void; onCancel?: (id: string) => void;
  emptyTitle?: string; emptyDescription?: string;
}) {
  if (events.length === 0) {
    return <EmptyState icon={<CalendarDays />} title={emptyTitle ?? "No events"} description={emptyDescription ?? "Nothing on the calendar for this view."} />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => {
        const registered = registeredIds?.includes(e.id);
        const full = e.registered >= e.capacity;
        return (
          <Card key={e.id} className="flex flex-col">
            <CardBody className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <EventTypeBadge type={e.type} />
                {e.ceCredits ? <Badge tone="brand" size="sm">{e.ceCredits} CE</Badge> : null}
              </div>
              <Link href={`${base}/events/${e.id}`} className="mt-3 block text-[15px] font-semibold leading-snug tracking-[-0.015em] text-ink hover:underline">
                {e.name}
              </Link>
              <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">{e.description}</p>
              <dl className="mt-3.5 space-y-1.5 text-[12.5px] text-ink-2">
                <div className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-ink-4" />{dateMed(e.date)} · {e.start}</div>
                <div className="flex items-center gap-1.5"><MapPin className="size-3.5 text-ink-4" /><span className="truncate">{e.location}</span></div>
                <div className="flex items-center gap-1.5"><Users className="size-3.5 text-ink-4" />Hosted by {agentName(e.hostId)}</div>
              </dl>
            </CardBody>
            <div className="border-t border-line px-5 py-3">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-[12px] text-ink-3">{num(e.registered)} of {num(e.capacity)} registered</p>
                {e.waitlist > 0 && <p className="text-[11.5px] text-warn-700">{e.waitlist} waitlisted</p>}
              </div>
              <ProgressBar value={(e.registered / e.capacity) * 100} tone={full ? "warn" : "brand"} />
              {onRsvp && (
                <div className="mt-3">
                  {registered ? (
                    <div className="flex gap-2">
                      <Badge tone="ok" size="lg" className="flex-1 justify-center"><Check className="size-3" /> Registered</Badge>
                      <Button size="sm" variant="ghost" onClick={() => onCancel?.(e.id)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant={full ? "secondary" : "primary"} full onClick={() => onRsvp(e.id)}>
                      {full ? "Join waitlist" : "RSVP"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function EventCalendarStrip({ events, base }: { events: BrokerageEvent[]; base: string }) {
  const byDate = events.reduce<Record<string, BrokerageEvent[]>>((acc, e) => {
    (acc[e.date] ||= []).push(e);
    return acc;
  }, {});
  return (
    <Card>
      <CardHeader><CardTitle>Next 30 days</CardTitle></CardHeader>
      <ul className="divide-y divide-line">
        {Object.entries(byDate).map(([date, list]) => (
          <li key={date} className="flex gap-4 px-5 py-3.5">
            <div className="w-[92px] shrink-0">
              <p className="text-[12.5px] font-medium text-ink">
                {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
            <ul className="flex-1 space-y-2">
              {list.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5">
                  <span className={cn("size-1.5 rounded-full", e.type === "training" ? "bg-info-500" : e.type === "broker_meeting" ? "bg-brand-600" : "bg-warn-500")} />
                  <Link href={`${base}/events/${e.id}`} className="truncate text-[13px] text-ink hover:underline">{e.name}</Link>
                  <span className="ml-auto shrink-0 text-[11.5px] tabular text-ink-4">{e.start}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  );
}
