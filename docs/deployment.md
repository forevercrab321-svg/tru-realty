# Deploying Tru Realty

The app is a **fully static site**. There is no server, no database and no API route —
every page renders from the seeded data layer in the browser. `npm run build` produces an
`out/` directory that any static host will serve.

That means the whole thing runs on free tiers with no commercial-use restrictions.

---

## Option A — GitHub Pages (recommended if you already pay for GitHub)

Private repos on Pages are included with GitHub Pro / Team. No usage limits that matter
here, no commercial restriction.

### One-time setup

```bash
cd tru-realty
git init && git add -A && git commit -m "Tru Realty v1"
gh repo create tru-realty --private --source=. --push
```

Then in the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.

That's it. `.github/workflows/deploy.yml` is already in the repo — it typechecks, lints,
builds and publishes on every push to `main`. Your URL will be:

```
https://<your-username>.github.io/tru-realty/
```

### Custom domain

1. Create `public/CNAME` containing your domain, e.g. `demo.trurealty.com`
2. In `.github/workflows/deploy.yml`, change `NEXT_PUBLIC_BASE_PATH` to `""`
   (a custom domain serves from the root, not a subpath)
3. Point a CNAME record at `<your-username>.github.io`
4. Repo **Settings → Pages → Custom domain**, then tick **Enforce HTTPS**

### Deploying by hand instead of via Actions

```bash
npm run build:pages          # builds with basePath=/tru-realty
npx gh-pages -d out --dotfiles
```

`--dotfiles` matters — it carries `.nojekyll`, without which Pages strips the `_next`
directory and you get a blank white page.

---

## Option B — Cloudflare Pages (free, no commercial restriction)

Fastest path with no CLI at all:

```bash
npm run build
```

Then drag the `out/` folder into **Cloudflare dashboard → Workers & Pages → Create →
Pages → Upload assets**. Live in about 30 seconds on `*.pages.dev`.

To wire it to Git instead (auto-deploy on push): **Connect to Git**, pick the repo, and set

| Setting | Value |
|---|---|
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Output directory | `out` |
| Node version | `22` |

No `NEXT_PUBLIC_BASE_PATH` needed — Cloudflare serves from the root.

---

## Option C — anything else

`out/` is plain HTML, CSS, JS and SVG. It works unchanged on Netlify (drop the folder),
S3 + CloudFront, Vercel, nginx, or `python3 -m http.server` from inside `out/`.

Two rules for any host:

1. Serve `404.html` for unknown paths — that is where `app/not-found.tsx` lands.
2. Don't run a Jekyll-style build over it. Keep `.nojekyll`.

---

## Local preview of the production build

```bash
npm run build
npm run preview     # serves out/ on http://localhost:4000
```

Worth doing before every client-facing deploy — it catches basePath and asset problems
that the dev server hides.

---

## What changes when Phase 3 adds a database

Static export is a Phase 1–2 decision, not a permanent one. When Server Actions and a
real database arrive:

1. Delete `output: "export"` and `basePath` from `next.config.ts`
2. Delete `NEXT_PUBLIC_BASE_PATH` from the workflow, and the `asset()` calls become no-ops
   (the helper already returns the path unchanged when the env var is empty)
3. Deploy to a Node host — Vercel, Fly, Railway, or a container

Nothing in `components/` or `app/` needs to change.

---

## Known limitation of the static build

Records you create in the demo (a new client, a new transaction) live in browser memory
and appear immediately in lists, tables, kanban boards and dashboards — but they have no
prerendered detail page, so the app deliberately keeps you on the list after creating one
rather than routing to a URL that would 404. Seeded records open normally.

This disappears in Phase 3 when records are persisted and rendered on demand.
