import type { CommissionBreakdown } from "@/types";
import { agentById, teamById } from "@/data/agents";

/**
 * Single source of truth for how a deal turns into money.
 * Order of operations mirrors a standard US brokerage disbursement authorization:
 *   gross → side → referral out → company dollar (split + fees) → agent net
 */
export function computeCommission(input: {
  salePrice: number;
  grossCommissionPct: number;   // total commission on the deal
  sidePct?: number;             // portion of gross belonging to our side (0.5 typical, 1 if dual)
  agentId: string;
  referralFeePct?: number;
  extraCompanyFee?: number;
}): CommissionBreakdown {
  const agent = agentById(input.agentId);
  const plan = agent?.plan;
  const sidePct = input.sidePct ?? 0.5;

  const grossCommission = Math.round(input.salePrice * (input.grossCommissionPct / 100));
  const sideCommission = Math.round(grossCommission * sidePct);

  const referralFeePct = input.referralFeePct ?? 0;
  const referralFee = Math.round(sideCommission * (referralFeePct / 100));
  const afterReferral = sideCommission - referralFee;

  const agentSplitPct = plan?.agentSplit ?? 70;
  // NOTE: `capYtd` is read here and written nowhere in the product — no code path
  // accumulates company dollar into it. So every deal is clamped against the same static
  // remainder, and an agent with $2,700 left can be charged $2,700 on each of three deals.
  // Correcting that needs a ledger, which needs persistence; it is tracked as the reason
  // persistence is the next piece of work. This function is right for one deal in
  // isolation and cannot be right across a year until something writes this field.
  const remainingCap = Math.max(0, (plan?.cap ?? 0) - (plan?.capYtd ?? 0));
  const rawBrokerageSplit = Math.round(afterReferral * ((100 - agentSplitPct) / 100));
  // `Math.min(raw, remainingCap || raw)` did the opposite of its purpose at the one point
  // that matters: when an agent has capped, remainingCap is 0, `0 || raw` is `raw`, and the
  // clamp let the full company dollar through. Three seeded agents were charged past their
  // cap on payouts already marked paid, while the screen beside the figure said "you have
  // capped — every closing from here keeps 100% of company dollar".
  const brokerageSplit = Math.min(rawBrokerageSplit, remainingCap);

  const team = teamById(agent?.teamId ?? null);
  const isLead = team?.leadAgentId === input.agentId;
  const teamSplit = team && !isLead ? Math.round((afterReferral - brokerageSplit) * (team.splitToTeam / 100)) : 0;

  const transactionFee = plan?.transactionFee ?? 295;
  const companyFee = input.extraCompanyFee ?? 0;

  const netAgent = afterReferral - brokerageSplit - teamSplit - transactionFee - companyFee;
  const netBrokerage = brokerageSplit + transactionFee + companyFee;

  return {
    salePrice: input.salePrice,
    grossCommissionPct: input.grossCommissionPct,
    grossCommission,
    sideCommission,
    referralFeePct,
    referralFee,
    brokerageSplitPct: 100 - agentSplitPct,
    brokerageSplit,
    agentSplit: afterReferral - brokerageSplit,
    teamSplit,
    companyFee,
    transactionFee,
    netAgent,
    netBrokerage,
  };
}
