## Evaluation of the brief

The brief is **accurate and well-scoped**. I verified the key claims against the codebase:

- Confirmed: `/pricing-reference` exists, uses `genericPageSchema` only (generic WebPage), no Product/Offer/ItemList. Brief is right.
- Confirmed: `GlobalSEO.tsx` line 68 has `latitude: 44.1147` and renders `priceRange: "$"` on the sitewide LocalBusiness — both wrong as the brief states.
- Confirmed: `motor_models` data is server-accessible at prerender time (`scripts/generate-markdown-twins.mjs` already builds the .md table from it). Patch 2 can be generated statically — answers the brief's open question.
- Confirmed: zero real internal links to `/pricing-reference`. However, I found a **related bug** the brief missed: ~10+ blog articles and case-study/location data files link to `/n` (e.g. `mercuryrepower.ca/n`) as a shortlink for the pricing reference, and `/n` is not a route — those are silent 404s. Worth fixing as part of Patch 1.

One concern with **Patch 3 (microdata)**: the page client-renders markdown via `marked.parse()` into `dangerouslySetInnerHTML`, so injecting per-row `itemscope/itemprop` requires either post-processing the HTML string client-side or emitting microdata in the static prerender's noscript fallback. Brief itself flags Patch 3 as deprioritizable. I recommend skipping unless you want it.

Overall: **do Patches 1, 2, 4, 5. Skip Patch 3.** Estimated 4–5 hrs of work. No risk to existing functionality — all additive schema + a few links.

## Plan

### Patch 1 — Internal links (incl. `/n` shortlink fix)
- Add an `<a href="/pricing-reference">` link in:
  - Homepage hero/trust area (locate Index/home component)
  - `RepowerHub.tsx` near the price range copy
  - `FAQ.tsx` answer that mentions price ranges
  - Site footer "Resources" section
  - Blog post layout's "related" area
- Fix dangling `/n` references: either add a redirect route `/n` → `/pricing-reference` in `App.tsx` (lowest-effort, preserves blog copy), or sweep `src/data/blogArticles.ts`, `caseStudiesLongForm.ts`, `locationsLongFormUpgrades.ts` to replace `/n` with `/pricing-reference`. Recommend the redirect route — single line, no content churn.

### Patch 2 — Product/Offer/ItemList JSON-LD
- In `scripts/static-prerender.mjs`, replace the `/pricing-reference` `schemas:` array with a custom `@graph` containing:
  - WebPage (linked to `#website`, `#organization`, with `mainEntity` → `#pricelist`)
  - ItemList `#pricelist` with one ListItem per motor pulled from the same `motor_models` query the markdown twin already runs
  - Each item: Product with brand=Mercury Marine, additionalProperty (HP, Family), and Offer (price, CAD, availability based on stock status, seller `@id`=`#organization`)
- Group by motor row (matches the .md table — HP variants in `additionalProperty`). One ListItem per row, not per shaft variant.
- Re-emit the same `@graph` in a Helmet `<script type="application/ld+json">` inside `PricingReference.tsx` so SPA navigations also expose it. (Will need to fetch a small `/pricing-schema.json` artifact built at the same time, OR inline a build-time generated TS module — simpler: generate `src/data/pricingReferenceSchema.ts` from the same script and import it.)

### Patch 4 — "About this dealer" paragraph
- Add the dealer attribution paragraph to `public/pricing-reference.md` (between intro and "How to use this page"), so it flows through both the .md alternate and the rendered HTML (PricingReference.tsx renders the .md body).
- Wrap "Harris Boat Works" as a markdown link to `/`.

### Patch 5 — LocalBusiness fixes (sitewide)
- In `src/components/seo/GlobalSEO.tsx` and `HomepageSEO.tsx`: change `latitude: 44.1147` → `44.1456` and `longitude: -78.2564` → `-78.2542`.
- Remove the `priceRange: "$"` field (cleaner than guessing `$$$`; the repower Service AggregateOffer already conveys range).
- Audit any other SEO components that duplicate these coords (`rg -n "44.1147"`) and update consistently.

### Verification
- `bun run build` (prerender will fail loudly if schema generation breaks)
- `curl -sL` checks from the brief's acceptance criteria
- Spot-check view-source on `dist/pricing-reference/index.html` for the new `@graph` block

### Technical notes
- Use the existing Supabase service-role data fetch the markdown-twin script uses; do not introduce a new data path.
- Availability mapping: in-stock → `InStock`, available-to-order → `PreOrder`.
- Slug for Product `@id` should reuse the motor's existing `model_display`-derived slug (already used in `/motors/{slug}`).

### Out of scope (per brief)
- No Verado entries
- No microdata on table rows (Patch 3)
- No fake reviews/ratings
- No changes to title/H1/meta/canonical

## Open questions
1. OK to add the `/n` → `/pricing-reference` redirect route instead of rewriting blog copy?
2. OK to skip Patch 3 (microdata) per brief's own deprioritization?
3. Where exactly on the homepage do you want the "See all Mercury outboard prices" link — hero trust bar, or the existing pricing ribbon, or both?
