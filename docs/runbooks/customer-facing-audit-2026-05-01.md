# Customer-Facing Audit — mercuryrepower.ca
Date: 2026-05-01
Scope: AI search readiness, buyer conversion, local Ontario/GTA intent.
Constraint: Audit only. No code, pricing, inventory, auth, Edge, cron, or MCP changes.

---

## Snapshot of what's already strong (do not regress)

- **AI discovery surface is unusually mature.** `/llms.txt` (HTTP 200, 175 lines), `/.well-known/ai.txt`, `/.well-known/mcp.json`, `/sitemap.xml` (200, 112 URLs), markdown twins for motors/locations/case-studies, and a public MCP server with 5 tools all live and CORS-open.
- **Public motors API healthy.** `public-motors-api` returns 200, `count: 25`, all in-stock, 0 Verado leaks, 0 missing prices, families split FourStroke 18 / ProXS 7. Catalog rules intact.
- **Provenance & policy** are reinforced consistently across `llms.txt`, `ai.txt`, `mcp.json`, location MDs, and motor MDs: CAD-only, pickup-only, Verado special-order, dealer since 1965, family since 1947.
- **Local intent coverage** has dedicated pages for Cobourg/Northumberland, Durham/GTA, Peterborough, Kawartha Lakes, Rice Lake — both as React landing pages and as `.md` twins. GTA + Peterborough also have React landing pages (`MercuryDealerGTA.tsx`, `MercuryDealerPeterborough.tsx`, `MercuryDealerCobourg.tsx`).
- **Schema.org graph** on home + motor selection has Organization, LocalBusiness, WebSite, BreadcrumbList, ItemList, AggregateOffer with CAD pricing, hreflang for en-CA/fr-CA/zh-Hans.
- **27 FAQ entries** in `src/data/faqData.ts` — solid base for FAQPage schema.

---

## Top 10 highest-impact improvements

Each item flags **DO NOW** (low risk, copy/markup/UI only) vs **THINK THROUGH WITH JAY** (touches data, PR claims, or business decisions).

### 1. Public motors feed is missing images for 22 of 25 motors — **DO NOW (data-side, no code)**
`public-motors-api` returns `imageUrl: null` for 22/25 motors. Only 3 have a `hero_image_url` or `image_url` populated in `motor_models`. AI agents and partners ingesting our feed see a near-imageless catalog, and Product schema with no `image` is downgraded by Google. **Fix path:** backfill `hero_image_url` for the 22 missing motors via the existing Dropbox folder sync (per memory `Dropbox Folder Sync`). No code change required, only data. Confirms with Jay only if any motor still has no source image.

### 2. Mobile homepage hero — secondary CTA collides with primary intent — **DO NOW (UI only)**
At 390×772 (current viewport) the hero stacks: Build Quote (primary), then mobile trust row, then a full-width outline "Call (905) 342-2153" button. Two equally-weighted CTAs above the fold dilute the conversion path. Recommend demoting the call button to a small inline link beneath trust row on mobile (`text-sm`, no full-width outline button) so "Build Your Quote" is the only filled CTA above the fold. Desktop is fine.

### 3. No competitive comparison pages — **DO NOW (content)**
`grep` finds zero `Mercury vs Yamaha` / `vs Honda` / `vs Suzuki` pages in `src/pages/`. The blog has the topics, but there are no dedicated comparison landing routes. These are the single highest-intent AI-search queries for a Mercury dealer ("is Mercury more reliable than Yamaha", "Mercury vs Yamaha 150"). Recommended new routes (markdown-twinned):
- `/compare/mercury-vs-yamaha-outboards`
- `/compare/mercury-vs-honda-outboards`
- `/compare/mercury-fourstroke-vs-pro-xs`
- `/compare/mercury-115-vs-150`
- `/compare/command-thrust-vs-standard-gearcase`
Use only verified facts. Cite mercurymarine.com brochures inline. No claims of "best" / "most reliable" without a sourced quote.

### 4. Motor detail markdown twins exist for only 26 of ~25-active + brochure motors — **THINK THROUGH WITH JAY**
`public/motors/*.md` has 26 hand-curated files. The catalog is dynamic and the live count is 25 today, but as Lightspeed adds new SKUs (e.g., new Command Thrust models, ProKickers), twins will go stale unless they're generated, not hand-edited. `scripts/generate-markdown-twins.mjs` exists — confirm it's wired into the build and producing twins for **every** motor returned by `public-motors-api`. If not, the twin set silently lags inventory. (Separate question for Jay: do we want SeaPro/Racing markdown twins too, even though we don't actively stock them?)

### 5. `llms.txt` lists motor-page example URLs that include Verado — **DO NOW (content fix)**
`/llms.txt` currently shows `https://www.mercuryrepower.ca/motors/verado-300hp-v8-exlpt` as an example URL. This contradicts our Verado-special-order policy that the same file states two paragraphs above, and it tells AI agents to fetch a Verado motor page. Replace with a non-Verado example (e.g., a real ProXS or FourStroke slug from the live feed).

### 6. ai.txt date is stale relative to last operational change — **DO NOW (content)**
`/.well-known/ai.txt` still says `last_updated: 2026-04-25`. We've made content/inventory shifts since (Lightspeed cutover, Sheets deprecation). Bump to today and add a one-liner: "Lightspeed is the inventory source of truth as of 2026-05-01. Google Sheets feed is deprecated."

### 7. Schema.org `motorCount` on /quote/motor-selection is hardcoded to 128 — **DO NOW (UI only)**
`MotorSelectionSEO` defaults `motorCount = 128` while the live public feed exposes 25. The `ItemList.numberOfItems` value the crawler reads is therefore misleading by ~5×. Either:
   a) Pass the actual visible-count from the page into the prop (preserves the "current public motor rule" — no fixed count),
   b) Or drop the prop default and require the caller to pass it. Either way, never let it ship as 128. Also: the `lowPrice/highPrice` aggregate offers for ProXS/SeaPro/ProKicker are hand-tuned constants — confirm against the feed before next deploy.

### 8. Source-provenance not visible to humans on motor pages — **THINK THROUGH WITH JAY**
We tell AI agents (in `llms.txt`) that specs come from MercuryMarine.com and official brochures, but that statement does not appear on the human-facing motor detail pages. Add a small "Specs sourced from Mercury Marine official brochures · Last verified [date]" footnote to motor pages. This builds buyer trust and increases the page's E-E-A-T signal. Jay should approve the wording and pick a verification cadence (quarterly?).

### 9. Trust strip claim audit — **THINK THROUGH WITH JAY**
Homepage hero says "7-year warranty available." This is conditional on current Mercury promo. When promos revert (per memory `Warranty Reversion` → 3-year standard), the static "7-year warranty available" line becomes false. Two safer options:
   a) Change to "Up to 7-year warranty with current Mercury promotions" (always defensible).
   b) Bind the badge to active promo data so it auto-toggles.
Same audit needed for the "Mercury Platinum Dealer" and "60+ years" claims — those are verified, leave them.

### 10. High-value missing pages buyers and AI ask for — **THINK THROUGH WITH JAY**
Beyond comparisons, the following are absent and would each pull a distinct intent cluster:
   - `/repower/cost-calculator-ontario` (interactive — even simpler than the full quote builder, for top-of-funnel)
   - `/help/what-shaft-length-do-i-need` (we have the matching memory + AI logic; the public help page is missing)
   - `/help/how-much-hp-for-my-boat` (we have `useHpSuggestions`; no public landing page)
   - `/repower/lead-times-ontario-2026` (every Mercury buyer asks)
   - `/legend-boats` (we are an authorized Legend dealer per `ai.txt` line 30 but there is no Legend landing page on this domain — confirms with Jay whether mercuryrepower.ca should host Legend content or keep it on harrisboatworks.ca)
   - A public `/agents` hub page (referenced from `mcp.json` and `llms.txt` as `homepage`/`documentation` — verify it actually renders; if not, ship a minimal one).

---

## Mobile UI friction notes (for the design pass)

Observed at 390×772:
- Hero CTA stacking — see #2.
- Trust row uses `gap-x-4 gap-y-2` — at 390 the row wraps to 3 lines. Tightening the badge text or hiding the GoogleRatingBadge below 360 px would clean it.
- "Resume your quote" banner is high-value but only renders when there's an in-progress quote — confirm the button height (h-9) doesn't push the hero below the fold for returning users.
- Final CTA band overlays text on a lake image with `bg-primary/80`. Check WCAG AA contrast at the actual rendered HSL — likely fine on `--primary` but worth a one-shot Lighthouse pass.

---

## Items explicitly NOT recommended in this audit

- No changes to pricing hierarchy, trade-in formulas, cron, Supabase auth, Edge Functions, or MCP tool contracts.
- No forcing a fixed motor count anywhere — fix #7 by reading the live count, not hardcoding it.
- No Verado promotion anywhere — only fix the stale Verado example URL in `llms.txt`.

---

## Suggested execution order if approved

1. **Today (no approval needed beyond Jay's nod):** #5 (llms.txt Verado URL), #6 (ai.txt date), #7 (motor count prop), #2 (mobile CTA), #1 (image backfill via existing Dropbox sync).
2. **This week:** #3 (4-5 comparison pages with markdown twins), #9 (warranty wording).
3. **Decide with Jay before building:** #4 (twin generator coverage), #8 (provenance footnote wording + cadence), #10 (which of the missing pages are in scope for mercuryrepower.ca vs harrisboatworks.ca).

No code, content, or config has been changed by this audit.
