# Tru Realty — Roadmap

Status as of the current build.

## Phase 1 — Foundation ✅ Complete

| Item | Status | Where |
|---|---|---|
| Design system & tokens | ✅ | `app/globals.css`, `components/ui/*` |
| App shell, sidebars, top bar | ✅ | `components/shared/app-shell.tsx` |
| Public website navigation | ✅ | `components/public/site-chrome.tsx` |
| Routing for all three surfaces | ✅ | `app/` |
| Mock auth + RBAC | ✅ | `lib/session.tsx`, `lib/permissions.ts` |
| Realistic mock data layer | ✅ | `data/*`, `types/index.ts` |
| Admin dashboard | ✅ | `/admin/dashboard` |
| Agent dashboard | ✅ | `/agent/dashboard` |
| Agent management (HR) | ✅ | `/admin/agents`, `/admin/agents/[id]` |
| Transaction management | ✅ | `/admin/transactions` + detail with 8 tabs |
| Client CRM | ✅ | `/admin/clients`, `/agent/clients` + detail |
| Listings | ✅ | `/admin/listings`, `/agent/listings` + detail |
| Events | ✅ | `/admin/events`, `/agent/events` + detail |
| Public website (8 routes) | ✅ | `app/(site)/*` |
| Global search + ⌘K command menu | ✅ | `components/shared/command-menu.tsx` |
| Notification centre | ✅ | `components/shared/notifications.tsx` |

## Phase 2 — Operations depth ✅ Complete

| Item | Status | Where |
|---|---|---|
| Recruiting pipeline (kanban + table) | ✅ | `/admin/pipeline` |
| Agent onboarding pipeline + checklist | ✅ | `/admin/pipeline` |
| Transaction pipeline (kanban + table) | ✅ | `/admin/pipeline` |
| Follow-up task queue | ✅ | `/admin/pipeline` |
| Commission engine + breakdowns | ✅ | `lib/commission.ts` |
| Accounting | ✅ | `/admin/accounting` |
| Payouts & 1099s | ✅ | `/admin/payouts` |
| Project signing + buyer registration | ✅ | `/agent/projects` |
| Library | ✅ | `/admin/library`, `/agent/library` |
| Performance & rankings | ✅ | `/admin/performance` |
| E-signature tracking | ✅ | `/admin/esign` |
| Company admin, roles, vendors | ✅ | `/admin/company` |

## Phase 3 — Real systems 🔜 Next

Ordered by dependency, not by appeal.

### 3.1 Persistence (blocks everything else)
- Postgres schema from `docs/data-model.md`; Supabase or Neon
- Repository layer replacing `data/*` exports
- Convert `lib/store.tsx` mutations to Server Actions (signatures already match)
- Zod schemas per mutation, shared between client form and server action
- Row-level security using the permission strings in `lib/permissions.ts`

### 3.2 Real authentication
- Supabase Auth or WorkOS; SSO for brokerage staff
- Replace `RequirePortal` with middleware-level route protection
- Move `can()` server-side; keep the client check as a UI affordance only
- Invitations, password reset, session revocation, 2FA for finance roles

### 3.3 MLS integration
- RESO Web API feed for REBNY RLS and OneKey
- Listing sync + media ingestion (replaces generated imagery)
- Two-way status write-back where the board permits it
- Agent MLS ID verification against the board roster

### 3.4 E-signature
- DocuSign or Dropbox Sign; template field mapping already modelled
- Webhook → `signature_requests` status updates
- Envelope-to-transaction linking on completion, auto-filing into the document tab

### 3.5 Payments & accounting
- ACH disbursement (Stripe Treasury or Modern Treasury) for the Wednesday release
- Commission ledger freeze on close (see `data-model.md` §4)
- 1099-NEC e-file (Track1099 or Tax1099)
- QuickBooks / Xero export

### 3.6 Notifications
- Transactional email (Resend), SMS for closing reminders (Twilio)
- Per-user preference enforcement — the UI already exists at `/agent/profile`
- Digest scheduling and quiet hours

### 3.7 Platform hardening
- Test suite: Vitest for `lib/commission.ts` and formatters, Playwright for the five
  critical flows (login → create client → open transaction → move stage → disburse)
- Error boundaries and loading skeletons on every async route
- Audit log on every mutation (who, what, when, previous value)
- Rate limiting and CSRF on public lead-capture forms

## Phase 4 — Differentiation

- **Dark mode** — token-layer only (see D-18)
- **Agent mobile app** — React Native or PWA with offline showing notes
- **Commission plan builder** — visual editor for splits, caps, tiers and bonuses
- **Recruiting intelligence** — MLS production data ingestion to source candidates
- **Client portal** — buyers and sellers see their own transaction timeline
- **Market analytics** — absorption, pricing and forecast by submarket
- **Document intelligence** — extract dates and parties from executed contracts
- **Team management** — multi-tier splits, team P&L, team-level recruiting

## Hosting

Phases 1–2 ship as a **static export** (`output: "export"`). There is no server-side
logic, so the whole product runs on a free static host with no commercial-use
restrictions — GitHub Pages, Cloudflare Pages, S3. See `docs/deployment.md`.

This is reversed in Phase 3.1: once Server Actions and a database exist, `output` and
`basePath` come out of `next.config.ts` and the app moves to a Node host.

## Known gaps in the current build

Called out honestly so nobody discovers them in a demo:

1. **Persistence is in-memory.** Refreshing resets to seed. Intentional for Phase 1–2.
   A corollary of the static build: records created in the demo appear everywhere in
   lists and dashboards, but have no prerendered detail page, so the create flow keeps
   you on the list instead of routing to a URL that would 404.
2. **Search is substring, not ranked.** No fuzzy matching or relevance scoring.
3. **Kanban drag-and-drop is desktop-only.** Native HTML5 DnD; touch users use the table.
4. **No test suite yet.** `tsc --noEmit` and `eslint` are clean; behaviour is unverified.
5. **Charts are not keyboard-navigable.** Recharts limitation; needs a data-table fallback.
6. **`Agent.stats` is seeded, not derived** from the 24 seeded transactions — it
   represents a full production year. Live counts come from `data/derived.ts`.
7. **No i18n.** Copy is inline English; agent-facing language data exists but is display-only.
