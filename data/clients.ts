import type { Client, ClientNote } from "@/types";

type C = [
  id: string, name: string, type: Client["type"], status: Client["status"],
  agentId: string, min: number, max: number, areas: string[], ptype: string, beds: number,
  source: string, created: string, last: string, next: string | null, tags: string[]
];

const rows: C[] = [
  ["cl_hartley", "Nathan & Ruth Hartley", "buyer", "under_contract", "ag_schen", 3_200_000, 4_100_000, ["Flatiron", "Gramercy"], "Condo", 3, "Sphere of Influence", "2026-01-14", "2026-08-24", "2026-08-28", ["Financing", "Repeat Client"]],
  ["cl_zhao", "Wei Zhao", "investor", "active", "ag_schen", 1_800_000, 2_600_000, ["NoMad", "Chelsea"], "Condo", 2, "Referral — Attorney", "2025-11-02", "2026-08-25", "2026-08-27", ["Cash", "1031 Exchange"]],
  ["cl_delgado", "Carmen Delgado", "seller", "under_contract", "ag_mrodriguez", 0, 0, ["Greenpoint"], "Multi-Family", 0, "Past Client", "2026-03-08", "2026-08-22", "2026-09-02", ["Estate Sale"]],
  ["cl_brennan", "Kyle Brennan", "buyer", "active", "ag_cwhite", 750_000, 950_000, ["Bed-Stuy", "Crown Heights"], "Condo", 2, "Zillow", "2026-06-19", "2026-08-23", "2026-08-29", ["First-Time Buyer", "Pre-Approved"]],
  ["cl_okonkwo", "Adaeze Okonkwo", "buyer", "new_lead", "ag_rmensah", 620_000, 780_000, ["Harlem", "Morningside Heights"], "Co-op", 2, "Open House", "2026-08-21", "2026-08-21", "2026-08-27", ["First-Time Buyer"]],
  ["cl_vandenberg", "Els van den Berg", "buyer", "active", "ag_jwang", 6_500_000, 9_000_000, ["Tribeca", "SoHo"], "Loft", 3, "International Referral", "2026-02-27", "2026-08-20", "2026-09-04", ["Relocation", "Cash"]],
  ["cl_prasad", "Rohan Prasad", "both", "under_contract", "ag_apatel", 1_400_000, 1_750_000, ["Upper East Side"], "Co-op", 2, "Sphere of Influence", "2025-09-30", "2026-08-25", "2026-08-31", ["Sell to Buy"]],
  ["cl_moretti", "Gianna Moretti", "seller", "active", "ag_lbianchi", 0, 0, ["Roslyn"], "Single Family", 0, "Farming Postcard", "2026-05-11", "2026-08-19", "2026-08-28", ["Price Reduction Discussion"]],
  ["cl_akerman", "Paul & Dana Akerman", "buyer", "closed", "ag_ejohnson", 1_100_000, 1_400_000, ["Garden City", "Rockville Centre"], "Single Family", 4, "Referral — Lender", "2025-12-05", "2026-07-30", null, ["Closed 2026"]],
  ["cl_ferraro", "Luca Ferraro", "seller", "under_contract", "ag_jocallahan", 0, 0, ["Park Slope"], "Townhouse", 0, "Past Client", "2026-04-02", "2026-08-24", "2026-09-01", ["Historic District"]],
  ["cl_nakamura", "Yuki Nakamura", "buyer", "nurturing", "ag_dpark", 900_000, 1_150_000, ["Long Island City"], "Condo", 2, "New Development Event", "2026-06-30", "2026-08-12", "2026-09-10", ["Timeline 2027"]],
  ["cl_mcallister", "Grant McAllister", "investor", "active", "ag_mrodriguez", 2_400_000, 3_800_000, ["Bushwick", "Ridgewood"], "Multi-Family", 0, "Cold Outreach", "2026-01-22", "2026-08-18", "2026-08-27", ["Portfolio", "1031 Exchange"]],
  ["cl_soto", "Ines Soto", "renter", "active", "ag_cwhite", 4_200, 5_400, ["Williamsburg"], "Condo", 1, "StreetEasy", "2026-08-04", "2026-08-25", "2026-08-27", ["Rental", "Convert to Buyer"]],
  ["cl_lindqvist", "Astrid Lindqvist", "buyer", "under_contract", "ag_jwang", 4_000_000, 5_200_000, ["West Village"], "Townhouse", 4, "Referral — Agent", "2026-03-19", "2026-08-23", "2026-08-30", ["Relocation"]],
  ["cl_boateng", "Kwame Boateng", "seller", "new_lead", "ag_rmensah", 0, 0, ["Washington Heights"], "Co-op", 0, "Website Form", "2026-08-24", "2026-08-24", "2026-08-28", ["Valuation Requested"]],
  ["cl_reinhart", "Susan Reinhart", "seller", "active", "ag_ejohnson", 0, 0, ["Manhasset"], "Single Family", 0, "Sphere of Influence", "2026-07-08", "2026-08-21", "2026-08-29", ["Downsizing"]],
  ["cl_tanaka", "Hiro & Mei Tanaka", "buyer", "active", "ag_ntran", 680_000, 850_000, ["Forest Hills"], "Co-op", 2, "Referral — Client", "2026-05-26", "2026-08-20", "2026-09-03", ["Board Package Prep"]],
  ["cl_whitfield", "Owen Whitfield", "buyer", "lost", "ag_dkim", 1_200_000, 1_500_000, ["Murray Hill"], "Condo", 2, "StreetEasy", "2025-10-15", "2026-05-30", null, ["Went With Family Friend"]],
  ["cl_castellanos", "Diego Castellanos", "buyer", "active", "ag_dpark", 780_000, 940_000, ["Astoria", "Sunnyside"], "Condo", 2, "Instagram", "2026-07-02", "2026-08-22", "2026-08-28", ["Pre-Approved"]],
  ["cl_odonnell", "Fiona O'Donnell", "seller", "closed", "ag_jocallahan", 0, 0, ["Cobble Hill"], "Townhouse", 0, "Past Client", "2025-11-18", "2026-06-25", null, ["Closed 2026"]],
  ["cl_haddad", "Layla Haddad", "buyer", "nurturing", "ag_apatel", 1_050_000, 1_300_000, ["Yorkville", "Carnegie Hill"], "Co-op", 2, "Open House", "2026-04-14", "2026-08-06", "2026-09-08", ["Board Approval Risk"]],
  ["cl_pemberton", "Charles Pemberton III", "seller", "active", "ag_schen", 0, 0, ["Gramercy"], "Condo", 0, "Referral — Attorney", "2026-06-01", "2026-08-25", "2026-08-27", ["Luxury", "Off-Market"]],
  ["cl_novak", "Petra Novak", "buyer", "active", "ag_lbianchi", 2_100_000, 2_900_000, ["Great Neck", "Old Westbury"], "Single Family", 5, "Relocation Service", "2026-06-12", "2026-08-19", "2026-08-30", ["Relocation", "School District"]],
  ["cl_alvarez", "Rosa Alvarez", "renter", "closed", "ag_mmartinez", 3_100, 3_800, ["Astoria"], "Condo", 1, "Referral — Client", "2026-07-15", "2026-08-14", null, ["Rental Closed"]],
  ["cl_kingsley", "Devon Kingsley", "investor", "nurturing", "ag_mrodriguez", 5_000_000, 8_000_000, ["Bushwick", "East Williamsburg"], "Multi-Family", 0, "Event", "2026-02-09", "2026-07-28", "2026-09-15", ["Institutional", "Long Timeline"]],
  ["cl_sung", "Grace Sung", "buyer", "under_contract", "ag_dkim", 1_300_000, 1_600_000, ["Kips Bay", "Midtown East"], "Co-op", 2, "Sphere of Influence", "2026-02-18", "2026-08-24", "2026-08-29", ["Board Package Submitted"]],
  ["cl_ruiz", "Antonio Ruiz", "buyer", "active", "ag_ntran", 540_000, 660_000, ["Jackson Heights", "Rego Park"], "Co-op", 1, "Website Form", "2026-07-24", "2026-08-23", "2026-08-31", ["First-Time Buyer"]],
  ["cl_barrington", "Helen Barrington", "seller", "active", "ag_jwang", 0, 0, ["SoHo"], "Loft", 0, "Past Client", "2026-05-05", "2026-08-18", "2026-09-02", ["Luxury", "Staging Scheduled"]],
];

const NOTE_BANK: [ClientNote["type"], string][] = [
  ["call", "Left a voicemail and followed up by text. Confirmed they're still targeting a fall move."],
  ["showing", "Toured three properties Saturday morning. Strong reaction to the second one — light and layout were the drivers."],
  ["email", "Sent the updated comps package and the neighborhood absorption report."],
  ["meeting", "Sat down at the office to walk through the offer strategy and net sheet."],
  ["note", "Pre-approval letter refreshed and on file. Lender confirmed rate lock available through end of month."],
  ["call", "Discussed appraisal contingency language. They're comfortable with a 10-day window."],
  ["note", "Prefers evening showings after 6pm on weekdays; weekends open."],
  ["showing", "Second showing with their contractor to price out the kitchen."],
];

export const clients: Client[] = rows.map((r, i) => {
  const notes: ClientNote[] = Array.from({ length: 2 + (i % 3) }).map((_, j) => {
    const [type, body] = NOTE_BANK[(i * 3 + j) % NOTE_BANK.length];
    const d = new Date(r[12]);
    d.setDate(d.getDate() - j * 9);
    return { id: `${r[0]}_n${j}`, body, authorId: r[4], createdAt: d.toISOString().slice(0, 10), type };
  });
  return {
    id: r[0], name: r[1], type: r[2], status: r[3],
    email: `${r[1].split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")}.${r[1].split(" ").pop()!.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
    phone: `917555${(2000 + i * 43).toString().slice(0, 4)}`,
    avatar: "", agentId: r[4], budgetMin: r[5], budgetMax: r[6], areas: r[7],
    propertyType: r[8], beds: r[9], leadSource: r[10], createdAt: r[11],
    lastContact: r[12], nextFollowUp: r[13], notes, tags: r[14],
    preApproved: r[14].includes("Pre-Approved") || r[14].includes("Financing"),
    lender: r[2] === "buyer" || r[2] === "both" ? ["Empire Mortgage", "Hudson Federal", "Citizens One", "Guaranteed Rate"][i % 4] : undefined,
  };
});

export const clientById = (id: string) => clients.find((c) => c.id === id);
export const clientName = (id: string) => clientById(id)?.name ?? "—";
export const clientsByAgent = (agentId: string) => clients.filter((c) => c.agentId === agentId);
