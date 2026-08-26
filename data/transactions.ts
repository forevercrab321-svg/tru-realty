import type {
  ClientNote, TimelineEvent, Transaction, TransactionDocument, TransactionTask, TxStage, TxSide,
} from "@/types";
import { computeCommission } from "@/lib/commission";

type T = [
  id: string, ref: string, address: string, unit: string, city: string, zip: string,
  ptype: string, side: TxSide, stage: TxStage, agentId: string, coAgent: string | null,
  coordinator: string, clientId: string, counterparty: string, cpBrokerage: string,
  listPrice: number, salePrice: number, commissionPct: number,
  contractDate: string | null, closingDate: string, createdAt: string, img: number,
  lender: string | null, title: string | null, referralPct?: number
];

const rows: T[] = [
  ["tx_1041", "TR-2026-1041", "45 East 22nd Street", "31B", "New York", "10010", "Condo", "buyer", "under_contract", "ag_schen", null, "usr_tc_reeves", "cl_hartley", "Whitlock Family Trust", "Corcoran", 3_895_000, 3_760_000, 5, "2026-07-18", "2026-09-14", "2026-06-02", 1, "Empire Mortgage", "Vanguard Title", 0],
  ["tx_1042", "TR-2026-1042", "88 Franklin Street", "PH", "New York", "10013", "Loft", "buyer", "inspection", "ag_jwang", null, "usr_tc_reeves", "cl_vandenberg", "Alderman Holdings LLC", "Douglas Elliman", 8_450_000, 8_100_000, 5, "2026-08-06", "2026-10-09", "2026-05-19", 2, null, "Ironclad Title", 25],
  ["tx_1043", "TR-2026-1043", "212 Java Street", "", "Brooklyn", "11222", "Multi-Family", "listing", "under_contract", "ag_mrodriguez", null, "usr_tc_alvarez", "cl_delgado", "Bennett Capital Partners", "Compass", 2_950_000, 2_875_000, 5, "2026-07-29", "2026-09-22", "2026-04-11", 3, "Hudson Federal", "Kings County Abstract", 0],
  ["tx_1044", "TR-2026-1044", "620 Carroll Street", "", "Brooklyn", "11215", "Townhouse", "listing", "appraisal", "ag_jocallahan", null, "usr_tc_alvarez", "cl_ferraro", "The Okafor Family", "Brown Harris Stevens", 4_395_000, 4_250_000, 5, "2026-07-11", "2026-09-08", "2026-03-27", 4, "Citizens One", "Kings County Abstract", 0],
  ["tx_1045", "TR-2026-1045", "127 Sherman Avenue", "", "Garden City", "11530", "Single Family", "buyer", "loan", "ag_ejohnson", null, "usr_tc_devlin", "cl_akerman", "Marchetti Estate", "Daniel Gale", 1_349_000, 1_310_000, 4.5, "2026-06-30", "2026-08-28", "2026-05-02", 5, "Guaranteed Rate", "Nassau Land Services", 0],
  ["tx_1046", "TR-2026-1046", "301 East 79th Street", "14C", "New York", "10075", "Co-op", "buyer", "closing", "ag_apatel", "ag_dkim", "usr_tc_reeves", "cl_prasad", "Estate of R. Steinberg", "Sotheby's", 1_595_000, 1_535_000, 5, "2026-06-12", "2026-08-31", "2026-04-08", 6, "Empire Mortgage", "Vanguard Title", 0],
  ["tx_1047", "TR-2026-1047", "42-15 Crescent Street", "9F", "Queens", "11101", "Condo", "buyer", "under_contract", "ag_dpark", null, "usr_tc_devlin", "cl_castellanos", "Skyline Court Sponsor", "Tru Realty", 899_000, 885_000, 4, "2026-08-04", "2026-10-16", "2026-07-05", 7, "Hudson Federal", "Queens Title Group", 0],
  ["tx_1048", "TR-2026-1048", "19 Bedford Street", "", "New York", "10014", "Townhouse", "buyer", "accepted", "ag_jwang", null, "usr_tc_reeves", "cl_lindqvist", "Hollenbeck Trust", "Corcoran", 4_995_000, 4_875_000, 5, "2026-08-19", "2026-10-30", "2026-06-24", 8, "Citizens One", "Ironclad Title", 0],
  ["tx_1049", "TR-2026-1049", "255 East 34th Street", "8H", "New York", "10016", "Co-op", "buyer", "under_contract", "ag_dkim", null, "usr_tc_reeves", "cl_sung", "Nadia Petrov", "Brown Harris Stevens", 1_425_000, 1_390_000, 5, "2026-07-22", "2026-09-19", "2026-05-14", 9, "Empire Mortgage", "Vanguard Title", 0],
  ["tx_1050", "TR-2026-1050", "1140 Northern Boulevard", "", "Manhasset", "11030", "Single Family", "listing", "offer", "ag_ejohnson", null, "usr_tc_devlin", "cl_reinhart", "Reviewing 2 offers", "—", 2_195_000, 0, 4.5, null, "2026-11-06", "2026-07-14", 10, null, null, 0],
  ["tx_1051", "TR-2026-1051", "36 Gramercy Park East", "10A", "New York", "10003", "Condo", "listing", "lead", "ag_schen", null, "usr_tc_reeves", "cl_pemberton", "Off-market — pre-launch", "—", 6_750_000, 0, 5, null, "2026-12-18", "2026-08-11", 11, null, null, 0],
  ["tx_1052", "TR-2026-1052", "544 Bushwick Avenue", "", "Brooklyn", "11206", "Multi-Family", "dual", "final_walkthrough", "ag_mrodriguez", null, "usr_tc_alvarez", "cl_mcallister", "Fairwater Group", "Tru Realty", 3_450_000, 3_395_000, 5, "2026-06-24", "2026-08-27", "2026-03-30", 12, "Hudson Federal", "Kings County Abstract", 0],
  ["tx_1053", "TR-2026-1053", "77 Crown Street", "3R", "Brooklyn", "11225", "Condo", "buyer", "inspection", "ag_cwhite", null, "usr_tc_alvarez", "cl_brennan", "Ostrow Development", "Halstead", 869_000, 852_000, 4.5, "2026-08-12", "2026-09-30", "2026-07-01", 13, "Guaranteed Rate", "Kings County Abstract", 0],
  ["tx_1054", "TR-2026-1054", "108 Bay 8th Street", "", "Brooklyn", "11228", "Single Family", "listing", "cancelled", "ag_jocallahan", null, "usr_tc_alvarez", "cl_odonnell", "Buyer withdrew — financing", "Keller Williams", 1_195_000, 0, 5, "2026-05-08", "2026-07-15", "2026-02-19", 14, null, null, 0],
  ["tx_1055", "TR-2026-1055", "70-31 108th Street", "4B", "Queens", "11375", "Co-op", "buyer", "under_contract", "ag_ntran", null, "usr_tc_devlin", "cl_tanaka", "Marvin & Estelle Kaplan", "Keller Williams", 749_000, 735_000, 4.5, "2026-08-01", "2026-10-03", "2026-06-16", 15, "Citizens One", "Queens Title Group", 0],
  ["tx_1056", "TR-2026-1056", "2 Bond Street", "5W", "New York", "10012", "Loft", "listing", "closed", "ag_jwang", null, "usr_tc_reeves", "cl_barrington", "Kaminsky Family", "Compass", 5_450_000, 5_300_000, 5, "2026-04-30", "2026-06-27", "2026-01-20", 16, "—", "Ironclad Title", 0],
  ["tx_1057", "TR-2026-1057", "88 Remsen Street", "", "Brooklyn", "11201", "Townhouse", "listing", "closed", "ag_jocallahan", null, "usr_tc_alvarez", "cl_odonnell", "Ferrante Holdings", "Douglas Elliman", 3_895_000, 3_800_000, 5, "2026-04-14", "2026-06-25", "2025-12-02", 17, "—", "Kings County Abstract", 0],
  ["tx_1058", "TR-2026-1058", "18 Chestnut Lane", "", "Rockville Centre", "11570", "Single Family", "buyer", "closed", "ag_ejohnson", null, "usr_tc_devlin", "cl_akerman", "Whelan Family", "Daniel Gale", 1_179_000, 1_155_000, 4.5, "2026-05-20", "2026-07-30", "2026-02-12", 18, "Guaranteed Rate", "Nassau Land Services", 0],
  ["tx_1059", "TR-2026-1059", "331 East 51st Street", "6D", "New York", "10022", "Co-op", "buyer", "closed", "ag_dkim", null, "usr_tc_reeves", "cl_whitfield", "Delacroix Estate", "Corcoran", 1_295_000, 1_240_000, 5, "2026-03-02", "2026-05-15", "2025-11-08", 19, "Empire Mortgage", "Vanguard Title", 0],
  ["tx_1060", "TR-2026-1060", "63 Guernsey Street", "", "Brooklyn", "11222", "Multi-Family", "listing", "closed", "ag_mrodriguez", null, "usr_tc_alvarez", "cl_delgado", "Northside Equities", "Compass", 2_495_000, 2_460_000, 5, "2026-02-26", "2026-04-24", "2025-12-15", 20, "Hudson Federal", "Kings County Abstract", 0],
  ["tx_1061", "TR-2026-1061", "150 Rivington Street", "7C", "New York", "10002", "Condo", "buyer", "closed", "ag_schen", null, "usr_tc_reeves", "cl_zhao", "Rivington Sponsor LLC", "Tru Realty", 2_150_000, 2_100_000, 4, "2026-03-14", "2026-05-29", "2025-12-28", 21, "—", "Vanguard Title", 0],
  ["tx_1062", "TR-2026-1062", "9 Sutton Place", "", "Great Neck", "11021", "Single Family", "listing", "under_contract", "ag_lbianchi", null, "usr_tc_devlin", "cl_moretti", "Anand & Priya Chandra", "Compass", 2_875_000, 2_750_000, 4.5, "2026-08-08", "2026-10-20", "2026-05-30", 22, "Citizens One", "Nassau Land Services", 0],
  ["tx_1063", "TR-2026-1063", "530 West 145th Street", "2A", "New York", "10031", "Co-op", "buyer", "offer", "ag_rmensah", null, "usr_tc_reeves", "cl_okonkwo", "HDFC Board — offer submitted", "Halstead", 675_000, 0, 5, null, "2026-11-13", "2026-08-22", 23, "Hudson Federal", null, 0],
  ["tx_1064", "TR-2026-1064", "24-20 41st Avenue", "12E", "Queens", "11101", "Condo", "buyer", "accepted", "ag_dpark", null, "usr_tc_devlin", "cl_nakamura", "Vernon Yards Sponsor", "Tru Realty", 1_075_000, 1_048_000, 4, "2026-08-20", "2026-11-20", "2026-07-19", 24, "Empire Mortgage", "Queens Title Group", 0],
];

const TASK_BANK: Record<string, [string, TransactionTask["category"], TransactionTask["priority"]][]> = {
  early: [
    ["Collect signed disclosures from all parties", "compliance", "high"],
    ["Open escrow and confirm deposit receipt", "finance", "high"],
    ["Order title search", "closing", "medium"],
    ["Upload fully executed contract to file", "compliance", "high"],
  ],
  mid: [
    ["Schedule home inspection", "closing", "high"],
    ["Review inspection report with client", "client", "high"],
    ["Submit loan application confirmation", "finance", "medium"],
    ["Order appraisal", "closing", "medium"],
    ["Confirm mortgage contingency date", "compliance", "high"],
  ],
  late: [
    ["Schedule final walkthrough", "closing", "high"],
    ["Confirm clear-to-close from lender", "finance", "high"],
    ["Send closing disclosure to client", "client", "high"],
    ["Order wire instructions verification call", "compliance", "high"],
    ["Prepare commission disbursement authorization", "finance", "medium"],
  ],
};

const DOC_BANK: [string, string, TransactionDocument["fileType"], boolean][] = [
  ["Exclusive Right to Sell Agreement", "Agency", "pdf", true],
  ["Agency Disclosure Form", "Compliance", "pdf", true],
  ["Fully Executed Purchase Contract", "Contract", "pdf", true],
  ["Lead Paint Disclosure", "Compliance", "pdf", true],
  ["Property Condition Disclosure", "Compliance", "pdf", true],
  ["Pre-Approval Letter", "Financing", "pdf", true],
  ["Inspection Report", "Inspection", "pdf", false],
  ["Appraisal Report", "Financing", "pdf", false],
  ["Title Commitment", "Title", "pdf", false],
  ["Closing Disclosure", "Closing", "pdf", true],
  ["Wire Instructions Verification", "Closing", "pdf", true],
  ["Commission Disbursement Authorization", "Closing", "pdf", true],
  ["Listing Photos — Final Set", "Marketing", "jpg", false],
  ["Comparative Market Analysis", "Marketing", "xlsx", false],
];

const STAGE_ORDER: TxStage[] = ["lead", "offer", "accepted", "under_contract", "inspection", "appraisal", "loan", "final_walkthrough", "closing", "closed"];

const MILESTONES: [TxStage, string][] = [
  ["lead", "Opportunity created"],
  ["offer", "Offer submitted"],
  ["accepted", "Offer accepted"],
  ["under_contract", "Contract fully executed"],
  ["inspection", "Inspection completed"],
  ["appraisal", "Appraisal received"],
  ["loan", "Loan commitment issued"],
  ["final_walkthrough", "Final walkthrough"],
  ["closing", "Closing scheduled"],
  ["closed", "Closed & funded"],
];

function shift(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const transactions: Transaction[] = rows.map((r, i) => {
  const stageIdx = STAGE_ORDER.indexOf(r[8]);
  const cancelled = r[8] === "cancelled";
  const progress = cancelled ? 3 : stageIdx;

  const bucket = progress <= 3 ? "early" : progress <= 6 ? "mid" : "late";
  const pool = TASK_BANK[bucket];
  const tasks: TransactionTask[] = pool.map((t, j) => {
    const due = shift(r[19], -(pool.length - j) * 6 + (i % 5));
    const overdue = new Date(due) < new Date("2026-08-26") && j >= pool.length - 2;
    return {
      id: `${r[0]}_t${j}`, title: t[0], dueDate: due, assigneeId: j % 3 === 0 ? r[11] : r[9],
      status: cancelled ? "done" : j < pool.length - 2 ? "done" : overdue ? "overdue" : j === pool.length - 2 ? "in_progress" : "open",
      priority: t[2], category: t[1],
    };
  });

  const docCount = Math.min(DOC_BANK.length, 4 + progress);
  const documents: TransactionDocument[] = DOC_BANK.slice(0, docCount).map((d, j) => ({
    id: `${r[0]}_d${j}`, name: d[0], category: d[1], fileType: d[2],
    sizeKb: 180 + ((i * 37 + j * 91) % 3400),
    uploadedBy: j % 2 === 0 ? r[9] : r[11],
    uploadedAt: shift(r[20], j * 4 + 2),
    status: j >= docCount - 2 && progress < 9 ? "pending" : d[2] === "pdf" && d[3] ? "signed" : "received",
    required: d[3],
  }));

  const timeline: TimelineEvent[] = MILESTONES.slice(0, cancelled ? 4 : stageIdx + 1).map((m, j) => ({
    id: `${r[0]}_m${j}`, label: m[1], kind: "milestone",
    date: shift(r[20], Math.round((j / Math.max(1, stageIdx || 1)) * 60)),
    done: j <= progress, actorId: r[9],
  }));
  if (cancelled) timeline.push({ id: `${r[0]}_mx`, label: "Transaction cancelled — buyer financing fell through", kind: "milestone", date: "2026-07-15", done: true, actorId: r[11] });

  const notes: ClientNote[] = [
    { id: `${r[0]}_n0`, body: `Coordinator sync: all compliance documents current as of ${shift(r[20], 40)}.`, authorId: r[11], createdAt: shift(r[20], 40), type: "note" },
    { id: `${r[0]}_n1`, body: "Client confirmed availability for the closing window. Attorney copied on the thread.", authorId: r[9], createdAt: shift(r[20], 52), type: "email" },
  ];

  const salePrice = r[16] || r[15];
  const commission = computeCommission({
    salePrice,
    grossCommissionPct: r[17],
    sidePct: r[7] === "dual" ? 1 : 0.5,
    agentId: r[9],
    referralFeePct: r[24] ?? 0,
    extraCompanyFee: r[7] === "listing" ? 250 : 0,
  });

  const riskFlags: string[] = [];
  const openReq = documents.filter((d) => d.required && d.status === "pending").length;
  if (openReq) riskFlags.push(`${openReq} required document${openReq > 1 ? "s" : ""} outstanding`);
  if (tasks.some((t) => t.status === "overdue")) riskFlags.push("Overdue task past due date");
  if (r[8] === "loan" && !r[22]) riskFlags.push("No lender on file");

  return {
    id: r[0], ref: r[1], address: r[2], unit: r[3] || undefined, city: r[4], state: "NY", zip: r[5],
    propertyType: r[6], image: `/listings/l${r[21]}-1.svg`, side: r[7], stage: r[8],
    agentId: r[9], coAgentId: r[10], coordinatorId: r[11], clientId: r[12],
    counterparty: r[13], counterpartyBrokerage: r[14],
    listPrice: r[15], salePrice: r[16], commissionPct: r[17],
    contractDate: r[18], closingDate: r[19], createdAt: r[20],
    escrow: Math.round(salePrice * 0.1), lender: r[22], titleCompany: r[23],
    tasks, documents, timeline, notes, commission,
    complianceComplete: openReq === 0,
    riskFlags,
  };
});

export const txById = (id: string) => transactions.find((t) => t.id === id);
export const CLOSED_STAGES: TxStage[] = ["closed", "cancelled"];
export const openTransactions = transactions.filter((t) => !CLOSED_STAGES.includes(t.stage));
export const closedTransactions = transactions.filter((t) => t.stage === "closed");
export const txByAgent = (agentId: string) => transactions.filter((t) => t.agentId === agentId || t.coAgentId === agentId);

export const TX_STAGES: { key: TxStage; label: string; tone: string }[] = [
  { key: "lead", label: "Lead", tone: "neutral" },
  { key: "offer", label: "Offer", tone: "info" },
  { key: "accepted", label: "Accepted", tone: "info" },
  { key: "under_contract", label: "Under Contract", tone: "brand" },
  { key: "inspection", label: "Inspection", tone: "warn" },
  { key: "appraisal", label: "Appraisal", tone: "warn" },
  { key: "loan", label: "Loan", tone: "warn" },
  { key: "final_walkthrough", label: "Final Walkthrough", tone: "brand" },
  { key: "closing", label: "Closing", tone: "brand" },
  { key: "closed", label: "Closed", tone: "ok" },
  { key: "cancelled", label: "Cancelled", tone: "risk" },
];
