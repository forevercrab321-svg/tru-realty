import { describe, expect, it } from "vitest";
import { TOOLS, TOOL_BY_NAME, isWriteIntent } from "./tools";
import { allowTool, redactFor, scopeFor, REDACTED, type Caller } from "./policy";
import { AGENTS } from "./agents";
import { agents, clients, transactions } from "@/data";

/**
 * These are the tests that matter. Everything else in this product can be checked by
 * looking at it; a permission boundary cannot — a leak looks exactly like a correct
 * answer until someone reads the transcript.
 *
 * The shape of every test here is the same: build a caller, run a tool, and assert that
 * nothing came back that the caller was not entitled to. They are deliberately written
 * against the *output*, not the implementation, so a refactor that reintroduces a leak
 * still fails.
 */

const SOPHIA = "ag_schen";
const other = agents.find((a) => a.id !== SOPHIA)!;

const publicCaller: Caller = {
  agentId: "concierge", role: null, bookAgentId: null, userId: null, sessionId: "t",
};
const agentCaller: Caller = {
  agentId: "copilot", role: "agent", bookAgentId: SOPHIA, userId: "usr_ag_schen", sessionId: "t",
};
const coordinatorCaller: Caller = {
  agentId: "operator", role: "transaction_coordinator", bookAgentId: null, userId: "usr_tc_reeves", sessionId: "t",
};
const brokerCaller: Caller = {
  agentId: "operator", role: "super_admin", bookAgentId: null, userId: "usr_admin_whitfield", sessionId: "t",
};

const json = (v: unknown) => JSON.stringify(v);

/* ---------------------------------------------------------------- TIER 1 -- */

describe("tier 1 — the public concierge", () => {
  it("offers no tool that reads a transaction or a client", () => {
    const offered = AGENTS.concierge.tools;
    for (const forbidden of ["get_transaction", "get_client", "my_book", "file_health", "commission_breakdown"]) {
      expect(offered).not.toContain(forbidden);
    }
  });

  it("refuses a tool the model invents", () => {
    const d = allowTool(publicCaller, "get_transaction");
    expect(d.allowed).toBe(false);
  });

  it("returns no unpublished listing", () => {
    const out = TOOL_BY_NAME.get("search_listings")!.run({ limit: 100 }, scopeFor(publicCaller)) as {
      results: { status: string }[];
    };
    expect(out.results.length).toBeGreaterThan(0);
    for (const r of out.results) {
      expect(["sold", "withdrawn", "expired"]).not.toContain(r.status);
    }
  });

  it("never returns an agent's economics, even through a profile", () => {
    const raw = TOOL_BY_NAME.get("get_agent_profile")!.run({ id: SOPHIA }, scopeFor(publicCaller));
    const safe = json(redactFor("concierge", raw));
    for (const leak of ["capYtd", "agentSplit", "transactionFee", "ytdGci"]) {
      expect(safe).not.toContain(leak);
    }
  });

  it("never returns a project's co-broke or bonus to a buyer", () => {
    const out = TOOL_BY_NAME.get("list_projects")!.run({}, scopeFor(publicCaller)) as {
      projects: Record<string, unknown>[];
    };
    for (const p of out.projects) {
      expect(p).not.toHaveProperty("coBrokePct");
      expect(p).not.toHaveProperty("bonus");
    }
  });
});

/* ---------------------------------------------------------------- TIER 2 -- */

describe("tier 2 — the agent copilot", () => {
  it("returns only the signed-in agent's own rows", () => {
    const scope = scopeFor(agentCaller);
    const book = TOOL_BY_NAME.get("my_book")!.run({}, scope) as {
      openDeals: { id: string }[];
      clientsNeedingFollowUp: { id: string }[];
    };
    for (const d of book.openDeals) {
      const t = transactions.find((x) => x.id === d.id)!;
      expect([t.agentId, t.coAgentId]).toContain(SOPHIA);
    }
    for (const c of book.clientsNeedingFollowUp) {
      expect(clients.find((x) => x.id === c.id)!.agentId).toBe(SOPHIA);
    }
  });

  it("refuses another agent's client by id", () => {
    const foreign = clients.find((c) => c.agentId !== SOPHIA)!;
    const out = TOOL_BY_NAME.get("get_client")!.run({ id: foreign.id }, scopeFor(agentCaller)) as { found: boolean };
    expect(out.found).toBe(false);
  });

  it("refuses another agent's transaction by ref", () => {
    const foreign = transactions.find((t) => t.agentId !== SOPHIA && t.coAgentId !== SOPHIA)!;
    const out = TOOL_BY_NAME.get("get_transaction")!.run({ id: foreign.ref }, scopeFor(agentCaller)) as { found: boolean };
    expect(out.found).toBe(false);
  });

  it("refuses another agent's profile", () => {
    const out = TOOL_BY_NAME.get("get_agent_profile")!.run({ id: other.id }, scopeFor(agentCaller)) as { found: boolean };
    expect(out.found).toBe(false);
  });

  it("will not write into a book that is not the caller's", () => {
    const foreign = clients.find((c) => c.agentId !== SOPHIA)!;
    const out = TOOL_BY_NAME.get("log_activity")!.run(
      { clientId: foreign.id, kind: "call", body: "x" }, scopeFor(agentCaller),
    ) as { refused?: boolean };
    expect(out.refused).toBe(true);
  });

  it("fails closed when the session carries no agent id", () => {
    const broken: Caller = { ...agentCaller, bookAgentId: null };
    expect(allowTool(broken, "my_book").allowed).toBe(false);
    // Even if the gate were bypassed, the scope must match nothing rather than everything.
    const out = TOOL_BY_NAME.get("my_book")!.run({}, scopeFor(broken)) as { openDeals: unknown[] };
    expect(out.openDeals).toHaveLength(0);
  });

  it("marks every write tool as requiring confirmation", () => {
    const writes = TOOLS.filter((t) => t.kind === "operate" && AGENTS.copilot.tools.includes(t.name));
    // draft_message is the one write that changes nothing — it returns text, so it needs no gate.
    const needing = writes.filter((t) => t.name !== "draft_message").map((t) => t.name);
    for (const name of needing) {
      expect(AGENTS.copilot.confirmBeforeRun).toContain(name);
    }
  });
});

/* ---------------------------------------------------------------- TIER 3 -- */

describe("tier 3 — the operator, bounded by role", () => {
  it("refuses a payout reconciliation to a transaction coordinator", () => {
    const d = allowTool(coordinatorCaller, "reconcile_payout_run");
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toContain("payouts.view");
  });

  it("refuses the recruiting pipeline to accounting", () => {
    const accounting: Caller = { ...coordinatorCaller, role: "accounting" };
    expect(allowTool(accounting, "recruiting_pipeline").allowed).toBe(false);
  });

  it("refuses commission detail to HR", () => {
    const hr: Caller = { ...coordinatorCaller, role: "hr_ops" };
    expect(allowTool(hr, "commission_breakdown").allowed).toBe(false);
  });

  it("allows the principal broker everything on the tier's list", () => {
    for (const tool of AGENTS.operator.tools) {
      expect(allowTool(brokerCaller, tool).allowed).toBe(true);
    }
  });

  it("still strips TINs from a broker's results", () => {
    const safe = json(redactFor("operator", { agent: { name: "X", tin: "**-***1000" } }));
    expect(safe).toContain(REDACTED);
    expect(safe).not.toContain("1000");
  });
});

/* -------------------------------------------------------------- INVARIANTS */

describe("invariants that must hold for every tool", () => {
  it("every tool named by an assistant actually exists", () => {
    for (const def of Object.values(AGENTS)) {
      for (const name of def.tools) {
        expect(TOOL_BY_NAME.has(name), `${def.id} lists an unknown tool: ${name}`).toBe(true);
      }
    }
  });

  it("no operate tool mutates — they all return an intent or a refusal", () => {
    const before = json({ clients, transactions });
    const scope = scopeFor(agentCaller);
    const mine = clients.find((c) => c.agentId === SOPHIA)!;
    for (const tool of TOOLS.filter((t) => t.kind === "operate")) {
      const out = tool.run(
        { clientId: mine.id, id: mine.id, transactionId: "tx_1041", taskId: "tk_1", target: "client",
          kind: "call", body: "test", name: "Test", type: "buyer", email: "t@e.com",
          listingId: "ls_1", preferredDate: "2026-09-01", stage: "closed", to: "x",
          purpose: "y", draft: "z", reason: "r", intent: "buy", date: "2026-09-01" },
        scope,
      );
      const ok = isWriteIntent(out) || (typeof out === "object" && out !== null);
      expect(ok, `${tool.name} returned something unexpected`).toBe(true);
    }
    expect(json({ clients, transactions })).toBe(before);
  });

  it("redaction replaces rather than deletes, so the model can say it was blocked", () => {
    const out = redactFor("concierge", { name: "A", plan: { cap: 1 }, nested: [{ tin: "x" }] }) as Record<string, unknown>;
    expect(out.plan).toBe(REDACTED);
    expect(out.name).toBe("A");
    expect(json(out.nested)).toContain(REDACTED);
  });
});
