import type { LibraryDoc } from "@/types";

type D = [title: string, cat: LibraryDoc["category"], ft: LibraryDoc["fileType"], kb: number, by: string, updated: string, dl: number, fav: boolean, desc: string, tags: string[]];

const rows: D[] = [
  ["Tru Realty Independent Contractor Agreement (2026)", "Company Documents", "pdf", 412, "usr_hr_bell", "2026-01-08", 214, true, "The current ICA template countersigned by every agent at onboarding. Supersedes the 2024 revision.", ["Onboarding", "Legal"]],
  ["Agent Policy Manual", "Policies", "pdf", 3860, "usr_hr_bell", "2026-06-30", 388, true, "Everything from advertising rules and sign standards to expense reimbursement and dispute escalation.", ["Compliance", "Reference"]],
  ["Anti-Money Laundering Policy & Red Flags", "Policies", "pdf", 640, "usr_admin_whitfield", "2026-05-14", 96, false, "Required reading for all agents handling cash-heavy or entity purchases.", ["Compliance", "AML"]],
  ["Fair Housing Advertising Standards", "Policies", "pdf", 522, "usr_admin_whitfield", "2026-03-11", 143, false, "Approved and prohibited language for listing copy, social posts and mailers.", ["Compliance", "Marketing"]],
  ["Exclusive Right to Sell — Fillable", "Forms", "pdf", 288, "usr_tc_reeves", "2026-02-19", 641, true, "Standard listing agreement with Tru's brokerage terms pre-filled.", ["Listing", "Contract"]],
  ["Buyer Representation Agreement — Fillable", "Forms", "pdf", 262, "usr_tc_reeves", "2026-02-19", 588, false, "Post-settlement compliant buyer agreement with compensation disclosure section.", ["Buyer", "Contract"]],
  ["NY Agency Disclosure Form", "Forms", "pdf", 190, "usr_tc_reeves", "2025-11-04", 902, false, "State-mandated agency disclosure. Must be presented at first substantive contact.", ["Compliance", "Required"]],
  ["Property Condition Disclosure Statement", "Forms", "pdf", 244, "usr_tc_alvarez", "2026-01-27", 411, false, "Seller disclosure with the $500 credit alternative noted.", ["Seller", "Required"]],
  ["Commission Disbursement Authorization", "Forms", "pdf", 176, "usr_acct_navarro", "2026-04-02", 356, false, "Sent to title at clear-to-close. Accounting must countersign before release.", ["Closing", "Accounting"]],
  ["Listing Presentation Deck — 2026", "Templates", "pptx", 18400, "usr_admin_whitfield", "2026-07-01", 274, true, "Editable seller presentation with market data placeholders and Tru brand styling.", ["Listing", "Presentation"]],
  ["Buyer Consultation Packet", "Templates", "docx", 1240, "usr_hr_bell", "2026-06-12", 198, false, "Agenda, process map and expectation-setting worksheet for first buyer meetings.", ["Buyer", "Consultation"]],
  ["Comparative Market Analysis Workbook", "Templates", "xlsx", 940, "usr_admin_whitfield", "2026-05-22", 322, false, "Adjustment-grid CMA model with automatic price-per-square-foot bracketing.", ["Pricing", "Analysis"]],
  ["Net Sheet Calculator — NY & Nassau", "Templates", "xlsx", 610, "usr_acct_navarro", "2026-04-18", 429, true, "Seller net proceeds with transfer tax, mansion tax and flip-tax handling by county.", ["Pricing", "Accounting"]],
  ["Tru Brand Guidelines", "Marketing Materials", "pdf", 9200, "usr_admin_whitfield", "2026-01-15", 167, false, "Logo usage, color, typography and photography direction for all agent-produced materials.", ["Brand", "Design"]],
  ["Just Listed / Just Sold Postcard Set", "Marketing Materials", "zip", 24600, "usr_admin_whitfield", "2026-06-05", 233, false, "Print-ready InDesign and Canva files in three sizes with bleed.", ["Print", "Farming"]],
  ["Social Media Template Pack — Q3", "Marketing Materials", "zip", 31200, "usr_admin_whitfield", "2026-07-08", 301, true, "Story, reel-cover and carousel templates matched to the brand system.", ["Social", "Design"]],
  ["Open House Sign-In & Follow-Up Kit", "Marketing Materials", "pdf", 780, "usr_hr_bell", "2026-03-30", 259, false, "QR sign-in sheet, follow-up email sequence and a same-day call script.", ["Open House", "Lead Gen"]],
  ["Launch Bootcamp Workbook", "Training Materials", "pdf", 5400, "usr_hr_bell", "2026-08-01", 88, false, "The full 6-week new agent curriculum with weekly activity targets.", ["Onboarding", "Training"]],
  ["Co-op Board Package Masterclass", "Training Materials", "mp4", 486000, "usr_tc_reeves", "2026-05-09", 141, true, "72-minute recorded session on assembling board packages that get approved the first time.", ["Co-op", "Video"]],
  ["Objection Handling Field Guide", "Sales Resources", "pdf", 690, "usr_hr_bell", "2026-06-20", 312, false, "Twenty-two common seller and buyer objections with responses that hold up in the room.", ["Scripts", "Sales"]],
  ["Metro Market Report — August 2026", "Sales Resources", "pdf", 4100, "usr_admin_whitfield", "2026-08-06", 187, true, "Absorption, median price and days-on-market by submarket, formatted for client sharing.", ["Market Data", "Client-Ready"]],
  ["Vendor & Referral Directory", "Sales Resources", "xlsx", 320, "usr_admin_whitfield", "2026-07-22", 174, false, "Preferred inspectors, attorneys, lenders, photographers and stagers with negotiated rates.", ["Vendors", "Reference"]],
  ["1031 Exchange Primer for Agents", "Sales Resources", "pdf", 850, "usr_acct_navarro", "2026-02-28", 119, false, "Timelines, qualified intermediaries and the questions to ask before taking an exchange listing.", ["Investor", "Tax"]],
  ["E&O Insurance Certificate — 2026", "Company Documents", "pdf", 210, "usr_acct_navarro", "2026-01-02", 76, false, "Current errors and omissions certificate for lender and title requests.", ["Insurance", "Reference"]],
];

export const libraryDocs: LibraryDoc[] = rows.map((r, i) => ({
  id: `lib_${i + 1}`, title: r[0], category: r[1], fileType: r[2], sizeKb: r[3],
  uploadedById: r[4], updatedAt: r[5], downloads: r[6], favorite: r[7], description: r[8], tags: r[9],
}));

export const LIBRARY_CATEGORIES = [
  "Company Documents", "Policies", "Forms", "Templates",
  "Marketing Materials", "Training Materials", "Sales Resources",
] as const;
