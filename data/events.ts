import type { BrokerageEvent, EventRegistration } from "@/types";

export const events: BrokerageEvent[] = [
  { id: "ev_1", name: "New Agent Launch Bootcamp — Week 1", type: "training", date: "2026-08-27", start: "9:00 AM", end: "12:30 PM",
    location: "Flatiron HQ · Training Room A", hostId: "ag_schen", capacity: 24, registered: 19, attended: null,
    description: "Three-hour intensive covering contract mechanics, the Tru CRM, and how to run a first buyer consultation. Required for all agents in their first 90 days.",
    resources: [{ name: "Launch Workbook 2026", type: "pdf" }, { name: "Buyer Consultation Script", type: "docx" }], ceCredits: 3, officeId: "all", waitlist: 0 },
  { id: "ev_2", name: "Weekly Broker Meeting", type: "broker_meeting", date: "2026-08-28", start: "9:00 AM", end: "10:00 AM",
    location: "Flatiron HQ · Main Floor + Zoom", hostId: "ag_schen", capacity: 60, registered: 41, attended: null,
    description: "Market update, new inventory round-robin, compliance reminders and open deal needs. Hybrid — remote link goes out the night before.",
    resources: [{ name: "August Market Snapshot", type: "pdf" }], ceCredits: null, officeId: "all", waitlist: 0 },
  { id: "ev_3", name: "Fair Housing & Anti-Bias — NY CE", type: "training", date: "2026-09-03", start: "1:00 PM", end: "4:00 PM",
    location: "Virtual · Zoom", hostId: "ag_jocallahan", capacity: 100, registered: 63, attended: null,
    description: "State-approved continuing education satisfying the New York fair housing and implicit bias requirement. Certificate issued within 48 hours.",
    resources: [{ name: "NY Fair Housing Handbook", type: "pdf" }, { name: "Case Study Packet", type: "pdf" }], ceCredits: 3, officeId: "all", waitlist: 4 },
  { id: "ev_4", name: "Skyline Court — Agent Preview & Hard Hat Tour", type: "open_house", date: "2026-09-05", start: "10:00 AM", end: "12:00 PM",
    location: "42-15 Crescent Street, Long Island City", hostId: "ag_dpark", capacity: 30, registered: 30, attended: null,
    description: "Walk the amenity floor and three model residences with the Halloran sales team before the public launch. Hard hats and closed-toe shoes required.",
    resources: [{ name: "Skyline Court Fact Sheet", type: "pdf" }, { name: "Commission & Bonus Terms", type: "pdf" }], ceCredits: null, officeId: "all", waitlist: 7 },
  { id: "ev_5", name: "Q3 All-Hands & Awards", type: "company_event", date: "2026-09-18", start: "5:30 PM", end: "8:30 PM",
    location: "The Wythe Hotel · Williamsburg", hostId: "ag_mrodriguez", capacity: 120, registered: 88, attended: null,
    description: "Quarterly results, 2027 roadmap, and the Tru Top Producer awards. Partners and spouses welcome. Dinner and open bar provided.",
    resources: [{ name: "Q3 Deck (preview)", type: "pptx" }], ceCredits: null, officeId: "all", waitlist: 0 },
  { id: "ev_6", name: "Listing Presentation Lab", type: "training", date: "2026-09-10", start: "2:00 PM", end: "4:00 PM",
    location: "Williamsburg Office · Studio", hostId: "ag_ejohnson", capacity: 16, registered: 12, attended: null,
    description: "Live-fire practice: each agent presents to a mock seller and gets structured feedback from two peers and a broker.",
    resources: [{ name: "Listing Deck Template", type: "pptx" }, { name: "Objection Matrix", type: "xlsx" }], ceCredits: null, officeId: "all", waitlist: 0 },
  { id: "ev_7", name: "Mortgage Market Briefing with Empire", type: "webinar", date: "2026-09-01", start: "11:00 AM", end: "11:45 AM",
    location: "Virtual · Zoom", hostId: "ag_dkim", capacity: 200, registered: 54, attended: null,
    description: "Empire Mortgage's chief economist on rate expectations into 2027 and what it means for buyer affordability in the metro.",
    resources: [{ name: "Rate Outlook Deck", type: "pdf" }], ceCredits: null, officeId: "all", waitlist: 0 },
  { id: "ev_8", name: "Garden City Community Day Booth", type: "community", date: "2026-09-13", start: "10:00 AM", end: "3:00 PM",
    location: "Garden City Village Green", hostId: "ag_lbianchi", capacity: 10, registered: 6, attended: null,
    description: "Tru is sponsoring a booth at the village fall festival. Shifts are two hours; branded materials and swag provided.",
    resources: [{ name: "Booth Shift Signup", type: "xlsx" }], ceCredits: null, officeId: "of_gardencity", waitlist: 0 },
  { id: "ev_9", name: "New Agent Launch Bootcamp — Week 2", type: "training", date: "2026-09-04", start: "9:00 AM", end: "12:30 PM",
    location: "Flatiron HQ · Training Room A", hostId: "ag_schen", capacity: 24, registered: 17, attended: null,
    description: "Prospecting systems, database setup, and building a 90-day activity plan with accountability partners.",
    resources: [{ name: "90-Day Plan Template", type: "xlsx" }], ceCredits: 3, officeId: "all", waitlist: 0 },
  { id: "ev_10", name: "August Broker Meeting", type: "broker_meeting", date: "2026-08-14", start: "9:00 AM", end: "10:00 AM",
    location: "Flatiron HQ · Main Floor + Zoom", hostId: "ag_schen", capacity: 60, registered: 44, attended: 38,
    description: "Mid-month market update and compliance review.", resources: [], ceCredits: null, officeId: "all", waitlist: 0 },
  { id: "ev_11", name: "Summer Client Appreciation Rooftop", type: "company_event", date: "2026-07-24", start: "6:00 PM", end: "9:00 PM",
    location: "Ravel Rooftop · Long Island City", hostId: "ag_dpark", capacity: 150, registered: 132, attended: 118,
    description: "Annual client appreciation event. Agents brought past clients and sphere.", resources: [], ceCredits: null, officeId: "all", waitlist: 0 },
  { id: "ev_12", name: "Ethics & License Law Refresher", type: "training", date: "2026-07-16", start: "1:00 PM", end: "3:30 PM",
    location: "Virtual · Zoom", hostId: "ag_jocallahan", capacity: 100, registered: 71, attended: 66,
    description: "NAR Code of Ethics cycle requirement plus New York license law updates.", resources: [], ceCredits: 2.5, officeId: "all", waitlist: 0 },
];

const REG_AGENTS = ["ag_schen", "ag_dkim", "ag_mrodriguez", "ag_jwang", "ag_dpark", "ag_ejohnson", "ag_apatel", "ag_jocallahan", "ag_ntran", "ag_rmensah", "ag_lbianchi", "ag_cwhite", "ag_mmartinez", "ag_thoffman"];

export const eventRegistrations: EventRegistration[] = events.flatMap((e, ei) =>
  REG_AGENTS.filter((_, ai) => (ai * 7 + ei * 3) % 5 < 3).map((agentId, ai) => ({
    id: `er_${e.id}_${agentId}`,
    eventId: e.id,
    agentId,
    status: e.attended !== null
      ? ((ai + ei) % 6 === 0 ? "no_show" : "attended")
      : ai === 0 && e.waitlist > 0 ? "waitlisted" : "registered",
    registeredAt: "2026-08-12",
  }))
);

export const eventById = (id: string) => events.find((e) => e.id === id);
export const upcomingEvents = events
  .filter((e) => e.date >= "2026-08-26")
  .sort((a, b) => a.date.localeCompare(b.date));
export const pastEvents = events.filter((e) => e.date < "2026-08-26");
export const registrationsForAgent = (agentId: string) => eventRegistrations.filter((r) => r.agentId === agentId);

export const EVENT_TYPE_LABEL: Record<BrokerageEvent["type"], string> = {
  training: "Training", broker_meeting: "Broker Meeting", open_house: "Open House",
  company_event: "Company Event", webinar: "Webinar", community: "Community",
};
