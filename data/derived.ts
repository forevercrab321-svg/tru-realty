import { transactions } from "./transactions";
import { listings } from "./listings";

/**
 * Live activity counts derived from the transaction and listing tables.
 *
 * `Agent.stats` holds ledger figures for the full year (including history that
 * predates the seeded transaction set), so anything describing *right now* —
 * open files, live listings — is computed here instead of being stored.
 */
export function agentActivity(agentId: string) {
  const open = transactions.filter(
    (t) => (t.agentId === agentId || t.coAgentId === agentId) && !["closed", "cancelled"].includes(t.stage)
  );
  const live = listings.filter(
    (l) => l.listingAgentId === agentId && ["active", "coming_soon", "under_contract", "pending"].includes(l.status)
  );
  return {
    activeDeals: open.length,
    activeListings: live.length,
    pipelineValue: open.reduce((s, t) => s + (t.salePrice || t.listPrice), 0),
  };
}
