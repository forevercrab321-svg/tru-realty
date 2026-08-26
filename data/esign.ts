import type { SignatureRequest, SignatureTemplate } from "@/types";

export const signatureTemplates: SignatureTemplate[] = [
  { id: "st_1", name: "Exclusive Right to Sell", category: "Listing", fields: 24, usageCount: 118, updatedAt: "2026-02-19" },
  { id: "st_2", name: "Buyer Representation Agreement", category: "Buyer", fields: 19, usageCount: 96, updatedAt: "2026-02-19" },
  { id: "st_3", name: "Independent Contractor Agreement", category: "HR", fields: 31, usageCount: 22, updatedAt: "2026-01-08" },
  { id: "st_4", name: "Commission Disbursement Authorization", category: "Closing", fields: 14, usageCount: 141, updatedAt: "2026-04-02" },
  { id: "st_5", name: "Price Reduction Amendment", category: "Listing", fields: 9, usageCount: 47, updatedAt: "2025-10-14" },
  { id: "st_6", name: "Buyer Registration — New Development", category: "New Development", fields: 17, usageCount: 38, updatedAt: "2026-06-11" },
];

type SR = [id: string, doc: string, tmpl: string | null, tx: string | null, agent: string,
  status: SignatureRequest["status"], sent: string | null, completed: string | null, expires: string,
  recipients: [string, string, string, boolean, string | null][]];

const rows: SR[] = [
  ["sg_1", "Exclusive Right to Sell — 36 Gramercy Park East 10A", "st_1", "tx_1051", "ag_schen", "sent", "2026-08-25", null, "2026-09-08",
    [["Charles Pemberton III", "c.pemberton@example.com", "Seller", false, null], ["Sophia Chen", "sophia.chen@trurealty.com", "Listing Agent", true, "2026-08-25"]]],
  ["sg_2", "Commission Disbursement Authorization — TR-2026-1046", "st_4", "tx_1046", "ag_apatel", "viewed", "2026-08-24", null, "2026-09-07",
    [["Vanguard Title — Marla Deitch", "marla@vanguardtitle.com", "Title", false, null], ["Ruben Navarro", "ruben.navarro@trurealty.com", "Accounting", true, "2026-08-24"]]],
  ["sg_3", "Buyer Representation Agreement — Okonkwo", "st_2", null, "ag_rmensah", "completed", "2026-08-21", "2026-08-22", "2026-09-04",
    [["Adaeze Okonkwo", "adaeze.okonkwo@example.com", "Buyer", true, "2026-08-22"], ["Robert Mensah", "robert.mensah@trurealty.com", "Agent", true, "2026-08-21"]]],
  ["sg_4", "Independent Contractor Agreement — Thomas Hoffman", "st_3", null, "ag_thoffman", "signed", "2026-08-18", null, "2026-09-01",
    [["Thomas Hoffman", "thomas.hoffman@trurealty.com", "Agent", true, "2026-08-19"], ["Grace Whitfield", "grace.whitfield@trurealty.com", "Principal Broker", false, null]]],
  ["sg_5", "Price Reduction Amendment — 9 Sutton Place", "st_5", "tx_1062", "ag_lbianchi", "completed", "2026-08-06", "2026-08-07", "2026-08-20",
    [["Gianna Moretti", "gianna.moretti@example.com", "Seller", true, "2026-08-07"], ["Laura Bianchi", "laura.bianchi@trurealty.com", "Listing Agent", true, "2026-08-06"]]],
  ["sg_6", "Buyer Registration — Vernon Yards / Nakamura", "st_6", null, "ag_dpark", "sent", "2026-08-20", null, "2026-09-03",
    [["Yuki Nakamura", "yuki.nakamura@example.com", "Buyer", false, null], ["Northside Equities — Sales", "sales@northsideequities.com", "Sponsor", false, null]]],
  ["sg_7", "Exclusive Right to Sell — 1140 Northern Boulevard", "st_1", "tx_1050", "ag_ejohnson", "completed", "2026-07-14", "2026-07-15", "2026-07-28",
    [["Susan Reinhart", "susan.reinhart@example.com", "Seller", true, "2026-07-15"], ["Emily Johnson", "emily.johnson@trurealty.com", "Listing Agent", true, "2026-07-14"]]],
  ["sg_8", "Commission Disbursement Authorization — TR-2026-1052", "st_4", "tx_1052", "ag_mrodriguez", "expired", "2026-07-02", null, "2026-07-16",
    [["Kings County Abstract", "sol@kcabstract.com", "Title", false, null], ["Ruben Navarro", "ruben.navarro@trurealty.com", "Accounting", true, "2026-07-02"]]],
  ["sg_9", "Buyer Representation Agreement — Ruiz", "st_2", null, "ag_ntran", "draft", null, null, "2026-09-10",
    [["Antonio Ruiz", "antonio.ruiz@example.com", "Buyer", false, null], ["Nina Tran", "nina.tran@trurealty.com", "Agent", false, null]]],
  ["sg_10", "Independent Contractor Agreement — Marisol Martinez", "st_3", null, "ag_mmartinez", "completed", "2026-08-04", "2026-08-05", "2026-08-18",
    [["Marisol Martinez", "marisol.martinez@trurealty.com", "Agent", true, "2026-08-05"], ["Grace Whitfield", "grace.whitfield@trurealty.com", "Principal Broker", true, "2026-08-05"]]],
];

export const signatureRequests: SignatureRequest[] = rows.map((r) => ({
  id: r[0], documentName: r[1], templateId: r[2], transactionId: r[3], agentId: r[4],
  status: r[5], sentAt: r[6], completedAt: r[7], expiresAt: r[8], createdBy: "usr_tc_reeves",
  recipients: r[9].map((x) => ({ name: x[0], email: x[1], role: x[2], signed: x[3], signedAt: x[4] })),
}));
