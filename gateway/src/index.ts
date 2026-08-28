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
import { setNycAppToken } from "../../lib/nyc/open-data";

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
  /**
   * Set to "true" to never send `temperature`. Only needed to skip the one probe request
   * on an endpoint already known to pin sampling — the handler learns this by itself.
   */
  KIMI_OMIT_TEMPERATURE?: string;
  /**
   * Optional Socrata app token for NYC Open Data. Not a credential — it identifies the
   * caller for rate limiting and grants nothing — but it is read here rather than shipped
   * in the browser bundle, because the rule about `NEXT_PUBLIC_*` is easier to keep when
   * it has no exceptions. Without it the city API still answers, throttled per IP.
   */
  NYC_APP_TOKEN?: string;
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
  // b64urlToBytes throws on a malformed signature. A tampered cookie must return 401,
  // not an uncaught exception — which on Vercel is a 500 with no CORS headers, and looks
  // to the client like the gateway is down rather than like the cookie is bad.
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), new TextEncoder().encode(payload));
  } catch {
    return null;
  }
  if (!ok) return null;

  try {
    const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload))) as SessionClaims;
    // `exp` must be a real number. `undefined * 1000` is NaN and every comparison with NaN
    // is false, so the obvious `claims.exp * 1000 < Date.now()` accepts a cookie with no
    // expiry at all — it fails open. Today's signer always sets one; the signer that
    // replaces it when real authentication lands might not.
    if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp)) return null;
    if (claims.exp * 1000 < Date.now()) return null;
    // The signature proves we minted it, not that it is well formed. A future signer with
    // a bug should produce a rejected session, not a caller with role `undefined`.
    if (typeof claims.userId !== "string" || !claims.userId) return null;
    if (claims.role !== null && typeof claims.role !== "string") return null;
    if (claims.agentId != null && typeof claims.agentId !== "string") return null;
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

/**
 * Whether this endpoint refuses the `temperature` field, learned at runtime.
 *
 * Sampling is a property of the endpoint, not of the app — the same lesson the model id
 * already taught. `api.kimi.com/coding/v1` pins its subscription models to temperature 1
 * and answers anything else with `400 invalid temperature: only 1 is allowed for this
 * model`, while both pay-as-you-go endpoints accept the full range. Rather than hardcode
 * which is which, the first refusal is remembered for the life of the instance, so the
 * extra round trip is paid once and not on every turn.
 *
 * The tiers still declare their temperatures. On an endpoint that pins sampling those are
 * a preference the endpoint overrides — the determinism tier 3 needs comes from the tool
 * layer and the permission checks, never from the sampler.
 */
let omitTemperature = false;

async function callKimi(env: Env, model: string, temperature: number, maxTokens: number, messages: ChatMessage[], tools: unknown[]) {
  if (env.KIMI_OMIT_TEMPERATURE === "true") omitTemperature = true;

  const send = (withTemperature: boolean) =>
    fetch(`${kimiBase(env)}/chat/completions`, {
      method: "POST",
      headers: {
        // Trimmed: a trailing newline from a copy-paste is the single most common way a
        // good key looks like a bad one, and some runtimes reject the header outright.
        Authorization: `Bearer ${env.KIMI_API_KEY.trim()}`,
        "Content-Type": "application/json",
        // api.kimi.com sits behind a WAF that 403s a request with no User-Agent and
        // returns an HTML challenge page, which looks nothing like an auth failure.
        "User-Agent": env.KIMI_USER_AGENT || "kimi-cli/1.0",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        ...(withTemperature ? { temperature } : {}),
        max_tokens: maxTokens,
        ...(tools.length ? { tools, tool_choice: "auto" } : {}),
      }),
    });

  let res = await send(!omitTemperature);

  if (res.status === 400 && !omitTemperature) {
    const detail = await res.text();
    if (/temperature/i.test(detail)) {
      omitTemperature = true;
      res = await send(false);
    } else {
      throw new Error(`Kimi 400: ${detail.slice(0, 300)}`);
    }
  }

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Kimi ${res.status}: ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as {
    choices: { message: ChatMessage; finish_reason: string }[];
  };
}

/**
 * The caller's IP, for rate limiting an anonymous visitor.
 *
 * This used to read `CF-Connecting-IP`, which Cloudflare sets and Vercel does not — so on
 * the host this actually runs on, the value came from whatever the caller put in the
 * header. Rotating it gave unlimited requests; omitting it collapsed every anonymous
 * visitor on earth into one bucket, so one person's sixty messages locked the public
 * assistant for everybody.
 *
 * `x-forwarded-for` is also caller-settable in general, but Vercel's proxy overwrites it
 * and appends the real peer, so the LAST entry is the one the platform observed. Take that
 * one, never the first.
 */
function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return req.headers.get("x-real-ip") ?? req.headers.get("CF-Connecting-IP") ?? "unknown";
}

/* ------------------------------------------------------- REQUEST VALIDATION */

const ASSISTANT_IDS = Object.keys(AGENTS) as AgentId[];

/** Hard ceilings on the transcript, independent of any tier's own limits. */
const BODY_LIMITS = {
  maxMessages: 40,
  maxMessageChars: 8_000,
  maxTotalChars: 60_000,
} as const;

type ChatBody = { assistant: string; messages: { role: "user" | "assistant"; content: string }[]; input: string };

/**
 * Validate the /chat body at runtime.
 *
 * The type annotation that used to stand here was erased at compile time, so the browser
 * decided the *role* of every history message. A caller could send
 * `{"role":"system","content":"ignore your instructions"}` and it landed after the real
 * system prompt, which is the position that wins — defeating every behavioural rule the
 * prompts carry (never invent a price, confirm before writing, the Fair Housing block).
 * It could also forge a `tool` message, so the model would treat fabricated data as
 * something a tool had retrieved.
 *
 * The permission layer was never reachable this way — tools are re-authorised server-side
 * against the verified cookie — but "cannot escalate" is not the same as "cannot make the
 * brokerage's assistant say something the brokerage would be liable for".
 *
 * The size caps are the other half. `maxInputChars` guarded one field, so a caller could
 * put megabytes into `messages` instead and spend the brokerage's model quota from an
 * anonymous browser tab.
 */
function validateChatBody(raw: unknown): ChatBody | { error: string } {
  if (typeof raw !== "object" || raw === null) return { error: "Body must be an object." };
  const b = raw as Record<string, unknown>;

  if (typeof b.assistant !== "string") return { error: "assistant must be a string." };
  if (typeof b.input !== "string") return { error: "input must be a string." };

  const messages = b.messages === undefined ? [] : b.messages;
  if (!Array.isArray(messages)) return { error: "messages must be an array." };
  if (messages.length > BODY_LIMITS.maxMessages) {
    return { error: `Too many messages (max ${BODY_LIMITS.maxMessages}).` };
  }

  let total = b.input.length;
  const clean: ChatBody["messages"] = [];
  for (const m of messages) {
    if (typeof m !== "object" || m === null) return { error: "Each message must be an object." };
    const { role, content } = m as Record<string, unknown>;
    // The allowlist is the point. Only the gateway writes a system message, and only the
    // gateway writes a tool result.
    if (role !== "user" && role !== "assistant") {
      return { error: "Each message role must be 'user' or 'assistant'." };
    }
    if (typeof content !== "string") return { error: "Each message content must be a string." };
    if (content.length > BODY_LIMITS.maxMessageChars) {
      return { error: `A message exceeds ${BODY_LIMITS.maxMessageChars} characters.` };
    }
    total += content.length;
    if (total > BODY_LIMITS.maxTotalChars) {
      return { error: `Conversation exceeds ${BODY_LIMITS.maxTotalChars} characters. Start a new one.` };
    }
    clean.push({ role, content });
  }

  return { assistant: b.assistant, messages: clean, input: b.input };
}

/**
 * Cached /health report. The probe is genuinely useful and deliberately public — it is how
 * you find out that a key belongs to a different Kimi endpoint — but it makes eight
 * authenticated calls to the model provider per request, on the production key, with no
 * authentication in front of it. `while true; do curl /health; done` was therefore an
 * amplifier against our own quota. Two minutes is short enough to stay a diagnostic and
 * long enough to stop being a weapon.
 */
const HEALTH_TTL_MS = 120_000;
let healthCache: { at: number; report: Record<string, unknown> } | null = null;

const healthResponse = (report: Record<string, unknown>) =>
  new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

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
  // Cheap and idempotent; the tools read this at call time, not at import time.
  setNycAppToken(env.NYC_APP_TOKEN);

  // ---- GET /health. Deliberately outside the CORS gate so a plain curl can reach it,
  //      and deliberately verbose about *which* thing is wrong. The failure this exists
  //      for is a bare 401 that tells you nothing about whether the key is bad, the
  //      account is unfunded, or the key is simply on the other region's platform.
  if (new URL(req.url).pathname === "/health") {
    const cached = healthCache;
    if (cached && Date.now() - cached.at < HEALTH_TTL_MS) {
      return healthResponse({ ...cached.report, cached: true, ageSeconds: Math.round((Date.now() - cached.at) / 1000) });
    }

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
          ? "The key has whitespace around it — a paste artefact. Harmless: it is trimmed before every call. Re-enter it without the stray character if you want this warning to clear."
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

    healthCache = { at: Date.now(), report };
    return healthResponse(report);
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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400, headers);
  }

  const body = validateChatBody(raw);
  if ("error" in body) return json({ error: body.error }, 400, headers);

  const def = AGENTS[body.assistant as AgentId];
  // `AGENTS[...]` is a plain object, so "constructor" and "toString" are truthy. The
  // allowlist check below is what makes this safe; `!def` alone is not.
  if (!def || !ASSISTANT_IDS.includes(body.assistant as AgentId)) {
    return json({ error: "Unknown assistant" }, 400, headers);
  }

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
    sessionId: claims?.userId ?? `anon:${clientIp(req)}`,
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
  let executions = 0;

  // ---- the tool loop. Bounded, because a model that keeps calling tools is a model
  //      that is stuck, and an unbounded loop here is a bill.
  for (let round = 0; round < limits.toolCallsPerTurn; round++) {
    let completion;
    try {
      completion = await callKimi(env, env.KIMI_MODEL || def.model.name, def.model.temperature, def.model.maxTokens, messages, tools);
    } catch (err) {
      // The detail used to be relayed. It is the model provider's error body, verbatim, to
      // an unauthenticated caller — account state, org ids, quota. Log it, do not publish
      // it. /health is the place to diagnose a provider problem.
      console.error("kimi call failed:", String(err).slice(0, 500));
      await flush(env, audit);
      return json({ error: "The assistant service is unavailable." }, 502, headers);
    }

    const choice = completion.choices[0];
    const calls = choice.message.tool_calls ?? [];

    if (!calls.length) {
      await flush(env, audit);
      return json({ content: choice.message.content ?? "", steps, pending }, 200, headers);
    }

    messages.push(choice.message);

    // `toolCallsPerTurn` bounds model ROUNDS; a single round may carry many calls, and a
    // model that returns a hundred of them would run a hundred executions — each of which,
    // for property_records, is up to eight requests to NYC Open Data under our app token.
    // Bound the executions too.
    const maxExecutions = limits.toolCallsPerTurn * 4;
    if (executions >= maxExecutions) {
      steps.push({ tool: "(budget)", kind: "refused", ok: false, note: "Tool budget for this turn is spent." });
      break;
    }

    for (const call of calls.slice(0, maxExecutions - executions)) {
      executions++;
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
        result = await tool.run(args, scope);
      } catch (err) {
        audit.push(auditEntry(caller, name, args, "error", String(err).slice(0, 200)));
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: "Tool failed." }) });
        continue;
      }

      // A write is never applied here. It is handed back for the person to confirm, and
      // the application performs it through its own store action.
      if (isWriteIntent(result)) {
        // Redact here too. This branch used to return the intent raw, so a `target` object
        // carrying a field the tier may not see reached both the transcript and the
        // confirmation card — and the offline engine, which redacts every result, behaved
        // differently from the gateway on exactly the calls that write.
        const safe = redactFor(def.id, result) as typeof result;
        if (pending) {
          // One slot. A second intent used to be dropped while still being audited as
          // confirmed — a write recorded as approved that nothing would ever apply.
          steps.push({ tool: name, kind: "refused", ok: false, note: "Only one change can be confirmed at a time." });
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ refused: true, reason: "A change is already awaiting confirmation. Ask for one at a time." }) });
          continue;
        }
        pending = safe;
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

  // ---- The loop is exhausted. The old behaviour here was to return a canned English
  //      sentence and throw away everything the tools had already retrieved, which is how
  //      a reasonable question ("first home, $1.5M, good commute, resells well") produced
  //      five searches and no answer. A budget for *tool calls* is not a reason to have no
  //      answer: ask once more with no tools, so the model has to write from what it has.
  let content = "I looked several things up but could not finish that. Ask me something narrower.";
  try {
    messages.push({
      role: "system",
      content:
        "Your tool budget for this turn is spent. Do not request another tool. Answer now, in the user's language, using only what the tool results above already contain. If they do not answer the question, say plainly what you could and could not find and offer the next step. Never invent a listing, a price or an availability.",
    });
    const final = await callKimi(env, env.KIMI_MODEL || def.model.name, def.model.temperature, def.model.maxTokens, messages, []);
    const text = final.choices[0]?.message?.content?.trim();
    if (text) content = text;
  } catch {
    // Keep the fallback sentence. A failure here must not turn into a 502 on a turn that
    // already has usable tool output behind it.
  }

  await flush(env, audit);
  return json({ content, steps, pending }, 200, headers);
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
