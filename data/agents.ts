import type { Agent, CommissionPlan, Team } from "@/types";

const PLANS: Record<string, CommissionPlan> = {
  cap: { name: "Cap Plan 80/20", agentSplit: 80, brokerageSplit: 20, cap: 24000, capYtd: 0, transactionFee: 295, royaltyPct: 0 },
  premier: { name: "Premier 90/10", agentSplit: 90, brokerageSplit: 10, cap: 18000, capYtd: 0, transactionFee: 195, royaltyPct: 0 },
  standard: { name: "Standard 70/30", agentSplit: 70, brokerageSplit: 30, cap: 30000, capYtd: 0, transactionFee: 395, royaltyPct: 0 },
  team: { name: "Team Member 60/40", agentSplit: 60, brokerageSplit: 40, cap: 20000, capYtd: 0, transactionFee: 295, royaltyPct: 0 },
  newAgent: { name: "Launch 60/40", agentSplit: 60, brokerageSplit: 40, cap: 16000, capYtd: 0, transactionFee: 395, royaltyPct: 0 },
};

type Seed = {
  id: string; name: string; title: string; office: string; team?: string | null;
  status: Agent["status"]; tier: Agent["tier"]; join: string; bday: string;
  langs: string[]; hoods: string[]; spec: string[]; plan: keyof typeof PLANS;
  lic: [string, string, Agent["license"]["type"], string, string, Agent["license"]["status"]];
  mls: [string, string, Agent["mls"]["status"]];
  s: [number, number, number, number, number, number, number, number, number]; // ytdVol, ytdGci, closings, activeDeals, activeListings, lifetime, dom, listToSale, satisfaction
  bio: string;
  capYtd?: number;
  onboardingStage?: Agent["onboardingStage"];
};

const S: Seed[] = [
  { id: "ag_schen", name: "Sophia Chen", title: "Associate Broker · Senior Advisor", office: "of_flatiron", team: "tm_chen", status: "active", tier: "platinum", join: "2019-05-13", bday: "03-18",
    langs: ["English", "Mandarin", "Cantonese"], hoods: ["Flatiron", "Gramercy", "Chelsea", "NoMad"], spec: ["Luxury Condo", "New Development", "Investor Sales"], plan: "premier", capYtd: 18000,
    lic: ["10301218844", "NY", "Associate Broker", "2016-02-11", "2027-02-28", "active"], mls: ["RLS-88213", "REBNY RLS", "active"],
    s: [42_800_000, 1_069_000, 21, 6, 5, 214_000_000, 42, 97.8, 4.9],
    bio: "Sophia leads Tru Realty's top-producing team out of Flatiron. Twelve years in Manhattan resale and new development, with a specialty in cross-border buyers and 1031 exchanges." },

  { id: "ag_dkim", name: "Daniel Kim", title: "Licensed Salesperson", office: "of_flatiron", team: "tm_chen", status: "active", tier: "gold", join: "2021-01-11", bday: "11-02",
    langs: ["English", "Korean"], hoods: ["Murray Hill", "Kips Bay", "Midtown East"], spec: ["First-Time Buyers", "Co-op Board Packages"], plan: "team", capYtd: 11400,
    lic: ["10401299137", "NY", "Salesperson", "2020-11-04", "2026-11-30", "expiring"], mls: ["RLS-90114", "REBNY RLS", "active"],
    s: [18_400_000, 441_600, 12, 4, 2, 61_000_000, 51, 96.2, 4.8],
    bio: "Daniel is the co-op specialist on the Chen Team. He has shepherded more than 90 board packages through Manhattan's toughest buildings." },

  { id: "ag_mrodriguez", name: "Michael Rodriguez", title: "Licensed Salesperson", office: "of_williamsburg", team: null, status: "active", tier: "gold", join: "2020-07-20", bday: "06-24",
    langs: ["English", "Spanish"], hoods: ["Williamsburg", "Greenpoint", "Bushwick"], spec: ["Multi-Family", "Investment Sales", "Rentals"], plan: "cap", capYtd: 21300,
    lic: ["10401277402", "NY", "Salesperson", "2019-06-18", "2027-06-30", "active"], mls: ["OK-44190", "OneKey MLS", "active"],
    s: [23_900_000, 597_500, 16, 5, 4, 88_500_000, 38, 98.4, 4.7],
    bio: "Michael works North Brooklyn's small multi-family market. He grew up in Greenpoint and has closed on more than 60 buildings within a mile of the office." },

  { id: "ag_jwang", name: "Jessica Wang", title: "Licensed Salesperson", office: "of_flatiron", team: null, status: "active", tier: "platinum", join: "2019-09-09", bday: "01-30",
    langs: ["English", "Mandarin"], hoods: ["Tribeca", "SoHo", "West Village"], spec: ["Luxury Resale", "New Development", "Relocation"], plan: "premier", capYtd: 18000,
    lic: ["10301224509", "NY", "Associate Broker", "2015-08-22", "2026-09-30", "expiring"], mls: ["RLS-88907", "REBNY RLS", "active"],
    s: [51_200_000, 1_216_000, 18, 7, 6, 268_000_000, 47, 96.9, 5.0],
    bio: "Jessica is Tru Realty's highest-volume individual agent, focused on downtown lofts and trophy condos between $4M and $20M." },

  { id: "ag_dpark", name: "David Park", title: "Licensed Salesperson", office: "of_lic", team: null, status: "active", tier: "silver", join: "2023-03-06", bday: "08-14",
    langs: ["English", "Korean"], hoods: ["Long Island City", "Astoria", "Sunnyside"], spec: ["New Development", "First-Time Buyers"], plan: "cap", capYtd: 9800,
    lic: ["10401310288", "NY", "Salesperson", "2022-12-01", "2028-12-31", "active"], mls: ["OK-51022", "OneKey MLS", "active"],
    s: [11_600_000, 290_000, 9, 3, 3, 24_800_000, 44, 97.1, 4.6],
    bio: "David covers the Queens waterfront and is the brokerage's lead on the Skyline Court and Vernon Yards developments." },

  { id: "ag_ejohnson", name: "Emily Johnson", title: "Licensed Salesperson", office: "of_gardencity", team: null, status: "active", tier: "gold", join: "2024-06-17", bday: "04-09",
    langs: ["English"], hoods: ["Garden City", "Rockville Centre", "Manhasset", "Port Washington"], spec: ["Single Family", "Relocation", "Sellers"], plan: "cap", capYtd: 15600,
    lic: ["10401325571", "NY", "Salesperson", "2021-03-19", "2027-03-31", "active"], mls: ["OK-58840", "OneKey MLS", "active"],
    s: [19_750_000, 493_750, 15, 4, 5, 47_200_000, 29, 99.2, 4.9],
    bio: "Emily brought a Nassau County listing book with her from a legacy brokerage in 2024. She is the top listing agent on Long Island for Tru." },

  { id: "ag_apatel", name: "Aisha Patel", title: "Licensed Salesperson", office: "of_flatiron", team: "tm_chen", status: "active", tier: "silver", join: "2022-08-01", bday: "09-27",
    langs: ["English", "Hindi", "Gujarati"], hoods: ["Upper East Side", "Yorkville", "Carnegie Hill"], spec: ["Co-ops", "Condos", "Rentals"], plan: "team", capYtd: 7200,
    lic: ["10401301990", "NY", "Salesperson", "2022-05-02", "2026-09-15", "expiring"], mls: ["RLS-91442", "REBNY RLS", "active"],
    s: [9_400_000, 235_000, 8, 3, 2, 21_600_000, 55, 95.8, 4.7],
    bio: "Aisha handles the Chen Team's uptown business and runs the team's rental-to-purchase conversion program." },

  { id: "ag_jocallahan", name: "James O'Callahan", title: "Associate Broker", office: "of_williamsburg", team: null, status: "active", tier: "gold", join: "2020-02-24", bday: "12-11",
    langs: ["English"], hoods: ["Park Slope", "Cobble Hill", "Carroll Gardens", "Brooklyn Heights"], spec: ["Townhouses", "Brownstones", "Historic Homes"], plan: "premier", capYtd: 18000,
    lic: ["10301230117", "NY", "Associate Broker", "2014-04-07", "2028-04-30", "active"], mls: ["OK-40092", "OneKey MLS", "active"],
    s: [28_300_000, 707_500, 11, 4, 6, 132_000_000, 61, 94.6, 4.8],
    bio: "James is Brownstone Brooklyn's townhouse specialist, with 20 years of limestone and brownstone transactions in the historic districts." },

  { id: "ag_ntran", name: "Nina Tran", title: "Licensed Salesperson", office: "of_lic", team: null, status: "active", tier: "silver", join: "2023-11-13", bday: "07-05",
    langs: ["English", "Vietnamese"], hoods: ["Forest Hills", "Rego Park", "Jackson Heights"], spec: ["Co-ops", "First-Time Buyers", "Investors"], plan: "cap", capYtd: 6100,
    lic: ["10401318802", "NY", "Salesperson", "2023-08-30", "2027-08-31", "active"], mls: ["OK-53311", "OneKey MLS", "active"],
    s: [7_900_000, 197_500, 7, 2, 2, 14_200_000, 49, 97.5, 4.6],
    bio: "Nina works central Queens, where she is known for making pre-war co-op deals close on schedule." },

  { id: "ag_rmensah", name: "Robert Mensah", title: "Licensed Salesperson", office: "of_flatiron", team: null, status: "active", tier: "emerging", join: "2025-04-07", bday: "02-16",
    langs: ["English", "French"], hoods: ["Harlem", "Morningside Heights", "Washington Heights"], spec: ["First-Time Buyers", "HDFC Co-ops"], plan: "newAgent", capYtd: 3400,
    lic: ["10401341226", "NY", "Salesperson", "2025-02-14", "2029-02-28", "active"], mls: ["RLS-93880", "REBNY RLS", "active"],
    s: [3_600_000, 90_000, 4, 2, 1, 5_100_000, 58, 96.1, 4.5],
    bio: "Robert joined from a mortgage-brokerage background and specializes in uptown HDFC and income-restricted co-ops." },

  { id: "ag_lbianchi", name: "Laura Bianchi", title: "Licensed Salesperson", office: "of_gardencity", team: null, status: "active", tier: "silver", join: "2024-09-30", bday: "05-21",
    langs: ["English", "Italian"], hoods: ["Great Neck", "Roslyn", "Old Westbury"], spec: ["Luxury Single Family", "Estates"], plan: "cap", capYtd: 8900,
    lic: ["10401329004", "NY", "Salesperson", "2024-07-11", "2028-07-31", "active"], mls: ["OK-59120", "OneKey MLS", "active"],
    s: [12_400_000, 310_000, 6, 3, 4, 18_900_000, 71, 93.8, 4.7],
    bio: "Laura sells North Shore estates and handles Tru's relocation referrals from Milan and Rome." },

  { id: "ag_cwhite", name: "Caleb White", title: "Licensed Salesperson", office: "of_williamsburg", team: null, status: "active", tier: "emerging", join: "2025-01-20", bday: "10-08",
    langs: ["English"], hoods: ["Bed-Stuy", "Crown Heights", "Prospect Heights"], spec: ["Rentals", "First-Time Buyers"], plan: "newAgent", capYtd: 2600,
    lic: ["10401338771", "NY", "Salesperson", "2024-11-22", "2028-11-30", "active"], mls: ["OK-60441", "OneKey MLS", "active"],
    s: [2_900_000, 72_500, 5, 2, 1, 3_400_000, 34, 98.9, 4.4],
    bio: "Caleb runs the highest showing volume in the Williamsburg office and converts a third of his rental clients into buyers." },

  { id: "ag_mmartinez", name: "Marisol Martinez", title: "Licensed Salesperson", office: "of_lic", team: null, status: "onboarding", tier: "emerging", join: "2026-08-04", bday: "03-03",
    langs: ["English", "Spanish"], hoods: ["Astoria", "Ditmars", "Woodside"], spec: ["Rentals", "Multi-Family"], plan: "newAgent", capYtd: 0,
    lic: ["10401346612", "NY", "Salesperson", "2026-06-19", "2030-06-30", "pending"], mls: ["—", "OneKey MLS", "pending"],
    s: [0, 0, 0, 0, 0, 0, 0, 0, 0], onboardingStage: "mls_setup",
    bio: "Marisol joins Tru from a boutique Astoria firm, bringing eight years of northwest Queens rental and small-building experience." },

  { id: "ag_thoffman", name: "Thomas Hoffman", title: "Licensed Salesperson", office: "of_flatiron", team: null, status: "onboarding", tier: "emerging", join: "2026-08-18", bday: "12-29",
    langs: ["English", "German"], hoods: ["Midtown West", "Hell's Kitchen", "Hudson Yards"], spec: ["New Development", "Condos"], plan: "cap", capYtd: 0,
    lic: ["10401347005", "NY", "Salesperson", "2026-07-02", "2030-07-31", "active"], mls: ["—", "REBNY RLS", "pending"],
    s: [0, 0, 0, 0, 0, 0, 0, 0, 0], onboardingStage: "agreement_signed",
    bio: "Thomas spent six years in Hudson Yards new development sales and joins Tru to build a west-side condo practice." },

  { id: "ag_pgreene", name: "Priya Greene", title: "Licensed Salesperson", office: "of_williamsburg", team: null, status: "inactive", tier: "silver", join: "2021-06-14", bday: "08-30",
    langs: ["English", "Hindi"], hoods: ["Fort Greene", "Clinton Hill", "DUMBO"], spec: ["Condos", "New Development"], plan: "cap", capYtd: 4100,
    lic: ["10401288330", "NY", "Salesperson", "2021-04-05", "2026-04-30", "expired"], mls: ["OK-46701", "OneKey MLS", "inactive"],
    s: [1_850_000, 46_250, 2, 0, 0, 34_600_000, 46, 96.4, 4.6],
    bio: "Priya is on parental leave through Q4 2026 with her license renewal pending reinstatement." },

  { id: "ag_bschultz", name: "Ben Schultz", title: "Licensed Salesperson", office: "of_gardencity", team: null, status: "offboarding", tier: "emerging", join: "2024-11-04", bday: "06-06",
    langs: ["English"], hoods: ["Levittown", "Hicksville", "Bethpage"], spec: ["Single Family"], plan: "cap", capYtd: 5200,
    lic: ["10401331775", "NY", "Salesperson", "2024-09-16", "2028-09-30", "active"], mls: ["OK-59988", "OneKey MLS", "active"],
    s: [4_300_000, 107_500, 4, 1, 0, 9_800_000, 53, 95.2, 4.3],
    bio: "Ben submitted notice on August 12, 2026. Two active files are being reassigned within the Garden City office." },
];

export const agents: Agent[] = S.map((s) => {
  const [first, ...rest] = s.name.split(" ");
  return {
    id: s.id,
    userId: `usr_${s.id.slice(3)}`,
    name: s.name,
    firstName: first,
    lastName: rest.join(" "),
    title: s.title,
    email: `${first.toLowerCase()}.${rest.join("").toLowerCase().replace(/[^a-z]/g, "")}@trurealty.com`,
    phone: `212555${(1000 + S.indexOf(s) * 37).toString().slice(0, 4)}`,
    avatar: "",
    officeId: s.office,
    teamId: s.team ?? null,
    status: s.status,
    tier: s.tier,
    joinDate: s.join,
    birthday: s.bday,
    bio: s.bio,
    languages: s.langs,
    neighborhoods: s.hoods,
    specialties: s.spec,
    license: {
      number: s.lic[0], state: s.lic[1], type: s.lic[2], issued: s.lic[3],
      expires: s.lic[4], status: s.lic[5],
      verifiedOn: s.lic[5] === "pending" ? null : "2026-01-14",
      verifiedBy: s.lic[5] === "pending" ? null : "Dana Whitfield",
    },
    mls: { mlsId: s.mls[0], board: s.mls[1], status: s.mls[2], associationDuesPaid: s.mls[2] === "active", lastSync: "2026-08-26" },
    plan: { ...PLANS[s.plan], capYtd: s.capYtd ?? 0 },
    stats: {
      ytdVolume: s.s[0], ytdGci: s.s[1], ytdClosings: s.s[2], activeDeals: s.s[3],
      activeListings: s.s[4], lifetimeVolume: s.s[5], avgDaysOnMarket: s.s[6],
      listToSaleRatio: s.s[7], satisfaction: s.s[8],
    },
    onboardingStage: s.onboardingStage,
    emergencyContact: { name: "On file with HR", relation: "—", phone: "—" },
    address: "On file with HR",
  };
});

export const teams: Team[] = [
  { id: "tm_chen", name: "The Chen Team", leadAgentId: "ag_schen", memberIds: ["ag_schen", "ag_dkim", "ag_apatel"], splitToTeam: 15 },
];

export const agentById = (id: string) => agents.find((a) => a.id === id);
export const agentName = (id: string) => agentById(id)?.name ?? "Unassigned";
export const activeAgents = agents.filter((a) => a.status === "active");
export const teamById = (id: string | null) => (id ? teams.find((t) => t.id === id) : undefined);
