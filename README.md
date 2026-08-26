# Tru Realty — Digital Brokerage Platform

A complete real-estate brokerage operating system: a public marketing site, a back-office
management portal, and an agent portal, sharing one design system and one data layer.

![Tru Realty](public/brand/og.svg)

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

No environment variables, no database, no network access required — the app builds and
runs fully offline.

## Demo accounts

Any password works. Pick an account on the login screen or type the email.

| Email | Role | Portal | What to look at |
|---|---|---|---|
| `admin@trurealty.com` | Super Admin | Back office | Everything, including roles & settings |
| `ops@trurealty.com` | Brokerage Admin | Back office | Day-to-day operations |
| `tc@trurealty.com` | Transaction Coordinator | Back office | Pipeline and compliance only |
| `hr@trurealty.com` | HR / Operations | Back office | Recruiting, onboarding, licensing |
| `accounting@trurealty.com` | Accounting | Back office | Commission, payouts, 1099s |
| `agent@trurealty.com` | Agent (Sophia Chen) | Agent portal | A full book of business |
| `newagent@trurealty.com` | Agent (Caleb White) | Agent portal | A thin book — empty & early states |

## What's in the box

**Public site** — home with property search, listings index + detail, agent directory +
profiles, new development, services, about, contact.

**Back office** — dashboard, three-track pipeline (recruiting / onboarding / transactions)
with kanban and table views, transactions with an eight-tab detail page, agents & HR with
licensing and training, clients, listings, events, library, performance, e-signature,
accounting, payouts & 1099s, company administration with RBAC.

**Agent portal** — dashboard, clients, deals, listings, project signing with buyer
registration, event hub, library, commission, profile. Mobile-first.

**Throughout** — ⌘K command menu, global search, notification centre, saved table views,
CSV export, bulk actions, drag-and-drop kanban, working create/edit flows, and a designed
empty state on every list.

## Try these

1. Sign in as **admin**, open **Pipeline**, drag a recruiting candidate between stages.
2. Open **Transactions → 45 East 22nd Street**, walk the tabs, tick a task, upload a doc.
3. Open **Payouts** and find *544 Bushwick Avenue* — the deduction is small because that
   agent has nearly capped. The commission engine models this correctly.
4. Sign in as **agent**, go to **Project Signing**, register a buyer on Skyline Court.
5. Sign in as **newagent** to see the same product with almost no data in it.
6. Press **⌘K** anywhere in either portal.

## Deploying

The app is a fully static export — `npm run build` writes an `out/` directory that any
static host serves. A GitHub Pages workflow is included and runs on push to `main`
(repo **Settings → Pages → Source = GitHub Actions**).

```bash
npm run build      # → out/   (root domain: Cloudflare Pages, custom domain)
npm run build:pages # → out/  (GitHub Pages project subpath)
npm run preview    # serve out/ on :4000 — always check this before a client-facing deploy
```

Full instructions, including custom domains: [`docs/deployment.md`](docs/deployment.md).

## Documentation

| Document | What it covers |
|---|---|
| [`docs/product-architecture.md`](docs/product-architecture.md) | Stack, directory map, data layer, conventions |
| [`docs/design-system.md`](docs/design-system.md) | Tokens, components, layout, motion, a11y |
| [`docs/data-model.md`](docs/data-model.md) | Entities → Postgres tables, enums, RLS, commission math |
| [`docs/product-decisions.md`](docs/product-decisions.md) | 20 decisions and the reasoning behind each |
| [`docs/roadmap.md`](docs/roadmap.md) | Phase status and known gaps |
| [`docs/deployment.md`](docs/deployment.md) | GitHub Pages, Cloudflare Pages, custom domains |

## Scripts

```bash
npm run dev          # dev server
npm run build        # static export → out/
npm run build:pages  # static export with the GitHub Pages subpath
npm run preview      # serve out/ on :4000
npm run lint         # eslint (flat config)
npm run typecheck    # tsc --noEmit
npm run assets       # regenerate all imagery
```

## Stack

Next.js 16 (App Router, static export) · React 19 · TypeScript strict · Tailwind CSS v4 ·
Radix UI · Recharts · cmdk · sonner · lucide-react · self-hosted Inter.

## Status

Phases 1 and 2 are complete. Persistence is in-memory by design — every mutation in
`lib/store.tsx` is written with the signature its Server Action replacement will have.
See the roadmap for the migration path and the honest list of current gaps.
