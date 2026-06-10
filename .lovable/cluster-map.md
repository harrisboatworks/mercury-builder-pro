# Blog Cluster Map — Proposal v1

**Total articles:** 74
**Proposed clusters:** 8
**Status:** AWAITING APPROVAL — no code changes yet.

Each cluster has 1 **Pillar** (the canonical/most authoritative article) and N **Spokes**. For every article we'll add:
1. Inline links (2-3) woven into prose where naturally referenced.
2. End-of-article `## Related guides` H2 with 3-5 bulleted links to other articles in the same cluster (preferring the pillar + 2-4 closest spokes).

---

## Cluster 1 — Repower & Cost (10 articles)

**Pillar:** `complete-guide-boat-repower-kawarthas`

**Spokes:**
- mercury-repower-cost-ontario-2026-cad
- boat-repowering-guide-when-to-replace-motor
- ontario-cottage-boat-motor-repower-guide
- evinrude-to-mercury-repower-ontario-guide
- winter-repower-planning-guide
- boat-hull-replacement-vs-repower-decision
- pleasure-craft-licence-update-repower-ontario
- mercury-ordering-process
- year-end-boat-motor-buying-guide

---

## Cluster 2 — Financing & Pricing (5 articles)

**Pillar:** `mercury-outboard-financing-ontario-2026`

**Spokes:**
- boat-motor-financing-guide-ontario
- mercury-pricing-promotions-2026
- cheapest-mercury-outboard-canada-2026
- 2026-boating-market-ontario-boat-buyers

---

## Cluster 3 — Buying Guides: Motor Sizing & Selection (12 articles)

**Pillar:** `how-to-choose-right-horsepower-boat`

**Spokes:**
- boat-motor-size-calculator-guide
- mercury-75-vs-90-vs-115-comparison
- mercury-115-vs-150-hp-outboard-ontario
- mercury-150-200hp-v6-performance
- mercury-v8-outboard-comparison
- mercury-motor-families-fourstroke-vs-pro-xs-vs-verado
- understanding-mercury-model-numbers
- portable-outboard-mercury-guide-2-20hp
- tiller-vs-remote-steering-outboard-guide
- new-vs-used-outboard-motor-guide
- pre-owned-mercury-what-to-check

---

## Cluster 4 — Buying Guides: Boat-Type Specific (10 articles)

**Pillar:** `best-mercury-outboard-aluminum-fishing-boats`

**Spokes:**
- best-mercury-outboard-pontoon-boats
- bass-boat-mercury-motor-buying-guide
- center-console-mercury-motor-guide
- best-mercury-for-family-runabouts
- best-mercury-for-ski-wakeboard-boats
- mercury-seapro-commercial-outboard-guide
- electric-trolling-motor-kicker-guide
- best-boats-rice-lake-under-30000
- is-2026-good-year-to-buy-boat-canada

---

## Cluster 5 — Local Knowledge & Fishing (8 articles)

**Pillar:** `best-mercury-outboard-rice-lake-fishing`

**Spokes:**
- best-mercury-outboard-lake-simcoe-walleye-fishing
- best-mercury-outboard-lake-ontario-salmon-trout
- musky-boat-motor-guide-kawarthas
- mercury-prokicker-rice-lake-fishing-guide
- best-motor-small-lakes-ontario
- 2026-rice-lake-fishing-season-outlook
- trailer-boat-toronto-to-rice-lake-guide

---

## Cluster 6 — Maintenance, Service & Seasonal (12 articles)

**Pillar:** `mercury-service-schedule-complete-guide`

**Spokes:**
- mercury-motor-maintenance-seasonal-tips
- spring-outboard-commissioning-checklist
- outboard-motor-storage-tips
- fall-winterization-guide-complete
- diy-mercury-outboard-winterization-guide
- boat-winterization-cost-ontario-2026
- breaking-in-new-mercury-motor-guide
- walleye-opener-boat-prep
- late-season-boating-safety
- ontario-boating-season-tips
- ontario-cottage-boat-motor-repower-guide *(also in Cluster 1; cross-link allowed)*

---

## Cluster 7 — Performance, Tech & Troubleshooting (10 articles)

**Pillar:** `mercury-propeller-selection-guide`

**Spokes:**
- mercury-outboard-fuel-efficiency-guide
- mercury-smartcraft-gauges-guide
- mercury-digital-throttle-shift-guide
- mercury-boost-software-upgrade-eligibility-2026
- mercury-boost-upgrade-150hp-pontoon-analysis
- mercury-warranty-what-you-need-to-know
- boat-motor-trade-in-guide
- mercury-outboard-wont-start-troubleshooting
- troubleshooting-outboard-overheating

---

## Cluster 8 — Brand Story, Comparisons & Market (7 articles)

**Pillar:** `why-mercury-dominates-outboard-market`

**Spokes:**
- why-harris-boat-works-mercury-dealer
- mercury-vs-yamaha-outboards-ontario
- mercury-vs-yamaha-vs-honda-reliability-2026
- 2026-mercury-model-preview
- mercury-2026-outboard-lineup-ontario
- tariffs-trade-canadian-boating-2026
- boat-rentals-shared-access-booming-2026

---

## Coverage check

| Cluster | # articles |
|---|---|
| 1. Repower & Cost | 10 |
| 2. Financing & Pricing | 5 |
| 3. Buying — Motor Sizing | 12 |
| 4. Buying — Boat-Type | 10 |
| 5. Local Knowledge & Fishing | 8 |
| 6. Maintenance & Seasonal | 12 |
| 7. Performance & Tech | 10 |
| 8. Brand Story & Market | 7 |
| **Total** | **74** ✅ |

(`ontario-cottage-boat-motor-repower-guide` is dual-listed in Clusters 1 & 6 because it bridges both topics — no double-count in the total.)

---

## Implementation plan (Phase 2)

For each article:
1. **Append `## Related guides`** — H2 placed before the final CTA section, with 3-5 bullets:
   - Always include the cluster pillar (unless this *is* the pillar — then link to 4 top spokes)
   - 2-4 closest topical spokes
   - Each bullet: `- [Title](/blog/slug) — one-line context`
2. **Inline links** — scan body for natural mention points and weave 2-3 contextual links to sibling articles. Prefer phrases like "see our [horsepower guide](...)" or "(more in [link](...))".

Estimated edits: 74 article entries in `src/data/blogArticles.ts`. The 5 already-rewritten articles already have inline links and Related guides — those will be lightly normalized to match the new cluster mapping.

---

## What I need from you

✅ **Approve the 8-cluster map as-is** → I implement Phase 2 in the next turn.

✏️ **Or edit:** tell me which articles to move/rename/regroup and I'll update before implementing.

❌ **Or scope down:** "do clusters 1-3 only", "skip pillar logic", etc.
