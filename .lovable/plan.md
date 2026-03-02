

## Two Issues to Fix

### 1. Add "Continue" button after estimate result
After the estimate displays, there's no way to proceed. Add a prominent "Continue" button below the estimate in `TradeInValuation.tsx` that calls `onAutoAdvance`.

### 2. Values too high + Add hours to condition labels
For a 2008 Mercury 90 in "Good" condition, the system returns ~$4,400. You're saying that's basically the ceiling for an excellent, low-hours unit.

**Fix A: Update condition descriptions with hour ranges**
In `TradeInValuation.tsx`, update `conditionOptions`:
- Excellent: "Like new, 0–100 hours, no issues"
- Good: "100–500 hours, well maintained"  
- Fair: "500–1,000 hours, needs minor work"
- Poor: "1,000+ hours or needs major repair"

**Fix B: Reduce trade values across the board**
In `src/lib/trade-valuation.ts`, reduce the fallback values. Current "good" values are too close to what should be the excellent ceiling. Proposed adjustment: reduce all conditions by roughly 25-30%, making "excellent" closer to what "good" currently is. This affects the `fallbackTradeValues` table for all year ranges and HP levels.

Also reduce the generic/unknown brand multiplier and the condition multipliers used in the pre-2005 and unknown-brand formulas.

### Files changed
- `src/components/quote-builder/TradeInValuation.tsx` — add Continue button after estimate, update condition hour descriptions
- `src/lib/trade-valuation.ts` — reduce all fallback trade values by ~25-30%

