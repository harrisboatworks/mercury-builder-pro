

# Fix Trade-In Valuation for Non-Mercury Small HP Motors

## Problem

A 2020 Tohatsu 6HP in "Good" condition shows $100 — clearly wrong. Two bugs in `estimateTradeValue`:

1. **Unknown brand path skips HP-class floors** — passes `minTradeValue` ($100) instead of the HP-class floor ($200 for under-25HP). The bracket path does this correctly but the unknown-brand path at line 400 does not.

2. **Base value formula too low for small motors** — `horsepower × 30` gives $180 for a 6HP. After depreciation and condition multipliers, the value collapses to floor. The voice agent file (`service-estimates.ts`) uses `hp × 400` for ≤10HP motors, which is far more realistic.

## Fix

### File: `src/lib/trade-valuation.ts`

**Change 1 — Add HP-class floor to unknown brand path** (around lines 392-400):
- Compute the same `hpFloor` / `effectiveFloor` that the bracket path uses (lines 537-545)
- Pass `effectiveFloor` instead of `minTradeValue` to `applyBrandPenaltyToRange`

**Change 2 — Fix base value formula for unknown brands** (line 392):
Replace the flat `hp * 30` with a tiered formula matching real-world MSRP proxies:

```text
≤10 HP  → hp × 350
11-30   → hp × 250
31-75   → hp × 180
76-150  → hp × 140
151-300 → hp × 120
300+    → hp × 100
```

These tiers align with actual Mercury selling prices (e.g. 6HP ≈ $2,100, 25HP ≈ $6,000).

**Change 3 — Same fix for pre-2005 path** (around lines 429-438):
Apply the same tiered base value formula and HP-class floor calculation to the pre-2005 motor fallback path, which has the identical bugs.

### Expected result for the screenshot scenario

2020 Tohatsu 6HP Good:
- Base: 6 × 350 = $2,100
- Age depreciation (6 years): ~0.5 → $1,050
- Condition (Good): × 0.75 → $788
- Brand penalty (Tohatsu 0.7): × 0.7 → $551
- Range: ~$470 – $635 → displayed median ~$550

Much more reasonable — and the $200 HP-class floor would still catch edge cases.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/trade-valuation.ts` | Fix base value formula (2 locations), add HP-class floor to unknown-brand + pre-2005 paths |

