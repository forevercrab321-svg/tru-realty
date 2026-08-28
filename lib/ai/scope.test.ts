import { afterEach, describe, expect, it, vi } from "vitest";
import { TOOLS, TOOL_BY_NAME, isWriteIntent } from "./tools";
import { allowTool, redactFor, scopeFor, REDACTED, type Caller } from "./policy";
import { AGENTS } from "./agents";
import { normalizeAddress, unusedFloorArea } from "@/lib/nyc/open-data";
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
const hrCaller: Caller = {
  agentId: "operator", role: "hr_ops", bookAgentId: null, userId: "usr_hr_okafor", sessionId: "t",
};
const accountingCaller: Caller = {
  agentId: "operator", role: "accounting", bookAgentId: null, userId: "usr_acct_lin", sessionId: "t",
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

/* ------------------------------------------------------ NYC PUBLIC RECORDS -- */

/**
 * The city-records tools are the first that read something outside this repo, which adds
 * two failure modes the seeded tools never had: a tier could leak a field the city
 * publishes but the brokerage should not repeat, and the city API could be down.
 *
 * These tests stub `fetch`, so they never touch the network — a test that depends on NYC
 * Open Data being up is a test that fails for reasons unrelated to this codebase.
 */

const PLUTO_ROW = {
  borough: "BK", block: "2540", lot: "14", address: "84 INDIA STREET", zipcode: "11222",
  bldgclass: "B9", landuse: "01", zonedist1: "R6B", yearbuilt: "1910", yearalter1: "2019",
  numfloors: "3.0000000", unitsres: "2", unitstotal: "2", lotarea: "2000", bldgarea: "2200",
  resarea: "2200", comarea: "0", builtfar: "1.10000000000", residfar: "2.00000000000",
  commfar: "0", assessland: "180000.00000", assesstot: "900000.00000",
  ownername: "A PRIVATE PERSON",
};

/** Route a stubbed response by dataset id, so one stub serves a whole lookup. */
function stubCity(rows: { pluto?: unknown[]; legals?: unknown[]; master?: unknown[]; parties?: unknown[] }) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const pick = url.includes("64uk-42ks") ? rows.pluto
      : url.includes("8h5j-fqxa") ? rows.legals
      : url.includes("bnx9-e6tj") ? rows.master
      : rows.parties;
    return { ok: true, status: 200, json: async () => pick ?? [] } as unknown as Response;
  }));
}

describe("NYC public records", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalises the address forms people type into the one PLUTO stores", () => {
    expect(normalizeAddress("425 W 21st St")).toEqual({ number: "425", street: "WEST 21 STREET" });
    expect(normalizeAddress("84 India Street")).toEqual({ number: "84", street: "INDIA STREET" });
    expect(normalizeAddress("1 Park Ave.")).toEqual({ number: "1", street: "PARK AVENUE" });
    expect(normalizeAddress("77 Crown Street #3R")).toEqual({ number: "77", street: "CROWN STREET" });
    expect(normalizeAddress("Greenpoint")).toBeNull();
  });

  it("computes unused floor area, and refuses to guess when a figure is missing", () => {
    expect(unusedFloorArea({ residentialFar: 2, builtFar: 1.1, lotAreaSqFt: 2000 } as never)).toBe(1800);
    expect(unusedFloorArea({ residentialFar: 1, builtFar: 4, lotAreaSqFt: 2000 } as never)).toBe(0);
    expect(unusedFloorArea({ residentialFar: null, builtFar: 1, lotAreaSqFt: 2000 } as never)).toBeNull();
  });

  it("gives a visitor the building but never the owner, the parties or the tax figures", async () => {
    stubCity({ pluto: [PLUTO_ROW], legals: [], master: [], parties: [] });
    const raw = await TOOL_BY_NAME.get("property_records")!.run(
      { address: "84 India Street" }, scopeFor(publicCaller),
    );
    const out = json(redactFor("concierge", raw));
    expect(out).toContain("84 INDIA STREET");
    expect(out).toContain("1910");
    expect(out).not.toContain("A PRIVATE PERSON");
    expect(out).not.toContain("900000");
    expect(out).not.toContain("180000");
  });

  it("gives an agent the pricing layer the visitor does not get", async () => {
    stubCity({ pluto: [PLUTO_ROW], legals: [], master: [], parties: [] });
    const raw = await TOOL_BY_NAME.get("property_records")!.run(
      { address: "84 India Street", borough: "Brooklyn" }, scopeFor(agentCaller),
    );
    const out = json(redactFor("copilot", raw));
    expect(out).toContain("assessedTotal");
    expect(out).toContain("unusedResidentialFloorAreaSqFt");
  });

  it("refuses development analysis below tier 2 and ownership below tier 3", async () => {
    stubCity({ pluto: [PLUTO_ROW] });
    const dev = await TOOL_BY_NAME.get("development_potential")!.run(
      { address: "84 India Street" }, scopeFor(publicCaller),
    ) as { refused?: boolean };
    expect(dev.refused).toBe(true);

    const own = await TOOL_BY_NAME.get("ownership_record")!.run(
      { address: "84 India Street" }, scopeFor(agentCaller),
    ) as { refused?: boolean };
    expect(own.refused).toBe(true);
  });

  it("never offers the ownership tool to tiers 1 or 2 in the first place", () => {
    expect(AGENTS.concierge.tools).not.toContain("ownership_record");
    expect(AGENTS.copilot.tools).not.toContain("ownership_record");
    expect(AGENTS.concierge.tools).not.toContain("development_potential");
    expect(AGENTS.operator.tools).toContain("ownership_record");
  });

  it("narrows tier 3 by role as well as by tier", () => {
    // A coordinator verifying the seller of record on a file is doing their job.
    expect(allowTool(coordinatorCaller, "ownership_record").allowed).toBe(true);
    expect(allowTool(brokerCaller, "ownership_record").allowed).toBe(true);
    // HR holds neither clients.view nor listings.view, so none of these open for them —
    // the tier is not the whole gate.
    expect(allowTool(hrCaller, "ownership_record").allowed).toBe(false);
    expect(allowTool(hrCaller, "property_records").allowed).toBe(false);
    expect(allowTool(hrCaller, "development_potential").allowed).toBe(false);
    // Accounting can release money but has no business pulling ownership records.
    expect(allowTool(accountingCaller, "ownership_record").allowed).toBe(false);
  });

  it("degrades rather than throws when the city API is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    const out = await TOOL_BY_NAME.get("property_records")!.run(
      { address: "500 Nowhere Boulevard" }, scopeFor(publicCaller),
    ) as { available?: boolean; note?: string };
    expect(out.available).toBe(false);
    expect(String(out.note)).toMatch(/unreachable|did not answer/i);
  });

  it("says so plainly when nothing matches, rather than returning an empty shell", async () => {
    stubCity({ pluto: [] });
    const out = await TOOL_BY_NAME.get("property_records")!.run(
      { address: "9999 Imaginary Street" }, scopeFor(publicCaller),
    ) as { found?: boolean };
    expect(out.found).toBe(false);
  });
});
