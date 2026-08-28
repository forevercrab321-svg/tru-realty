import type { AgentDef } from "./agents";
import { LIMITS } from "./policy";
import { TOOL_BY_NAME, isWriteIntent, type WriteIntent } from "./tools";
import { scopeFor, allowTool, redactFor, type Caller } from "./policy";

/**
 * The browser side of the assistant.
 *
 * There are two transports and the difference between them is the whole security story:
 *
 *   GATEWAY (production). The browser posts the conversation to a Worker that holds the
 *   Kimi key, re-derives the caller's identity from a signed session, re-runs every
 *   permission check, executes the tools, redacts the results, and streams back an answer.
 *   The key is never in the bundle. The browser's claim about who it is is never trusted.
 *
 *   LOCAL (this demo). No key, no network, no model. Tool calls are resolved from the
 *   seeded data in the browser and answers are composed from the results. This exists
 *   because the demo is a static export on GitHub Pages, where there is nowhere to put a
 *   secret — and shipping a key into a public bundle to make a chat window work is how
 *   people wake up to a drained quota. It is clearly labelled in the UI as offline.
 *
 * The two share the tool layer and the policy layer exactly, so what you see in the demo
 * is what the gateway will do — minus the model's own language.
 */

const GATEWAY = process.env.NEXT_PUBLIC_AI_GATEWAY ?? "";

export const gatewayConfigured = () => GATEWAY.length > 0;

export type Role = "user" | "assistant" | "tool";

export interface Message {
  id: string;
  role: Role;
  content: string;
  /** Tool activity to render as a step, not as prose. */
  steps?: { tool: string; kind: string; ok: boolean; note?: string }[];
  /** A write the user must approve before it is applied. */
  pending?: WriteIntent;
  at: number;
}

export interface TurnResult {
  message: Message;
  /** Set when the assistant wants to write. The app applies it after confirmation. */
  pending?: WriteIntent;
}

const uid = () => Math.random().toString(36).slice(2, 10);

/* ------------------------------------------------------------- TRANSPORT */

export async function send(
  def: AgentDef,
  caller: Caller,
  history: Message[],
  input: string,
): Promise<TurnResult> {
  const limit = LIMITS[def.id];
  if (input.length > limit.maxInputChars) {
    return { message: reply(`That is longer than this window accepts (${limit.maxInputChars} characters). Send the essential part and I will work from there.`) };
  }

  if (gatewayConfigured()) {
    try {
      return await viaGateway(def, history, input);
    } catch (err) {
      // A gateway that is down should degrade to the offline engine rather than to a
      // spinner that never resolves. Say so — the user needs to know the answer they are
      // reading did not come from the model.
      return {
        message: reply(
          `I could not reach the assistant service, so this answer comes from the local data layer only.\n\n${
            (await viaLocal(def, caller, input)).message.content
          }`,
        ),
      };
    }
  }

  return viaLocal(def, caller, input);
}

async function viaGateway(def: AgentDef, history: Message[], input: string): Promise<TurnResult> {
  const res = await fetch(`${GATEWAY}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // No identity is sent. The gateway reads it from the session cookie it verifies itself:
    // anything the browser asserted about its own role would be worth exactly nothing.
    credentials: "include",
    body: JSON.stringify({
      assistant: def.id,
      messages: history.filter((m) => m.role !== "tool").slice(-20).map((m) => ({ role: m.role, content: m.content })),
      input,
    }),
  });
  if (!res.ok) throw new Error(`gateway ${res.status}`);
  const data = (await res.json()) as { content: string; steps?: Message["steps"]; pending?: WriteIntent };
  const message: Message = { id: uid(), role: "assistant", content: data.content, steps: data.steps, pending: data.pending, at: Date.now() };
  return { message, pending: data.pending };
}

/* --------------------------------------------------------- OFFLINE ENGINE */

/**
 * A deterministic stand-in for the model: it routes the question to a tool, runs it under
 * the same scope and redaction the gateway would apply, and renders the result. It does not
 * pretend to be the model — it says what it looked up and shows the data.
 */
async function viaLocal(def: AgentDef, caller: Caller, input: string): Promise<TurnResult> {
  const scope = scopeFor(caller);
  const q = input.toLowerCase();
  const steps: NonNullable<Message["steps"]> = [];

  const call = (tool: string, args: Record<string, unknown> = {}) => {
    const decision = allowTool(caller, tool);
    if (!decision.allowed) {
      steps.push({ tool, kind: "refused", ok: false, note: decision.reason });
      return null;
    }
    const def2 = TOOL_BY_NAME.get(tool);
    if (!def2) return null;
    const raw = def2.run(args, scope);
    steps.push({ tool, kind: def2.kind, ok: true });
    return redactFor(def.id, raw);
  };

  const picked = route(q, def.tools);
  if (!picked) {
    return {
      message: {
        id: uid(), role: "assistant", at: Date.now(),
        content: offlineIntro(def),
      },
    };
  }

  const result = call(picked.tool, picked.args);
  if (result === null) {
    return { message: reply(`That is outside what ${def.name} is allowed to do. ${refusalHint(def)}`, steps) };
  }
  if (isWriteIntent(result)) {
    return {
      message: { id: uid(), role: "assistant", at: Date.now(), steps, pending: result, content: `${result.summary}\n\nConfirm and I will apply it.` },
      pending: result,
    };
  }

  return {
    message: {
      id: uid(), role: "assistant", at: Date.now(), steps,
      content: `Running \`${picked.tool}\` against the live data:\n\n\`\`\`json\n${JSON.stringify(result, null, 2).slice(0, 3000)}\n\`\`\`\n\n*Offline mode — the data and the permission checks are real; the language is not. Connect the gateway for a written answer.*`,
    },
  };
}

/** A tiny intent router. Deliberately obvious rather than clever. */
function route(q: string, allowed: string[]): { tool: string; args: Record<string, unknown> } | null {
  const has = (...w: string[]) => w.some((x) => q.includes(x));
  const pick = (tool: string, args: Record<string, unknown> = {}) => (allowed.includes(tool) ? { tool, args } : null);

  if (has("reconcile", "payout run", "disburse")) return pick("reconcile_payout_run");
  if (has("compliance", "audit", "missing document", "required document")) return pick("compliance_audit");
  if (has("licence", "license", "expiring")) return pick("licence_watch");
  if (has("cap")) return pick("cap_audit") ?? pick("cap_progress");
  if (has("integrity", "disagree", "doesn't match", "does not match")) return pick("data_integrity_check");
  if (has("risk", "at risk", "closing soon")) return pick("closing_risk");
  if (has("file health", "will it close", "ready to close")) return pick("file_health", { id: extractId(q) ?? "tx_1041" });
  if (has("commission", "split", "net", "take home")) return pick("commission_breakdown") ?? pick("my_plan");
  if (has("recruit", "candidate", "hiring")) return pick("recruiting_pipeline");
  if (has("performance", "production", "office")) return pick("performance_report");
  if (has("overview", "how are we", "dashboard", "state of")) return pick("brokerage_overview");
  if (has("my book", "my deals", "my clients", "what do i")) return pick("my_book");
  if (has("agent", "who covers", "speaks")) return pick("list_agents", { neighborhood: extractHood(q) }) ?? pick("search_agents");
  if (has("neighborhood", "area", "guide")) return pick("neighborhood_guide", { name: extractHood(q) });
  if (has("office", "address", "phone")) return pick("list_offices");
  if (has("new development", "project", "sponsor")) return pick("list_projects");
  if (has("event", "training", "class")) return pick("list_events");
  if (has("document", "form", "template", "policy")) return pick("library_search", { query: q });
  if (has("listing", "home", "apartment", "condo", "co-op", "buy", "for sale", "$", "bed"))
    return pick("search_listings", { query: extractHood(q), maxPrice: extractPrice(q), beds: extractBeds(q) });
  return null;
}

const extractId = (q: string) => q.match(/\b(tx_\d+|TR-\d{4}-\d+|ls_\d+|cl_\d+)\b/i)?.[0];
const extractBeds = (q: string) => {
  const m = q.match(/(\d+)\s*(?:bed|br|bd)/);
  return m ? Number(m[1]) : undefined;
};
const extractPrice = (q: string) => {
  const m = q.match(/\$?\s?([\d.]+)\s*(m|million|k)?/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return undefined;
  const unit = m[2]?.toLowerCase();
  if (unit === "m" || unit === "million") return n * 1_000_000;
  if (unit === "k") return n * 1_000;
  return n > 10_000 ? n : undefined;
};
const HOODS = ["flatiron", "gramercy", "west village", "tribeca", "soho", "park slope", "williamsburg",
  "greenpoint", "long island city", "astoria", "brooklyn", "queens", "manhattan", "garden city", "chelsea"];
const extractHood = (q: string) => HOODS.find((h) => q.includes(h)) ?? "";

/* ------------------------------------------------------------- HELPERS */

const reply = (content: string, steps?: Message["steps"]): Message =>
  ({ id: uid(), role: "assistant", content, steps, at: Date.now() });

function refusalHint(def: AgentDef) {
  return `I can help with: ${def.refuse.length ? "everything except " + def.refuse[0] : "what is in scope"}.`;
}

function offlineIntro(def: AgentDef) {
  const examples: Record<string, string[]> = {
    concierge: [
      "Two-bedroom condos in Flatiron under $4M",
      "Which of your agents speak Mandarin?",
      "What is a co-op board package, and how long does it take?",
    ],
    copilot: [
      "What is in my book right now?",
      "Will TR-2026-1041 close cleanly?",
      "What do I take home on a $3.2M sale?",
    ],
    operator: [
      "Reconcile the payout run",
      "Which files have compliance gaps, including closed ones?",
      "Whose licence expires in the next 90 days?",
    ],
  };
  const list = (examples[def.id] ?? []).map((e) => `· ${e}`).join("\n");
  return `${def.tagline}\n\nTry:\n${list}\n\n*Running offline — no model is connected, so I answer by running the same tools with the same permission checks and showing you the result. Set \`NEXT_PUBLIC_AI_GATEWAY\` to connect Kimi K3.*`;
}
