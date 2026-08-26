import type { Agreement, Announcement, AppNotification, TrainingRecord, User, Vendor } from "@/types";
import { agents } from "./agents";

export const staffUsers: User[] = [
  { id: "usr_admin_whitfield", name: "Grace Whitfield", email: "grace.whitfield@trurealty.com", role: "super_admin", title: "Principal Broker & Co-Founder", officeId: "of_flatiron", avatar: "", phone: "2125550101", lastActive: "2026-08-26" },
  { id: "usr_admin_okafor", name: "Andre Okafor", email: "andre.okafor@trurealty.com", role: "brokerage_admin", title: "Director of Brokerage Operations", officeId: "of_williamsburg", avatar: "", phone: "7185550102", lastActive: "2026-08-26" },
  { id: "usr_tc_reeves", name: "Dana Reeves", email: "dana.reeves@trurealty.com", role: "transaction_coordinator", title: "Senior Transaction Coordinator", officeId: "of_flatiron", avatar: "", phone: "2125550110", lastActive: "2026-08-26" },
  { id: "usr_tc_alvarez", name: "Hector Alvarez", email: "hector.alvarez@trurealty.com", role: "transaction_coordinator", title: "Transaction Coordinator", officeId: "of_williamsburg", avatar: "", phone: "7185550111", lastActive: "2026-08-25" },
  { id: "usr_tc_devlin", name: "Nora Devlin", email: "nora.devlin@trurealty.com", role: "transaction_coordinator", title: "Transaction Coordinator", officeId: "of_gardencity", avatar: "", phone: "5165550112", lastActive: "2026-08-26" },
  { id: "usr_hr_bell", name: "Simone Bell", email: "simone.bell@trurealty.com", role: "hr_ops", title: "Director of Agent Experience", officeId: "of_flatiron", avatar: "", phone: "2125550120", lastActive: "2026-08-26" },
  { id: "usr_acct_navarro", name: "Ruben Navarro", email: "ruben.navarro@trurealty.com", role: "accounting", title: "Controller", officeId: "of_flatiron", avatar: "", phone: "2125550130", lastActive: "2026-08-26" },
  { id: "usr_acct_park", name: "Helen Park", email: "helen.park@trurealty.com", role: "accounting", title: "Commission Accountant", officeId: "of_flatiron", avatar: "", phone: "2125550131", lastActive: "2026-08-25" },
];

export const agentUsers: User[] = agents.map((a) => ({
  id: a.userId, name: a.name, email: a.email, role: "agent" as const, title: a.title,
  officeId: a.officeId, avatar: "", phone: a.phone, lastActive: "2026-08-26", agentId: a.id,
}));

export const users: User[] = [...staffUsers, ...agentUsers];
export const userById = (id: string) => users.find((u) => u.id === id);
export const userName = (id: string) => userById(id)?.name ?? "—";

export const announcements: Announcement[] = [
  { id: "an_1", title: "Commission disbursement moves to Wednesday releases", category: "Company", pinned: true, audience: "all", authorId: "usr_acct_navarro", publishedAt: "2026-08-24",
    body: "Starting September 2, approved disbursements are released every Wednesday by 2pm instead of on a rolling basis. Files with a complete CDA in by Tuesday noon make that week's release. This gives accounting a single reconciliation window and should cut the average payout wait by about two days." },
  { id: "an_2", title: "New York fair housing CE is due before December 31", category: "Compliance", pinned: true, audience: "agents", authorId: "usr_admin_whitfield", publishedAt: "2026-08-20",
    body: "Every licensed agent needs three hours of fair housing and implicit bias CE this cycle. We are running the state-approved session on September 3 at 1pm — it satisfies the full requirement and the certificate lands in your file automatically. Eleven agents are still outstanding." },
  { id: "an_3", title: "Skyline Court agent preview — September 5", category: "Market", pinned: false, audience: "agents", authorId: "usr_admin_whitfield", publishedAt: "2026-08-18",
    body: "Halloran is giving Tru agents a hard-hat walkthrough of the amenity floor and three model residences a week before public launch. Thirty spots, currently full with seven on the waitlist. Bonus terms through October are $10,000 per signed contract." },
  { id: "an_4", title: "Welcome Marisol Martinez and Thomas Hoffman", category: "Celebration", pinned: false, audience: "all", authorId: "usr_hr_bell", publishedAt: "2026-08-19",
    body: "Two new agents joined this month. Marisol comes to the LIC office from a boutique Astoria firm with eight years in northwest Queens; Thomas joins Flatiron after six years in Hudson Yards new development. Both are in the September Launch cohort." },
  { id: "an_5", title: "Q3 all-hands and awards on September 18", category: "Company", pinned: false, audience: "all", authorId: "usr_admin_whitfield", publishedAt: "2026-08-12",
    body: "The Wythe Hotel, 5:30pm. Quarterly numbers, the 2027 product roadmap, and the Top Producer awards. Partners welcome. RSVP through the Event Hub by September 10 so we can finalize the headcount." },
  { id: "an_6", title: "Wire fraud attempt reported on a Brooklyn file", category: "Compliance", pinned: true, audience: "all", authorId: "usr_admin_whitfield", publishedAt: "2026-08-07",
    body: "A buyer on an active Brooklyn transaction received spoofed wire instructions that closely mimicked our title partner's formatting. No funds were lost. Reminder: every wire instruction must be verbally verified with a known number before funds move, and that verification is now a required task on every file." },
];

export const notifications: AppNotification[] = [
  { id: "nt_1", kind: "closing_reminder", title: "Closing in 2 days", body: "TR-2026-1045 · 127 Sherman Avenue closes Friday. Clear-to-close is still outstanding from Guaranteed Rate.", createdAt: "2026-08-26", read: false, href: "/admin/transactions/tx_1045", audience: ["brokerage_admin", "transaction_coordinator", "agent", "super_admin"] },
  { id: "nt_2", kind: "license_expiration", title: "3 licenses expiring within 45 days", body: "Daniel Kim, Jessica Wang and Aisha Patel have renewals due before October 10.", createdAt: "2026-08-26", read: false, href: "/admin/agents?filter=license", audience: ["brokerage_admin", "hr_ops", "super_admin"] },
  { id: "nt_3", kind: "new_lead", title: "New website lead — Sasha Nikolic", body: "Recruiting form submission from an agent at Halstead with $6.2M in trailing production.", createdAt: "2026-08-25", read: false, href: "/admin/pipeline", audience: ["brokerage_admin", "hr_ops", "super_admin"] },
  { id: "nt_4", kind: "document_request", title: "Missing required document", body: "TR-2026-1042 · 88 Franklin Street is missing a signed wire verification form.", createdAt: "2026-08-25", read: true, href: "/admin/transactions/tx_1042", audience: ["transaction_coordinator", "brokerage_admin", "agent", "super_admin"] },
  { id: "nt_5", kind: "commission_payment", title: "Payout released", body: "$104,812 released to 6 agents in the August 19 disbursement run.", createdAt: "2026-08-19", read: true, href: "/admin/payouts", audience: ["accounting", "brokerage_admin", "super_admin"] },
  { id: "nt_6", kind: "event_reminder", title: "Broker meeting tomorrow at 9:00 AM", body: "Weekly broker meeting — Flatiron main floor and Zoom.", createdAt: "2026-08-27", read: false, href: "/admin/events", audience: ["brokerage_admin", "agent", "hr_ops", "super_admin", "transaction_coordinator", "accounting"] },
  { id: "nt_7", kind: "transaction_update", title: "Offer accepted", body: "19 Bedford Street moved to Accepted at $4,875,000.", createdAt: "2026-08-19", read: true, href: "/admin/transactions/tx_1048", audience: ["brokerage_admin", "agent", "transaction_coordinator", "super_admin"] },
  { id: "nt_8", kind: "announcement", title: "Commission disbursement schedule change", body: "Weekly Wednesday releases begin September 2.", createdAt: "2026-08-24", read: false, href: "/admin/company", audience: ["brokerage_admin", "agent", "accounting", "hr_ops", "super_admin", "transaction_coordinator"] },
];

export const vendors: Vendor[] = [
  { id: "vn_1", name: "Vanguard Title Agency", category: "Title", contact: "Marla Deitch", phone: "2125550301", email: "marla@vanguardtitle.com", preferred: true, rating: 4.8, transactions: 64 },
  { id: "vn_2", name: "Kings County Abstract", category: "Title", contact: "Sol Feinberg", phone: "7185550302", email: "sol@kcabstract.com", preferred: true, rating: 4.6, transactions: 41 },
  { id: "vn_3", name: "Empire Mortgage", category: "Lender", contact: "Devon Ashby", phone: "2125550311", email: "dashby@empiremtg.com", preferred: true, rating: 4.9, transactions: 58 },
  { id: "vn_4", name: "Hudson Federal Savings", category: "Lender", contact: "Cheryl Nunes", phone: "2125550312", email: "cnunes@hudsonfed.com", preferred: true, rating: 4.5, transactions: 33 },
  { id: "vn_5", name: "Sentinel Home Inspection", category: "Inspection", contact: "Roy Battaglia", phone: "9175550321", email: "roy@sentinelinspect.com", preferred: true, rating: 4.9, transactions: 87 },
  { id: "vn_6", name: "Northlight Property Media", category: "Photography", contact: "Ivy Chandra", phone: "9175550331", email: "ivy@northlightmedia.com", preferred: true, rating: 5.0, transactions: 112 },
  { id: "vn_7", name: "Weisman & Cho LLP", category: "Legal", contact: "Alan Weisman", phone: "2125550341", email: "aweisman@weismancho.com", preferred: true, rating: 4.7, transactions: 52 },
  { id: "vn_8", name: "Framework Staging Co.", category: "Staging", contact: "Bea Lindstrom", phone: "3475550351", email: "bea@frameworkstaging.com", preferred: false, rating: 4.4, transactions: 26 },
  { id: "vn_9", name: "Metro Risk Partners", category: "Insurance", contact: "Curtis Nolan", phone: "2125550361", email: "cnolan@metrorisk.com", preferred: true, rating: 4.3, transactions: 19 },
];

const COURSES: [string, string, number][] = [
  ["Fair Housing & Implicit Bias", "NY DOS Approved", 3],
  ["NAR Code of Ethics — 2026 Cycle", "National Association of Realtors", 2.5],
  ["Agency & Disclosure Law Update", "NY DOS Approved", 2],
  ["Tru Launch Bootcamp", "Tru Realty", 6],
  ["Co-op Board Package Masterclass", "Tru Realty", 1.5],
  ["Anti-Money Laundering for Real Estate", "NY DOS Approved", 1],
];

export const trainingRecords: TrainingRecord[] = agents.flatMap((a, ai) =>
  COURSES.map((c, ci) => {
    const roll = (ai * 7 + ci * 5) % 10;
    const status: TrainingRecord["status"] =
      a.status === "onboarding" ? (ci < 1 ? "in_progress" : "not_started")
        : roll < 6 ? "completed" : roll < 8 ? "in_progress" : roll === 8 ? "overdue" : "not_started";
    return {
      id: `tr_${a.id}_${ci}`, agentId: a.id, course: c[0], provider: c[1], ceCredits: c[2], status,
      completedOn: status === "completed" ? `2026-0${1 + (ci % 6)}-1${(ai % 8) + 1}` : null,
      dueOn: status === "completed" ? null : status === "overdue" ? "2026-07-31" : "2026-12-31",
    };
  })
);

export const agreements: Agreement[] = agents.flatMap((a) => {
  const base: [Agreement["type"], string][] = [["ICA", "Independent Contractor Agreement"], ["W-9", "W-9 Tax Form"], ["Policy Ack", "Agent Policy Manual Acknowledgment"], ["Commission Plan", `${a.plan.name} Addendum`]];
  return base.map((b, i) => ({
    id: `agr_${a.id}_${i}`, agentId: a.id, name: b[1], type: b[0], version: "2026.1",
    status: a.status === "onboarding" && i > 1 ? "pending" : "signed",
    signedOn: a.status === "onboarding" && i > 1 ? null : a.joinDate,
    expiresOn: b[0] === "ICA" ? "2027-12-31" : null,
  }));
});
