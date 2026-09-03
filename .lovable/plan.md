# Audit findings — desktop tables + imperial units

Article prose column is `max-w-[880px]` (`src/pages/BlogArticle.tsx:282`). At 1440px viewport that leaves ~560px of unused horizontal space; at 1280px, ~400px. That's the "wasted width" the lg-breakout on `MercuryCapacityLookup` reclaimed.

---

## PART A — Desktop wide-content overflow

Headless check at 1440 and 1280: every rendered `<table>` measured 846px wide with `scrollWidth == clientWidth` (no active horizontal scroll inside the card). So none of the other tables silently overflow on desktop the way the capacity lookup did — but several are visually cramped inside the 880px prose column when a wider component would breathe better.

Ranked (real overflow risk first, then "wasted width" candidates):

| # | Component / file | Article slug(s) | Cols | 1440 / 1280 behaviour | Fix / effort |
|---|---|---|---|---|---|
| 1 | `src/components/blog/BlogTable.tsx` (markdown table renderer, `min-w-[640px] md:min-w-full`, wraps everything in `overflow-x-auto`) | 7-col: `mercury-main-and-trolling-motor`; 6-col: `year-end-boat-motor-buying-guide`, `mercury-controls-rigging-guide-ontario`, `mercury-extended-warranty-platinum-ontario`, `mercury-avator-range-rice-lake-cottage`; 5-col: `mercury-outboard-overheat-alarm-decoder`, `mercury-propeller-selection-guide`, `fourstroke-vs-pro-xs`, `best-mercury-outboard-rice-lake-fishing`, `boat-rentals-shared-access-booming-2026`, `2026-rice-lake-fishing-season-outlook`, `mercury-90-hp-fourstroke-review-ontario`, `mercury-250-hp-fourstroke-pro-xs-review-ontario`, `mercury-outboard-monthly-payment-ontario-2026`, `bilge-pump-troubleshooting-guide` | 3–7 | Fits 846px, no scroll. Cells with long text wrap heavily on 6/7-col tables — cramped but not overflowing. | **Medium.** Add an opt-in `wide` prop / detection (≥5 cols) that triggers an lg breakout wrapper mirroring `MercuryCapacityLookup` (`lg:relative lg:left-1/2 lg:-translate-x-1/2 lg:w-[min(1200px,calc(100vw-2rem))]`). Keep mobile scroll-in-card. Highest payoff on the 7- and 6-col tables above. |
| 2 | `src/components/blog/visuals/BlogComparison.tsx` (hbw-comparison directive) | No live usages in `blogArticles.ts` or `public/blog/*.md` today | variable | Would overflow whenever ≥5 columns because header cells and row labels are `whitespace-nowrap` and it lives inside 880px prose. | **Low.** No article uses it right now — leave as-is, but when re-enabled, apply the same lg-breakout pattern and drop the `whitespace-nowrap` at lg. |
| 3 | `src/components/blog/MercuryPriceTable.tsx` | Blog directive; used where authors insert `::mercury-price-table` | 3 | Fits well inside 846px, no overflow observed. | **None.** Fine as-is. |
| 4 | `src/components/blog/visuals/BlogCostBreakdown.tsx` | List of cards, not a table (uses `min-w-0` for text truncation only) | n/a | No overflow. | **None.** |
| 5 | `src/components/blog/MultilingualHub.tsx` | Multilingual index page, not article body | n/a | `whitespace-nowrap` only on short chips. No overflow. | **None.** |

Nothing else in `src/components/blog/` matched `overflow-x-auto`, `min-w-`, `whitespace-nowrap`, or `<table>` in a way that affects article-body layout.

**Recommendation:** only #1 is worth acting on. A single change to `BlogTable.tsx` (opt-in wide mode) fixes the entire ranked list of 15 articles in one shot, without touching article markdown.

---

## PART B — Imperial-first fluid units

Bucketed by article slug from `src/data/blogArticles.ts` (markdown twins in `public/blog/*.md` are regenerated from this source, so fixing the TS fixes both).

Ranked by count of imperial fluid mentions (`qt/quart/oz/fl oz/gallon/gal/GPH/mpg`). Only the ones that still present imperial-first or imperial-only for **oil / gear lube / fuel / coolant** capacities:

| # | Slug | Hits | What's wrong | Fix / effort |
|---|---|---|---|---|
| 1 | `bilge-pump-troubleshooting-guide` | 15 | Pump ratings quoted GPH-only ("1,000 GPH", "600 GPH"). | Add L/h in parentheses (1 US gal = 3.785 L). **Low.** |
| 2 | `mercury-outboard-oil-capacity-chart` | 12 | Already metric-first from prior fix. Remaining hits are the "(US qt)" parenthetical — correct. | **None — already done.** |
| 3 | `mercury-outboard-fuel-efficiency-guide` | 8 | Fuel burn quoted GPH-first / gal-only ("6-7 gallons per hour", "1 gallon per 10 HP"). | Swap to L/h primary. **Low–medium** (touch ~8 strings). |
| 4 | `mercury-9-9-vs-15-hp-tiller-ontario` | 7 | "25 to 50 gallons per season", "15 to 25 gallons", "6-gallon portable tank". Imperial-only. | Metric-first with US gal in parens. **Low.** |
| 5 | `mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026` | 6 | "7 GPH", "8 GPH" in the cost calc block; also `3.785 L/gal` shown inline (partial metric). | Convert GPH → L/h primary; keep the multiplier. **Low.** |
| 6 | `best-mercury-for-family-runabouts` | 5 | Fuel burn in GPH-only. | **Low.** |
| 7 | `mercury-200-hp-fourstroke-pro-xs-review-ontario` | 4 | Mercury perf-test tables cite "US gal/h" (source unit). | Add "(≈X L/h)" once per row or in the table header. **Low.** |
| 8 | `mercury-90-hp-fourstroke-review-ontario` | 3 | Same — Mercury perf tables cite "US gal/h" and "gallon". | **Low.** |
| 9 | `mercury-150-hp-fourstroke-pro-xs-review-ontario` | 3 | Same. | **Low.** |
| 10 | `mercury-9-9-efi-review-ontario` | 2 | "External 12L / 3.2 gal" — already metric-first ✓. Fine. | **None.** |
| 11 | `mercury-vesselview-smartcraft-plain-english-guide` | 1 | "gallons per hour" in feature-list prose. | Trivial swap. **Low.** |
| 12 | `ethanol-octane-mercury-outboard-fuel-guide-ontario` | 1 | "less energy per gallon". | Reword to "per litre". **Low.** |
| 13 | `mercury-40-vs-60-hp-outboard-ontario` | 1 | "3.5-4 gallons per hour", "5-5.5 GPH". | L/h primary. **Low.** |
| 14 | `mercury-smartcraft-connect-guide-ontario` | 1 | GPH in feature description. | **Low.** |
| 15 | `mercury-115-hp-fourstroke-review-ontario` | 1 | "US gal/h" in Mercury perf table. | **Low.** |
| 16 | `mercury-dts-vs-mechanical-controls-ontario-repower` | 1 | "fraction of a gallon at cruise". | Reword. **Low.** |
| 17 | `boat-trim-explained-rice-lake-ontario` | 1 | "6-7 gallons per hour". | **Low.** |
| 18 | `mercury-90-vs-115-hp-which-outboard-is-right-for-your-ontario-boat` | 1 | Fuel burn "4-5 gallons per hour (15-19 L)" — already dual, just swap order. | **Trivial.** |

Total: **17 articles** need imperial → metric-first work on fluid volumes (the oil chart is already done).

Guidance for the fix pass (mirrors the oil-chart rules):
- Fuel burn: L/h primary, US gal/h in parens. 1 US gal = 3.785 L.
- Tank sizes: L primary, US gal in parens.
- Pump flow: L/h primary, GPH in parens.
- Where Mercury publishes both (perf-test tables), just add the L/h once in the table header rather than every cell.

---

## Extra flag list — imperial-first NON-fluid measurements (Part B item 5)

Not fixing in this turn — just flagged, per your instruction. Top offenders:

**Weight (lbs-only) — likely wants kg primary:**
- `mercury-outboard-weight-chart` (31 hits — it's the whole point of the article)
- `boat-motor-size-calculator-guide` (13)
- `mercury-250-hp-fourstroke-pro-xs-review-ontario` (8), `-200-` (7), `-150-` (6)
- Reviews and comparisons with dry-weight callouts: `mercury-9-9-vs-15`, `mercury-75-vs-90-vs-115`, `mercury-40-vs-60`, `mercury-115-hp-fourstroke-review`, `two-stroke-vs-four-stroke-repower`, `mercury-90-vs-115`, plus ~25 others at 1–4 hits each.

**Distance/length (ft / in / mi-only) — boat length and shaft length conventions are US-imperial industry-wide, so most are intentional:**
- Highest counts on shaft-length and boat-sizing guides: `outboard-shaft-length-guide` (32), `center-console-mercury-motor-guide` (28), `2026-rice-lake-fishing-season-outlook` (24), `mercury-40-vs-60` (24), `best-mercury-outboard-rice-lake-fishing` (23), etc. Recommend leaving boat LOA and shaft length in inches/feet (industry standard), but adding cm/m where a Canadian audience would find it useful (transom heights especially).

**Temperature (°F-only):**
- `late-season-boating-safety` (4 hits) — cold-water safety numbers, add °C.
- `best-mercury-outboard-rice-lake-fishing` (2), `mercury-boat-battery-guide-ontario` (1).

---

## No code changes made this turn

Approve this plan to move into a follow-up build turn where you can pick which of Part A #1 (BlogTable wide-mode) and which Part B slugs to actually convert. I'd suggest bundling: (a) BlogTable opt-in wide mode as one commit, (b) fluid units for the 17 slugs as a second commit, and (c) the non-fluid list as a separate future decision.
