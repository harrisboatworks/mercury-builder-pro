

## Pilot landing pages — plan with one hard blocker to resolve

Your doc proposes 9 new conversion-intent landing pages, each with route, content spec, and JSON-LD schema. The architecture is clean and matches what's already in the codebase (page component → SEO component with Helmet → matching prerender schema in `scripts/static-prerender.mjs` → route in `src/App.tsx` → entry in `src/utils/generateSitemap.ts`).

I can build all of this. Before we start, one thing in the doc directly conflicts with a hard project rule, and I need a decision.

### Blocker: Page #6 `/mercury-verado` cannot ship as written

Project memory and existing AI guardrails (`mem://ai-safety/product-exclusion-verado-v2`) state: **Harris Boat Works does not sell or service Mercury Verado**. The FAQ, AI chatbot, voice agent, and sales content all redirect Verado interest to FourStroke V8 (250–300 HP) or Pro XS. Publishing a `/mercury-verado` landing page that says "Harris Boat Works is a Mercury Platinum Dealer serving Verado buyers" would directly contradict that policy and the AI agents would refuse to discuss the page they're being asked to support.

Three options — pick one:

| Option | What ships at slot #6 |
|---|---|
| **A. Drop Verado, replace with `/mercury-fourstroke-v8`** (recommended) | Same premium 250–300 HP intent, aligns with what HBW actually sells. Captures "mercury 300 outboard ontario" / "mercury v8 outboard canada" queries. |
| **B. Drop Verado, replace with `/mercury-portable-outboards` (2.5–20 HP)** | Different segment — kicker / tender / small tiller buyers. Lower intent per visit but underserved on the site. |
| **C. Lift the Verado exclusion** | Requires updating chatbot KB, FAQ data, voice agent context, and the memory rule. Bigger scope, owner decision. Don't recommend without Jay confirming. |

I'll assume **A** unless told otherwise.

### What's good to go as-is

The other 8 pages all align with project rules. Two small adjustments I'll make automatically:

1. **`/mercury-dealer-gta`** — copy says "Mercury dealer since 1965." Project memory anchors **family-owned 1947, Mercury dealer 1965** (both already in global schema). I'll keep both year anchors consistent across all 8 pages.
2. **No "delivery" / "ship motor" language** — project rule is strict Pickup Only at Gores Landing (`mem://policies/sales/no-delivery-transport-strict-policy`). Page #3 GTA section mentions "ship motor or bring boat" — I'll rewrite as "bring boat for install, or pick up loose motor for self-install." Page #5 says "pricing starts at [$X] CAD including delivery to Gores Landing" — that's actually fine (delivery TO us = pickup), but I'll phrase as "pricing starts at $X CAD, pickup at Gores Landing" to remove ambiguity.

### How I'll build each page (the pattern, applied 9× — or 8× without Verado)

Each landing page = 5 coordinated changes, identical pattern to what we already shipped for `/about`, `/contact`, `/quote/summary`:

```text
1. src/pages/landing/<PageName>.tsx     — React component, content + CTA
2. src/components/seo/<PageName>SEO.tsx — Helmet + JSON-LD (matches prerender)
3. scripts/static-prerender.mjs         — <pageName>Schema() + route entry
4. src/App.tsx                          — <Route path="..." element={...} />
5. src/utils/generateSitemap.ts         — getStaticPages() entry, priority 0.8
```

Schema per page-type follows your cheat sheet:
- **Geo (Peterborough, Cobourg, GTA):** `WebPage` + `BreadcrumbList` + `Service` (areaServed = the city `Place`) + `FAQPage` (5 Q/A)
- **Product hub (Pro XS):** `WebPage` + `BreadcrumbList` + `ProductGroup` with `hasVariant` Offers per HP tier + `FAQPage` (6–8 Q/A)
- **Product model (150 FourStroke):** `WebPage` + `BreadcrumbList` + `Product` + `Offer` + `FAQPage` (6 Q/A)
- **Repower FAQ:** `WebPage` + `BreadcrumbList` + `FAQPage` with all 20 Q/A formally encoded
- **HowTo:** `WebPage` + `BreadcrumbList` + `HowTo` (7 `HowToStep` entries) + `FAQPage` (5 Q/A)
- **Trust page:** `WebPage` + `BreadcrumbList` + `Organization` + `FAQPage` (12 Q/A) — no `AggregateRating` unless we wire to a real review source (the previous global schema's hardcoded 4.9/127 is gone for a reason)

All pages render React `<LuxuryHeader />` + `<SiteFooter />` for nav consistency, and all CTAs deep-link to `/quote/motor-selection`.

### Pricing data — flag for the product pages

Pages 4 and 5 (Pro XS, 150 FourStroke) need real CAD prices. The doc has `[$X]` placeholders. I won't hardcode prices — the project's `motor_models` table is the source of truth (`mem://features/pricing/motor-selling-price-hierarchy-and-source-of-truth`). Two ways to handle:

- **Static range** (e.g. "Pro XS 115: from $14,599 CAD"): I pull current values from `motor_models` at build time and bake them into the page. Stale within weeks if pricing moves. Simplest.
- **Dynamic fetch on page load**: live read from Supabase. Always current. Adds a query per visit (cached client-side). Better.

Recommend **dynamic** for product pages, **static "starting at"** ranges in JSON-LD `Offer` (rich-result safe — Google needs a number, not a query). I'll flag specific motors when I get to that step.

### Suggested rollout

Your week-by-week order is solid. Confirming or revising:

1. **Batch 1 (build first):** `/mercury-repower-faq` + `/how-to-repower-a-boat` + `/mercury-dealer-canada-faq` (the three FAQ/trust pages — highest AI-citation ROI, no pricing or geo dependencies, all content is already in our heads)
2. **Batch 2:** `/mercury-dealer-peterborough` + `/mercury-dealer-cobourg` + `/mercury-dealer-gta` (geo set — ship together for cross-linking)
3. **Batch 3:** `/mercury-pro-xs` + `/mercury-150-fourstroke` + (Verado replacement) — needs price data confirmation before we ship

That's 3 separate Lovable build sessions, each ~3 pages.

### What I need from you to start Batch 1

1. **Verado decision:** A, B, or C above? (I'll default to A.)
2. **Confirm batch order** above, or reshuffle.
3. **For the 20-Q FAQ page:** want me to draft the 20 Q/A from scratch (using existing FAQ data + brand voice), or will you supply them? I can draft.
4. **AggregateRating on trust page:** include a hardcoded star rating, omit until we wire real Google reviews, or omit permanently? Recommend **omit until real source** — Google penalizes review schema without a verifiable source.

Answer those four and I'll build Batch 1 (3 pages, 15 file changes) in the next default-mode pass.

