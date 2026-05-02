## Goal

Simplify `/locations/:slug` so each page feels premium, calm, and scannable — like a high-end dealer page, not an SEO landing page. No changes to quote builder, pricing, inventory, redirects, sitemap, or markdown twin generation.

## What changes

Only two files get meaningful edits:

1. `src/pages/LocationDetail.tsx` — full visual redesign (less density, fewer sections).
2. `src/data/locations.ts` — light trims: cap FAQs at 4, remove ROI/cost-claim FAQs, ensure each city has exactly one "no mobile service" FAQ.

Everything else (data interface fields, slugs, JSON-LD shape, markdown twin output, sitemap, redirects, lint rules) stays as-is so we don't disturb the SEO/AI infrastructure we just built.

## New page structure

```text
┌─ Premium hero (navy bg, gold accent) ────────────────────┐
│  H1: Mercury Outboards for {Region} Buyers              │
│  1 short intro paragraph                                 │
│  [Build Your Quote]  [Call Harris Boat Works]            │
│  Trust row (inline, small): Platinum · Since 1947 ·      │
│    Mercury since 1965 · Pickup in Gores Landing          │
└──────────────────────────────────────────────────────────┘

┌─ Local context ──────────────────────────────────────────┐
│  3 short bullets (first 3 of localContext)               │
└──────────────────────────────────────────────────────────┘

┌─ Common motor use cases (3 cards) ───────────────────────┐
│  Small / kicker  │  60–115 fishing & pontoon  │ 150+ Pro XS │
│  → /quote/motor-selection (with hp hint in link copy)    │
└──────────────────────────────────────────────────────────┘

┌─ Pickup boundary (one polished box) ─────────────────────┐
│  Bring the boat to Gores Landing, or pick up a loose     │
│  motor. No mobile service, delivery, driveway installs,  │
│  or marina visits.                                       │
└──────────────────────────────────────────────────────────┘

┌─ FAQ (max 4, short answers) ─────────────────────────────┐
│  Accordion or simple stacked cards                       │
└──────────────────────────────────────────────────────────┘

Footer CTA: single line + Build Your Quote button.
```

## What gets removed from the rendered page

- 4-tile factbox grid (drive time / pickup / Platinum / phone) — drive time folded into intro, phone into footer CTA.
- "Why customers from {region} choose us" bullet list (covered by hero trust row).
- "Common local boats" + "Popular HP ranges" twin grid (replaced by 3 use-case cards).
- "Recommended next steps" link grid.
- "Related repower case studies" block.
- The duplicate amber "Shop-based service only" banner (merged into the single pickup boundary box).
- Drive route paragraph (kept in data; not rendered on the page).

Data fields stay in `LocationPageData` so markdown twins and JSON-LD still emit them — we just stop showing them in the React UI.

## Data trims (`src/data/locations.ts`)

- Cap `faqs` at 4 entries per location.
- Remove FAQs that quote dollar ranges or ROI claims (e.g. Rice Lake "What does a typical Rice Lake repower cost?").
- For each city page, ensure exactly one FAQ answers the "do you do mobile service / deliver" question — collapse duplicates.
- No interface changes. No removed fields. Other consumers (markdown twin generator, JSON-LD) keep working unchanged.

## Design

- Hero: deep navy background (`bg-slate-900` / brand navy token), white H1, thin gold rule under H1, white intro.
- Body: white background, generous vertical spacing (`py-16` between sections), `max-w-3xl` for body content (narrower than today's `max-w-4xl`) so it feels editorial.
- Cards: subtle border, no heavy shadows, single accent color.
- One CTA color (gold/primary) used sparingly — hero primary CTA + footer CTA only.
- Use existing tokens (`bg-card`, `border-border`, `text-primary`) — no new color additions.

## JSON-LD

Kept exactly as today: `WebPage`, `BreadcrumbList`, `LocalBusiness` (with sales-catchment `areaServed`), `Place`, `FAQPage`. No `Service` node. FAQ schema will reflect the trimmed (≤4) FAQ list automatically since it iterates `location.faqs`.

## Explicitly NOT touched

- `/quote/motor-selection` and any quote/pricing/inventory code
- `src/App.tsx` redirects
- `vercel.json` 301s
- `scripts/generate-markdown-twins.mjs` (lint + frontmatter)
- `scripts/static-prerender.mjs`
- `src/utils/generateSitemap.ts`
- `src/pages/Locations.tsx` hub (already correct after last pass)
- `LocationPageData` interface

## Acceptance

- Each `/locations/:slug` page has ≤5 visible sections (hero, context, use-cases, boundary, faq) plus footer CTA.
- "No mobile service" / "no delivery" wording appears in exactly one visible box plus at most one FAQ.
- Build still passes the markdown-twin lint.
- JSON-LD validates and includes FAQ + LocalBusiness + Breadcrumb.
- No dollar amounts or ROI claims rendered on city pages.
