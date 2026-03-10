

# Fix Pricing Drift False Positive in Dev-Mode Check

## Problem
The browser test confirmed:
- **All displayed prices are correct** — the summary page shows $2,999 motor → $2,749 after rebate → $3,106 with HST. Math checks out.
- **The dev-mode drift check fires a false positive** because it passes wrong data to `calculateRunningTotal`:
  1. It sends `motor.msrp` ($3,875) as the `price` field instead of the effective sale price ($2,999). The running-total function treats `price` as the final motor price.
  2. It omits the `getRebateForHP` callback, so the $250 rebate is never subtracted.
  
  Combined: ($876 + $250) × 1.13 = $1,272.38 drift — exactly what the console shows.

## Fix

**`src/pages/quote/QuoteSummaryPage.tsx`** — Update the dev-mode `useEffect` (lines 344-362):

1. Pass the **effective motor price** (MSRP minus discount) as `price` instead of `motor.msrp`
2. Pass `getRebateForHP` from `useActivePromotions` so the cash rebate is applied
3. Pass `selectedPromoOption` from state (already done)

The corrected call should look like:
```ts
const effectiveMotorPrice = (motor.msrp || 0) - motorDiscount;
const check = calculateRunningTotal(
  { price: effectiveMotorPrice, model: motor.model, hp: motor.horsepower || 0 },
  {
    ...existingOpts,
    getRebateForHP,
  }
);
```

This is a ~3-line change in the drift-check `useEffect`. No changes to any pricing logic, display, or the `calculateRunningTotal` function itself.

