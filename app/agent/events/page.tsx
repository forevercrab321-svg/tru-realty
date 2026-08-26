"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/ui/metric-card";
import { EventGrid, EventCalendarStrip } from "@/components/admin/events-view";
import { useStore } from "@/lib/store";
import { useCurrentAgent } from "@/lib/session";
import { num } from "@/lib/format";
import { trainingRecords } from "@/data/company";

export default function AgentEvents() {
  const agent = useCurrentAgent();
  const { events, eventRegistrations, rsvp, cancelRsvp } = useStore();
  if (!agent) return null;

  const myRegs = eventRegistrations.filter((r) => r.agentId === agent.id);
  const myIds = myRegs.map((r) => r.eventId);
  const upcoming = events.filter((e) => e.date >= "2026-08-26").sort((a, b) => a.date.localeCompare(b.date));
  const training = upcoming.filter((e) => e.type === "training" || e.type === "webinar");
  const activities = upcoming.filter((e) => !["training", "webinar"].includes(e.type));
  const registered = upcoming.filter((e) => myIds.includes(e.id));
  const ceEarned = trainingRecords.filter((t) => t.agentId === agent.id && t.status === "completed").reduce((s, t) => s + t.ceCredits, 0);

  return (
    <>
      <PageHeader title="Event hub" description="Training, broker meetings, previews and company events. RSVP in one click." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Upcoming events" value={num(upcoming.length)} sub={`${training.length} training sessions`} />
        <MetricCard label="You're registered for" value={num(registered.length)} sub="Confirmed RSVPs" />
        <MetricCard label="CE credits earned" value={String(ceEarned)} sub="This license cycle" />
        <MetricCard label="CE available" value={String(upcoming.reduce((s, e) => s + (e.ceCredits ?? 0), 0))} sub="From upcoming sessions" />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="activities">Company activities</TabsTrigger>
          <TabsTrigger value="mine">My registrations</TabsTrigger>
        </TabsList>
        <div className="mt-5">
          <TabsContent value="upcoming">
            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <EventGrid events={upcoming} base="/agent" registeredIds={myIds} onRsvp={(id) => rsvp(id, agent.id)} onCancel={(id) => cancelRsvp(id, agent.id)} />
              <EventCalendarStrip events={upcoming.slice(0, 8)} base="/agent" />
            </div>
          </TabsContent>
          <TabsContent value="training">
            <EventGrid events={training} base="/agent" registeredIds={myIds} onRsvp={(id) => rsvp(id, agent.id)} onCancel={(id) => cancelRsvp(id, agent.id)} emptyTitle="No training scheduled" />
          </TabsContent>
          <TabsContent value="activities">
            <EventGrid events={activities} base="/agent" registeredIds={myIds} onRsvp={(id) => rsvp(id, agent.id)} onCancel={(id) => cancelRsvp(id, agent.id)} emptyTitle="No company activities scheduled" />
          </TabsContent>
          <TabsContent value="mine">
            <EventGrid
              events={registered} base="/agent" registeredIds={myIds}
              onRsvp={(id) => rsvp(id, agent.id)} onCancel={(id) => cancelRsvp(id, agent.id)}
              emptyTitle="You haven't registered for anything"
              emptyDescription="Browse upcoming events and RSVP — most fill up within a week."
            />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
