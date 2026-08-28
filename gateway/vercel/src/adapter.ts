/**
 * Vercel entry point for the Tru Realty AI gateway.
 *
 * Deliberately the **Node.js runtime, not the Edge runtime.** Vercel's Edge Functions run
 * on Cloudflare's network, and Cloudflare egress is exactly what `api.kimi.com` refuses —
 * see gateway/README.md for the controlled comparison. Choosing Edge here would reproduce
 * the bug this file exists to avoid. Node functions run on AWS Lambda, a different network.
 *
 * Everything else is `handle()` — the same function, the same permission checks, the same
 * redaction, the same audit log. Only the adapter below is Vercel-specific.
 *
 * This file is the SOURCE. `npm run build:gateway` bundles it, with the handler and the
 * app's policy and tool modules inlined, into `api/gateway.mjs` — one self-contained file
 * with no imports to resolve. That is deliberate: a serverless builder has its own opinions
 * about extensions, `type: module` and sibling files, and none of them can go wrong if
 * there is nothing to resolve. Edit here, never in api/.
 *
 * ROUTING. The gateway answers /health, /session and /chat from one function, so
 * `vercel.json` rewrites every path to `/api/gateway` and the handler switches on the
 * pathname. That note lives here rather than in the JSON because `vercel.json` is
 * validated against a schema with `additionalProperties: false` — a `"// comment"` key is
 * not ignored, it is a hard "Invalid request" at import time. Keep that file free of
 * anything the schema does not name.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "../../src/index";

/*
 * No `export const config = { runtime: "edge" }` here, and there must never be one.
 * Vercel's Node.js runtime is the default for an `api/*.ts` function and runs on AWS
 * Lambda; opting into Edge would move it onto Cloudflare's network, which is exactly
 * what api.kimi.com refuses. The absence of that line is load-bearing.
 */

/** Node's request object into a Web `Request`, which is all the handler understands. */
async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `${proto}://${host}`);

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((one) => headers.append(k, one));
    else if (v != null) headers.set(k, v);
  }

  const method = req.method ?? "GET";
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    body = Buffer.concat(chunks).toString("utf8");
  }

  return new Request(url, { method, headers, body });
}

/**
 * In-memory audit and rate-limit storage.
 *
 * Lambda instances are recycled, so this is best-effort per instance — enough to blunt a
 * burst, not a durable log. For real supervision, back it with Vercel KV or Upstash and
 * swap the two methods; the handler only ever calls get and put.
 */
const mem = new Map<string, { value: string; expires: number }>();
const store = {
  async get(key: string) {
    const hit = mem.get(key);
    if (!hit || hit.expires < Date.now()) return null;
    return hit.value;
  },
  async put(key: string, value: string, opts?: { expirationTtl?: number }) {
    mem.set(key, { value, expires: Date.now() + (opts?.expirationTtl ?? 3600) * 1000 });
  },
};

const env = {
  KIMI_API_KEY: process.env.KIMI_API_KEY ?? "",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? "",
  KIMI_BASE_URL: process.env.KIMI_BASE_URL,
  KIMI_MODEL: process.env.KIMI_MODEL,
  KIMI_USER_AGENT: process.env.KIMI_USER_AGENT,
  KIMI_OMIT_TEMPERATURE: process.env.KIMI_OMIT_TEMPERATURE,
  DEMO_SESSIONS: process.env.DEMO_SESSIONS,
  REAL_DATA: process.env.REAL_DATA,
  AUDIT: store,
} as Parameters<typeof handle>[1];

export default async function gateway(req: IncomingMessage, res: ServerResponse) {
  const response = await handle(await toWebRequest(req), env);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    // Set-Cookie must not be folded into one comma-joined header.
    if (key.toLowerCase() === "set-cookie") res.appendHeader?.("Set-Cookie", value);
    else res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}
