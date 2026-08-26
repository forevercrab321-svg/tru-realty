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
  const remainingCap = Math.max(0, (plan?.cap ?? 0) - (plan?.capYtd ?? 0));
  const rawBrokerageSplit = Math.round(afterReferral * ((100 - agentSplitPct) / 100));
  const brokerageSplit = Math.min(rawBrokerageSplit, remainingCap || rawBrokerageSplit);

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
