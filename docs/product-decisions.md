# Tru Realty — Product Decisions

Assumptions made while building, and why. Anyone picking this up should be able to
disagree with a decision here without having to reverse-engineer the reasoning.

---

### D-01 · Brokerage size: 16 agents, 4 offices
A boutique-to-mid brokerage, not a national franchise. It keeps every number on screen
internally consistent (roster count = office counts = role counts = production totals),
which matters more for credibility than a big headline figure. Scaling the seed set is
a data change, not a code change.

### D-02 · "Today" is pinned to 2026-08-26
`TODAY` in `lib/format.ts`. Relative dates ("in 3 days", "7 days ago") and overdue
states are a large part of how this product reads, and they have to stay stable.
Delete the constant when live data arrives.

### D-03 · Light sidebar, not a dark one
A near-black sidebar reads "legacy real estate CRM". The reference set (Linear, Attio,
Notion) uses a light, slightly warm sidebar with a hairline border. Dark surfaces are
reserved for the marketing hero, the login panel, the recruiting band, and exactly one
KPI card per dashboard — used as emphasis, not as chrome.

### D-04 · Evergreen accent, used sparingly
Low-saturation forest green. Real estate defaults to navy or red; both are overused and
neither survives being placed next to property photography. Green also frees red and
amber to mean *only* risk and pending in data views.

### D-05 · Locally generated SVG imagery instead of stock photos
No external image host. The sandbox has no CDN egress, and more importantly a demo that
silently breaks offline or when a photo URL rots is worse than one with honest
illustrations. `scripts/gen-assets.mjs` generates 72 property illustrations and 8
project renderings across six architectural typologies and six palettes, deterministic
by seed. Swap for MLS media when the feed exists — `Listing.images` is already an array.

### D-06 · Monogram avatars, not photographs
Fake headshots of nonexistent people are worse than a good monogram, and the monogram
reads as an intentional product decision (Linear, Attio, Height all do this). The
`<Avatar>` component derives a palette from a name hash, so it is stable per person.

### D-07 · Hand-rolled DataTable instead of TanStack Table
The spec suggested TanStack. A typed 300-line table gives exact control over markup,
sticky headers, bulk selection, saved views and CSV export without fighting a headless
API's rendering assumptions. The `Column<T>` interface is deliberately TanStack-shaped
(`accessor` + `cell`), so migrating later is mechanical if a use case demands it.

### D-08 · Client-side store now, Server Actions later
Every interaction in the spec (create client, move a pipeline stage, RSVP, upload,
submit a buyer registration) has to actually work. A client store makes that immediate.
Each mutation in `lib/store.tsx` is written with the exact signature its Server Action
replacement will have, so the migration is body-only. Documented in
`product-architecture.md` §4.

### D-09 · Shared detail modules across both portals
`TransactionDetail`, `ClientDetail`, `ListingDetail` and the table/grid views take a
`base` prop and are rendered by both `/admin` and `/agent`. A transaction detail page is
the same object viewed by two roles; duplicating it guarantees drift. Role differences
are handled with `hasPermission()` (e.g. agents see their own commission but cannot
adjust splits).

### D-10 · Commission math lives in one pure function
`lib/commission.ts`. Splits, caps, team overrides, referral fees and transaction fees
are the highest-trust numbers in the product. Computing them anywhere else — or storing
a denormalized copy before close — is how brokerages end up with disputes.

### D-11 · Cap clamping is modelled, not decorative
Once an agent's year-to-date company dollar reaches their plan cap, the brokerage split
drops to zero and only the flat transaction fee applies. This is the single most
misunderstood mechanic in US brokerage economics and the reason agents distrust
commission software; it is modelled correctly here and visible on the agent's cap meter.

### D-12 · Six roles, 26 permissions, enforced in the UI
Super Admin, Brokerage Admin, Transaction Coordinator, HR/Operations, Accounting, Agent.
Permissions gate navigation, tabs and actions today; the same strings become RLS
predicates when Supabase is attached (`data-model.md` §5).

### D-13 · Demo login with seven accounts, no real auth
Role-switching has to be one click for anyone evaluating the product. Session lives in
`localStorage`, read via `useSyncExternalStore`. Two agent accounts are provided
deliberately: a top producer (rich data) and a second-year agent (thin data, so empty
and early states are reachable without editing code).

### D-14 · Kanban and table are peers, not alternatives
Recruiting, onboarding and transaction pipelines all offer both. Kanban is for moving
work; a table is for auditing it. Drag-and-drop is native HTML5 — no dependency, and it
degrades to the table view on touch.

### D-15 · The public site is a real site, not a shell
Eight routes with working search, filters, agent profiles, property detail and lead
capture. A brokerage platform whose marketing site is a placeholder is not credible, and
the public site is where the recruiting funnel actually starts.

### D-16 · Agent portal starts at two KPI columns on mobile
Agents are not at a desk. The agent dashboard, deal list and client list are designed
mobile-first; the admin portal is desktop-first and degrades gracefully. One-per-row KPI
cards on a phone is too much scroll before the first piece of real content.

### D-17 · Every list has a designed empty state
Not a blank div. Each one names what is missing, explains what it means, and offers the
action that resolves it. Empty states are the first thing a real new brokerage sees.

### D-18 · No dark mode yet
A second theme doubles the surface area of every review while the light theme is still
being tuned. All colour is tokenized in `@theme`, so adding one is a token-layer change,
not a component change. Flagged as a Phase 3 item.

### D-19 · Fictional-brokerage disclaimer in the footer
The public site shows prices, agents and transactions that look real. A one-line
disclaimer in the footer keeps the demo honest without touching the design.

### D-20 · Notifications are read-only in this phase
The notification centre reads from the store and supports read/mark-all-read. Delivery
(email, SMS, push) is a backend concern and is listed in Phase 3 rather than faked.

### D-21 · Ship as a static export, not a Node deployment
The product has no server-side logic in Phases 1–2 — every page renders from the seeded
data layer in the browser. `output: "export"` turns the whole thing into plain files,
which means it hosts free on GitHub Pages or Cloudflare Pages with no commercial-use
restriction, and it cannot break in a way a static file can't break. `basePath` is
env-driven (`NEXT_PUBLIC_BASE_PATH`) so the same source deploys to a Pages subpath and to
a root domain. Every `/public` reference goes through `asset()` in `lib/utils.ts`, because
`basePath` rewrites next/link and next/image but not a plain `<img src>` or a CSS `url()`.
Reversed in Phase 3.1 — see `docs/deployment.md`.
