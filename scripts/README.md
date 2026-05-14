# scripts/

Build, validation, and content-maintenance utilities. Run with `node scripts/<name>.mjs` unless noted.

| Script | Purpose |
|--------|---------|
| `safe-blog-edit.mjs` | Canonical body-swap utility for `src/data/*BlogArticles.ts`. Backup, write, esbuild + leaks verify, rollback on failure. All bulk blog body edits MUST route through this. |
| `check-blog-leaks.mjs` | Pre-publish leak scan. Fails if any blog `.ts` file contains editor notes, TODOs, or `[INSERT ...]` placeholders. Wired to prebuild. |
| `check-design-tokens.mjs` | Lints components for raw color classes (`text-white`, `bg-black`, etc.) instead of semantic design tokens from `index.css` / `tailwind.config.ts`. |
| `generate-markdown-twins.mjs` | Mirrors each blog post in `src/data/blogArticles.ts` to a `.md` file under `public/blog/` for AI-agent crawlability. |
| `generate-sitemap.ts` | Builds `public/sitemap.xml` from blog, motor, location, and tool routes. Run via `tsx`. |
| `indexnow-submit.mjs` | Pings Bing/IndexNow with a list of changed URLs after deploy. |
| `static-prerender.mjs` | Vite post-build pass that prerenders blog and key marketing routes to static HTML for SEO. |

## Adding a new script

1. Drop it in `scripts/`. `.mjs` for plain Node, `.ts` for TypeScript (run with `tsx`).
2. Update this README with a one-liner.
3. If it mutates `src/data/*BlogArticles.ts`, route through `safe-blog-edit.mjs` instead of writing your own swap loop.
