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

export interface Store {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  /** `wrangler secret put KIMI_API_KEY`. Never a var, never in wrangler.toml, never in git. */
  KIMI_API_KEY: string;
  /** HMAC key for session cookies. `wrangler secret put SESSION_SECRET`. */
  SESSION_SECRET: string;
  /**
   * Audit log and rate-limit storage. Deliberately a two-method interface rather than a
   * `KVNamespace`, because this handler has to run somewhere that is not Cloudflare — see
   * the header comment — and the only thing it needs from a key-value store is get and put.
   */
  AUDIT?: Store;
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
  /**
   * Moonshot runs two region-partitioned platforms and the keys are NOT interchangeable —
   * a key issued on one returns a bare 401 "Invalid Authentication" on the other, with
   * nothing in the message to tell you that is what happened.
   *
   *   https://api.moonshot.ai/v1   keys from platform.kimi.ai       (international)
   *   https://api.moonshot.cn/v1   keys from platform.moonshot.cn   (China)
   *
   * Set it to match wherever the key came from. GET /health reports which one is live and
   * whether the key actually works against it.
   */
  KIMI_BASE_URL?: string;
  /**
   * Overrides the model id for every tier. Model ids are a property of the endpoint, not
   * of the app: the platform API calls it `kimi-k3`, the Kimi Code subscription endpoint
   * calls the same model `k3`. Set this to match wherever KIMI_BASE_URL points.
   */
  KIMI_MODEL?: string;
  /** Sent on every outbound call. Some Kimi endpoints WAF-block an empty User-Agent. */
  KIMI_USER_AGENT?: string;
}

const DEFAULT_KIMI_BASE = "https://api.moonshot.ai/v1";
const kimiBase = (env: Env) => (env.KIMI_BASE_URL ?? DEFAULT_KIMI_BASE).replace(/\/+$/, "");

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
  const res = await fetch(`${kimiBase(env)}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.KIMI_API_KEY}`,
      "Content-Type": "application/json",
      // api.kimi.com sits behind a WAF that 403s a request with no User-Agent and
      // returns an HTML challenge page, which looks nothing like an auth failure.
      "User-Agent": env.KIMI_USER_AGENT || "kimi-cli/1.0",
      Accept: "application/json",
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

/**
 * The whole gateway, as a plain (Request, Env) => Response function.
 *
 * It is written against Web standards only — fetch, Request, Response, crypto.subtle — so
 * the same file runs on Cloudflare Workers, Deno Deploy, Netlify, Bun or Node 18+. That
 * portability is not theoretical: `api.kimi.com` returns a Cloudflare bot-protection page
 * to requests originating from Cloudflare Workers, so the Kimi Code subscription endpoint
 * is unreachable from a Worker no matter what headers you send. See gateway/README.md.
 */
export async function handle(req: Request, env: Env): Promise<Response> {
  // ---- GET /health. Deliberately outside the CORS gate so a plain curl can reach it,
  //      and deliberately verbose about *which* thing is wrong. The failure this exists
  //      for is a bare 401 that tells you nothing about whether the key is bad, the
  //      account is unfunded, or the key is simply on the other region's platform.
  if (new URL(req.url).pathname === "/health") {
    const base = kimiBase(env);
    const report: Record<string, unknown> = {
      worker: "ok",
      kimiBaseUrl: base,
      secrets: {
        KIMI_API_KEY: env.KIMI_API_KEY ? "set" : "MISSING",
        SESSION_SECRET: env.SESSION_SECRET ? "set" : "MISSING",
      },
      bindings: { AUDIT: env.AUDIT ? "bound" : "not bound (audit log and rate limits are off)" },
      demoSessions: env.DEMO_SESSIONS === "true" && env.REAL_DATA !== "true",
      allowedOrigins: env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
    };

    if (env.KIMI_API_KEY) {
      const k = env.KIMI_API_KEY;
      // The key's SHAPE, never the key. Length, prefix and stray whitespace are what
      // actually go wrong, and none of them are usable by themselves. Flip-flopping
      // between endpoints one deploy at a time wastes more time than it saves, so both
      // are probed in one call.
      report.keyShape = {
        length: k.length,
        prefix: k.slice(0, 3),
        hasWhitespace: /\s/.test(k),
        looksLikeMoonshotKey: k.startsWith("sk-"),
        note: /\s/.test(k)
          ? "The key contains whitespace or a newline — almost certainly a paste artefact. Re-run `wrangler secret put KIMI_API_KEY` and paste without a trailing newline."
          : !k.startsWith("sk-")
            ? "Moonshot platform keys start with `sk-`. This does not, so it is probably not a Developer Platform API key — a Kimi app subscription does not issue one."
            : undefined,
      };

      const ua = env.KIMI_USER_AGENT || "kimi-cli/1.0";

      /**
       * A block page is only a useful diagnostic if you can read what it says. Cloudflare
       * numbers its rules — 1010 is "browser signature banned", 1020 a firewall rule,
       * 1015 rate limiting — and that number is the difference between "change the
       * User-Agent" and "this host will never accept traffic from a Worker".
       */
      const describe = (text: string) => {
        const html = text.trimStart().startsWith("<");
        if (!html) return { html: false, body: text.slice(0, 200) };
        const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text)?.[1]?.trim();
        const cfError = /Error\s*(?:code\s*)?(\d{4})/i.exec(text)?.[1]
          ?? /"errorCode"\s*:\s*"?(\d{4})/i.exec(text)?.[1];
        const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(text)?.[1]?.replace(/<[^>]+>/g, " ").trim();
        const what = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(text)?.[1]?.replace(/<[^>]+>/g, " ").trim();
        return {
          html: true,
          blockPage: { title, heading, detail: what, cloudflareError: cfError },
          meaning:
            cfError === "1010" ? "Cloudflare banned the client's browser signature. A different User-Agent may get through."
            : cfError === "1020" ? "A firewall rule on the origin denied this request. Often an ASN or country rule — Cloudflare Worker egress IPs are frequently on that list, and no header change will fix it."
            : cfError === "1015" ? "Rate limited."
            : cfError === "1005" ? "The origin banned this ASN outright."
            : undefined,
        };
      };
      const auth = {
        Authorization: `Bearer ${k}`,
        "User-Agent": ua,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      /**
       * Two probes, because `/models` is not universal. The subscription endpoint answers
       * chat but may not enumerate models, and a WAF in front of either returns HTML —
       * so the shape of the body matters as much as the status.
       */
      const probe = async (base: string, model: string) => {
        const out: Record<string, unknown> = {};
        try {
          const r = await fetch(`${base}/models`, { headers: auth });
          const text = await r.text();
          out.models = r.ok
            ? { ok: true, status: r.status, ids: (JSON.parse(text) as { data?: { id: string }[] }).data?.map((m) => m.id) }
            : { ok: false, status: r.status, ...describe(text) };
        } catch (err) {
          out.models = { ok: false, error: String(err).slice(0, 120) };
        }
        try {
          // The call that actually matters — one token, cheapest possible.
          const r = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers: auth,
            body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }], max_tokens: 1 }),
          });
          const text = await r.text();
          out.chat = { ok: r.ok, status: r.status, ...describe(text), cfRay: r.headers.get("cf-ray"), server: r.headers.get("server") };
        } catch (err) {
          out.chat = { ok: false, error: String(err).slice(0, 120) };
        }
        return { ...out, ok: (out.chat as { ok?: boolean }).ok === true } as {
          ok: boolean; models?: unknown; chat?: unknown;
        };
      };

      // Three places a Kimi key can be valid, and they do not overlap. A subscription
      // key is a real `sk-` key that 401s on both pay-as-you-go platforms, which reads
      // as "bad key" unless you know the third endpoint exists.
      const CANDIDATES: [string, string][] = [
        ["https://api.moonshot.ai/v1", "kimi-k3"],
        ["https://api.moonshot.cn/v1", "kimi-k3"],
        ["https://api.kimi.com/coding/v1", "k3"],
        ["https://api.kimi.com/coding/v1", "kimi-for-coding"],
      ];
      const results = await Promise.all(CANDIDATES.map(([u, m]) => probe(u, m)));
      report.endpoints = Object.fromEntries(CANDIDATES.map(([u, m], i) => [`${u} (${m})`, results[i]]));

      const idx = results.findIndex((r) => r.ok);
      const anyHtml = results.some((r) => {
        const c = r.chat as { html?: boolean } | undefined;
        return c?.html === true;
      });
      if (idx >= 0) {
        const [wu, wm] = CANDIDATES[idx];
        report.verdict =
          wu === base && wm === (env.KIMI_MODEL || "k3")
            ? `Working. KIMI_BASE_URL and KIMI_MODEL are correct.`
            : `Key works on ${wu} with model "${wm}". Set KIMI_BASE_URL="${wu}" and KIMI_MODEL="${wm}" and redeploy.`;
      } else if (anyHtml) {
        report.verdict =
          "An endpoint returned HTML rather than JSON — that is a WAF or bot-protection page, not an authentication failure. The request is being blocked before it reaches the API. Usually a User-Agent problem: set KIMI_USER_AGENT to whatever the official client sends.";
      } else {
        report.verdict =
          "Rejected everywhere with a real API error. Either the key is wrong, or the account behind it has no active subscription and no balance.";
      }
    }

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

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
      completion = await callKimi(env, env.KIMI_MODEL || def.model.name, def.model.temperature, def.model.maxTokens, messages, tools);
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
}

/** Cloudflare Workers entry point. Kept so the code still deploys there for other origins. */
export default { fetch: handle };

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
