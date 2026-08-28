import type { DemoAccount } from "./session";

/**
 * Whether the signed-in account may open one specific record.
 *
 * The route guard in `lib/nav.ts` answers "may this role open this *kind* of page". It
 * cannot answer "may this person open *this* record", and until now nothing did: the
 * agent portal's list pages filtered to the signed-in agent's book, while the detail
 * pages behind them were rendered from the whole table. Every client, deal and listing in
 * the brokerage was one URL away from every agent — including, through the transaction
 * detail's commission panel, a colleague's plan, cap and net payout. Agent-reads-
 * colleague's-compensation is the classic brokerage HR incident, and the nav never showed
 * a link you could not have, which is exactly why it was easy to miss.
 *
 * Back office is deliberately unrestricted here: a coordinator or an admin is supposed to
 * see any file. Their bound is the route guard and the permission registry, not ownership.
 *
 * Like the route guard, this is a client-side check on a static export and is NOT a
 * security boundary — it is the correct behaviour, and the specification the server-side
 * checks in Phase 3 will implement.
 */
export function ownsRecord(
  account: Pick<DemoAccount, "portal" | "agentId"> | null,
  /** Which portal the page is being rendered in — "/admin" or "/agent". */
  base: string,
  /** The agent(s) the record belongs to. A co-agent counts as an owner. */
  owners: (string | null | undefined)[],
): boolean {
  if (base !== "/agent") return true;
  // A signed-in agent with no agentId is a broken session, not an unrestricted one.
  if (!account?.agentId) return false;
  return owners.some((o) => o === account.agentId);
}
