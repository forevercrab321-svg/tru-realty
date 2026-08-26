# Tru Realty — Design System

## 1. Direction

Premium, quiet, dense-where-it-matters. The reference set is Linear, Attio, Stripe and
Compass — not a Bootstrap admin. Concretely:

- Warm neutral ground, never pure white or pure gray
- One low-saturation brand colour, used sparingly
- Hairline borders and very soft shadows instead of heavy elevation
- Tabular figures everywhere a number can be compared
- Generous whitespace on marketing pages, tight rhythm in data views

## 2. Tokens

All tokens are declared once in `app/globals.css` under `@theme`. Tailwind generates the
utilities; nothing is hardcoded in components.

### Neutrals (warm)

| Token | Value | Use |
|---|---|---|
| `canvas` | `#fbfaf8` | App background |
| `surface` | `#ffffff` | Cards, tables, sheets |
| `subtle` | `#f6f5f2` | Sidebar, hover, chips |
| `sunken` | `#f1efeb` | Track backgrounds, skeletons |
| `line` | `#e8e5df` | Hairline border (default) |
| `line-strong` | `#d9d5cd` | Input border, dividers that must read |
| `ink` | `#16181a` | Primary text |
| `ink-2` | `#45484c` | Body text |
| `ink-3` | `#74787e` | Secondary text |
| `ink-4` | `#9ba0a7` | Labels, icons, meta |

### Brand — "Tru Evergreen"

`brand-50 #f1f5f1` · `100 #dfe8df` · `200 #c2d2c3` · `300 #9bb59d` · `400 #6e8f72`
`500 #4d7053` · `600 #3a5740` · `700 #2f4635` · `800 #26382b` · `900 #1c2921`

Primary buttons use `brand-700`. Large brand fields (the recruiting band, the login
panel) use `brand-900`. Brand tint on data (`brand-50`) marks *selected*, not *good*.

### Status

| Role | Token family | Meaning |
|---|---|---|
| Green | `ok` | Active, complete, paid, signed |
| Amber | `warn` | Pending, expiring, in progress |
| Red | `risk` | Expired, overdue, declined, cancelled |
| Blue | `info` | Informational, new, submitted |
| Plum | `plum` | Viewed, coming soon, nurturing |

Never invent a colour for a status — add it to the map in `components/ui/status.tsx`.

### Typography

Inter Variable, self-hosted. Optical sizing on, `cv02 cv03 cv04 cv11 ss01` enabled,
`-0.011em` base tracking, tighter (`-0.022em` → `-0.03em`) as size increases.

| Context | Size | Weight |
|---|---|---|
| Marketing H1 | 40–64px | 560 |
| Page title | 21px | 600 |
| Card title | 13.5px | 600 |
| Body | 13–14.5px | 400 |
| Table cell | 13px | 400 |
| Table header | 11.5px uppercase, `0.06em` | 500 |
| Meta / label | 11.5–12px | 400 |

### Radius & elevation

`xs 4 · sm 6 · md 8 · lg 12 · xl 16 · 2xl 22`.
Cards use `xl`, controls `sm`–`md`, pills `full`.

Shadows are deliberately weak: `xs` for resting cards, `md` on hover, `pop` for
overlays. Depth comes from the hairline border, not the shadow.

## 3. Components

`components/ui/` — all of these exist and are in use:

Button · Icon Button · Input · Textarea · NativeSelect · Field / Label · Search ·
Filter (in DataTable) · Badge · StatusBadge · Avatar · AvatarStack · Card (+ Header /
Body / Footer) · MetricCard · Stat · ProgressBar · DataTable · Tabs · Segmented ·
Dialog · Drawer · Dropdown (+ checkbox items) · Popover · Tooltip · Toast (sonner) ·
Pagination (in DataTable) · Breadcrumb · PageHeader · SectionHeader · Timeline ·
StageRail · KanbanBoard · EmptyState · Skeleton · FileUpload · KeyHint · Toggle ·
Separator · CommandMenu · NotificationCenter

### Button variants

`primary` (brand-700) · `secondary` (surface + ring) · `ghost` · `subtle` · `dark` ·
`danger` · `link`. Sizes `xs sm md lg icon iconSm`.

One primary action per view. Two at most in a page header, and the second is
`secondary`.

### DataTable

The workhorse. Every back-office table uses it, and it supports the full spec:
search, per-column sort, multi-select filters, pagination, column visibility, bulk
select + bulk actions, CSV export, and saved views. Column definitions are typed
(`Column<T>`) with an `accessor` used for sorting/search/export and a `cell` renderer
used for display — keep those two in sync.

## 4. Layout rules

- App shell: 236px sidebar, 56px top bar, content max-width 1440px
- Marketing: content max-width 1280px, 20/32px gutters
- Card grids: `sm:2 → lg:3 → xl:4`; KPI rows `2 → 4` (agent portal starts at 2 on mobile)
- Vertical rhythm inside cards: 20px padding, 14px between blocks
- Tables scroll horizontally inside their card; the page never does

## 5. Motion

Short and functional. `--ease-out-quint` for entrances, 150ms for colour, 200–350ms for
transforms. Dialogs scale from 0.97; drawers slide from the right; list items that
appear in response to an action fade up 6px. Nothing loops, nothing bounces.

## 6. Accessibility

- Focus rings are brand-500 at 2px with 2px offset, never removed
- Every icon-only control has an `aria-label` or `sr-only` text
- Status is never colour-only — every `StatusBadge` carries a dot *and* a text label
- Radix handles focus trapping, escape and roving tabindex for overlays and tabs
- Body text is `ink-2` on `surface`/`canvas` — above 4.5:1 at every size in use
