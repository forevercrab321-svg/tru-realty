/**
 * Deno Deploy entry point for the Tru Realty AI gateway.
 *
 * This exists because of a fact that took a while to pin down: **`api.kimi.com` returns a
 * Cloudflare bot-protection page to any request originating from a Cloudflare Worker.**
 * The evidence is unambiguous —
 *
 *   from a normal client:   GET https://api.kimi.com/coding/v1/models
 *                           → 401 {"error":{"message":"Invalid Authentication"}}
 *   from a Cloudflare Worker, same URL, same key, same headers:
 *                           → 403 <!DOCTYPE html> … Cloudflare block page
 *
 * A JSON 401 means the request reached Kimi and was evaluated. An HTML 403 means it never
 * got there. Kimi's own error reference documents 403 only as a quota condition returned
 * as JSON, so the HTML page is not theirs — it is the edge in front of them refusing the
 * traffic. No User-Agent or header change fixes that from inside a Worker.
 *
 * So the gateway runs here instead. Everything else is identical: `handle()` is the same
 * function, with the same permission checks, the same redaction and the same audit log.
 * The only runtime-specific parts are the two shims below.
 *
 * Deploy:
 *   deno install -gArf jsr:@deno/deployctl
 *   cd gateway/deno
 *   deployctl deploy --project=tru-ai-gateway --entrypoint=main.ts
 *
 * Then set the secrets in the Deno Deploy dashboard (Settings → Environment Variables):
 *   KIMI_API_KEY, SESSION_SECRET, ALLOWED_ORIGINS, KIMI_BASE_URL, KIMI_MODEL,
 *   DEMO_SESSIONS, REAL_DATA
 */

// The bundle, not the source: the handler imports the app's `lib/ai/*` modules with
// extensionless specifiers, which Deno will not resolve. `node gateway/build-deno.mjs`
// regenerates it. It is committed so this deploys without a build step.
import { handle } from "./gateway.bundle.js";

type Store = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
};

/**
 * Deno KV behind the same two-method interface the handler expects. `expirationTtl` is
 * seconds in the Workers API and milliseconds in Deno KV — converting it here rather than
 * in the handler keeps the runtime difference in the adapter, where it belongs.
 */
function denoStore(kv: Deno.Kv): Store {
  return {
    async get(key) {
      const r = await kv.get<string>([key]);
      return r.value ?? null;
    },
    async put(key, value, opts) {
      await kv.set([key], value, opts?.expirationTtl ? { expireIn: opts.expirationTtl * 1000 } : undefined);
    },
  };
}

// Deno KV is unavailable on some plans; the audit log and rate limits are optional by
// design, so a failure here degrades rather than refusing to boot.
let store: Store | undefined;
try {
  store = denoStore(await Deno.openKv());
} catch {
  store = undefined;
}

const env = {
  KIMI_API_KEY: Deno.env.get("KIMI_API_KEY") ?? "",
  SESSION_SECRET: Deno.env.get("SESSION_SECRET") ?? "",
  ALLOWED_ORIGINS: Deno.env.get("ALLOWED_ORIGINS") ?? "",
  KIMI_BASE_URL: Deno.env.get("KIMI_BASE_URL"),
  KIMI_MODEL: Deno.env.get("KIMI_MODEL"),
  KIMI_USER_AGENT: Deno.env.get("KIMI_USER_AGENT"),
  KIMI_OMIT_TEMPERATURE: Deno.env.get("KIMI_OMIT_TEMPERATURE"),
  DEMO_SESSIONS: Deno.env.get("DEMO_SESSIONS"),
  REAL_DATA: Deno.env.get("REAL_DATA"),
  AUDIT: store,
} as Parameters<typeof handle>[1];

Deno.serve((req) => handle(req, env));
