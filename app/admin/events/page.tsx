"use client";
import * as React from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { EventGrid, EventCalendarStrip } from "@/components/admin/events-view";
import { NewEventDialog } from "@/components/admin/create-dialogs";
import { useStore } from "@/lib/store";
import { agentName } from "@/data/agents";
import { num, dateMed } from "@/lib/format";

export default function AdminEvents() {
  const { events, eventRegistrations } = useStore();
  const upcoming = events.filter((e) => e.date >= "2026-08-26").sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < "2026-08-26").sort((a, b) => b.date.localeCompare(a.date));
  const training = upcoming.filter((e) => e.type === "training" || e.type === "webinar");
  const activities = upcoming.filter((e) => e.type === "company_event" || e.type === "community" || e.type === "open_house");
  const attendanceRate = Math.round(
    (past.reduce((s, e) => s + (e.attended ?? 0), 0) / Math.max(1, past.reduce((s, e) => s + e.registered, 0))) * 100
  );

  return (
    <>
      <PageHeader
        title="Events & activities"
        description="Training, broker meetings, previews and company events — plus who actually showed up."
        actions={<NewEventDialog trigger={<Button variant="primary"><Plus /> Create event</Button>} />}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Upcoming events" value={num(upcoming.length)} sub={`${training.length} training sessions`} />
        <MetricCard label="Total registrations" value={num(eventRegistrations.filter((r) => r.status !== "cancelled").length)} sub="Across all open events" />
        <MetricCard label="Attendance rate" value={`${attendanceRate}%`} sub="Registered vs. attended, past events" />
        <MetricCard label="On waitlists" value={num(events.reduce((s, e) => s + e.waitlist, 0))} sub="Capacity constrained" />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="activities">Company activities</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <div className="mt-5">
          <TabsContent value="upcoming">
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <EventGrid events={upcoming} base="/admin" />
              <EventCalendarStrip events={upcoming.slice(0, 8)} base="/admin" />
            </div>
          </TabsContent>
          <TabsContent value="training"><EventGrid events={training} base="/admin" emptyTitle="No training scheduled" /></TabsContent>
          <TabsContent value="activities"><EventGrid events={activities} base="/admin" emptyTitle="No company activities scheduled" /></TabsContent>
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle>Registrations</CardTitle>
                <span className="text-[12.5px] text-ink-3">{eventRegistrations.length} total</span>
              </CardHeader>
              <ul className="divide-y divide-line">
                {eventRegistrations.slice(0, 40).map((r) => {
                  const e = events.find((x) => x.id === r.eventId)!;
                  return (
                    <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                      <Avatar name={agentName(r.agentId)} size="sm" />
                      <span className="w-[150px] shrink-0 truncate text-[13px] text-ink">{agentName(r.agentId)}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{e?.name}</span>
                      <span className="hidden shrink-0 text-[12px] tabular text-ink-4 sm:block">{e && dateMed(e.date)}</span>
                      <StatusBadge value={r.status} size="sm" />
                    </li>
                  );
                })}
              </ul>
            </Card>
          </TabsContent>
          <TabsContent value="history"><EventGrid events={past} base="/admin" emptyTitle="No past events" /></TabsContent>
        </div>
      </Tabs>
    </>
  );
}
