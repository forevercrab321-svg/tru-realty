/**
 * Alibaba Cloud Function Compute (函数计算 FC 3.0) entry point.
 *
 * This is the host most likely to be *allowed* by `api.kimi.com`, because that is a China
 * service and this runs on a mainland network. It is also the one with the most setup, so
 * read the trade-off in gateway/README.md before choosing it — the cost is not the money,
 * it is the ICP filing.
 *
 * Runtime: Node.js 20. Handler: `index.handler`. HTTP trigger, auth type ANONYMOUS.
 *
 * FC's Node runtime gives you a Node request and response, so this is the same adapter
 * shape as the Vercel one. `handle()` underneath is identical to every other host.
 */

import { handle } from "./gateway.bundle.js";

/**
 * Best-effort per-instance storage for the audit log and rate limits. FC recycles
 * instances, so treat it as a burst damper rather than a durable record. For real
 * supervision, point these two methods at Tablestore or Redis — the handler never asks
 * for more than get and put.
 */
const mem = new Map();
const store = {
  async get(key) {
    const hit = mem.get(key);
    if (!hit || hit.expires < Date.now()) return null;
    return hit.value;
  },
  async put(key, value, opts) {
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
  DEMO_SESSIONS: process.env.DEMO_SESSIONS,
  REAL_DATA: process.env.REAL_DATA,
  AUDIT: store,
};

async function toWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.path ?? req.url ?? "/", `${proto}://${host}`);
  if (req.queries) {
    for (const [k, v] of Object.entries(req.queries)) url.searchParams.set(k, String(v));
  }

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers ?? {})) {
    if (Array.isArray(v)) v.forEach((one) => headers.append(k, one));
    else if (v != null) headers.set(k, String(v));
  }

  const method = req.method ?? "GET";
  let body;
  if (method !== "GET" && method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks).toString("utf8");
  }

  return new Request(url, { method, headers, body });
}

export const handler = async (req, resp, _context) => {
  const response = await handle(await toWebRequest(req), env);

  resp.setStatusCode(response.status);
  const cookies = [];
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") cookies.push(value);
    else resp.setHeader(key, value);
  });
  // FC folds repeated headers, so Set-Cookie is set once per value where supported.
  for (const c of cookies) resp.setHeader("Set-Cookie", c);

  resp.send(Buffer.from(await response.arrayBuffer()));
};
