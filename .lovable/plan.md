

# Use Base Model Price as Trade-In Anchor (Not Median)

## The Problem

Right now the trade-in reference price per HP class is the **median** selling price across all models at that HP. For a 15hp, that includes the manual tiller (~$3,200), the electric-start tiller (~$3,800), and the electric-start remote (~$4,500+). The median lands somewhere in the middle, which means a customer who just says "15hp Mercury" without specifying electric start gets valued as if they have a mid-range model.

A manual-start tiller is the most common small motor people trade in. If they don't specify electric start, the valuation should assume the base (cheapest) model — not the middle of the pack.

## The Fix

**File: `src/hooks/useTradeValuationData.ts`** — one change in the MSRP aggregation logic (lines 73-80):

Instead of computing the **median** selling price per HP class, use the **minimum** (lowest) selling price. This automatically anchors to the base tiller/manual-start model for small motors, which is the most conservative and fair assumption when start type isn't specified.

```
// Before: median
const mid = Math.floor(sorted.length / 2);
referenceMsrps[hp] = sorted.length % 2 === 0
  ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  : sorted[mid];

// After: minimum (base model)
referenceMsrps[hp] = sorted[0];
```

## Why Minimum, Not Median

- For small motors (3.5–25hp), the base model is the manual-start tiller — the most common trade-in
- For large motors (40hp+), there's usually only one or two models per HP class, so min ≈ median anyway
- If someone has an electric-start model, they can specify that — and eventually you could add a "start type" field to the trade-in form to bump the anchor up
- This is the most defensible position: "we valued your trade at the base model price because you didn't specify upgrades"

## Impact Example — 2020 Mercury 15hp

| Anchor | Selling Price | Excellent (44%) | Good (40%) |
|--------|-------------|-----------------|------------|
| Median (current) | ~$4,100 | ~$1,800 | ~$1,640 |
| Minimum (proposed) | ~$3,200 | ~$1,400 | ~$1,280 |

The "good" condition value drops from ~$1,640 to ~$1,280 — a more realistic number for a basic 15hp tiller trade.

## One File Change

| File | Change |
|------|--------|
| `src/hooks/useTradeValuationData.ts` | Replace median calculation with `sorted[0]` (minimum) on lines 73-80 |

