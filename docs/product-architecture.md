# Tru Realty — Product Architecture

> Read this first. It explains how the codebase is laid out and where to put new work.

## 1. What this is

Tru Realty is a **digital brokerage platform** with three surfaces that share one design
system, one type system and one data layer:

| Surface | Route prefix | Audience | Design bias |
|---|---|---|---|
| Public Website | `/` | Buyers, sellers, recruits | Editorial, marketing, SEO |
| Back Office | `/admin` | Brokerage staff | Desktop-first, dense, table-driven |
| Front Office | `/agent` | Agents | Mobile-first, task-driven |

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Turbopack dev, static export where possible |
| Language | TypeScript, `strict: true` | No `any` in domain code |
| Styling | Tailwind CSS v4 | Tokens declared in `app/globals.css` via `@theme` |
| Primitives | Radix UI | Dialog, Dropdown, Tabs, Tooltip, Popover |
| Icons | lucide-react | |
| Charts | Recharts | Wrapped in `components/charts` — never import Recharts in a page |
| Command menu | cmdk | |
| Toasts | sonner | |
| Font | Inter (self-hosted via `@fontsource-variable/inter`) | No network dependency at build or runtime |

**No network dependency.** Fonts are bundled; every image is a locally generated SVG.
The app builds and runs fully offline. See §7.

## 3. Directory map

```
app/
  (site)/            Public marketing site (own layout: SiteHeader / SiteFooter)
  admin/             Back office — layout wraps AppShell + RequirePortal("admin")
  agent/             Front office — layout wraps AppShell + RequirePortal("agent")
  login/             Demo login + account switcher
  settings/          Personal preferences
  layout.tsx         Root: metadata + <Providers>
  providers.tsx      SessionProvider → StoreProvider → TooltipProvider → Toaster
  globals.css        Design tokens (single source of truth for color/type/elevation)

components/
  ui/                Design system primitives. No domain imports allowed.
  charts/            Recharts wrappers with the house palette + tooltip
  shared/            App shell, logo, command menu, notification center
  public/            Marketing-site components (cards, hero search, chrome)
  admin/             Domain modules shared by BOTH portals (see note below)

lib/
  utils.ts           cn(), sum(), groupBy(), uid()
  format.ts          Every money/date/number formatter. Never format inline.
  commission.ts      The commission engine — single source of truth for deal math
  permissions.ts     Roles → permissions (RBAC registry)
  nav.ts             Navigation trees for all three surfaces
  session.tsx        Mock auth + portal guard
  store.tsx          In-memory application store (mutations)

data/                Seeded mock data, one file per aggregate + index barrel
types/index.ts       Every domain entity. One file, deliberately.
docs/                This folder
scripts/gen-assets.mjs  Procedural imagery generator
```

**Note on `components/admin/`:** several modules there (`transaction-detail`,
`client-detail`, `listing-detail`, `clients-view`, `listings-view`, `events-view`,
`library-view`, `transaction-table`) are shared by both portals. They take a `base`
prop (`"/admin"` or `"/agent"`) so every internal link resolves to the right portal.
If you extract a fourth surface, keep that pattern rather than duplicating the module.

## 4. Data layer

Today the data layer is a client-side store. It was written so that swapping in a real
backend is a body-only change:

```
data/*.ts          Seed records, typed against types/index.ts
lib/store.tsx      StoreProvider — holds state + exposes mutations
lib/commission.ts  Pure function; already backend-ready
data/derived.ts    Live counts computed from other tables (never stored)
```

Every mutation in `lib/store.tsx` is shaped like the Server Action that will replace it:
same argument object, same return value, same toast. The migration path is:

1. Create the Postgres schema from `docs/data-model.md`.
2. Replace each `data/*.ts` export with a repository function (`getTransactions()` etc.).
3. Convert each store mutation body to a `"use server"` action; keep the signature.
4. Convert the read-only pages to Server Components; keep the interactive ones client-side.

Nothing in `components/` reads from `data/` for mutable entities — it reads from
`useStore()`. Static reference data (offices, roles, permission groups, vendors) is
imported directly because it does not change at runtime.

## 5. Auth & RBAC

`lib/session.tsx` holds a demo session in `localStorage`, read through
`useSyncExternalStore` (not an effect). `RequirePortal` guards each portal layout and
redirects mismatched roles.

`lib/permissions.ts` is the RBAC registry: six roles, 26 permissions. `hasPermission()`
gates navigation items (`lib/nav.ts` carries a `permission` per item), tab visibility
(e.g. the Commission tab on a transaction) and destructive actions.

Replacing the mock: keep `useSession()`'s shape, back it with your identity provider,
and move `can()` server-side as a middleware check. The permission strings do not change.

## 6. Routing

Public routes are static or SSG. Portal routes are client components under a guarded
layout, so they render as dynamic. Detail routes take `params: Promise<{id}>` (Next 16)
and are unwrapped with `use()` in client components or `await` in server components.

## 7. Imagery

There is no external image CDN. `scripts/gen-assets.mjs` deterministically generates:

- `public/listings/l{n}-{v}.svg` — 24 properties × 3 views, six architectural typologies
  (tower, brownstone row, colonial, loft, waterfront modern) across six muted palettes
- `public/projects/p{n}.svg` — new-development massing studies
- `public/brand/hero.svg` — the marketing hero skyline
- `public/brand/og.svg` — social card

Run `node scripts/gen-assets.mjs` to regenerate. Avatars are **not** files — the
`<Avatar>` component renders a deterministic monogram from a name hash.

When an MLS media feed is connected, replace `Listing.images` with real URLs and add the
host to `next.config.ts` `images.remotePatterns`. Nothing else needs to change.

## 8. Conventions

- **Formatting** lives in `lib/format.ts`. Never call `toLocaleString` in a component.
- **Money math** lives in `lib/commission.ts`. Never compute a split in a component.
- **Status colour** lives in `components/ui/status.tsx`. Add new statuses to its map,
  do not pass a tone by hand.
- **Empty states are required.** Every list, table and tab has one — see `EmptyState`.
- **`TODAY` is pinned** to 2026-08-26 in `lib/format.ts` so the seeded demo reads
  consistently. Delete that constant when real data arrives.
- Files stay under ~400 lines. If a page grows past that, extract to `components/`.
