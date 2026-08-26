# Tru Realty — Data Model

Every interface in `types/index.ts` maps 1:1 to a planned Postgres table. This document
is the bridge between the two.

## 1. Entity map

```
Office ──< Agent ──< Client ──< Transaction >── Listing
   │         │          │            │
   │         ├──< License (embedded, 1:1)
   │         ├──< MLSProfile (embedded, 1:1)
   │         ├──< CommissionPlan (embedded, 1:1 → FK to plans in prod)
   │         ├──< Agreement
   │         ├──< TrainingRecord
   │         ├──< AgentCharge
   │         └──< Payout ──< TaxRecord
   │
   └──< User ──< Role ──< Permission

Transaction ──< TransactionTask
            ──< TransactionDocument
            ──< TimelineEvent
            ──< CommissionBreakdown (computed, 1:1)

Project ──< BuyerRegistration >── Client
        ──< unitMix (jsonb)

Event ──< EventRegistration >── Agent
Listing ──< OpenHouse
RecruitCandidate ──> Agent (on conversion)
Agent ──< OnboardingRecord ──< OnboardingChecklistItem
SignatureRequest ──> Transaction (nullable), ──> SignatureTemplate (nullable)
```

## 2. Core tables

### `offices`
`id, name, code, street, city, state, zip, phone, managing_broker, opened, timezone`
`agent_count` is a **view**, not a column, in production.

### `users`
`id, name, email (unique), role_key, title, office_id → offices, phone, last_active,
agent_id → agents (nullable)`

An agent is a `user` with `role_key = 'agent'` plus an `agents` row. Staff have a user
row and no agent row.

### `agents`
`id, user_id → users, first_name, last_name, title, email, phone, office_id → offices,
team_id → teams (null), status, tier, join_date, birthday (mm-dd), bio,
languages text[], neighborhoods text[], specialties text[], commission_plan_id → plans`

Embedded in the TypeScript type but separate tables in Postgres:
- `licenses` — `agent_id, number, state, type, issued, expires, status, verified_on, verified_by`
- `mls_profiles` — `agent_id, mls_id, board, status, dues_paid, last_sync`
- `commission_plans` — `id, name, agent_split, brokerage_split, cap, transaction_fee, royalty_pct`
- `agent_plan_progress` — `agent_id, year, cap_ytd` (mutable; keep out of the plan table)

`Agent.stats` is a **materialized view** (`agent_production_ytd`) refreshed nightly:
ytd_volume, ytd_gci, ytd_closings, lifetime_volume, avg_dom, list_to_sale_ratio.
Anything describing *right now* (open deals, live listings) is computed on read —
see `data/derived.ts`.

### `clients`
`id, name, type, status, email, phone, agent_id → agents, budget_min, budget_max,
areas text[], property_type, beds, lead_source, created_at, last_contact,
next_follow_up, tags text[], pre_approved, lender`

- `client_notes` — `id, client_id, body, author_id → users, created_at, type`

### `transactions`
`id, ref (unique), address, unit, city, state, zip, property_type, image,
side, stage, agent_id, co_agent_id, coordinator_id → users, client_id,
counterparty, counterparty_brokerage, list_price, sale_price, commission_pct,
contract_date, closing_date, created_at, escrow, lender, title_company,
compliance_complete`

Children:
- `transaction_tasks` — `id, transaction_id, title, due_date, assignee_id, status, priority, category`
- `transaction_documents` — `id, transaction_id, name, category, file_type, size_kb, uploaded_by, uploaded_at, status, required`
- `transaction_timeline` — `id, transaction_id, label, date, done, kind, actor_id, detail`
- `transaction_notes` — same shape as `client_notes`

`commission` is **computed**, never stored, until the file closes. On close, freeze the
result into `commission_ledger` so historical disbursements never move when a plan
changes. See §4.

### `listings`
`id, mls_id, address, unit, city, state, zip, neighborhood, price, original_price,
status, property_type, beds, baths, half_baths, sqft, lot_sqft, year_built, hoa,
taxes, listing_agent_id, co_listing_agent_id, listed_on, description,
features text[], featured`

- `listing_media` — `id, listing_id, url, kind, sort_order` (replaces `images text[]`)
- `open_houses` — `id, listing_id, date, start, end, host_agent_id, registrations, attended`
- `listing_activity` — `listing_id, date, views, saves, showings` (daily rollup; the
  scalar `views/saves/showings` on the type are sums over this table)

`days_on_market` is computed, not stored.

### `projects` / `buyer_registrations`
`projects` — `id, name, developer, city, state, neighborhood, image, price_min,
price_max, total_units, available_units, commission_pct, bonus, status, completion,
registration_required, description, amenities text[], unit_mix jsonb`

`buyer_registrations` — `id, project_id, client_id, agent_id, status, submitted_at,
expires_at, unit_interest, note` + `buyer_registration_documents` child table.

Unique partial index on `(project_id, client_id)` where `status in ('submitted','approved','signed')`
— this is what actually protects the agent's commission.

### `events` / `event_registrations`
`events` — `id, name, type, date, start, end, location, host_id, capacity,
description, ce_credits, office_id (nullable = all), resources jsonb`

`event_registrations` — `id, event_id, agent_id, status, registered_at`.
`registered`, `waitlist` and `attended` on the event are counts over this table.

### Money
- `agent_charges` — `id, agent_id, description, category, amount, date, status, transaction_id`
- `payouts` — `id, agent_id, transaction_id, period, gross_commission, deductions, net_payout, method, status, issued_at, reference`
- `tax_records` — `agent_id, year, ytd_commission, ytd_paid, pending, form_1099_status, tin, entity_name`

### Governance
- `roles` — `key, name, description, is_system`
- `role_permissions` — `role_key, permission`
- `signature_templates`, `signature_requests`, `signature_recipients`
- `library_docs`, `vendors`, `announcements`, `notifications`
- `recruit_candidates`, `onboarding_records`, `onboarding_checklist_items`

## 3. Enumerations

| Enum | Values |
|---|---|
| `agent_status` | active, onboarding, inactive, offboarding |
| `license_status` | active, expiring, expired, pending |
| `production_tier` | platinum, gold, silver, emerging |
| `client_type` | buyer, seller, both, renter, investor |
| `client_status` | new_lead, nurturing, active, under_contract, closed, lost |
| `tx_stage` | lead, offer, accepted, under_contract, inspection, appraisal, loan, final_walkthrough, closing, closed, cancelled |
| `tx_side` | listing, buyer, dual, rental |
| `listing_status` | coming_soon, active, under_contract, pending, sold, withdrawn, expired |
| `registration_status` | draft, submitted, approved, rejected, expired, signed |
| `signature_status` | draft, sent, viewed, signed, completed, expired, declined |
| `recruit_stage` | new_lead, contacted, meeting_scheduled, interviewed, offer_sent, joined, not_interested |
| `onboarding_stage` | application, agreement_signed, license_verified, mls_setup, account_setup, training, ready_to_activate, active |

## 4. The commission engine

`lib/commission.ts` is the only place deal math happens. Order of operations mirrors a
standard US brokerage disbursement authorization:

```
gross            = sale_price × gross_commission_pct
side             = gross × side_pct            (0.5 typical, 1.0 when dual)
after_referral   = side − (side × referral_pct)
brokerage_split  = min(after_referral × (1 − agent_split), cap_remaining)
team_split       = (after_referral − brokerage_split) × team_pct   [members only, not the lead]
net_agent        = after_referral − brokerage_split − team_split − transaction_fee − company_fee
net_brokerage    = brokerage_split + transaction_fee + company_fee
```

The cap clamp is the important part: once an agent has paid their annual company-dollar
cap, the brokerage split goes to zero and only the flat transaction fee remains. You can
see this working on Michael Rodriguez's 544 Bushwick Avenue file.

## 5. Row-level security

When Supabase is connected, the agent portal needs exactly these policies:

```sql
-- clients, transactions, listings, buyer_registrations, payouts, agent_charges
using ( agent_id = auth.uid() or exists (
  select 1 from role_permissions rp
  join users u on u.role_key = rp.role_key
  where u.id = auth.uid() and rp.permission = '<table>.view'
))
```

Admin roles pass through the permission branch; agents pass through the ownership
branch. `lib/permissions.ts` already carries the permission strings these policies need.

## 6. Seed data

`data/*.ts` holds a hand-authored, internally consistent dataset: 4 offices, 16 agents,
28 clients, 24 transactions, 24 listings, 6 new-development projects, 12 events,
24 library documents, 12 recruiting candidates, 10 signature requests and a full
commission/payout ledger derived from the closed files.

The set is deliberately uneven: one agent is capped, one is on parental leave with a
lapsed license, one is offboarding, two are mid-onboarding, one transaction is cancelled,
several files have compliance gaps. Empty and edge states are reachable without editing
code — sign in as `newagent@trurealty.com` to see a light book of business.
