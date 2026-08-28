# AI gateway

The Worker that holds the Kimi key. Deploy this and the three assistants stop being a demo.

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

## Deploy

```bash
cd gateway
npm install
npx wrangler login

# Audit log + rate-limit buckets. Optional, but the audit log is the point of tier 3.
npx wrangler kv namespace create AUDIT
# paste the id it prints into wrangler.toml and uncomment the [[kv_namespaces]] block

# The two secrets. wrangler prompts for the value; it never appears in a file or in git.
npx wrangler secret put KIMI_API_KEY
npx wrangler secret put SESSION_SECRET      # any long random string you generate

npx wrangler deploy
```

Then point the app at it and rebuild:

```bash
NEXT_PUBLIC_AI_GATEWAY=https://tru-ai-gateway.<your-subdomain>.workers.dev npm run build
```

Add the deployed app's origin to `ALLOWED_ORIGINS` in `wrangler.toml` before you do, or the
gateway will refuse the request — which is the correct behaviour and worth seeing once.

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
signs this and sets it `HttpOnly; Secure; SameSite=Lax`. Until that exists the gateway
returns 401 for tiers 2 and 3, which is the right direction to fail. **Do not add a
development bypass that trusts the request body**; if you need one for local work, gate it
on `wrangler dev` and never on a deployed Worker.

## Cost control

`kimi-k3` has a 1M-token context, and the tool loop means a single question can become
several model calls. Three things keep the bill sane, all already in the code:

- Tier 1 gets `maxTokens: 1200` and four tool calls per turn. It is the window strangers use.
- History is truncated to the last 20 messages before it is sent.
- Tool results are capped at 24KB each before they enter the transcript.

Watch it with `npx wrangler tail` while you test, and set a spend limit on the platform
account rather than trusting any of the above to be enough.
