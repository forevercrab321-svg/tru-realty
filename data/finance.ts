import type { AgentCharge, Payout, TaxRecord } from "@/types";
import { agents } from "./agents";
import { transactions } from "./transactions";

const CHARGE_TYPES: [AgentCharge["category"], string, number][] = [
  ["E&O", "Errors & Omissions — per transaction", 55],
  ["Technology", "Platform & CRM fee — monthly", 89],
  ["Marketing", "Just Listed postcard run", 340],
  ["Desk Fee", "Flatiron desk — monthly", 250],
  ["MLS", "REBNY RLS quarterly dues", 195],
  ["Training", "Launch Bootcamp materials", 120],
  ["Marketing", "Professional photography — 3 listings", 890],
  ["Technology", "E-signature seat — annual", 240],
];

export const agentCharges: AgentCharge[] = agents.flatMap((a, ai) =>
  CHARGE_TYPES.filter((_, ci) => (ai + ci) % 3 !== 0).map((c, ci) => {
    const roll = (ai * 3 + ci) % 9;
    return {
      id: `ch_${a.id}_${ci}`, agentId: a.id, description: c[1], category: c[0], amount: c[2],
      date: `2026-0${(ci % 8) + 1}-${String(((ai * 5 + ci * 3) % 27) + 1).padStart(2, "0")}`,
      status: roll < 5 ? "paid" : roll < 7 ? "billed" : roll === 7 ? "past_due" : "waived",
    } as AgentCharge;
  })
);

const closed = transactions.filter((t) => t.stage === "closed");

export const payouts: Payout[] = closed.map((t, i) => ({
  id: `po_${t.id}`, agentId: t.agentId, transactionId: t.id,
  period: t.closingDate.slice(0, 7),
  grossCommission: t.commission.sideCommission,
  deductions: t.commission.brokerageSplit + t.commission.transactionFee + t.commission.companyFee + t.commission.teamSplit + t.commission.referralFee,
  netPayout: t.commission.netAgent,
  method: (["ACH", "ACH", "Wire", "Check"] as const)[i % 4],
  status: (["paid", "paid", "approved", "pending"] as const)[i % 4],
  issuedAt: i % 4 < 2 ? t.closingDate : null,
  reference: `DISB-${t.ref.split("-")[2]}`,
}));

/**
 * One deliberately unbalanced payout, so the assistants' `verify` class has a real defect
 * to find on seeded data. It is planted here, in the open, rather than left as a bug in
 * the arithmetic above — a demo that depends on a genuine defect stops working the moment
 * someone fixes it, and nobody can tell the two apart.
 *
 * Delete this the moment real payout data arrives.
 */
export const PLANTED_VARIANCE = { reference: "DISB-1046", amount: 3836 };

/** Pending disbursements for deals that have reached closing but not funded. */
export const pendingPayouts: Payout[] = transactions
  .filter((t) => t.stage === "closing" || t.stage === "final_walkthrough")
  .map((t) => ({
    id: `po_p_${t.id}`, agentId: t.agentId, transactionId: t.id, period: t.closingDate.slice(0, 7),
    grossCommission: t.commission.sideCommission,
    // This branch used to omit teamSplit and referralFee, which the closed branch above
    // includes — so gross minus deductions did not equal the net on the same row, visibly,
    // on the payouts screen. The seed deliberately keeps one row that does not reconcile
    // (see PLANTED_VARIANCE below) so the verify tools have something real to catch; that
    // is demo data, not arithmetic that disagrees with itself.
    deductions:
      t.commission.brokerageSplit + t.commission.transactionFee + t.commission.companyFee +
      t.commission.teamSplit + t.commission.referralFee,
    netPayout: t.commission.netAgent, method: "ACH" as const, status: "pending" as const, issuedAt: null,
    reference: `DISB-${t.ref.split("-")[2]}`,
  }))
  .map((p) => (p.reference === PLANTED_VARIANCE.reference
    ? { ...p, netPayout: p.netPayout - PLANTED_VARIANCE.amount }
    : p));

export const allPayouts = [...payouts, ...pendingPayouts];

export const taxRecords: TaxRecord[] = agents.map((a, i) => {
  const mine = allPayouts.filter((p) => p.agentId === a.id);
  const ytdCommission = mine.reduce((s, p) => s + p.grossCommission, 0);
  const ytdPaid = mine.filter((p) => p.status === "paid").reduce((s, p) => s + p.netPayout, 0);
  const pending = mine.filter((p) => p.status !== "paid").reduce((s, p) => s + p.netPayout, 0);
  return {
    agentId: a.id, year: 2026, ytdCommission, ytdPaid, pending,
    form1099Status: a.status === "onboarding" ? "not_started" : i % 5 === 0 ? "in_review" : "issued",
    tin: `**-***${(1000 + i * 7).toString().slice(-4)}`,
    entityName: i % 3 === 0 ? `${a.lastName} Realty LLC` : a.name,
  };
});

export const payoutsByAgent = (agentId: string) => allPayouts.filter((p) => p.agentId === agentId);
export const chargesByAgent = (agentId: string) => agentCharges.filter((c) => c.agentId === agentId);
export const taxForAgent = (agentId: string) => taxRecords.find((t) => t.agentId === agentId);
