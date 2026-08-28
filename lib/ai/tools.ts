import type { Scope } from "./policy";
import {
  agents, agentById, clients, transactions, listings, projects, offices,
  events as brokerageEvents, libraryDocs, allPayouts, recruits, onboarding,
  companyKpis, officeComparison, announcements,
} from "@/data";
import { neighborhoods } from "@/data/neighborhoods";
import { computeCommission } from "@/lib/commission";
import { agentActivity } from "@/data/derived";
import { TODAY } from "@/lib/format";
import type { TransactionTask } from "@/types";

/** The demo clock as YYYY-MM-DD, so it compares against ISODate fields directly. */
const NOW = TODAY.toISOString().slice(0, 10);
const isDone = (k: TransactionTask) => k.status === "done";

/**
 * The tool registry.
 *
 * Two rules govern this file, and they are what make the tier system real rather than
 * decorative:
 *
 * 1. EVERY EXECUTOR TAKES A SCOPE AND NARROWS BY IT. Not "should narrow" — the scope is a
 *    required argument and the first thing each executor does. A tool that forgot would be a
 *    permission hole, so there is a test (`scope.test.ts`) that calls every read tool with a
 *    tier-2 scope and asserts nothing comes back that belongs to another agent.
 *
 * 2. NO EXECUTOR WRITES. A write tool returns a typed *intent*; the application applies it
 *    through the same store action a button calls. That means the assistant can never have a
 *    capability the UI does not have, every AI-driven change inherits the app's own validation
 *    and audit trail, and a compromised gateway still cannot mutate anything on its own.
 */

export type JsonSchema = {
  type: "object";
  properties: Record<string, { type: string; description: string; enum?: string[] }>;
  required?: string[];
};

export interface ToolDef {
  name: string;
  /** What the model is told the tool does. Write these for the model, not for a developer. */
  description: string;
  parameters: JsonSchema;
  /** respond = read, verify = read + check, operate = returns a write intent. */
  kind: "respond" | "verify" | "operate";
  run: (args: Record<string, unknown>, scope: Scope) => unknown;
}

/** What an `operate` tool returns. The app applies it; the gateway never does. */
export interface WriteIntent {
  __intent: true;
  action: string;
  target: Record<string, unknown>;
  summary: string;
  actorId: string | null;
}

const intent = (action: string, target: Record<string, unknown>, summary: string, scope: Scope): WriteIntent =>
  ({ __intent: true, action, target, summary, actorId: scope.actorId });

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : Number(v) || fallback);

/* ------------------------------------------------------------ ROW SCOPING */

const PUBLIC_LISTING_STATUSES = ["active", "coming_soon", "under_contract", "pending"];

/** Listings a caller may see at all, before any filter the model asked for. */
function visibleListings(scope: Scope) {
  if (scope.tier === 1) return listings.filter((l) => PUBLIC_LISTING_STATUSES.includes(l.status));
  if (scope.tier === 2) return listings.filter((l) => l.listingAgentId === scope.ownBookOf);
  return listings;
}

function visibleTransactions(scope: Scope) {
  if (scope.tier === 1) return [];
  if (scope.tier === 2) {
    return transactions.filter((t) => t.agentId === scope.ownBookOf || t.coAgentId === scope.ownBookOf);
  }
  return transactions;
}

function visibleClients(scope: Scope) {
  if (scope.tier === 1) return [];
  if (scope.tier === 2) return clients.filter((c) => c.agentId === scope.ownBookOf);
  return clients;
}

/** Only ever the caller's own agent record below tier 3. */
function visibleAgents(scope: Scope) {
  if (scope.tier === 2) return agents.filter((a) => a.id === scope.ownBookOf);
  return agents;
}

/* -------------------------------------------------------------- PROJECTIONS */

/** A listing as the public site already shows it. Nothing here is a secret. */
const publicListing = (l: (typeof listings)[number]) => ({
  id: l.id, address: l.address, unit: l.unit ?? null, city: l.city, neighborhood: l.neighborhood,
  price: l.price, beds: l.beds, baths: l.baths, sqft: l.sqft, propertyType: l.propertyType,
  status: l.status, daysOnMarket: l.daysOnMarket, monthlyCharges: l.hoa,
  annualTaxes: l.taxes, yearBuilt: l.yearBuilt, features: l.features, description: l.description,
});

const publicAgent = (a: (typeof agents)[number]) => ({
  id: a.id, name: a.name, title: a.title, office: offices.find((o) => o.id === a.officeId)?.name ?? null,
  neighborhoods: a.neighborhoods, languages: a.languages, specialties: a.specialties,
  bio: a.bio, licenseState: a.license.state, licenseNumber: a.license.number,
  yearsExperience: a.license.issued ? TODAY.getFullYear() - new Date(a.license.issued).getFullYear() : null,
});

/* -------------------------------------------------------------- REGISTRY */

export const TOOLS: ToolDef[] = [

  /* ---------------------------------------------------------- respond -- */

  {
    name: "search_listings",
    kind: "respond",
    description:
      "Search available homes. Use for any question about what is for sale, in what neighborhood, at what price. Returns only what the caller is allowed to see.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free text — neighborhood, city, street or ZIP." },
        minPrice: { type: "number", description: "Minimum price in dollars." },
        maxPrice: { type: "number", description: "Maximum price in dollars." },
        beds: { type: "number", description: "Minimum bedrooms." },
        propertyType: { type: "string", description: "Condo, Co-op, Townhouse, Single Family, Multi-Family." },
        limit: { type: "number", description: "Max results, default 8." },
      },
    },
    run: (a, scope) => {
      const q = str(a.query).toLowerCase();
      const rows = visibleListings(scope).filter((l) => {
        if (q && ![l.address, l.city, l.neighborhood, l.zip].join(" ").toLowerCase().includes(q)) return false;
        if (a.minPrice != null && l.price < num(a.minPrice)) return false;
        if (a.maxPrice != null && l.price > num(a.maxPrice)) return false;
        if (a.beds != null && l.beds < num(a.beds)) return false;
        if (a.propertyType && l.propertyType !== str(a.propertyType)) return false;
        return true;
      });
      return {
        matched: rows.length,
        results: rows.slice(0, num(a.limit, 8)).map(publicListing),
        note: rows.length === 0 ? "No inventory matches. Do not invent alternatives — offer to have an agent check off-market." : undefined,
      };
    },
  },

  {
    name: "get_listing",
    kind: "respond",
    description: "Full detail on one home by id. Call this before quoting any figure about a specific property.",
    parameters: { type: "object", properties: { id: { type: "string", description: "Listing id, e.g. ls_3." } }, required: ["id"] },
    run: (a, scope) => {
      const l = visibleListings(scope).find((x) => x.id === str(a.id));
      if (!l) return { found: false, reason: "Not visible to this assistant, or does not exist." };
      const agent = agentById(l.listingAgentId);
      return {
        found: true,
        ...publicListing(l),
        openHouses: l.openHouses,
        listingAgent: agent ? { id: agent.id, name: agent.name, neighborhoods: agent.neighborhoods } : null,
        ...(scope.tier > 1 ? { mlsId: l.mlsId, listedOn: l.listedOn, showings: l.showings, offers: l.offers, views: l.views } : {}),
      };
    },
  },

  {
    name: "list_agents",
    kind: "respond",
    description: "Find agents by neighborhood, language or specialty. Use when a visitor asks who covers an area or who speaks a language.",
    parameters: {
      type: "object",
      properties: {
        neighborhood: { type: "string", description: "Neighborhood name." },
        language: { type: "string", description: "Language, e.g. Mandarin." },
        specialty: { type: "string", description: "e.g. New Development, First-Time Buyers." },
      },
    },
    run: (a, scope) => {
      const rows = visibleAgents(scope).filter((ag) => {
        if (scope.tier === 1 && ag.status !== "active") return false;
        if (a.neighborhood && !ag.neighborhoods.some((n) => n.toLowerCase().includes(str(a.neighborhood).toLowerCase()))) return false;
        if (a.language && !ag.languages.some((l) => l.toLowerCase() === str(a.language).toLowerCase())) return false;
        if (a.specialty && !ag.specialties.some((s) => s.toLowerCase().includes(str(a.specialty).toLowerCase()))) return false;
        return true;
      });
      return { matched: rows.length, results: rows.slice(0, 8).map(publicAgent) };
    },
  },

  {
    name: "get_agent_profile",
    kind: "respond",
    description: "One agent's public profile — coverage, languages, specialties, licence. Never returns their compensation.",
    parameters: { type: "object", properties: { id: { type: "string", description: "Agent id." } }, required: ["id"] },
    run: (a, scope) => {
      const ag = visibleAgents(scope).find((x) => x.id === str(a.id));
      return ag ? { found: true, ...publicAgent(ag) } : { found: false };
    },
  },

  {
    name: "neighborhood_guide",
    kind: "respond",
    description: "What Tru covers in a given area: inventory count, price range, and how many of our agents work it.",
    parameters: { type: "object", properties: { name: { type: "string", description: "Neighborhood or borough." } } },
    run: (a) => {
      const q = str(a.name).toLowerCase();
      const rows = q ? neighborhoods.filter((n) => `${n.name} ${n.borough}`.toLowerCase().includes(q)) : neighborhoods;
      return { results: rows.map((n) => ({
        name: n.name, borough: n.borough, blurb: n.blurb,
        available: n.listingCount, priceFrom: n.priceFrom, priceTo: n.priceTo, specialists: n.agentCount,
      })) };
    },
  },

  {
    name: "list_offices",
    kind: "respond",
    description: "Tru Realty office locations, addresses and phone numbers.",
    parameters: { type: "object", properties: {} },
    run: () => ({ offices: offices.map((o) => ({ name: o.name, address: `${o.street}, ${o.city}, ${o.state} ${o.zip}`, phone: o.phone, managingBroker: o.managingBroker })) }),
  },

  {
    name: "list_projects",
    kind: "respond",
    description: "New-development projects Tru represents. Public marketing detail only.",
    parameters: { type: "object", properties: {} },
    run: (_a, scope) => ({
      projects: projects.map((p) => ({
        id: p.id, name: p.name, neighborhood: p.neighborhood, developer: p.developer,
        status: p.status, priceFrom: p.priceMin, priceTo: p.priceMax, totalUnits: p.totalUnits,
        available: p.availableUnits, completion: p.completion, amenities: p.amenities,
        // Co-broke and bonus are what the agent is paid. A buyer never sees it.
        ...(scope.tier > 1 ? { coBrokePct: p.commissionPct, bonus: p.bonus } : {}),
      })),
    }),
  },

  {
    name: "my_book",
    kind: "respond",
    description: "The signed-in agent's own book: open deals, clients needing follow-up, live listings, and this month's closings.",
    parameters: { type: "object", properties: {} },
    run: (_a, scope) => {
      const tx = visibleTransactions(scope);
      const cl = visibleClients(scope);
      const act = scope.ownBookOf ? agentActivity(scope.ownBookOf) : null;
      return {
        openDeals: tx.filter((t) => !["closed", "cancelled"].includes(t.stage))
          .map((t) => ({ id: t.id, ref: t.ref, address: t.address, stage: t.stage, closingDate: t.closingDate, salePrice: t.salePrice || t.listPrice })),
        clientsNeedingFollowUp: cl.filter((c) => c.nextFollowUp && c.nextFollowUp <= NOW)
          .map((c) => ({ id: c.id, name: c.name, status: c.status, nextFollowUp: c.nextFollowUp })),
        liveListings: visibleListings(scope).filter((l) => PUBLIC_LISTING_STATUSES.includes(l.status))
          .map((l) => ({ id: l.id, address: l.address, status: l.status, price: l.price, daysOnMarket: l.daysOnMarket })),
        activity: act,
      };
    },
  },

  {
    name: "get_transaction",
    kind: "respond",
    description: "One deal in full — stage, dates, parties, tasks, documents and risk flags.",
    parameters: { type: "object", properties: { id: { type: "string", description: "Transaction id or ref." } }, required: ["id"] },
    run: (a, scope) => {
      const key = str(a.id);
      const t = visibleTransactions(scope).find((x) => x.id === key || x.ref === key);
      if (!t) return { found: false, reason: "Not in scope for this assistant, or does not exist." };
      return {
        found: true,
        id: t.id, ref: t.ref, address: t.address, unit: t.unit ?? null, city: t.city,
        side: t.side, stage: t.stage, listPrice: t.listPrice, salePrice: t.salePrice,
        contractDate: t.contractDate, closingDate: t.closingDate,
        counterparty: t.counterparty, counterpartyBrokerage: t.counterpartyBrokerage,
        lender: t.lender, titleCompany: t.titleCompany, escrow: t.escrow,
        tasks: t.tasks.map((k) => ({ id: k.id, title: k.title, status: k.status, dueDate: k.dueDate, priority: k.priority, category: k.category })),
        documents: t.documents.map((d) => ({ id: d.id, name: d.name, category: d.category, required: d.required, status: d.status, uploadedAt: d.uploadedAt })),
        riskFlags: t.riskFlags, complianceComplete: t.complianceComplete,
      };
    },
  },

  {
    name: "get_client",
    kind: "respond",
    description: "One client record — type, status, budget, areas, last contact and notes.",
    parameters: { type: "object", properties: { id: { type: "string", description: "Client id or name." } }, required: ["id"] },
    run: (a, scope) => {
      const key = str(a.id).toLowerCase();
      const c = visibleClients(scope).find((x) => x.id === key || x.name.toLowerCase().includes(key));
      if (!c) return { found: false, reason: "Not in scope for this assistant, or does not exist." };
      return {
        found: true, id: c.id, name: c.name, type: c.type, status: c.status,
        budgetMin: c.budgetMin, budgetMax: c.budgetMax, areas: c.areas, beds: c.beds,
        propertyType: c.propertyType, lastContact: c.lastContact, nextFollowUp: c.nextFollowUp,
        preApproved: c.preApproved ?? null, lender: c.lender ?? null,
        notes: c.notes.slice(-5).map((n) => ({ at: n.createdAt, body: n.body })),
      };
    },
  },

  {
    name: "library_search",
    kind: "respond",
    description: "Search brokerage documents, forms, templates and policies.",
    parameters: { type: "object", properties: { query: { type: "string", description: "What they are looking for." } } },
    run: (a) => {
      const q = str(a.query).toLowerCase();
      const rows = libraryDocs.filter((d) => `${d.title} ${d.category} ${d.description ?? ""}`.toLowerCase().includes(q));
      return { matched: rows.length, results: rows.slice(0, 8).map((d) => ({ id: d.id, title: d.title, category: d.category, updatedAt: d.updatedAt })) };
    },
  },

  {
    name: "list_events",
    kind: "respond",
    description: "Upcoming brokerage events — training, broker meetings, open-house tours.",
    parameters: { type: "object", properties: {} },
    run: () => ({ events: brokerageEvents.filter((e) => e.date >= NOW).slice(0, 10)
      .map((e) => ({ id: e.id, name: e.name, type: e.type, date: e.date, start: e.start, end: e.end,
        location: e.location, capacity: e.capacity, registered: e.registered, ceCredits: e.ceCredits })) }),
  },

  {
    name: "my_plan",
    kind: "respond",
    description: "The signed-in agent's own commission plan: split, cap, cap used, transaction fee.",
    parameters: { type: "object", properties: {} },
    run: (_a, scope) => {
      const ag = scope.ownBookOf ? agentById(scope.ownBookOf) : null;
      if (!ag) return { found: false };
      return { found: true, plan: ag.plan.name, agentSplit: ag.plan.agentSplit, cap: ag.plan.cap,
        capUsed: ag.plan.capYtd, capRemaining: Math.max(0, ag.plan.cap - ag.plan.capYtd), transactionFee: ag.plan.transactionFee };
    },
  },

  /* ----------------------------------------------------------- verify -- */

  {
    name: "file_health",
    kind: "verify",
    description:
      "Check whether a deal will actually close cleanly: required documents outstanding, tasks past due, days to closing, and every risk flag. Run this before any closing conversation.",
    parameters: { type: "object", properties: { id: { type: "string", description: "Transaction id or ref." } }, required: ["id"] },
    run: (a, scope) => {
      const key = str(a.id);
      const t = visibleTransactions(scope).find((x) => x.id === key || x.ref === key);
      if (!t) return { found: false };
      const missingDocs = t.documents.filter((d) => d.required && d.status === "pending").map((d) => d.name);
      const overdue = t.tasks.filter((k) => !isDone(k) && k.dueDate < NOW);
      const open = t.tasks.filter((k) => !isDone(k));
      const days = Math.round((new Date(t.closingDate).getTime() - TODAY.getTime()) / 86400000);
      return {
        found: true, ref: t.ref, address: t.address, stage: t.stage, daysToClosing: days,
        requiredDocumentsOutstanding: missingDocs,
        overdueTasks: overdue.map((k) => ({ title: k.title, dueDate: k.dueDate, assigneeId: k.assigneeId })),
        openTasks: open.length,
        riskFlags: t.riskFlags,
        verdict: missingDocs.length === 0 && overdue.length === 0
          ? "Clean — nothing outstanding."
          : `Not clean: ${missingDocs.length} required document(s) and ${overdue.length} overdue task(s).`,
      };
    },
  },

  {
    name: "commission_breakdown",
    kind: "verify",
    description:
      "Compute what a deal actually pays, through the brokerage's commission engine. Never do this arithmetic yourself — splits, caps, team overrides and fees all resolve here.",
    parameters: {
      type: "object",
      properties: {
        transactionId: { type: "string", description: "An existing deal. Omit to model a hypothetical." },
        salePrice: { type: "number", description: "For a hypothetical." },
        grossCommissionPct: { type: "number", description: "Total commission percent, e.g. 5." },
        sidePct: { type: "number", description: "Our side of gross: 0.5 typical, 1 for dual agency." },
      },
    },
    run: (a, scope) => {
      const agentId = scope.ownBookOf;
      if (a.transactionId) {
        const t = visibleTransactions(scope).find((x) => x.id === str(a.transactionId) || x.ref === str(a.transactionId));
        if (!t) return { found: false };
        return { found: true, ref: t.ref, address: t.address, breakdown: t.commission };
      }
      if (!agentId) return { found: false, reason: "A hypothetical needs an agent context." };
      return {
        found: true, hypothetical: true,
        breakdown: computeCommission({
          salePrice: num(a.salePrice), grossCommissionPct: num(a.grossCommissionPct, 5),
          sidePct: a.sidePct != null ? num(a.sidePct) : 0.5, agentId,
        }),
      };
    },
  },

  {
    name: "net_sheet",
    kind: "verify",
    description: "What the agent takes home on a deal at a given price — the number they actually want when a client asks 'what if we come down'.",
    parameters: {
      type: "object",
      properties: {
        salePrice: { type: "number", description: "Price to model." },
        grossCommissionPct: { type: "number", description: "Default 5." },
        sidePct: { type: "number", description: "Default 0.5." },
      },
      required: ["salePrice"],
    },
    run: (a, scope) => {
      if (!scope.ownBookOf) return { found: false };
      const b = computeCommission({
        salePrice: num(a.salePrice), grossCommissionPct: num(a.grossCommissionPct, 5),
        sidePct: a.sidePct != null ? num(a.sidePct) : 0.5, agentId: scope.ownBookOf,
      });
      return { found: true, salePrice: num(a.salePrice), breakdown: b };
    },
  },

  {
    name: "cap_progress",
    kind: "verify",
    description: "How close the signed-in agent is to their annual company-dollar cap, and what changes once they hit it.",
    parameters: { type: "object", properties: {} },
    run: (_a, scope) => {
      const ag = scope.ownBookOf ? agentById(scope.ownBookOf) : null;
      if (!ag) return { found: false };
      const remaining = Math.max(0, ag.plan.cap - ag.plan.capYtd);
      return { found: true, plan: ag.plan.name, cap: ag.plan.cap, used: ag.plan.capYtd, remaining,
        capped: remaining === 0,
        meaning: remaining === 0
          ? "Capped. Every remaining closing this year should pay the full side commission less only the transaction fee."
          : `${remaining} of company dollar left before the split stops applying.` };
    },
  },

  {
    name: "closing_risk",
    kind: "verify",
    description: "Every deal in scope that is at risk — closing inside 14 days with an incomplete file, or already past its closing date.",
    parameters: { type: "object", properties: {} },
    run: (_a, scope) => {
      const soon = visibleTransactions(scope)
        .filter((t) => !["closed", "cancelled"].includes(t.stage))
        .map((t) => {
          const days = Math.round((new Date(t.closingDate).getTime() - TODAY.getTime()) / 86400000);
          const missing = t.documents.filter((d) => d.required && d.status === "pending").length;
          const overdue = t.tasks.filter((k) => !isDone(k) && k.dueDate < NOW).length;
          return { ref: t.ref, address: t.address, stage: t.stage, daysToClosing: days, missingRequiredDocs: missing, overdueTasks: overdue, riskFlags: t.riskFlags };
        })
        .filter((r) => r.daysToClosing <= 14 || r.missingRequiredDocs > 0 || r.overdueTasks > 0 || r.riskFlags.length > 0)
        .sort((x, y) => x.daysToClosing - y.daysToClosing);
      return { atRisk: soon.length, deals: soon };
    },
  },

  {
    name: "compliance_audit",
    kind: "verify",
    description:
      "Brokerage-wide supervision check: every file with a required document outstanding or an overdue task, including CLOSED files — that is where a DOS audit looks.",
    parameters: { type: "object", properties: { includeClosed: { type: "string", description: "'yes' to include closed files. Default yes." } } },
    run: (a, scope) => {
      const includeClosed = str(a.includeClosed, "yes") !== "no";
      const rows = visibleTransactions(scope)
        .filter((t) => includeClosed || !["closed", "cancelled"].includes(t.stage))
        .map((t) => ({
          ref: t.ref, address: t.address, stage: t.stage, agentId: t.agentId, coordinatorId: t.coordinatorId,
          missingRequiredDocs: t.documents.filter((d) => d.required && d.status === "pending").map((d) => d.name),
          overdueTasks: t.tasks.filter((k) => !isDone(k) && k.dueDate < NOW).map((k) => k.title),
          riskFlags: t.riskFlags,
        }))
        .filter((r) => r.missingRequiredDocs.length || r.overdueTasks.length || r.riskFlags.length);
      const closedWithGaps = rows.filter((r) => r.stage === "closed");
      return {
        filesWithGaps: rows.length,
        closedFilesWithGaps: closedWithGaps.length,
        note: closedWithGaps.length
          ? "Closed files with open compliance items are the highest-exposure rows here — they cannot be fixed after the fact."
          : undefined,
        files: rows,
      };
    },
  },

  {
    name: "reconcile_payout_run",
    kind: "verify",
    description:
      "Check every payout row: gross minus deductions must equal net. Reports each row where it does not, with the arithmetic.",
    parameters: { type: "object", properties: {} },
    run: () => {
      const rows = allPayouts.map((p) => {
        const expected = p.grossCommission - p.deductions;
        return {
          reference: p.reference, agentId: p.agentId, transactionId: p.transactionId,
          gross: p.grossCommission, deductions: p.deductions, net: p.netPayout,
          expectedNet: expected, variance: p.netPayout - expected, status: p.status,
        };
      });
      const bad = rows.filter((r) => r.variance !== 0);
      return {
        rows: rows.length,
        reconciled: rows.length - bad.length,
        failures: bad.length,
        totalVariance: bad.reduce((s, r) => s + r.variance, 0),
        detail: bad,
        verdict: bad.length === 0 ? "All rows reconcile." : `${bad.length} row(s) do not reconcile. Do not release this run.`,
      };
    },
  },

  {
    name: "cap_audit",
    kind: "verify",
    description: "Whether company dollar collected agrees with each agent's cap and year-to-date. Flags any agent charged past their cap.",
    parameters: { type: "object", properties: {} },
    run: () => {
      const rows = agents.filter((a) => a.status === "active").map((a) => {
        const collected = transactions
          .filter((t) => t.agentId === a.id && t.stage === "closed")
          .reduce((s, t) => s + (t.commission?.brokerageSplit ?? 0), 0);
        return {
          agentId: a.id, name: a.name, plan: a.plan.name, cap: a.plan.cap, capYtdOnRecord: a.plan.capYtd,
          companyDollarCollected: collected, overCap: Math.max(0, collected - a.plan.cap),
        };
      });
      const over = rows.filter((r) => r.overCap > 0);
      return { agents: rows.length, agentsOverCap: over.length, totalOverCollected: over.reduce((s, r) => s + r.overCap, 0), detail: over.length ? over : rows.slice(0, 8) };
    },
  },

  {
    name: "licence_watch",
    kind: "verify",
    description: "Licences expiring inside 90 days, expired licences, and any agent with an open file and a licence that is not active.",
    parameters: { type: "object", properties: {} },
    run: () => {
      const horizon = new Date(TODAY.getTime() + 90 * 86400000).toISOString().slice(0, 10);
      const rows = agents
        .filter((a) => a.license.expires <= horizon || a.license.status !== "active")
        .map((a) => ({
          agentId: a.id, name: a.name, status: a.license.status, expires: a.license.expires,
          state: a.license.state, openFiles: agentActivity(a.id).activeDeals,
        }))
        .sort((x, y) => x.expires.localeCompare(y.expires));
      const blocking = rows.filter((r) => r.status !== "active" && r.openFiles > 0);
      return { flagged: rows.length, blocking: blocking.length, note: blocking.length ? "These agents have live files and a licence that is not active." : undefined, detail: rows };
    },
  },

  {
    name: "data_integrity_check",
    kind: "verify",
    description:
      "Compare headline figures against the rows beneath them and report where they disagree. Use when a broker questions a number.",
    parameters: { type: "object", properties: {} },
    run: () => {
      const closed = transactions.filter((t) => t.stage === "closed");
      const fromTransactions = {
        closings: closed.length,
        volume: closed.reduce((s, t) => s + t.salePrice, 0),
        grossCommission: closed.reduce((s, t) => s + (t.commission?.sideCommission ?? 0), 0),
      };
      const fromAgentStats = {
        closings: agents.reduce((s, a) => s + a.stats.ytdClosings, 0),
        volume: agents.reduce((s, a) => s + a.stats.ytdVolume, 0),
        grossCommission: agents.reduce((s, a) => s + a.stats.ytdGci, 0),
      };
      return {
        fromTransactionTable: fromTransactions,
        fromAgentStatsField: fromAgentStats,
        agrees: fromTransactions.closings === fromAgentStats.closings,
        note: "Agent.stats holds full-year ledger figures that predate the seeded transaction table. Quote the transaction table for anything about this system's own records, and say which source you used.",
      };
    },
  },

  /* ------------------------------------------------- respond, tier 3 -- */

  {
    name: "brokerage_overview",
    kind: "respond",
    description:
      "The state of the brokerage right now: open files by stage, pipeline value, closings this year, agent headcount, and what needs attention.",
    parameters: { type: "object", properties: {} },
    run: () => {
      const open = transactions.filter((t) => !["closed", "cancelled"].includes(t.stage));
      const closed = transactions.filter((t) => t.stage === "closed");
      const byStage: Record<string, number> = {};
      for (const t of open) byStage[t.stage] = (byStage[t.stage] ?? 0) + 1;
      return {
        openFiles: open.length,
        byStage,
        pipelineValue: open.reduce((s, t) => s + (t.salePrice || t.listPrice), 0),
        closedThisYear: closed.length,
        closedVolume: closed.reduce((s, t) => s + t.salePrice, 0),
        activeAgents: agents.filter((a) => a.status === "active").length,
        onboarding: agents.filter((a) => a.status === "onboarding").length,
        filesWithComplianceGaps: transactions.filter((t) => !t.complianceComplete).length,
        source: "the transaction table — quote this, not the dashboard's seeded monthly series",
      };
    },
  },

  {
    name: "search_transactions",
    kind: "respond",
    description: "Find deals by address, reference, stage, agent or closing window.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Address, ref or counterparty." },
        stage: { type: "string", description: "Filter to one stage." },
        agentId: { type: "string", description: "Filter to one agent." },
        closingBefore: { type: "string", description: "YYYY-MM-DD." },
        limit: { type: "number", description: "Default 12." },
      },
    },
    run: (a, scope) => {
      const q = str(a.query).toLowerCase();
      const rows = visibleTransactions(scope).filter((t) => {
        if (q && ![t.address, t.ref, t.counterparty, t.city].join(" ").toLowerCase().includes(q)) return false;
        if (a.stage && t.stage !== str(a.stage)) return false;
        if (a.agentId && t.agentId !== str(a.agentId) && t.coAgentId !== str(a.agentId)) return false;
        if (a.closingBefore && t.closingDate > str(a.closingBefore)) return false;
        return true;
      });
      return {
        matched: rows.length,
        results: rows.slice(0, num(a.limit, 12)).map((t) => ({
          id: t.id, ref: t.ref, address: t.address, stage: t.stage, side: t.side,
          agentId: t.agentId, coordinatorId: t.coordinatorId, closingDate: t.closingDate,
          salePrice: t.salePrice || t.listPrice, complianceComplete: t.complianceComplete,
          riskFlags: t.riskFlags,
        })),
      };
    },
  },

  {
    name: "search_agents",
    kind: "respond",
    description: "The agent roster with production and status. Use for staffing, coverage and performance questions.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "active, onboarding, inactive, offboarding." },
        officeId: { type: "string", description: "Filter to one office." },
        tier: { type: "string", description: "platinum, gold, silver, emerging." },
      },
    },
    run: (a, scope) => {
      const rows = visibleAgents(scope).filter((ag) => {
        if (a.status && ag.status !== str(a.status)) return false;
        if (a.officeId && ag.officeId !== str(a.officeId)) return false;
        if (a.tier && ag.tier !== str(a.tier)) return false;
        return true;
      });
      return {
        matched: rows.length,
        results: rows.map((ag) => ({
          id: ag.id, name: ag.name, status: ag.status, tier: ag.tier, officeId: ag.officeId,
          joinDate: ag.joinDate, licenceStatus: ag.license.status, licenceExpires: ag.license.expires,
          ...agentActivity(ag.id),
        })),
      };
    },
  },

  {
    name: "get_agent",
    kind: "respond",
    description: "One agent's full staff record: status, licence, office, team, production and plan.",
    parameters: { type: "object", properties: { id: { type: "string", description: "Agent id or name." } }, required: ["id"] },
    run: (a, scope) => {
      const key = str(a.id).toLowerCase();
      const ag = visibleAgents(scope).find((x) => x.id === key || x.name.toLowerCase().includes(key));
      if (!ag) return { found: false };
      const ob = onboarding.find((o) => o.agentId === ag.id);
      return {
        found: true, id: ag.id, name: ag.name, title: ag.title, status: ag.status, tier: ag.tier,
        officeId: ag.officeId, teamId: ag.teamId, joinDate: ag.joinDate,
        licence: { number: ag.license.number, state: ag.license.state, status: ag.license.status, expires: ag.license.expires },
        mls: { id: ag.mls.mlsId, board: ag.mls.board, status: ag.mls.status, duesPaid: ag.mls.associationDuesPaid },
        plan: { name: ag.plan.name, agentSplit: ag.plan.agentSplit, cap: ag.plan.cap, capYtd: ag.plan.capYtd, transactionFee: ag.plan.transactionFee },
        activity: agentActivity(ag.id),
        onboarding: ob ? { stage: ob.stage, startedAt: ob.startedAt, targetActivation: ob.targetActivation,
          checklistDone: ob.checklist.filter((c) => c.done).length, checklistTotal: ob.checklist.length } : null,
      };
    },
  },

  {
    name: "search_clients",
    kind: "respond",
    description: "Find client records across the brokerage by name, agent, status or type.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Name or area." },
        agentId: { type: "string", description: "Filter to one agent's book." },
        status: { type: "string", description: "Client status." },
      },
    },
    run: (a, scope) => {
      const q = str(a.query).toLowerCase();
      const rows = visibleClients(scope).filter((c) => {
        if (q && ![c.name, ...c.areas].join(" ").toLowerCase().includes(q)) return false;
        if (a.agentId && c.agentId !== str(a.agentId)) return false;
        if (a.status && c.status !== str(a.status)) return false;
        return true;
      });
      return {
        matched: rows.length,
        results: rows.slice(0, 20).map((c) => ({
          id: c.id, name: c.name, type: c.type, status: c.status, agentId: c.agentId,
          areas: c.areas, lastContact: c.lastContact, nextFollowUp: c.nextFollowUp,
        })),
      };
    },
  },

  {
    name: "recruiting_pipeline",
    kind: "respond",
    description:
      "The recruiting board: candidates by stage, their production, and where each one is stuck. Contains compensation discussions — never repeat those outside this window.",
    parameters: { type: "object", properties: { stage: { type: "string", description: "Filter to one stage." } } },
    run: (a) => {
      const rows = recruits.filter((r) => !a.stage || r.stage === str(a.stage));
      return {
        candidates: rows.length,
        byStage: rows.reduce<Record<string, number>>((acc, r) => { acc[r.stage] = (acc[r.stage] ?? 0) + 1; return acc; }, {}),
        results: rows.map((r) => ({
          id: r.id, name: r.name, stage: r.stage, currentBrokerage: r.currentBrokerage,
          yearsExperience: r.yearsExperience, productionVolume: r.productionVolume,
          productionUnits: r.productionUnits, leadSource: r.leadSource, recruiterId: r.recruiterId,
          lastContact: r.lastContact, nextFollowUp: r.nextFollowUp, notes: r.notes,
        })),
      };
    },
  },

  {
    name: "performance_report",
    kind: "respond",
    description:
      "Production by office and by agent. Say which source each figure came from — this product has more than one, and they disagree.",
    parameters: { type: "object", properties: {} },
    run: () => ({
      companyKpis,
      byOffice: officeComparison,
      caution: "companyKpis and officeComparison read Agent.stats, which holds full-year ledger figures predating the seeded transaction table. Run data_integrity_check before quoting either alongside a transaction count.",
    }),
  },

  /* ---------------------------------------------------------- operate -- */

  {
    name: "book_tour",
    kind: "operate",
    description:
      "Request a showing for a visitor. Confirm every field with them first — this reaches a real agent. Returns a request for the app to submit.",
    parameters: {
      type: "object",
      properties: {
        listingId: { type: "string", description: "Which home." },
        name: { type: "string", description: "Visitor's full name." },
        email: { type: "string", description: "Visitor's email." },
        phone: { type: "string", description: "Visitor's phone." },
        preferredDate: { type: "string", description: "YYYY-MM-DD." },
        preferredTime: { type: "string", description: "e.g. 2:00 PM." },
        mode: { type: "string", description: "in_person or virtual.", enum: ["in_person", "virtual"] },
        notes: { type: "string", description: "Anything they want the agent to know." },
      },
      required: ["listingId", "name", "email", "preferredDate"],
    },
    run: (a, scope) => {
      const l = listings.find((x) => x.id === str(a.listingId));
      return intent("book_tour", a, `Tour request for ${l?.address ?? str(a.listingId)} on ${str(a.preferredDate)} ${str(a.preferredTime)} for ${str(a.name)}.`, scope);
    },
  },

  {
    name: "capture_lead",
    kind: "operate",
    description: "Pass a visitor to an agent when they want to be contacted. Confirm before sending.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name." },
        email: { type: "string", description: "Email." },
        phone: { type: "string", description: "Phone." },
        intent: { type: "string", description: "buy, sell, rent, valuation or other." },
        summary: { type: "string", description: "One line on what they need, in their own words." },
      },
      required: ["name", "email", "intent"],
    },
    run: (a, scope) => intent("capture_lead", a, `Send ${str(a.name)} to an agent — ${str(a.intent)}: ${str(a.summary)}`, scope),
  },

  {
    name: "handoff_to_human",
    kind: "operate",
    description: "Hand the conversation to a person. Use whenever the visitor asks for one, is frustrated, or asks something outside your scope twice.",
    parameters: { type: "object", properties: { reason: { type: "string", description: "Why, in one line." } } },
    run: (a, scope) => intent("handoff_to_human", a, `Hand off: ${str(a.reason)}`, scope),
  },

  {
    name: "log_activity",
    kind: "operate",
    description: "Record a call, email, showing or meeting against a client. Confirm the client and the content first.",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "Client id." },
        kind: { type: "string", description: "call, email, showing, meeting.", enum: ["call", "email", "showing", "meeting"] },
        body: { type: "string", description: "What happened, in the agent's voice." },
      },
      required: ["clientId", "kind", "body"],
    },
    run: (a, scope) => {
      const c = visibleClients(scope).find((x) => x.id === str(a.clientId));
      if (!c) return { refused: true, reason: "That client is not in your book." };
      return intent("log_activity", a, `Log a ${str(a.kind)} with ${c.name}: "${str(a.body).slice(0, 90)}"`, scope);
    },
  },

  {
    name: "add_note",
    kind: "operate",
    description: "Add a note to a client or a transaction.",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "client or transaction.", enum: ["client", "transaction"] },
        id: { type: "string", description: "Record id." },
        body: { type: "string", description: "Note text." },
      },
      required: ["target", "id", "body"],
    },
    run: (a, scope) => intent("add_note", a, `Add a note to ${str(a.target)} ${str(a.id)}.`, scope),
  },

  {
    name: "create_client",
    kind: "operate",
    description: "Create a client record. Ask for anything you are missing rather than guessing a budget or an area.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name." },
        email: { type: "string", description: "Email." },
        phone: { type: "string", description: "Phone." },
        type: { type: "string", description: "buyer, seller, both, renter, investor." },
        budgetMin: { type: "number", description: "Lower bound." },
        budgetMax: { type: "number", description: "Upper bound." },
        areas: { type: "string", description: "Comma-separated neighborhoods." },
        leadSource: { type: "string", description: "Where they came from." },
      },
      required: ["name", "type"],
    },
    run: (a, scope) => intent("create_client", { ...a, agentId: scope.ownBookOf }, `Create client ${str(a.name)} (${str(a.type)}) in your book.`, scope),
  },

  {
    name: "update_client",
    kind: "operate",
    description: "Change a client's status, next follow-up date, or budget.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Client id." },
        status: { type: "string", description: "New status." },
        nextFollowUp: { type: "string", description: "YYYY-MM-DD." },
        budgetMin: { type: "number", description: "Lower bound." },
        budgetMax: { type: "number", description: "Upper bound." },
      },
      required: ["id"],
    },
    run: (a, scope) => {
      const c = visibleClients(scope).find((x) => x.id === str(a.id));
      if (!c) return { refused: true, reason: "That client is not in your book." };
      return intent("update_client", a, `Update ${c.name}.`, scope);
    },
  },

  {
    name: "complete_task",
    kind: "operate",
    description: "Mark a transaction task done. Only do this when the agent says the work is actually finished.",
    parameters: {
      type: "object",
      properties: { transactionId: { type: "string", description: "Deal id." }, taskId: { type: "string", description: "Task id." } },
      required: ["transactionId", "taskId"],
    },
    run: (a, scope) => {
      const t = visibleTransactions(scope).find((x) => x.id === str(a.transactionId));
      const k = t?.tasks.find((x) => x.id === str(a.taskId));
      if (!t || !k) return { refused: true, reason: "Not in scope, or no such task." };
      return intent("complete_task", a, `Mark "${k.title}" complete on ${t.ref}.`, scope);
    },
  },

  {
    name: "move_stage",
    kind: "operate",
    description: "Move a deal to a new stage. This is visible to the whole brokerage and appears on the file's timeline.",
    parameters: {
      type: "object",
      properties: { transactionId: { type: "string", description: "Deal id." }, stage: { type: "string", description: "New stage." } },
      required: ["transactionId", "stage"],
    },
    run: (a, scope) => {
      const t = visibleTransactions(scope).find((x) => x.id === str(a.transactionId));
      if (!t) return { refused: true, reason: "Not in scope." };
      return intent("move_stage", a, `Move ${t.ref} — ${t.address} from ${t.stage} to ${str(a.stage)}.`, scope);
    },
  },

  {
    name: "schedule_showing",
    kind: "operate",
    description: "Put a showing on the agent's calendar for one of their clients.",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "Client id." },
        listingId: { type: "string", description: "Listing id." },
        date: { type: "string", description: "YYYY-MM-DD." },
        time: { type: "string", description: "e.g. 3:30 PM." },
      },
      required: ["clientId", "listingId", "date"],
    },
    run: (a, scope) => intent("schedule_showing", a, `Schedule a showing on ${str(a.date)} ${str(a.time)}.`, scope),
  },

  {
    name: "draft_message",
    kind: "operate",
    description:
      "Draft a message for the agent to send — never sends it. Returns text they can edit. Use their client's actual situation from get_client.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Who it is for." },
        channel: { type: "string", description: "email, sms." },
        purpose: { type: "string", description: "What it needs to accomplish." },
        draft: { type: "string", description: "Your draft text." },
      },
      required: ["to", "purpose", "draft"],
    },
    run: (a) => ({ draft: str(a.draft), to: str(a.to), channel: str(a.channel, "email"), sent: false, note: "Draft only — nothing was sent." }),
  },

  {
    name: "assign_coordinator",
    kind: "operate",
    description: "Assign or change the transaction coordinator on a file.",
    parameters: {
      type: "object",
      properties: {
        transactionId: { type: "string", description: "Deal id or ref." },
        coordinatorId: { type: "string", description: "Staff user id." },
      },
      required: ["transactionId", "coordinatorId"],
    },
    run: (a, scope) => {
      const t = transactions.find((x) => x.id === str(a.transactionId) || x.ref === str(a.transactionId));
      if (!t) return { refused: true, reason: "No such file." };
      return intent("assign_coordinator", a, `Assign a new coordinator to ${t.ref} — ${t.address}.`, scope);
    },
  },

  {
    name: "reassign_transaction",
    kind: "operate",
    description:
      "Move a file to a different agent. Use when an agent is offboarding or on leave. This changes whose commission the file pays.",
    parameters: {
      type: "object",
      properties: {
        transactionId: { type: "string", description: "Deal id or ref." },
        toAgentId: { type: "string", description: "Receiving agent id." },
        reason: { type: "string", description: "Why — this goes on the file's timeline." },
      },
      required: ["transactionId", "toAgentId", "reason"],
    },
    run: (a, scope) => {
      const t = transactions.find((x) => x.id === str(a.transactionId) || x.ref === str(a.transactionId));
      const to = agentById(str(a.toAgentId));
      if (!t || !to) return { refused: true, reason: "No such file or agent." };
      return intent("reassign_transaction", a,
        `Reassign ${t.ref} — ${t.address} from ${agentById(t.agentId)?.name ?? t.agentId} to ${to.name}. This changes who the file pays.`, scope);
    },
  },

  {
    name: "request_document",
    kind: "operate",
    description: "Ask the responsible party for a missing required document, and record the request on the file.",
    parameters: {
      type: "object",
      properties: {
        transactionId: { type: "string", description: "Deal id or ref." },
        documentName: { type: "string", description: "Exactly what is needed." },
        dueDate: { type: "string", description: "YYYY-MM-DD." },
      },
      required: ["transactionId", "documentName"],
    },
    run: (a, scope) => intent("request_document", a, `Request "${str(a.documentName)}" on ${str(a.transactionId)}.`, scope),
  },

  {
    name: "approve_document",
    kind: "operate",
    description: "Accept or reject a submitted document. A rejection needs a reason the sender can act on.",
    parameters: {
      type: "object",
      properties: {
        transactionId: { type: "string", description: "Deal id." },
        documentId: { type: "string", description: "Document id." },
        decision: { type: "string", description: "accept or reject.", enum: ["accept", "reject"] },
        reason: { type: "string", description: "Required when rejecting." },
      },
      required: ["transactionId", "documentId", "decision"],
    },
    run: (a, scope) => {
      if (str(a.decision) === "reject" && !str(a.reason)) {
        return { refused: true, reason: "A rejection needs a reason. Ask for one before calling this again." };
      }
      return intent("approve_document", a, `${str(a.decision) === "accept" ? "Accept" : "Reject"} document ${str(a.documentId)}.`, scope);
    },
  },

  {
    name: "send_reminder",
    kind: "operate",
    description: "Send a reminder to an agent — a licence renewal, an overdue task, an outstanding document.",
    parameters: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Who to remind." },
        subject: { type: "string", description: "What about." },
        body: { type: "string", description: "The message." },
      },
      required: ["agentId", "subject"],
    },
    run: (a, scope) => {
      const ag = agentById(str(a.agentId));
      return intent("send_reminder", a, `Send ${ag?.name ?? str(a.agentId)} a reminder: ${str(a.subject)}`, scope);
    },
  },

  {
    name: "update_agent_status",
    kind: "operate",
    description:
      "Change an agent's status — onboarding, active, inactive, offboarding. This affects their access and their files. Always name the person when confirming.",
    parameters: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Agent id." },
        status: { type: "string", description: "New status.", enum: ["active", "onboarding", "inactive", "offboarding"] },
        reason: { type: "string", description: "Why — recorded against the change." },
      },
      required: ["agentId", "status", "reason"],
    },
    run: (a, scope) => {
      const ag = agentById(str(a.agentId));
      if (!ag) return { refused: true, reason: "No such agent." };
      const open = agentActivity(ag.id).activeDeals;
      return intent("update_agent_status", a,
        `Set ${ag.name} to ${str(a.status)}.${open > 0 ? ` They have ${open} open file(s) that will need reassigning.` : ""}`, scope);
    },
  },

  {
    name: "approve_disbursement",
    kind: "operate",
    description:
      "Release a payout run. Before calling this, run reconcile_payout_run and state the run, the payee count and the exact total for the person to confirm. Never call it on a run with a failed row.",
    parameters: {
      type: "object",
      properties: {
        references: { type: "string", description: "Comma-separated payout references." },
        confirmedTotal: { type: "number", description: "The total the person confirmed, to the dollar." },
      },
      required: ["references", "confirmedTotal"],
    },
    run: (a, scope) => {
      const refs = str(a.references).split(",").map((r) => r.trim()).filter(Boolean);
      const rows = allPayouts.filter((p) => refs.includes(p.reference));
      if (!rows.length) return { refused: true, reason: "No matching payouts." };
      const bad = rows.filter((p) => p.grossCommission - p.deductions !== p.netPayout);
      if (bad.length) {
        return { refused: true, reason: `${bad.length} row(s) do not reconcile: ${bad.map((b) => b.reference).join(", ")}. Do not release this run.` };
      }
      const total = rows.reduce((s, p) => s + p.netPayout, 0);
      if (num(a.confirmedTotal) !== total) {
        return { refused: true, reason: `Confirmed total ${num(a.confirmedTotal)} does not match the run total ${total}. Re-confirm with the correct figure.` };
      }
      return intent("approve_disbursement", { ...a, total }, `Release ${rows.length} payout(s) totalling ${total}.`, scope);
    },
  },

  {
    name: "export_dataset",
    kind: "operate",
    description: "Export a dataset as CSV. Data leaves the system — confirm scope and recipient first.",
    parameters: {
      type: "object",
      properties: {
        dataset: { type: "string", description: "transactions, agents, clients, listings, payouts." },
        filter: { type: "string", description: "How it should be narrowed, in plain words." },
      },
      required: ["dataset"],
    },
    run: (a, scope) => intent("export_dataset", a, `Export ${str(a.dataset)} (${str(a.filter, "no filter")}) as CSV.`, scope),
  },

  {
    name: "post_announcement",
    kind: "operate",
    description: "Publish an announcement to the brokerage. Everyone in the audience sees it.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Headline." },
        body: { type: "string", description: "Full text." },
        audience: { type: "string", description: "all, agents, staff." },
        pinned: { type: "string", description: "yes or no." },
      },
      required: ["title", "body", "audience"],
    },
    run: (a, scope) => intent("post_announcement", a,
      `Publish "${str(a.title)}" to ${str(a.audience)} — ${announcements.length + 1} announcements total.`, scope),
  },
];

export const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

/** The JSON the model is shown, filtered to one assistant's allowlist. */
export function toolSchemasFor(names: string[]) {
  return TOOLS.filter((t) => names.includes(t.name)).map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

export function isWriteIntent(v: unknown): v is WriteIntent {
  return typeof v === "object" && v !== null && (v as { __intent?: unknown }).__intent === true;
}
