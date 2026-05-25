## Goal

Two things:
1. Make JSON-LD correctness a build/deploy gate (Schema.org validator in CI, Rich Results probe post-deploy).
2. Ship Product + Offer JSON-LD on the per-motor configurator pages so rich results extend beyond the homepage and the existing landing pages.

---

## Part 1 — CI validation

### 1a. Schema.org validator in build pipeline

The repo already has `scripts/check-structured-data.mjs` which validates JSON-LD shape locally. It does NOT call the official Schema.org validator. Add a second script that does, run after prerender, before `indexnow-submit`.

New: `scripts/validate-schema-org.mjs`
- Walk every `*.html` under `dist/`.
- Extract every `<script type="application/ld+json">` block.
- POST each block to `https://validator.schema.org/validate` (form field `code`) and parse the JSON response.
- Fail the build on any error-severity issue. Warnings logged, not blocking.
- Throttle: ~3 req/sec, retry once on 5xx/network.
- `SKIP_SCHEMA_ORG_VALIDATOR=1` env var to skip (so offline dev builds still work).
- Sampling: in CI on Vercel, validate every file. Locally, validate only changed files (git diff against HEAD) to keep dev fast.

Wire into `package.json` build script:
`... && node scripts/check-structured-data.mjs && node scripts/validate-schema-org.mjs && node scripts/indexnow-submit.mjs`

### 1b. Google Rich Results check post-deploy

Google's Rich Results Test has no official public API. Two viable options:

- **Option A (recommended):** Use the PageSpeed Insights API (free, has an API key) which surfaces structured-data validity as part of its audit, OR call the unofficial Rich Results endpoint (`https://search.google.com/test/rich-results/result`). The unofficial endpoint can rate-limit / break — wrap in try/catch and treat failure as non-blocking.
- **Option B:** Use Google's `urlInspection` endpoint via the Search Console API, which the project already has wired (see `google_search_console` connector). This returns indexing + rich-results status per URL.

Plan picks **Option B** because the connector is already provisioned. New script: `scripts/post-deploy-rich-results.mjs`
- Takes a hard-coded list of canonical URLs (homepage, lineup landings, top 5 motor pages, quote summary).
- For each, calls `POST /webmasters/v3/sites/{site}/urlInspection/index:inspect` through `connector-gateway.lovable.dev/google_search_console`.
- Logs `richResultsResult.verdict` per URL.
- Non-blocking (post-deploy is informational, deploy already happened). Writes a summary to `/tmp/rich-results-report.json`.
- Triggered from a Vercel cron or a GitHub Actions `workflow_dispatch` (the repo deploys via Vercel from GitHub) — not from the Vite build, because it must run AFTER the new HTML is live on `mercuryrepower.ca`.

Add a `.github/workflows/post-deploy-rich-results.yml` that runs on `deployment_status` success and executes the script. (Requires `LOVABLE_API_KEY` + `GOOGLE_SEARCH_CONSOLE_API_KEY` secrets in the GitHub repo — flag this for the user to add.)

---

## Part 2 — Product/Offer JSON-LD on configurator pages

Today, Product schema exists on: homepage, `/mercury/pro-xs-250`, lineup landings, `/quote/motor-selection` (aggregate), `/quote/summary` (Service offer). It does NOT exist on the individual motor pages (`/motors/:slug` rendered by `MotorPage.tsx`), which is the highest-intent rich-result surface.

### 2a. New component `src/components/seo/MotorPageSEO.tsx`

Takes the resolved motor (already loaded by `MotorPage.tsx`) and emits:
- `WebPage` + `BreadcrumbList` (Home → Motor Selection → {motor name})
- `Product` with: name (model_display), description (generated from existing motor-description-generator), image (Supabase image), brand=Mercury Marine, sku (model code), category
- One `Offer` with: priceCurrency CAD, price (from pricing hierarchy: manual_overrides > sale_price > dealer_price > msrp), `availability: InStoreOnly`, `itemCondition: NewCondition`, `hasMerchantReturnPolicy: MerchantReturnNotPermitted` (CA), seller = BoatDealer Harris Boat Works, url = canonical
- Mirror the same shape used in `MercuryProXS250SEO.tsx` so the existing `check-structured-data.mjs` Offer rules pass.

Render it inside `MotorPage.tsx` once the motor is loaded. SSR/prerender: `static-prerender.mjs` already prerenders motor routes — extend that file in the same pass to emit the equivalent JSON-LD using the shared `mercuryOutboardsOffers.js` data source so the dual-source-of-truth check stays green.

### 2b. Upgrade `QuoteSummaryPageSEO.tsx`

Currently emits a Service-typed Offer (price-on-request). When a quote is in progress and a motor is selected, also emit a Product+Offer block for the selected motor (same shape as 2a) using the live total from `useQuoteRunningTotal`. Client-side only — prerender stays as the Service version (no motor known at prerender time). This gives rich-result eligibility on shared/saved quote links.

### 2c. Source-of-truth discipline

Per the existing `[Pricing Logic Centralized]` memory and the dual-source check in `check-structured-data.mjs`: extract the Product/Offer builder into `src/lib/seo/buildMotorProductSchema.ts`, consumed by both `MotorPageSEO.tsx` and `static-prerender.mjs` (the .mjs imports the compiled JS or a parallel `.js` mirror — match the `mercuryOutboardsOffers.js` pattern). No new hardcoded Product names in two files.

---

## Files

Create:
- `scripts/validate-schema-org.mjs`
- `scripts/post-deploy-rich-results.mjs`
- `.github/workflows/post-deploy-rich-results.yml`
- `src/components/seo/MotorPageSEO.tsx`
- `src/lib/seo/buildMotorProductSchema.ts` (+ `.js` twin for the prerender script, or refactor prerender to load the TS via tsx)

Edit:
- `package.json` — add `validate-schema-org` to build pipeline
- `scripts/README.md` — document the two new scripts
- `scripts/static-prerender.mjs` — emit per-motor Product schema using shared builder
- `src/pages/MotorPage.tsx` — render `<MotorPageSEO motor={motor} />`
- `src/components/seo/QuoteSummaryPageSEO.tsx` — accept optional `selectedMotor` + `totalCAD` props and emit Product block when present
- `src/pages/quote/QuoteSummaryPage.tsx` — pass live motor + total into the SEO component

---

## Questions before I build

1. **Rich Results checker source:** OK to use Search Console `urlInspection` via the existing `google_search_console` connector (Option B above), or do you want me to scrape the unofficial Rich Results endpoint?
2. **Deploy trigger:** Vercel deploys from GitHub. OK to add a `.github/workflows/*.yml` for the post-deploy check, or would you rather it run as a Vercel cron (`api/cron/...`)?
3. **Schema.org validator in CI:** if validator.schema.org returns warnings (not errors), should the build fail or just log? Default in the plan: warnings log, errors fail.