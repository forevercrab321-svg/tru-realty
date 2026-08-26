import { agents } from "./agents";
import { offices } from "./offices";
import { transactions } from "./transactions";
import { recruits } from "./pipeline";

export const monthlySeries = [
  { month: "Sep 25", volume: 38_200_000, closings: 21, gci: 955_000, listings: 34 },
  { month: "Oct 25", volume: 41_600_000, closings: 24, gci: 1_040_000, listings: 37 },
  { month: "Nov 25", volume: 33_900_000, closings: 19, gci: 847_500, listings: 29 },
  { month: "Dec 25", volume: 29_400_000, closings: 16, gci: 735_000, listings: 24 },
  { month: "Jan 26", volume: 35_800_000, closings: 20, gci: 895_000, listings: 31 },
  { month: "Feb 26", volume: 39_100_000, closings: 22, gci: 977_500, listings: 36 },
  { month: "Mar 26", volume: 46_300_000, closings: 27, gci: 1_157_500, listings: 42 },
  { month: "Apr 26", volume: 51_700_000, closings: 29, gci: 1_292_500, listings: 45 },
  { month: "May 26", volume: 48_900_000, closings: 26, gci: 1_222_500, listings: 44 },
  { month: "Jun 26", volume: 55_200_000, closings: 31, gci: 1_380_000, listings: 49 },
  { month: "Jul 26", volume: 58_400_000, closings: 33, gci: 1_460_000, listings: 52 },
  { month: "Aug 26", volume: 44_100_000, closings: 24, gci: 1_102_500, listings: 47 },
];

export const officeComparison = offices.map((o) => {
  const officeAgents = agents.filter((a) => a.officeId === o.id);
  return {
    office: o.name.replace(" — Headquarters", ""),
    volume: officeAgents.reduce((s, a) => s + a.stats.ytdVolume, 0),
    gci: officeAgents.reduce((s, a) => s + a.stats.ytdGci, 0),
    closings: officeAgents.reduce((s, a) => s + a.stats.ytdClosings, 0),
    agents: officeAgents.length,
  };
});

export const topAgents = [...agents]
  .filter((a) => a.stats.ytdVolume > 0)
  .sort((a, b) => b.stats.ytdVolume - a.stats.ytdVolume);

export const recruitingFunnel = [
  { stage: "New Lead", count: recruits.filter((r) => r.stage === "new_lead").length + 24 },
  { stage: "Contacted", count: recruits.filter((r) => r.stage === "contacted").length + 15 },
  { stage: "Meeting", count: recruits.filter((r) => r.stage === "meeting_scheduled").length + 8 },
  { stage: "Interviewed", count: recruits.filter((r) => r.stage === "interviewed").length + 5 },
  { stage: "Offer Sent", count: recruits.filter((r) => r.stage === "offer_sent").length + 2 },
  { stage: "Joined", count: recruits.filter((r) => r.stage === "joined").length + 6 },
];

export const sourceMix = [
  { source: "Sphere of Influence", deals: 31, volume: 62_400_000 },
  { source: "Past Client", deals: 24, volume: 51_900_000 },
  { source: "Referral", deals: 22, volume: 58_100_000 },
  { source: "Portal (StreetEasy/Zillow)", deals: 18, volume: 26_700_000 },
  { source: "Open House", deals: 12, volume: 15_300_000 },
  { source: "New Development", deals: 9, volume: 19_800_000 },
];

export const pipelineValue = transactions
  .filter((t) => !["closed", "cancelled"].includes(t.stage))
  .reduce((s, t) => s + (t.salePrice || t.listPrice), 0);

export const companyKpis = {
  totalAgents: agents.length,
  activeAgents: agents.filter((a) => a.status === "active").length,
  onboardingAgents: agents.filter((a) => a.status === "onboarding").length,
  inactiveAgents: agents.filter((a) => a.status === "inactive" || a.status === "offboarding").length,
  newThisMonth: agents.filter((a) => a.joinDate >= "2026-08-01").length,
  licenseExpiring: agents.filter((a) => a.license.status === "expiring" || a.license.status === "expired").length,
  ytdVolume: agents.reduce((s, a) => s + a.stats.ytdVolume, 0),
  ytdGci: agents.reduce((s, a) => s + a.stats.ytdGci, 0),
  ytdClosings: agents.reduce((s, a) => s + a.stats.ytdClosings, 0),
  pipelineValue,
};
