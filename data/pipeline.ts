import type { OnboardingChecklistItem, OnboardingRecord, RecruitCandidate, RecruitStage } from "@/types";

export const RECRUIT_STAGES: { key: RecruitStage; label: string; tone: string }[] = [
  { key: "new_lead", label: "New Lead", tone: "neutral" },
  { key: "contacted", label: "Contacted", tone: "info" },
  { key: "meeting_scheduled", label: "Meeting Scheduled", tone: "info" },
  { key: "interviewed", label: "Interviewed", tone: "warn" },
  { key: "offer_sent", label: "Offer Sent", tone: "brand" },
  { key: "joined", label: "Joined", tone: "ok" },
  { key: "not_interested", label: "Not Interested", tone: "risk" },
];

type R = [id: string, name: string, brokerage: string, yrs: number, vol: number, units: number,
  source: RecruitCandidate["leadSource"], recruiter: string, stage: RecruitStage,
  last: string, next: string | null, office: string, created: string, notes: string];

const rows: R[] = [
  ["rc_1", "Alexandra Voss", "Compass", 9, 31_400_000, 19, "Referral", "ag_schen", "offer_sent", "2026-08-24", "2026-08-27", "of_flatiron", "2026-06-18",
    "Two-year cap plan discussed. Wants confirmation on team-building support and a dedicated marketing coordinator before signing."],
  ["rc_2", "Marcus Bell", "Douglas Elliman", 6, 18_900_000, 14, "LinkedIn", "ag_jocallahan", "interviewed", "2026-08-21", "2026-08-28", "of_williamsburg", "2026-07-02",
    "Strong Brownstone Brooklyn book. Concerned about leaving a team structure — walked him through our TC coverage model."],
  ["rc_3", "Priyanka Rao", "Corcoran", 4, 9_600_000, 11, "Event", "ag_apatel", "meeting_scheduled", "2026-08-25", "2026-08-31", "of_flatiron", "2026-08-05",
    "Met at the July client appreciation event. Coffee scheduled at the Flatiron office; bring the split comparison sheet."],
  ["rc_4", "Terrence Hobbs", "Keller Williams", 12, 42_100_000, 22, "MLS Data", "ag_schen", "contacted", "2026-08-19", "2026-08-29", "of_flatiron", "2026-08-01",
    "Top-25 producer in his market. Responded to the first outreach but has not committed to a meeting."],
  ["rc_5", "Sasha Nikolic", "Halstead", 3, 6_200_000, 9, "Inbound", "ag_mrodriguez", "new_lead", "2026-08-25", "2026-08-27", "of_williamsburg", "2026-08-25",
    "Submitted the Join Tru form on the website. Wants information on the Launch plan and mentorship pairing."],
  ["rc_6", "Gregory Lam", "Brown Harris Stevens", 15, 55_800_000, 17, "Referral", "ag_jwang", "interviewed", "2026-08-22", "2026-09-02", "of_flatiron", "2026-05-28",
    "Second interview with the principal broker completed. Negotiating a 92/8 arrangement plus a marketing stipend."],
  ["rc_7", "Danielle Ortiz", "Independent", 7, 14_300_000, 16, "Cold Outreach", "ag_ejohnson", "not_interested", "2026-07-30", null, "of_gardencity", "2026-06-11",
    "Opening her own boutique brokerage in Nassau County. Asked to revisit in twelve months."],
  ["rc_8", "Nikhil Advani", "Compass", 5, 12_700_000, 12, "LinkedIn", "ag_dkim", "contacted", "2026-08-18", "2026-08-30", "of_flatiron", "2026-07-21",
    "Interested but locked into a Q4 team bonus. Best window to revisit is late December."],
  ["rc_9", "Rebecca Sunwoo", "Sotheby's", 8, 27_500_000, 10, "Referral", "ag_jwang", "meeting_scheduled", "2026-08-23", "2026-08-28", "of_flatiron", "2026-07-14",
    "Luxury downtown focus, strong overlap with Jessica's book — discuss territory before the meeting."],
  ["rc_10", "Owen Fitzgerald", "Daniel Gale", 11, 22_900_000, 20, "Event", "ag_lbianchi", "offer_sent", "2026-08-25", "2026-08-27", "of_gardencity", "2026-06-29",
    "Offer sent August 25 with a $15K signing incentive against first-year company dollar. Decision expected this week."],
  ["rc_11", "Yara Haddad", "Corcoran", 2, 4_100_000, 8, "Inbound", "ag_cwhite", "new_lead", "2026-08-26", "2026-08-28", "of_williamsburg", "2026-08-26",
    "Second-year agent seeking better training. Good fit for the Launch bootcamp cohort starting in September."],
  ["rc_12", "Stephen Marchetti", "Independent", 18, 38_400_000, 13, "MLS Data", "ag_jocallahan", "joined", "2026-08-04", null, "of_lic", "2026-04-16",
    "Signed and now onboarding as Marisol Martinez's sponsor-broker referral. Activation targeted for early September."],
];

export const recruits: RecruitCandidate[] = rows.map((r) => ({
  id: r[0], name: r[1], avatar: "", currentBrokerage: r[2], yearsExperience: r[3],
  productionVolume: r[4], productionUnits: r[5], leadSource: r[6], recruiterId: r[7],
  stage: r[8], lastContact: r[9], nextFollowUp: r[10], targetOfficeId: r[11], createdAt: r[12],
  notes: r[13],
  phone: `646555${(3000 + rows.indexOf(r) * 61).toString().slice(0, 4)}`,
  email: `${r[1].split(" ")[0].toLowerCase()}.${r[1].split(" ")[1].toLowerCase()}@example.com`,
}));

export const ONBOARDING_STAGES: { key: OnboardingRecord["stage"]; label: string }[] = [
  { key: "application", label: "Application" },
  { key: "agreement_signed", label: "Agreement Signed" },
  { key: "license_verified", label: "License Verified" },
  { key: "mls_setup", label: "MLS Setup" },
  { key: "account_setup", label: "Account Setup" },
  { key: "training", label: "Training" },
  { key: "ready_to_activate", label: "Ready to Activate" },
  { key: "active", label: "Active" },
];

const CHECKLIST: [string, string, OnboardingChecklistItem["owner"], boolean][] = [
  ["ica", "Independent Contractor Agreement", "Agent", true],
  ["w9", "W-9 Tax Form", "Agent", true],
  ["license", "Real Estate License Verification", "HR", true],
  ["mls", "MLS Account Provisioned", "HR", true],
  ["association", "Association Membership Confirmed", "HR", true],
  ["photo", "Professional Headshot", "Agent", false],
  ["bio", "Agent Bio & Public Profile", "Agent", false],
  ["bank", "Direct Deposit / Banking Information", "Agent", true],
  ["plan", "Commission Plan Countersigned", "Broker", true],
  ["eo", "E&O Insurance Enrollment", "HR", true],
  ["training", "Launch Bootcamp — Week 1", "Agent", true],
  ["systems", "System Access & Email Provisioned", "IT", true],
];

function checklist(doneCount: number, start: string): OnboardingChecklistItem[] {
  return CHECKLIST.map((c, i) => {
    const d = new Date(start + "T12:00:00");
    d.setDate(d.getDate() + i * 2);
    return { key: c[0], label: c[1], owner: c[2], required: c[3], done: i < doneCount, completedOn: i < doneCount ? d.toISOString().slice(0, 10) : null };
  });
}

export const onboarding: OnboardingRecord[] = [
  { id: "ob_1", agentId: "ag_mmartinez", stage: "mls_setup", startedAt: "2026-08-04", targetActivation: "2026-09-08", assignedTo: "usr_hr_bell", checklist: checklist(5, "2026-08-04") },
  { id: "ob_2", agentId: "ag_thoffman", stage: "agreement_signed", startedAt: "2026-08-18", targetActivation: "2026-09-22", assignedTo: "usr_hr_bell", checklist: checklist(3, "2026-08-18") },
  { id: "ob_3", agentId: "ag_cwhite", stage: "active", startedAt: "2025-01-06", targetActivation: "2025-01-20", assignedTo: "usr_hr_bell", checklist: checklist(12, "2025-01-06") },
  { id: "ob_4", agentId: "ag_rmensah", stage: "active", startedAt: "2025-03-24", targetActivation: "2025-04-07", assignedTo: "usr_hr_bell", checklist: checklist(12, "2025-03-24") },
];

export const onboardingByAgent = (agentId: string) => onboarding.find((o) => o.agentId === agentId);
