
# mercuryrepower.ca — AI Search, Local SEO & Conversion Audit

This plan tightens what's already in place rather than rebuilding it. The AI-agent docs (`/agents`, `/llms.txt`, `/.well-known/mcp.json`, `/.well-known/ai.txt`, `/catalog.md`) and the public Edge Functions (`public-motors-api`, `public-quote-api`, `motors-md`, `agent-mcp-server`) are already real and consistent. No `/api/public-motors-api` or `/repower-quote` references exist in the codebase or public files — that part of the audit is already clean. The work below adds proof, intent-targeted content, and conversion clarity using only verified facts (1947, 1965 Mercury dealer, Gores Landing pickup, CAD, Verado special-order, Legend new-boat exclusivity).

---

## 1. AI-agent documentation — small consistency fixes

Current state is good. Only minor tightening needed:

- **`/llms.txt`** — line 39–43 lists example motor URLs that include a Verado example and slugs that don't match real catalog slugs. Replace with 4 real slugs from `public/catalog.md` (e.g. `proxs-115hp-115-elpt-proxs`, `fourstroke-90hp-90-elpt-command-thrust-fourstroke`, `fourstroke-25hp-25-elpt-fourstroke`, `fourstroke-9-9hp-9-9elh-fourstroke`) and drop the Verado example to stay consistent with the "not actively promoted" rule.
- **`/llms.txt`** — line 27 advertises "Mercury Racing 450R-600HP" as if it's part of the lineup we sell. Soften to "available by special order" to match the Verado treatment, since it's not in the public feed.
- **`/.well-known/mcp.json`** — already correct. No change.
- **`/.well-known/ai.txt`** — already correct. No change.
- **`/catalog.md`** — already correct.
- **`/agents` page (`AgentsHub.tsx`)** — already references the real Supabase Function URLs. No change.
- **Quote deep-link** — every doc already uses `/quote/motor-selection`. Verified. No change.

---

## 2. Trust & proof — new homepage section + repower page section

Add one new section to **`src/pages/Index.tsx`** (above the existing testimonials block) and one to **`src/pages/Repower.tsx`**:

### "What's included in an installed Mercury repower quote" (Repower page)
A clear bulleted breakdown using facts already used elsewhere in the app:
- New Mercury outboard (your selection) at real CAD pricing
- Standard rigging package (controls, harness, gauges as required by motor)
- Propeller allowance applied (per HP tier — already in `propeller-allowance.ts`)
- Professional installation by Mercury-certified technicians
- Lake-test on Rice Lake before pickup
- Standard 3-year Mercury factory warranty (up to 7 years on select promos)
- HST shown line-by-line
- Optional trade-in credit applied against motor subtotal
- Optional financing (8.99% under $10K, 7.99% $10K+, $5K minimum)
- Final out-the-door price confirmed by Harris Boat Works before purchase
- Pickup at our Gores Landing location (we do not deliver)

### "Why buyers trust Harris Boat Works" (Homepage, replaces nothing — adds a new section)
Five short cards, all verifiable:
1. Family-owned since 1947
2. Authorized Mercury Marine dealer since 1965 (60+ years)
3. Mercury-certified service technicians on-site
4. Real CAD pricing online — not "call for price"
5. Local pickup at Gores Landing on Rice Lake

### "Real dealer quote vs 'call for price' listings" (Repower page subsection)
Short two-column compare — left: generic listings ("price on request", "contact for availability", no trade-in math, no financing math), right: HBW quote builder (live CAD, itemized, trade-in math, financing math, refundable deposit, dealer-confirmed). No competitor names.

---

## 3. AI-readable motor & location content

### Motor markdown twins
Already include model, HP, family, CAD price, stock status, pickup-only, dealer confirmation, best-fit. **No change to existing twins.**

Action: confirm `scripts/generate-markdown-twins.mjs` continues to exclude motors with `availability = 'Exclude'` so private/excluded motors stay out of public flows. (One-line read-only verification, no rewrite expected.)

### Location markdown twins — buyer-intent rewrite
Current `peterborough-mercury-dealer.md`, `durham-gta-mercury-pickup.md`, etc. are thin. Rewrite each to include:
- A 2–3 sentence intro that names the buyer intent (e.g. "Mercury outboard repower near Toronto", "Mercury dealer GTA", "Mercury outboard pricing Ontario", "boat repower Ontario") naturally in prose — not stuffed.
- Drive time + nearest highway anchor (verified facts only — Peterborough ~35 min, Cobourg ~20 min, Toronto/east GTA ~90 min, Durham ~75 min, Kawarthas ~30 min).
- Common boats in that region (e.g. Kawarthas → pontoons + aluminum fishing; GTA → runabouts + bowriders; Cobourg → small fishing + family boats).
- A clear 3-link CTA block: Build Quote → Trade-In Estimate → Phone.
- Same FAQ block but answers tightened to reinforce pickup-only and CAD pricing.

Apply to all 5 location twins under `public/locations/`.

### Location HTML pages
The matching HTML routes (`/locations/:slug` via `LocationDetail.tsx`) read from `src/data/locations.ts`. Mirror the same intent copy there so humans see the same value props as agents.

---

## 4. New buyer-intent pages / blog content

These are the highest-leverage content adds. Each is a real page with a route, SEO component, and JSON-LD where relevant.

| Page | Route | Type |
|---|---|---|
| How much does a Mercury repower cost in Ontario? | `/blog/mercury-repower-cost-ontario-2026-cad` | **Already exists** in `llms.txt` index — verify content covers itemized breakdown; expand if thin. |
| What's included in a Mercury repower quote? | `/repower/whats-included` | **New** landing page |
| Mercury repower for pontoon boats | `/mercury-pontoon-outboards` | **Already exists** (`MercuryPontoonOutboards.tsx`) — verify, no rebuild. |
| Evinrude to Mercury repower in Ontario | `/blog/evinrude-to-mercury-repower-ontario-guide` | **Already exists** — verify content. |
| 90 HP / 115 HP / 150 HP Mercury repower guide | `/repower/horsepower-guide` | **New** — single page with 3 anchor sections (#90hp, #115hp, #150hp), each linking to matching motor pages. |
| Toronto / GTA pickup guide for Mercury outboards | `/locations/durham-gta-mercury-pickup` | **Exists** — expand per section 3 above. |

Two genuinely new pages to add:
1. **`/repower/whats-included`** — long-form version of the trust section in #2, with FAQ JSON-LD.
2. **`/repower/horsepower-guide`** — buyer-intent guide with 3 anchored sections, each with: typical boats, real motor links from the catalog (90/115/150), expected install-quote range pulled from existing pricing logic, and a "Build a 90 HP quote" CTA that prefills via the deep-link pattern.

Add both to the React Router in `src/App.tsx`, the sitemap generator, and `llms.txt`.

---

## 5. Conversion clarity

- **Hero CTA** — already says "Build Your Quote" with "Real Mercury Repower Prices. No Forms. No Games." Keep. Add a tiny subline directly under the CTA: "No forms before price. Live CAD. ~3 minutes."
- **Sticky "Build Quote" CTA** — `GlobalStickyQuoteBar` already exists; verify it shows on the new `/repower/*` pages.
- **"Next step" block** at the end of every new page: 3 buttons — "Build my quote", "Estimate my trade-in", "Call (905) 342-2153".
- **NotFound** — confirm 404 page links to `/quote/motor-selection` and `/repower` so dead-end traffic still converts.

---

## Technical details

### Files to edit
- `public/llms.txt` — fix lines 27 (Racing softening) and 39–43 (real slugs, drop Verado example).
- `public/locations/*.md` (all 5) — rewrite per section 3.
- `src/data/locations.ts` — mirror new location intent copy.
- `src/pages/Index.tsx` — add "Why buyers trust HBW" section + CTA subline.
- `src/pages/Repower.tsx` — add "What's included" + "Real quote vs call-for-price" sections.
- `src/pages/NotFound.tsx` — verify CTAs.

### Files to create
- `src/pages/repower/WhatsIncluded.tsx` + route in `App.tsx`.
- `src/pages/repower/HorsepowerGuide.tsx` + route in `App.tsx`.
- Markdown twins: `public/repower/whats-included.md`, `public/repower/horsepower-guide.md`.

### Files to verify only (no edit expected)
- `scripts/generate-markdown-twins.mjs` — exclusion rule for private motors.
- `scripts/generate-sitemap.ts` — add the 2 new routes.
- All edge function references in `/agents`, `/llms.txt`, `/.well-known/mcp.json` — already correct.

### Strict guardrails (apply everywhere)
- No fake reviews, testimonials, awards, or numbers. Existing testimonials in `Index.tsx` stay as-is (already in production).
- No claim of delivery, shipping, or off-site service.
- No proactive Verado promotion. Verado mention only as "special-order, contact us".
- All prices CAD. No USD anywhere.
- No new brands implied. Mercury outboards + Legend boats only.

### Out of scope
- No backend / DB changes.
- No edge-function changes (they're already correct).
- No design system or theme changes.
- No new images generated.
