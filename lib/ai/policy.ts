import type { Permission, RoleKey } from "@/types";
import { permissionsFor } from "@/lib/permissions";
import { AGENTS, TOOL_PERMISSION, type AgentDef, type AgentId } from "./agents";

/**
 * The enforcement layer. Everything here runs on the gateway, where the caller cannot reach
 * it — the browser copy exists so the UI can grey out what it already knows will be refused,
 * but a decision made here in the browser is a hint, and a decision made here on the gateway
 * is the answer.
 *
 * Three checks, applied in order, on every single tool call:
 *
 *   allowTool()  — is this tool in the tier's allowlist, and does the caller hold the
 *                  permission it needs? A model that hallucinates a tool name gets a refusal,
 *                  not an execution.
 *   scopeFor()   — which rows may the executor see? Tier 2 is pinned to one agentId; tier 3
 *                  is pinned to the caller's permission set; tier 1 is pinned to published.
 *   redactFor()  — strip denied fields from the result before it enters the transcript.
 *
 * The ordering matters. Redaction last means a tool can compute over a field it is not
 * allowed to *return* — commission_breakdown reads a plan's cap to clamp a split, and the
 * cap never reaches the model.
 */

/* ------------------------------------------------------------------ CALLER */

export interface Caller {
  /** Which assistant window this came from. */
  agentId: AgentId;
  /** Signed-in role, or null for the public site. Set by the gateway from a verified session. */
  role: RoleKey | null;
  /** The agent record id, for tier 2 row scoping. */
  bookAgentId: string | null;
  /** The user id every write is stamped with. */
  userId: string | null;
  /** For rate limiting and the audit log. */
  sessionId: string;
}

export const PUBLIC_CALLER: Caller = {
  agentId: "concierge", role: null, bookAgentId: null, userId: null, sessionId: "anon",
};

/* ------------------------------------------------------------------- SCOPE */

export interface Scope {
  tier: 1 | 2 | 3;
  /** Tier 1 only sees rows a visitor could already see on the website. */
  publishedOnly: boolean;
  /** Tier 2 only sees rows belonging to this agent. Null means no row restriction. */
  ownBookOf: string | null;
  /** Tier 3 is bounded by what the signed-in role may do. */
  permissions: Permission[];
  /** Stamped on every mutation. */
  actorId: string | null;
}

export function scopeFor(caller: Caller): Scope {
  const def = AGENTS[caller.agentId];
  if (def.tier === 1) {
    return { tier: 1, publishedOnly: true, ownBookOf: null, permissions: [], actorId: null };
  }
  if (def.tier === 2) {
    return {
      tier: 2,
      publishedOnly: false,
      // A tier-2 window with no bookAgentId is a broken session, not an unrestricted one.
      // "__none__" matches nothing, which is the safe direction to fail.
      ownBookOf: caller.bookAgentId ?? "__none__",
      permissions: permissionsFor("agent"),
      actorId: caller.userId,
    };
  }
  return {
    tier: 3,
    publishedOnly: false,
    ownBookOf: null,
    permissions: caller.role ? permissionsFor(caller.role) : [],
    actorId: caller.userId,
  };
}

/* -------------------------------------------------------------- TOOL GATES */

export type ToolDecision =
  | { allowed: true; confirm: boolean }
  | { allowed: false; reason: string };

export function allowTool(caller: Caller, tool: string): ToolDecision {
  const def: AgentDef = AGENTS[caller.agentId];

  if (!def.tools.includes(tool)) {
    return {
      allowed: false,
      reason: `${tool} is not available to ${def.name}. Refusing.`,
    };
  }

  // Tier 3 narrows further by the signed-in role. A coordinator asking Operator for a payout
  // reconciliation is refused here, before any row is read — which is the difference between
  // this and the product's existing nav-only gating.
  if (def.tier === 3) {
    const needed = TOOL_PERMISSION[tool];
    if (needed) {
      const held = caller.role ? permissionsFor(caller.role) : [];
      if (!held.includes(needed)) {
        return {
          allowed: false,
          reason: `Your role does not hold ${needed}, which ${tool} requires. Refusing.`,
        };
      }
    }
  }

  if (def.tier === 2 && !caller.bookAgentId) {
    return { allowed: false, reason: "No agent is bound to this session. Refusing." };
  }

  return { allowed: true, confirm: def.confirmBeforeRun.includes(tool) };
}

/* -------------------------------------------------------------- REDACTION */

/**
 * Strip denied fields from a tool result, recursively, before it reaches the model.
 *
 * Patterns are field names, optionally prefixed `*.` to match at any depth. A bare name
 * matches at any depth too — the `*.` form exists for readability in the agent definitions.
 * Deleted keys are replaced with a marker rather than removed, so the model can tell the
 * difference between "this field is empty" and "you are not allowed to see this" and answer
 * the user honestly instead of guessing.
 */
export const REDACTED = "[redacted: outside this assistant's permission]";

export function redactFor(agentId: AgentId, value: unknown): unknown {
  const patterns = AGENTS[agentId].redact.map((p) => p.replace(/^\*\./, "").toLowerCase());
  const deny = new Set(patterns);
  return walk(value, deny, 0);
}

function walk(value: unknown, deny: Set<string>, depth: number): unknown {
  if (depth > 12 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => walk(v, deny, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (deny.has(k.toLowerCase())) {
      out[k] = REDACTED;
      continue;
    }
    out[k] = walk(v, deny, depth + 1);
  }
  return out;
}

/* ------------------------------------------------------------- RATE LIMITS */

/**
 * Per-tier ceilings. The public window is the one exposed to the open internet and to
 * anyone who wants to spend the brokerage's token budget for them, so it gets the tightest
 * limits and the shortest answers.
 */
export const LIMITS: Record<AgentId, {
  messagesPerSession: number;
  messagesPerHour: number;
  toolCallsPerTurn: number;
  maxInputChars: number;
}> = {
  // `toolCallsPerTurn` bounds *model rounds*, not individual calls — a round may carry
  // several. Four was too tight for the public window: a normal buyer question ("first
  // home, this budget, good commute") legitimately needs a search, a fallback search and
  // a neighborhood lookup before there is anything to say. It stays bounded, because a
  // model that keeps calling tools is stuck and an unbounded loop is a bill.
  concierge: { messagesPerSession: 30, messagesPerHour: 60, toolCallsPerTurn: 6, maxInputChars: 1500 },
  copilot:   { messagesPerSession: 200, messagesPerHour: 300, toolCallsPerTurn: 10, maxInputChars: 6000 },
  operator:  { messagesPerSession: 300, messagesPerHour: 500, toolCallsPerTurn: 14, maxInputChars: 12000 },
};

/* ----------------------------------------------------------------- AUDIT */

export interface AuditEntry {
  at: string;
  sessionId: string;
  actorId: string | null;
  role: RoleKey | null;
  assistant: AgentId;
  tool: string;
  args: Record<string, unknown>;
  outcome: "allowed" | "refused" | "confirmed" | "executed" | "error";
  detail?: string;
}

/**
 * Every tool call is logged, including the refused ones — a refusal is the most interesting
 * row in the table, because it is either someone probing or a permission set that is wrong.
 * Reads are logged too: on a system holding TINs, who *looked* is part of supervision.
 */
export function auditEntry(
  caller: Caller,
  tool: string,
  args: Record<string, unknown>,
  outcome: AuditEntry["outcome"],
  detail?: string,
): AuditEntry {
  return {
    at: new Date().toISOString(),
    sessionId: caller.sessionId,
    actorId: caller.userId,
    role: caller.role,
    assistant: caller.agentId,
    tool,
    args,
    outcome,
    detail,
  };
}
