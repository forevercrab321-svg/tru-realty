import type { NextConfig } from "next";

/**
 * Tru Realty ships as a fully static site.
 *
 * There is no server-side logic — every page is rendered from the seeded data layer
 * in the browser — so `output: "export"` produces a plain `out/` directory that any
 * static host will serve (GitHub Pages, Cloudflare Pages, S3, Netlify, nginx).
 *
 * GitHub Pages serves project sites from a subpath (`/<repo>/`), which requires a
 * basePath. Set it at build time rather than hardcoding it, so the same source
 * deploys to both a subpath and a root domain:
 *
 *   npm run build                          → root domain (Cloudflare Pages, custom domain)
 *   NEXT_PUBLIC_BASE_PATH=/tru-realty npm run build   → GitHub Pages project site
 *
 * When Phase 3 adds a database and Server Actions, delete `output` and `basePath`
 * and deploy to a Node host instead.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  // Emits /admin/dashboard/index.html instead of /admin/dashboard.html, which is what
  // static hosts expect when resolving a directory-style URL.
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
