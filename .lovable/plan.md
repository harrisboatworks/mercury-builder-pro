## Goal

Resolve the three GSC schema/indexing flags for mercuryrepower.ca:
1. Merchant listings missing `productGroupID`
2. Product snippets missing `offerCount` on `AggregateOffer`
3. Indexing — 404s and redirects in sitemap

## Scope

Only schema/JSON-LD and sitemap. No visual changes.

### 1. `productGroupID` on family Product nodes

Two places emit family-level Products (FourStroke / Pro XS / SeaPro / ProKicker):

- `src/components/seo/MotorSelectionSEO.tsx` (React-hydrated, 4 Product entries, lines ~61–140)
- `scripts/static-prerender.mjs` `motorSelectionSchema()` (prerendered HTML, 4 Product entries, lines ~1183–1273)

Add to each family Product node:
- `"@type": ["Product", "ProductGroup"]`
- `"productGroupID": "<stable-id>"` using the IDs the user supplied:
  - `mercury-fourstroke-outboards`
  - `mercury-pro-xs-outboards`
  - `mercury-seapro-outboards`
  - `mercury-prokicker-outboards`
- `"variesBy": ["horsepower", "shaftLength", "startType"]`

Per-motor `/motors/{slug}` schema (built in `src/lib/seo/buildMotorProductSchema.ts`) gets an optional `isVariantOf` reference back to the matching family group when `family` is known:
```
isVariantOf: { "@type": "ProductGroup", "productGroupID": "mercury-<family-slug>-outboards" }
```
Family-slug mapping derived from `MotorFamily` (lowercase, spaces → dashes; e.g. `Pro XS` → `pro-xs`). Skip when family is missing.

### 2. `offerCount` on AggregateOffer

For each family Product's `AggregateOffer` in both `MotorSelectionSEO.tsx` and `static-prerender.mjs`, add `offerCount` equal to the live variant count.

Source of truth: query `motor_models` grouped by family classification (reusing `classifyMotorFamily` from `src/lib/motor-family-classifier.ts`). For the React component this is a runtime count from the already-fetched motor list (pass `familyCounts` prop alongside existing `motorCount`/price props). For the prerender script, compute counts at build time from the same Supabase fetch that already powers `motorSelectionSchema` and pass into the schema function. No hardcoded inflation — actual counts only. When a count is 0, omit that family Product entirely rather than emit `offerCount: 0`.

Also audit lineup landing pages (`MercuryLineupLandingSEO.tsx`): the schema there uses an `offers` array (per-variant Offers), not `AggregateOffer`, so no change needed.

### 3. Sitemap cleanup (404s + redirects)

`src/utils/generateSitemap.ts` `getMotorSitemapEntries()` currently emits `/motors/{slug}` for every row in `motor_models` with a non-empty `model_key`. Two filters to add:

- Only include rows that will render a 200 page: require `model_display` non-null AND `is_active`/visible flag (mirror whatever the `/motors/:slug` loader uses to 404). Will read `MotorPage.tsx` to confirm the exact gate before coding so the sitemap matches what the page actually serves.
- Drop any model_key whose slug doesn't match the canonical slug the page itself emits (prevents redirect entries).

`/motors/:slug` pages stay in sitemap (they render full Product+Offer schema via `MotorPageSEO` and have self-canonical), so we keep the "rank individually" path the user described.

Static-page list in `getStaticPages()` will be spot-checked for any URL that now 404s or redirects (e.g. removed landing pages). Any found will be removed.

### Verification

- `npx tsc -p tsconfig.app.json --noEmit`
- `node scripts/check-structured-data.mjs` (runs after build; checks new ProductGroup/offerCount shape doesn't trip required-field validation)
- Manual schema validator paste of one rendered `/quote/motor-selection` and one `/motors/{slug}` block

### Files to edit

- `src/components/seo/MotorSelectionSEO.tsx` — add ProductGroup type, productGroupID, offerCount; accept `familyCounts` prop
- The caller of `MotorSelectionSEO` (will locate via grep) — pass familyCounts derived from the existing motor list
- `scripts/static-prerender.mjs` — same ProductGroup/offerCount additions in `motorSelectionSchema()`; compute counts from existing Supabase fetch
- `src/lib/seo/buildMotorProductSchema.ts` — add optional `isVariantOf` ProductGroup ref keyed off `family`
- `src/utils/generateSitemap.ts` — tighten `getMotorSitemapEntries()` filter to indexable, canonical, 200-returning slugs only

### Out of scope

- TD financing card / 7-year warranty promo (untouched)
- Any visual or copy changes
- Blog/article schema
- Lineup landing pages (already use per-variant Offer arrays, no AggregateOffer)
