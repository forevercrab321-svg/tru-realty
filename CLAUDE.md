# Working in this repository

Read `docs/product-architecture.md` before making changes. The short version:

- **Design tokens** live only in `app/globals.css`. Never hardcode a colour.
- **Formatting** lives only in `lib/format.ts`. Never call `toLocaleString` in a component.
- **Commission math** lives only in `lib/commission.ts`. Never compute a split in a page.
- **Status colours** live only in `components/ui/status.tsx`. Add to the map; don't pass a tone.
- `components/ui/*` must not import from `data/` or `lib/store`. Primitives stay domain-free.
- Modules in `components/admin/*` are shared by both portals via a `base` prop
  (`"/admin"` or `"/agent"`). Don't duplicate them.
- Mutable entities are read through `useStore()`, not imported from `data/`.
- Every list, table and tab needs an `EmptyState`.
- `TODAY` in `lib/format.ts` is pinned to 2026-08-26 so the seeded demo stays consistent.
- Keep files under ~400 lines; extract to `components/` when a page grows.
- **AI assistants**: three tiers defined once in `lib/ai/agents.ts`. Tools go in
  `lib/ai/tools.ts` and MUST narrow by the `Scope` argument on their first line. An
  `operate` tool returns a write intent — it never mutates. Read `docs/ai-agents.md`
  before touching any of it.
- Never put a key in `NEXT_PUBLIC_*`. This is a static export; that bundle is public.
- **Route permissions**: a page under `/admin` or `/agent` must be registered in `lib/nav.ts`
  — a nav item, or `UNLISTED_ROUTES` if it has no sidebar entry. `RequireRouteAccess`
  denies what it does not recognise, and `lib/route-access.test.ts` fails if a page on disk
  is unregistered. The nav and the guard read one registry so they cannot disagree. This is
  client-side and is NOT a security boundary — never describe it as one.
- **NYC public records** (`lib/nyc/open-data.ts`) are read live, never scraped from a
  portal. Listings come from a licensed MLS feed or not at all. `ToolDef.run` may return a
  promise; both call sites await it.

Before finishing: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` — all four must pass.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
