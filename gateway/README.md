# AI gateway

The service that holds the Kimi key. Deploy it and the three assistants stop being a demo.

> **Do not run it on Cloudflare Workers if you are using a Kimi Code subscription key.**
> `api.kimi.com` serves a Cloudflare bot-protection page to requests originating from
> Cloudflare Workers, so the subscription endpoint is unreachable from a Worker. Four
> deploy targets and the evidence are below.

## Why this exists at all

The app is `output: "export"` — a folder of static files on a CDN. There is no server, which
means **there is nowhere in the app to keep a secret**. Anything you put in
`NEXT_PUBLIC_*` or in client-side code is in the bundle, and the bundle is public. A Kimi
key shipped that way can be read by anyone who opens devtools, and the first thing that
happens is someone else spending the month's quota.

So the key lives here instead, in a Worker secret, and the browser talks to this Worker.

## Before you start: the API is not the subscription

A **Kimi membership** (the monthly plan in the Kimi app, including the coding-tool tiers)
and the **Kimi Developer Platform API** are two separate products with separate billing.
Moonshot's own FAQ is explicit: paying for a membership does not grant general-purpose API
credits. You need an account at `platform.kimi.ai`, funded separately, and the key it
issues.

If you skip this, the app still works — it falls back to the offline engine, which runs the
same tools with the same permission checks and shows the data instead of prose. It is
labelled as offline in the window, so nobody in a demo is misled.

## Which host, and why it matters

`api.kimi.com` — the endpoint a Kimi Code / membership subscription key uses — refuses
traffic from Cloudflare Workers:

| From | Request | Response |
|---|---|---|
| A normal client | `GET https://api.kimi.com/coding/v1/models` | `401 {"error":{"message":"Invalid Authentication"}}` |
| A Cloudflare Worker | the same URL, same key, same headers | `403 <!DOCTYPE html>` — a Cloudflare block page |

A JSON 401 means the request reached Kimi and was evaluated. An HTML 403 means it never
arrived. Kimi's own error reference documents 403 only as a quota condition returned as
JSON, so that page is not theirs — it is the edge in front of them refusing the traffic.
Changing the User-Agent does not help; it is not a header problem.

The Worker *can* reach both pay-as-you-go platforms — `/health` gets a proper JSON 401
from each. Only `api.kimi.com` refuses it. So the choice is really about which key you have:

| Your key | Host | Why |
|---|---|---|
| **Pay-as-you-go** (`platform.moonshot.cn` / `platform.kimi.ai`) | The Cloudflare Worker you already deployed | Verified working. Nothing new to set up. Costs per token. |
| **Kimi Code / membership subscription** | Vercel, Alibaba Function Compute, or Deno Deploy | Uses your monthly quota. Needs a non-Cloudflare host. |

`handle()` in `src/index.ts` is written against Web standards only — `fetch`, `Request`,
`Response`, `crypto.subtle` — so all four targets run the same code, the same permission
checks, the same redaction and the same audit log. Only a ~20-line adapter differs, and
`KVNamespace` was replaced by a two-method `Store` interface to make that true.

### Picking one

**Vercel** if you already pay for it: marginal cost is zero and it is five minutes. Use the
**Node.js runtime, not Edge** — Vercel Edge Functions run on Cloudflare's network, which is
the thing being blocked. `gateway/vercel/api/gateway.ts` pins this.

**Alibaba Function Compute** is the most likely to be *allowed*, because `api.kimi.com` is a
China service and this is a mainland network. Compute is nearly free. The real cost is the
ICP filing: FC's built-in domain is documented as test-only, and a public-facing service in
a mainland region wants a filed custom domain — typically one to three weeks. A Hong Kong
region skips the filing but also skips the one technical advantage. See
`gateway/aliyun/README.md`.

**Deno Deploy** is free and needs no card, but like Vercel it is a foreign network, so
whether `api.kimi.com` accepts it is unverified.

None of the three foreign hosts is *known* to work — the only thing measured so far is that
a residential connection works and Cloudflare Workers does not. Each is a five-minute test:
deploy, then `curl /health` and read `verdict`.

## Deploy - Vercel

Vercel no longer supports an `env` key in `vercel.json`, so all seven variables are
project Environment Variables. Set them in the dashboard during import (its field accepts
a pasted `.env` block), or from the CLI:

```bash
cd gateway/vercel
```
```bash
npx vercel login
```
```bash
npx vercel link --yes
```

The five that are not secrets:

```bash
printf 'ALLOWED_ORIGINS\nKIMI_BASE_URL\nKIMI_MODEL\nDEMO_SESSIONS\nREAL_DATA\n' | while read n; do echo "add $n"; done
```

| Name | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://forevercrab321-svg.github.io,http://localhost:3000,http://localhost:4000` |
| `KIMI_BASE_URL` | `https://api.kimi.com/coding/v1` |
| `KIMI_MODEL` | `k3` |
| `DEMO_SESSIONS` | `true` |
| `REAL_DATA` | `false` |

Then the two that are, each prompting for its value:

```bash
npx vercel env add KIMI_API_KEY production
```
```bash
openssl rand -base64 48 | pbcopy
```
```bash
npx vercel env add SESSION_SECRET production
```
```bash
npx vercel deploy --prod
```

Then confirm, and read `verdict`:

```bash
curl -s https://<the-url-vercel-printed>/health
```

The login is interactive and belongs to you — nothing here needs your token.

**Node.js runtime, on purpose.** It is the default for an `api/*` function and runs on AWS
Lambda. Vercel's Edge Functions run on Cloudflare's network, which is precisely what
`api.kimi.com` refuses — so there is no `runtime: "edge"` export in the adapter, and adding
one would reintroduce the bug this host exists to avoid.

**`api/gateway.mjs` is generated.** Edit `src/adapter.ts` and run `npm run build:gateway`
from the repo root. The function ships as one self-contained file with nothing to resolve,
because a serverless builder has its own opinions about extensions, `type: module` and
sibling imports, and none of them can go wrong when there is nothing left to import.

One limitation to know: the audit log and rate limits are per-instance memory on Vercel,
and Lambda recycles instances. That blunts a burst but is not a durable record. For real
supervision, point the `store` get/put at Vercel KV or Upstash — the handler asks for
nothing more than those two methods.

## Deploy - Alibaba Function Compute

See `gateway/aliyun/README.md` — it is a console flow rather than a CLI one, and the
备案 trade-off is written out there.

## Deploy - Deno Deploy

```bash
deno install -gArf jsr:@deno/deployctl
```
```bash
cd gateway/deno
```
```bash
deployctl deploy --project=tru-ai-gateway --entrypoint=main.ts
```

Then in the Deno Deploy dashboard, **Settings -> Environment Variables**, add:

| Name | Value |
|---|---|
| `KIMI_API_KEY` | your key |
| `SESSION_SECRET` | generate with `openssl rand -base64 48 \| pbcopy` |
| `ALLOWED_ORIGINS` | `https://forevercrab321-svg.github.io,http://localhost:3000,http://localhost:4000` |
| `KIMI_BASE_URL` | `https://api.kimi.com/coding/v1` |
| `KIMI_MODEL` | `k3` |
| `DEMO_SESSIONS` | `true` |
| `REAL_DATA` | `false` |

Check it, then point the app at the new URL by updating the `AI_GATEWAY_URL` repository
variable on GitHub:

```bash
curl -s https://tru-ai-gateway.deno.dev/health
```

`gateway/deno/gateway.bundle.js` is generated by `npm run build:gateway` and committed, so
this deploys with no build step. Edit `gateway/src/index.ts` and rerun that script; never
edit the bundle.

## Deploy - Cloudflare Workers

Run these one line at a time. **Do not paste a line with a trailing `#` comment** — zsh does
not treat `#` as a comment interactively, so the note becomes an argument and the command
fails. That is how a `secret put` silently doesn't happen.

`npm install` is optional: it only installs types for your editor. `npx` fetches wrangler
itself, so deployment works without it.

```bash
cd gateway
npx wrangler login
```

The audit log and rate-limit buckets. The id it prints is already in `wrangler.toml`; run
this only if you are setting up a fresh account.

```bash
npx wrangler kv namespace create AUDIT
```

The two secrets. Each prompts for the value, which never touches a file or git.

```bash
npx wrangler secret put KIMI_API_KEY
npx wrangler secret put SESSION_SECRET
```

For the second one, generate the value first with `openssl rand -base64 48` and paste it.

```bash
npx wrangler deploy
```

Verify the secrets actually landed — this is the step worth not skipping:

```bash
npx wrangler secret list
```

Then point the app at it and rebuild:

```bash
NEXT_PUBLIC_AI_GATEWAY=https://tru-ai-gateway.<your-subdomain>.workers.dev npm run build
```

Add the deployed app's origin to `ALLOWED_ORIGINS` in `wrangler.toml` before you do, or the
gateway will refuse the request — which is the correct behaviour and worth seeing once.

## Signing in, so tiers 2 and 3 work

The assistants take their identity from a cookie **this Worker signs and verifies**, not
from anything the browser claims. The real app will mint that cookie from real auth. Until
then, `POST /session` mints one from the demo roster — no password check, which is correct
for seeded data and wrong for anything else. It is off unless `DEMO_SESSIONS = "true"`, and
refused outright once `REAL_DATA = "true"`.

The app calls it automatically on demo sign-in when `NEXT_PUBLIC_AI_GATEWAY` is set. If you
skip this, tier 1 still works for everyone and tiers 2 and 3 return 401 — which is the
right direction to fail.

## Which endpoint your key belongs to

A Kimi key is valid in **exactly one of three places, and they do not overlap**. All three
issue keys beginning `sk-`, so a key from the wrong one returns
`401 Invalid Authentication` — indistinguishable from a bad key.

| Key from | Endpoint | Model id for K3 | Billing |
|---|---|---|---|
| `platform.kimi.ai` | `https://api.moonshot.ai/v1` | `kimi-k3` | per token |
| `platform.moonshot.cn` | `https://api.moonshot.cn/v1` | `kimi-k3` | per token |
| **A Kimi Code / membership subscription** | `https://api.kimi.com/coding/v1` | **`k3`** | against the monthly plan quota |

That third row is the one that costs people an afternoon: a subscription key is a real
`sk-` key that 401s on *both* pay-as-you-go platforms, so every diagnostic points at the
key. It is not the key — it is a fourth endpoint nobody mentions. Set `KIMI_BASE_URL` and
`KIMI_MODEL` to match and redeploy.

## Checking it works

```bash
curl -s https://<your-worker>.workers.dev/health
```

`/health` sits outside the CORS gate so a plain curl reaches it. It reports whether each
secret is set, whether the KV namespace is bound, which endpoint is live, and — by calling
`/models` with your key — whether the key actually works, naming the likely cause when it
does not. It never returns the key or any part of it.

## What it enforces, and why each check is here

| Check | What it stops |
|---|---|
| **Origin allowlist** | Someone else's page calling your gateway and spending your quota. Checked before the key is touched. |
| **Session verification** | The browser claiming to be an administrator. Identity comes from an HMAC-signed cookie this Worker verifies; **the request body's opinion about the caller's role is never read**. |
| **`allowTool()` per call** | A model that invents a tool name, or a coordinator reaching a payout tool. Re-run here for every call, including ones the browser already allowed — the browser's checks are UX. |
| **Row scoping** | Tier 2 seeing another agent's book. The scope is a required argument to every executor. |
| **`redactFor()`** | A TIN entering the transcript. Applied after execution, before the message is appended, so a tool can compute over a field it may not return. |
| **Write intents** | The assistant mutating anything. Writes are handed back for a person to confirm and applied by the app through its own store actions. The gateway never writes. |
| **Bounded tool loop** | A stuck model running up a bill. Capped per tier in `LIMITS`. |
| **Hourly rate limit** | The public window being farmed for free inference. Tightest on tier 1, which is the one exposed to the open internet. |
| **Audit log** | Not knowing who looked. Refusals are logged too — a refusal is either someone probing or a permission set that is wrong, and both are worth seeing. |

## The session cookie

`tru_session=<base64url(json)>.<base64url(hmac-sha256)>`, signed with `SESSION_SECRET`.

```json
{ "userId": "usr_admin_whitfield", "role": "super_admin", "agentId": null, "exp": 1790000000 }
```

Whatever issues real sessions for this app — Supabase Auth, WorkOS, your own endpoint —
should sign this and set it `HttpOnly; Secure; SameSite=Lax`. Point `POST /session` at that
instead of the demo roster, then set `DEMO_SESSIONS = "false"` and `REAL_DATA = "true"`.

**Never widen this to trust the request body.** The whole permission system rests on the
gateway deriving identity itself; a "just for development" bypass that reads a role from
JSON is the one change that turns all of it back into a suggestion.

## Cost control

`kimi-k3` has a 1M-token context, and the tool loop means a single question can become
several model calls. Three things keep the bill sane, all already in the code:

- Tier 1 gets `maxTokens: 1200` and four tool calls per turn. It is the window strangers use.
- History is truncated to the last 20 messages before it is sent.
- Tool results are capped at 24KB each before they enter the transcript.

Watch it with `npx wrangler tail` while you test, and set a spend limit on the platform
account rather than trusting any of the above to be enough.
