# scripts/

Build, validation, and content-maintenance utilities. Run with `node scripts/<name>.mjs` unless noted.

| Script | Purpose |
|--------|---------|
| `safe-blog-edit.mjs` | Canonical body-swap utility for `src/data/*BlogArticles.ts`. Backup, write, esbuild + leaks verify, rollback on failure. All bulk blog body edits MUST route through this. |
| `check-blog-leaks.mjs` | Pre-publish leak scan. Fails if any blog `.ts` file contains editor notes, TODOs, or `[INSERT ...]` placeholders. Wired to prebuild. |
| `check-pricing-reference-copy.mjs` | Locks the `/pricing-reference` page title, H1, and meta description to the Ontario CAD 2026 copy in both `src/pages/PricingReference.tsx` and `scripts/static-prerender.mjs`, and fails on any em-dash/en-dash. Wired to prebuild. |
| `check-design-tokens.mjs` | Lints components for raw color classes (`text-white`, `bg-black`, etc.) instead of semantic design tokens from `index.css` / `tailwind.config.ts`. |
| `generate-markdown-twins.mjs` | Mirrors each blog post in `src/data/blogArticles.ts` to a `.md` file under `public/blog/` for AI-agent crawlability. |
| `generate-sitemap.ts` | Builds `public/sitemap.xml` from blog, motor, location, and tool routes. Run via `tsx`. |
| `indexnow-submit.mjs` | Pings Bing/IndexNow with a list of changed URLs after deploy. |
| `static-prerender.mjs` | Vite post-build pass that prerenders blog and key marketing routes to static HTML for SEO. |
| `check-structured-data.mjs` | Post-build guardrail. Validates every JSON-LD block in `dist/` (parse + required fields), strict on Product Offers (`priceCurrency`/`price`/`availability`) but exempts Service offers (price-on-request). Also enforces a dual-source-of-truth check between `static-prerender.mjs` and React SEO components — fails if the same Product name/`@id` is hardcoded in both. Wired between `static-prerender.mjs` and `validate-schema-org.mjs` in the build pipeline. |
| `validate-schema-org.mjs` | Posts every JSON-LD block in `dist/` to validator.schema.org and fails the build on error-severity issues. Warnings logged. Skippable via `SKIP_SCHEMA_ORG_VALIDATOR=1`. Sampling caps requests at `SCHEMA_VALIDATOR_MAX_FILES` (default 80) to stay within rate limits. Wired into `npm build` after `check-structured-data.mjs`. |


## Adding a new script

1. Drop it in `scripts/`. `.mjs` for plain Node, `.ts` for TypeScript (run with `tsx`).
2. Update this README with a one-liner.
3. If it mutates `src/data/*BlogArticles.ts`, route through `safe-blog-edit.mjs` instead of writing your own swap loop.
