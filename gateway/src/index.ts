/**
 * Tru Realty AI gateway — Cloudflare Worker.
 *
 * This exists for one reason: the app is a static export served from a CDN, and a static
 * export has nowhere to keep a secret. Any API key in that bundle is a public key. So the
 * key lives here, in a Worker secret, and the browser never sees it or anything derived
 * from it.
 *
 * The gateway does four jobs the browser cannot be trusted to do:
 *
 *   1. IDENTITY. It derives who the caller is from a signed session cookie it verifies
 *      itself. The request body's opinion about the caller's role is ignored entirely —
 *      it is not even read. This is the difference between a permission system and a
 *      suggestion.
 *   2. AUTHORISATION. It re-runs allowTool() for every call the model makes, against the
 *      identity it derived. The browser's checks are a UX nicety; these are the ones that count.
 *   3. REDACTION. Denied fields are stripped from tool results before they enter the
 *      transcript, so the model never holds a value it has to remember not to repeat.
 *   4. AUDIT. Every call — allowed, refused, executed — is written to a durable log with
 *      the acting user id. On a system holding TINs, who looked is part of supervision.
 *
 * Deploy: see gateway/README.md. Nothing here needs editing except the ALLOWED_ORIGINS list.
 */

import { AGENTS, type AgentId } from "../../lib/ai/agents";
import { allowTool, redactFor, scopeFor, auditEntry, LIMITS, type Caller } from "../../lib/ai/policy";
import { TOOL_BY_NAME, toolSchemasFor, isWriteIntent } from "../../lib/ai/tools";

export interface Env {
  /** `wrangler secret put KIMI_API_KEY`. Never a var, never in wrangler.toml, never in git. */
  KIMI_API_KEY: string;
  /** HMAC key for session cookies. `wrangler secret put SESSION_SECRET`. */
  SESSION_SECRET: string;
  /** Optional KV namespace for the audit log and rate limits. */
  AUDIT?: KVNamespace;
  /** Comma-separated. Requests from anywhere else are refused. */
  ALLOWED_ORIGINS: string;
  /**
   * "true" turns on POST /session, which mints a signed cookie from the demo account
   * list with NO password check. That is fine for a demo over seeded data and is a
   * disaster over real records, so it is off unless you set it, and the endpoint
   * refuses to run at all once REAL_DATA is "true".
   */
  DEMO_SESSIONS?: string;
  REAL_DATA?: string;
}

const KIMI_BASE = "https://api.moonshot.ai/v1";

/** The demo roster, mirroring lib/session.tsx. Only reachable when DEMO_SESSIONS is on. */
const DEMO_ACCOUNTS: Record<string, { userId: string; role: NonNullable<Caller["role"]>; agentId: string | null }> = {
  "admin@trurealty.com":      { userId: "usr_admin_whitfield", role: "super_admin", agentId: null },
  "ops@trurealty.com":        { userId: "usr_admin_okafor", role: "brokerage_admin", agentId: null },
  "tc@trurealty.com":         { userId: "usr_tc_reeves", role: "transaction_coordinator", agentId: null },
  "hr@trurealty.com":         { userId: "usr_hr_bell", role: "hr_ops", agentId: null },
  "accounting@trurealty.com": { userId: "usr_acct_navarro", role: "accounting", agentId: null },
  "agent@trurealty.com":      { userId: "usr_ag_schen", role: "agent", agentId: "ag_schen" },
  "newagent@trurealty.com":   { userId: "usr_ag_cwhite", role: "agent", agentId: "ag_cwhite" },
};

/* ---------------------------------------------------------------- SESSION */

interface SessionClaims {
  userId: string;
  role: Caller["role"];
  agentId: string | null;
  exp: number;
}

/**
 * Verify the session cookie. This is the only place the caller's identity comes from.
 *
 * The cookie is `<base64url(json)>.<base64url(hmac)>`, signed with SESSION_SECRET by
 * whatever issues sessions for the real app. Until that exists, POST /session mints one
 * from the demo roster — opt-in via DEMO_SESSIONS, and hard-refused once REAL_DATA is on,
 * because the failure mode of getting that wrong is "anyone is an admin".
 */
async function verifySession(req: Request, env: Env): Promise<SessionClaims | null> {
  const cookie = req.headers.get("Cookie") ?? "";
  const raw = /(?:^|;\s*)tru_session=([^;]+)/.exec(cookie)?.[1];
  if (!raw) return null;

  const [payload, sig] = decodeURIComponent(raw).split(".");
  if (!payload || !sig) return null;

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
  );
  const ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), new TextEncoder().encode(payload));
  if (!ok) return null;

  try {
    const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload))) as SessionClaims;
    if (claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Mint a signed session cookie. Demo only — see DEMO_SESSIONS. */
async function signSession(env: Env, claims: SessionClaims): Promise<string> {
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify(claims)));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${bytesToB64url(new Uint8Array(sig))}`;
}

function bytesToB64url(b: Uint8Array): string {
  let bin = "";
  for (const byte of b) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/* ------------------------------------------------------------------ CORS */

function cors(req: Request, env: Env): Record<string, string> | null {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

/* ------------------------------------------------------------- RATE LIMIT */

async function underLimit(env: Env, key: string, ceiling: number): Promise<boolean> {
  if (!env.AUDIT) return true;
  const bucket = `rl:${key}:${Math.floor(Date.now() / 3_600_000)}`;
  const n = Number((await env.AUDIT.get(bucket)) ?? "0");
  if (n >= ceiling) return false;
  await env.AUDIT.put(bucket, String(n + 1), { expirationTtl: 7200 });
  return true;
}

/* -------------------------------------------------------------- KIMI CALL */

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

async function callKimi(env: Env, model: string, temperature: number, maxTokens: number, messages: ChatMessage[], tools: unknown[]) {
  const res = await fetch(`${KIMI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.KIMI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(tools.length ? { tools, tool_choice: "auto" } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Kimi ${res.status}: ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as {
    choices: { message: ChatMessage; finish_reason: string }[];
  };
}

/* ------------------------------------------------------------------ MAIN */

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const headers = cors(req, env);
    if (!headers) return new Response("Origin not allowed", { status: 403 });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers });

    const url = new URL(req.url);

    // ---- POST /session — demo sign-in. Explicitly opt-in, and hard-refused once the
    //      Worker is pointed at real records, because there is no password check here.
    if (url.pathname === "/session") {
      if (env.DEMO_SESSIONS !== "true" || env.REAL_DATA === "true") {
        return json({ error: "Demo sessions are disabled on this gateway." }, 403, headers);
      }
      const { email } = (await req.json()) as { email?: string };
      const account = DEMO_ACCOUNTS[(email ?? "").trim().toLowerCase()];
      if (!account) return json({ error: "Unknown demo account." }, 401, headers);
      const cookie = await signSession(env, { ...account, exp: Math.floor(Date.now() / 1000) + 12 * 3600 });
      return new Response(JSON.stringify({ ok: true, role: account.role }), {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": "application/json",
          // SameSite=None because the app and the gateway are on different origins.
          "Set-Cookie": `tru_session=${encodeURIComponent(cookie)}; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=None`,
        },
      });
    }

    if (url.pathname !== "/chat") return new Response("Not found", { status: 404, headers });

    const body = (await req.json()) as {
      assistant: AgentId;
      messages: { role: "user" | "assistant"; content: string }[];
      input: string;
    };

    const def = AGENTS[body.assistant];
    if (!def) return json({ error: "Unknown assistant" }, 400, headers);

    // ---- identity. Note what is NOT read from the body: role, agentId, userId.
    const claims = await verifySession(req, env);
    if (def.roles !== null) {
      if (!claims) return json({ error: "Sign in required." }, 401, headers);
      if (!def.roles.includes(claims.role!)) {
        return json({ error: "Your role cannot use this assistant." }, 403, headers);
      }
    }

    const caller: Caller = {
      agentId: def.id,
      role: claims?.role ?? null,
      bookAgentId: claims?.agentId ?? null,
      userId: claims?.userId ?? null,
      sessionId: claims?.userId ?? `anon:${req.headers.get("CF-Connecting-IP") ?? "?"}`,
    };

    const limits = LIMITS[def.id];
    if (body.input.length > limits.maxInputChars) {
      return json({ error: `Message too long (max ${limits.maxInputChars}).` }, 413, headers);
    }
    if (!(await underLimit(env, caller.sessionId, limits.messagesPerHour))) {
      return json({ error: "Too many messages this hour. Try again shortly." }, 429, headers);
    }

    const scope = scopeFor(caller);
    const audit: ReturnType<typeof auditEntry>[] = [];

    const messages: ChatMessage[] = [
      { role: "system", content: def.systemPrompt },
      ...body.messages.slice(-20).map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
      { role: "user", content: body.input },
    ];
    const tools = toolSchemasFor(def.tools);

    const steps: { tool: string; kind: string; ok: boolean; note?: string }[] = [];
    let pending: unknown = undefined;

    // ---- the tool loop. Bounded, because a model that keeps calling tools is a model
    //      that is stuck, and an unbounded loop here is a bill.
    for (let round = 0; round < limits.toolCallsPerTurn; round++) {
      let completion;
      try {
        completion = await callKimi(env, def.model.name, def.model.temperature, def.model.maxTokens, messages, tools);
      } catch (err) {
        return json({ error: "The assistant service is unavailable.", detail: String(err).slice(0, 200) }, 502, headers);
      }

      const choice = completion.choices[0];
      const calls = choice.message.tool_calls ?? [];

      if (!calls.length) {
        await flush(env, audit);
        return json({ content: choice.message.content ?? "", steps, pending }, 200, headers);
      }

      messages.push(choice.message);

      for (const call of calls) {
        const name = call.function.name;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* malformed — treat as empty */ }

        // The check that matters. Re-run here against the gateway's own identity, never
        // the browser's claim, for every call including ones the browser already allowed.
        const decision = allowTool(caller, name);
        if (!decision.allowed) {
          audit.push(auditEntry(caller, name, args, "refused", decision.reason));
          steps.push({ tool: name, kind: "refused", ok: false, note: decision.reason });
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ refused: true, reason: decision.reason }) });
          continue;
        }

        const tool = TOOL_BY_NAME.get(name);
        if (!tool) {
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: "No such tool." }) });
          continue;
        }

        let result: unknown;
        try {
          result = tool.run(args, scope);
        } catch (err) {
          audit.push(auditEntry(caller, name, args, "error", String(err).slice(0, 200)));
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: "Tool failed." }) });
          continue;
        }

        // A write is never applied here. It is handed back for the person to confirm, and
        // the application performs it through its own store action.
        if (isWriteIntent(result)) {
          pending = result;
          audit.push(auditEntry(caller, name, args, "confirmed", result.summary));
          steps.push({ tool: name, kind: "operate", ok: true });
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ awaitingConfirmation: true, summary: result.summary }) });
          continue;
        }

        audit.push(auditEntry(caller, name, args, "allowed"));
        steps.push({ tool: name, kind: tool.kind, ok: true });
        // Redaction happens here — after execution, before the transcript. A tool may
        // compute over a field it is not allowed to return.
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(redactFor(def.id, result)).slice(0, 24_000) });
      }
    }

    await flush(env, audit);
    return json({ content: "I ran out of steps working on that. Ask me something narrower.", steps, pending }, 200, headers);
  },
};

async function flush(env: Env, entries: ReturnType<typeof auditEntry>[]) {
  if (!env.AUDIT || !entries.length) return;
  const stamp = `audit:${Date.now()}:${crypto.randomUUID()}`;
  // 400 days: comfortably past a NY record-retention review of the year just closed.
  await env.AUDIT.put(stamp, JSON.stringify(entries), { expirationTtl: 400 * 86400 });
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
