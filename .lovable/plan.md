# Plan: Strengthen Mercury Repower SEO/AI Foundations

A 5-priority pass that builds on the existing `scripts/static-prerender.mjs` pipeline. No new blog posts. Everything below ships through the same prerender + sitemap mechanism already in production.

---

## Priority 1 — Per-motor prerendered `/motors/{slug}` pages (122 motors)

**Current state:** `/motors/:slug` is a client-side `<MotorRedirect>` that 302s into the quote builder. Crawlers see no per-motor content. There are **122 motors with `model_key`** in the DB (29 in stock).

**Plan:**

1. **`scripts/static-prerender.mjs`** — add a `loadMotors()` step (Supabase service-role fetch identical to `getMotorSitemapEntries`) that pulls every active motor and builds a `motorPageRoutes` array.

   - **Slug:** match the existing `MotorRedirect` convention — `model_key.toLowerCase().replace(/_/g, '-')` so legacy URLs keep working. Also expose the public-API slug as a 301 redirect target if needed.
   - **Pricing:** use the same hierarchy as `public-motors-api/index.ts` (`manual_overrides.sale → manual_overrides.base → sale_price → dealer_price → msrp → base_price`). Skip Verado motors.
   - **Per-route fields:**
     - `title`: `{Family} {HP}HP {ShaftCode} — Mercury Outboard {Model#} | Harris Boat Works`
     - `description`: HP, family, shaft, CAD price, availability, 7-yr warranty, pickup-only.
     - `canonical`: `https://www.mercuryrepower.ca/motors/{slug}`
     - `og:type`: `product`, `og:image`: `hero_image_url || image_url || /social-share.jpg`
     - `og:title`, `og:description`, `og:url`, `twitter:*` — already handled by the shared `socialReplacements` block once the route exists.
   - **JSON-LD graph:**
     - `Product` (name, brand: Mercury Marine, mpn: model_number, image, category: Outboard Motor, additionalProperty: HP/shaft/family/start type/control type)
     - `Offer` (price in CAD, priceCurrency: CAD, priceValidUntil: +180 days, availability: InStock vs PreOrder/Backorder based on `in_stock`/`availability`, seller → `#organization`, url → motor URL, hasMerchantReturnPolicy + shippingDetails marker for "pickup only at Gores Landing").
     - `BreadcrumbList`: Home → Mercury Outboards Ontario → {family} → {HP}HP model.
   - **Noscript HTML body:** an `<article>` with H1, key spec table (HP, family, shaft, model #, start type, control type), price line, availability, "Pickup only at Gores Landing", warranty paragraph, and a `<a href="/quote/motor-selection?motor={id}">Build a quote</a>` CTA. This is what crawlers and lightweight LLM fetchers see.

2. **`scripts/static-prerender.mjs` writeRoute loop** — keep current behavior but also build `dist/motors/{slug}/index.html` for each motor. Sanity check skips motors missing `model_key` or selling price.

3. **Vercel SPA fallback:** `vercel.json` rewrites `/motors/:slug` to `/index.html`. The static file at `dist/motors/{slug}/index.html` will be served first by Vercel's static handler before the SPA fallback fires — same mechanism the existing landing routes use today.

4. **`src/utils/generateSitemap.ts` → `getMotorSitemapEntries()`** — already exists and is wired into `generateFullSitemapXML`, but the **synchronous** `generateSitemapXML()` (used by `scripts/generate-sitemap.ts` at build time) does **not** include motors. Switch the build script to call the async version and write the resulting XML so motors land in `public/sitemap.xml`.

5. **`src/pages/MotorRedirect.tsx`** — keep redirect for legacy URLs that don't have a prerendered file, but on hydration of a prerendered page we don't want it to redirect away. Solution: rename the route or make `MotorRedirect` a no-op if the URL hash matches a prerendered motor. Cleaner fix: introduce `src/pages/MotorPage.tsx` that renders the same noscript content + a CTA + an inline "Configure & Quote" button that pushes to `/quote/motor-selection?motor={id}` only on click, not on mount. Mount `<MotorPage>` at `/motors/:slug` and retire `MotorRedirect` (or keep it as a fallback for slugs missing from the new page).

---

## Priority 2 — Fix orphan SEO on `/trade-in-value`, `/accessories`, `/compare`, `/finance-calculator`, `/financing-application`

**Current state:** None of these five routes are in the prerender `routes` array — they ship the homepage `<title>`, description, canonical, OG/Twitter tags from `index.html`. (`FinanceCalculator.tsx` does mount a `FinanceCalculatorSEO` component on the client, but Helmet only runs after JS hydrates, so raw HTML and most LLM crawlers see homepage metadata.)

**Plan:** Add five new entries to the `routes` array in `scripts/static-prerender.mjs` with route-specific `title`, `description`, `h1`, `intro`, `schemas`, and a noscript fallback. Each gets its own JSON-LD WebPage + BreadcrumbList + the right entity (Service for trade-in, ItemList for accessories, ComparePage for compare, FinancialProduct/Service for the calculator and application).

| Path | Title | Description | Schema |
|---|---|---|---|
| `/trade-in-value` | Trade-In Value Estimator — Mercury Outboards | Harris Boat Works | Estimate your outboard trade-in value in CAD. Anchored to our actual selling prices, not blue-book guesses… | WebPage + Service ("Outboard trade-in valuation") + BreadcrumbList |
| `/accessories` | Mercury Outboard Accessories — Genuine OEM Parts | Harris Boat Works | Genuine Mercury OEM accessories — propellers, controls, gauges, batteries… | WebPage + ItemList of accessory categories + BreadcrumbList |
| `/compare` | Compare Mercury Outboards Side-by-Side | Harris Boat Works | Compare Mercury outboard motors side-by-side: HP, weight, shaft, CAD price, family… | WebPage + ItemList placeholder + BreadcrumbList |
| `/finance-calculator` | Mercury Outboard Finance Calculator (CAD) | Harris Boat Works | Estimate your Mercury outboard monthly payment in CAD. 8.99% under $10K, 7.99% over… | WebPage + FinancialProduct + BreadcrumbList |
| `/financing-application` | Mercury Outboard Financing Application | Harris Boat Works | Apply online for Mercury outboard financing through DealerPlan. 7.99–8.99% APR, $5,000 minimum… | WebPage + FinancialProduct + BreadcrumbList |

Add all five to `getStaticPages()` in `src/utils/generateSitemap.ts` (some are already there but priority/changefreq should be tuned).

---

## Priority 3 — Sync source-of-truth files

**Current discrepancies (verified):**

- `public/.well-known/ai.txt` line 48 says "Boat sales (we sell motors, not boats)" → **wrong**. `public/llms.txt` and `public/.well-known/brand.json` correctly note we are an authorized Legend Boats dealer.
- `public/.well-known/mcp.json` `lastUpdated` is `2026-04-20`. `brand.json` is `2026-04-20`. `llms.txt` has no date. None reflects today's repository state.
- `llms.txt` blog list is incomplete — it lists 7 articles; there are 47+ published.
- "Mercury dealer since 1965" / "family-owned since 1947" phrasing is consistent in `llms.txt`, `brand.json`, `mcp.json`, and the prerender shell — **good, keep**.
- Verado policy is consistent across all three machine-readable files — **good, keep**.
- Pickup-only policy is consistent — **good, keep**.

**Plan:**

1. **`public/.well-known/ai.txt`** — replace the "Boat sales" defer line with: `Boat sales: We are an authorized Legend Boats dealer (new pontoon and aluminum). For all other boat brands, contact those dealers directly.` Add `boat_dealer_for: Legend Boats` near the business identity block.

2. **`public/llms.txt`** — regenerate the "Blog Articles" section to list **all** currently-published articles (auto-load from `src/data/blogArticles.ts` via a small Node script in `scripts/generate-discovery-files.mjs` so this stops drifting). Also add a short "Boat Sales" section noting the Legend Boats dealership and link to brand.json.

3. **`public/.well-known/brand.json`** — bump `lastUpdated` to today, add `"legendBoatsDealer": true` and a short `boatSales` block clarifying we sell new Legend boats but no other boat brands.

4. **`public/.well-known/mcp.json`** — bump `lastUpdated` to today and add a one-line `boatSales` field in the `geography`/`tags` block referencing Legend Boats so MCP-aware agents see it.

5. **Build hook:** add the regeneration script to `vite build` (or run it from `scripts/static-prerender.mjs` before stamping) so `lastUpdated` and the blog list are always current.

---

## Priority 4 — Real HTML tables on the major answer pages

LLM extractors (Perplexity, Claude search, ChatGPT browsing) and Google's table-aware snippets reward semantic `<table>` markup. Today these pages render lists or paragraphs instead of tables.

**Plan:** Add a real `<table>` (with `<caption>`, `<thead>`, `<tbody>`) into each page **and** mirror the table into the noscript fallback in `scripts/static-prerender.mjs` so crawlers see it pre-hydration.

1. **`/repower`** (`src/pages/Repower.tsx`)
   - Table 1: **Repower cost by HP range** (HP range, typical motor family, installed CAD range, lead time).
   - Table 2: **Repower vs new boat** (item, repower, new boat) — already has comparison content as cards; convert to table.

2. **`/mercury-outboards-ontario`** (`src/pages/landing/MercuryOutboardsOntario.tsx`)
   - Convert the `LINEUP` cards into a **lineup table** (Series, HP range, Best for, Starting CAD).

3. **`/mercury-pontoon-outboards`** (`src/pages/landing/MercuryPontoonOutboards.tsx`)
   - Already has a sizing table per the file summary — verify it's a real `<table>` (not a `<div>` grid). If it's a grid, convert. Add a second table mapping pontoon brand → recommended Mercury (Legend, Princecraft, Sylvan, Manitou, Bennington).

4. **`/blog/mercury-repower-cost-ontario-2026-cad`** — add an HP-vs-installed-cost table (10/25/60/90/115/150/200 HP × motor + install + total CAD range).

5. **`/blog/cheapest-mercury-outboard-canada-2026`** — add an "Cheapest by category" table (Lightest portable, Cheapest tiller, Cheapest electric-start, Cheapest 60HP, etc., with model + CAD price).

6. **`/blog/mercury-115-vs-150-hp-outboard-ontario`** — add a side-by-side spec table (HP, dry weight, displacement, top speed est., fuel economy, CAD price, best boat type).

Each table also gets a noscript clone in `scripts/static-prerender.mjs` `extraNoscript` for the route, so agents that only fetch raw HTML still extract structured data.

---

## Priority 5 — Canonicalize the cost article

**Confirmed duplicates** in `src/data/blogArticles.ts` for slug `mercury-repower-cost-ontario-2026-cad` (lines 8761+):

```
Q1 (74)  "Are Mercury prices higher in Canada than the US?"
Q1' (94) "Are Mercury outboard prices higher in Canada than the US?"   ← duplicate

Q2 (78)  "Does Harris Boat Works offer financing on repowers?"
Q2' (98) "Does Harris Boat Works offer financing on Mercury repowers?" ← duplicate

Q3 (82)  "How long does a full repower take?"
Q3' (102)"How long does a full Mercury repower take?"                   ← duplicate

Q4 (86)  "Is there a best time of year to repower in Ontario?"
Q4' (106)"Is there a best time of year to repower an outboard in Ontario?" ← duplicate

Q5 (90)  "What is the cheapest way to repower with Mercury?"
Q5' (110)"What is the cheapest way to repower with Mercury in Ontario?" ← duplicate
```

**Plan:**

1. **De-dup the FAQ array.** Keep the longer/more-specific phrasing (the `'Mercury'`-qualified versions on lines 94/98/102/106/110), drop the original five. Net: 5 fewer FAQs, no information loss.

2. **Mark this article canonical** for cost queries:
   - Add a `canonicalFor: ['repower-cost', 'mercury-cost-ontario', 'cost-2026-cad']` field on the article (purely informational for our internal links — not a `rel=canonical` change since each blog post already self-canonicalizes).
   - Add an "About this guide" callout at the top that says "This is the canonical 2026 Mercury repower cost guide. All other cost-related articles link here."

3. **Cross-link related cost articles back to it.** Edit each of these articles' content to include a "**See the full 2026 cost breakdown →**" link near the top:
   - `boat-repowering-guide-when-to-replace-motor`
   - `boat-motor-financing-guide-ontario`
   - `mercury-pricing-promotions-2026`
   - `year-end-boat-motor-buying-guide`
   - `winter-repower-planning-guide`
   - `cheapest-mercury-outboard-canada-2026`
   - `mercury-115-vs-150-hp-outboard-ontario`
   - `complete-guide-boat-repower-kawarthas`
   - `ontario-cottage-boat-motor-repower-guide`

4. **Update `llms.txt`** so the Mercury Repower Cost article is the first/featured cost link.

---

## Files touched (summary)

**Create / heavy-edit:**
- `scripts/static-prerender.mjs` — add motor route generation (Priority 1), 5 new orphan routes (Priority 2), updated noscript tables (Priority 4)
- `src/pages/MotorPage.tsx` (new) — replace `MotorRedirect` for prerendered slugs (Priority 1)
- `scripts/generate-discovery-files.mjs` (new) — auto-regen `llms.txt`, `ai.txt`, `brand.json`, `mcp.json` blog/lastUpdated fields (Priority 3)

**Edit:**
- `src/utils/generateSitemap.ts` — switch to async motor-aware sitemap; add the 5 orphan routes
- `scripts/generate-sitemap.ts` — call `generateFullSitemapXML()` instead of sync version
- `src/App.tsx` — swap `MotorRedirect` for `MotorPage` at `/motors/:slug` (keep `MotorRedirect` as fallback)
- `src/pages/Repower.tsx` — add 2 tables (Priority 4)
- `src/pages/landing/MercuryOutboardsOntario.tsx` — convert lineup to table
- `src/pages/landing/MercuryPontoonOutboards.tsx` — confirm/convert sizing table; add pontoon brand → Mercury table
- `src/data/blogArticles.ts` — dedupe cost FAQ; add 3 cost-content tables; add cross-links
- `public/.well-known/ai.txt` — fix Legend Boats line
- `public/.well-known/brand.json` — add Legend Boats, bump lastUpdated
- `public/.well-known/mcp.json` — add Legend Boats, bump lastUpdated
- `public/llms.txt` — regenerated section + Legend Boats note + canonical cost link

**Verification after build:**
- `dist/motors/<slug>/index.html` exists for ~100+ motors with route-specific title, JSON-LD Product/Offer, noscript article body
- `dist/{trade-in-value,accessories,compare,finance-calculator,financing-application}/index.html` carries route-specific titles
- `public/sitemap.xml` includes all 122 motor URLs and the 5 orphan routes
- `ai.txt`/`llms.txt`/`brand.json`/`mcp.json` agree on Legend Boats and have today's `lastUpdated`
- `mercury-repower-cost-ontario-2026-cad` article has 5 fewer FAQs (no duplicates) and 3 inbound links from related cost articles

**Out of scope (per your note):** no new blog posts, no copy rewrites beyond the duplicate FAQ removal, no design changes.

---

Does this plan look correct to you? If yes, approve and I'll switch to implementation mode.