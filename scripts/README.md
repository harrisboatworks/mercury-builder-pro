# scripts/

Build, validation, and content-maintenance utilities. Run with `node scripts/<name>.mjs` unless noted.

| Script | Purpose |
|--------|---------|
| `safe-blog-edit.mjs` | Canonical body-swap utility for `src/data/*BlogArticles.ts`. Backup, write, esbuild + leaks verify, rollback on failure. All bulk blog body edits MUST route through this. |
| `check-blog-leaks.mjs` | Pre-publish leak scan. Fails if any blog `.ts` file contains editor notes, TODOs, or `[INSERT ...]` placeholders. Wired to prebuild. |
| `check-blog-asset-existence.mjs` | Pre-build asset guard. Walks every blog data file (`blogArticles.ts` + localized siblings), verifies each hero `image` and inline markdown/HTML `<img>` reference resolves to a file under `public/` (with `lovable-uploads/` and `assets/optimized/` fallback), and fails if any hero uses a path listed in `STUB_FALLBACK_HEROES`. External `http(s)://` URLs are skipped. Wired to prebuild. |
| `check-pricing-reference-copy.mjs` | Locks the `/pricing-reference` page title, H1, and meta description to the Ontario CAD 2026 copy in both `src/pages/PricingReference.tsx` and `scripts/static-prerender.mjs`, and fails on any em-dash/en-dash. Wired to prebuild. |
| `check-design-tokens.mjs` | Lints components for raw color classes (`text-white`, `bg-black`, etc.) instead of semantic design tokens from `index.css` / `tailwind.config.ts`. |
| `generate-markdown-twins.mjs` | Mirrors each blog post in `src/data/blogArticles.ts` to a `.md` file under `public/blog/` for AI-agent crawlability. |
| `generate-sitemap.ts` | Builds `public/sitemap.xml` from blog, motor, location, and tool routes. Run via `tsx`. |
| `indexnow-submit.mjs` | Legacy IndexNow bulk submitter (old key, ran on every build). No longer wired into `npm build`; superseded by `indexnow-ping.mjs`. |
| `indexnow-ping.mjs` | Production-only IndexNow ping (npm `postbuild`). Reads `dist/sitemap.xml`, submits URLs with lastmod in the last 3 days (plus `/` and `/pricing-reference`, max 100). Runs only when `VERCEL_ENV=production`; never fails the build. |
| `static-prerender.mjs` | Vite post-build pass that prerenders blog and key marketing routes to static HTML for SEO. |
| `check-structured-data.mjs` | Post-build guardrail. Validates every JSON-LD block in `dist/` (parse + required fields), strict on Product Offers (`priceCurrency`/`price`/`availability`) but exempts Service offers (price-on-request). Also enforces a dual-source-of-truth check between `static-prerender.mjs` and React SEO components — fails if the same Product name/`@id` is hardcoded in both. Wired between `static-prerender.mjs` and `validate-schema-org.mjs` in the build pipeline. |
| `validate-schema-org.mjs` | Posts every JSON-LD block in `dist/` to validator.schema.org and fails the build on error-severity issues. Warnings logged. Skippable via `SKIP_SCHEMA_ORG_VALIDATOR=1`. Sampling caps requests at `SCHEMA_VALIDATOR_MAX_FILES` (default 80) to stay within rate limits. Wired into `npm build` after `check-structured-data.mjs`. |
| `report-supabase-deploy-required.mjs` | Git-derived report of edge functions and added migrations a push made undeployed. Writes `$GITHUB_STEP_SUMMARY`. Never deploys, never fails. Logic in `lib/supabase-deploy-required.mjs`. |
| `deploy-supabase-functions.mjs` | Deploys edge functions changed in a git range, one slug (`DEPLOY_FUNCTION`), or an allowlisted pair (`DEPLOY_PAIR=site-chat` / `openai-realtime`). Reuses `deployTargetsFromDiff` / `requiredMigrationsForSlug` for `_shared/` fan-out and newly required migrations. Pair and single-function selectors cannot be combined. Skips (and fails the run for) a function whose required migrations are not applied yet. Public chat and OpenAI Realtime pairs fail closed together on incomplete selection, pair-member preconditions, or missing/unknown/unverified production key/model attestation. `DEPLOY_PAIR` is a selector, not an approval switch. A local key is not production proof. Continues after per-function failures, then exits 1 if any failed. Checks applied migrations; never applies them. |
| `supabase-drift-watch.mjs` | Scheduled compare of `main` vs deployed functions / applied migrations. No-op without `SUPABASE_ACCESS_TOKEN`. Project ref is `SUPABASE_PROJECT_REF` or `supabase/config.toml`. Never fails. |


## Adding a new script

1. Drop it in `scripts/`. `.mjs` for plain Node, `.ts` for TypeScript (run with `tsx`).
2. Update this README with a one-liner.
3. If it mutates `src/data/*BlogArticles.ts`, route through `safe-blog-edit.mjs` instead of writing your own swap loop.
