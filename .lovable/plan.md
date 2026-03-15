

# Bug: Double HST in UnifiedMobileBar Monthly Payment

## Problem Found

The **UnifiedMobileBar** has a double-taxation bug on its monthly payment calculation.

`useQuoteRunningTotal` returns `total` which **already includes HST** (`subtotal * 1.13`). But then line 434 multiplies it by 1.13 again:

```text
centralTotal = subtotal + HST = subtotal × 1.13
runningTotal = centralTotal (when not preview)
priceWithHST = runningTotal × 1.13  ← DOUBLE TAX
priceWithFee = priceWithHST + $299
monthlyPayment = calculateMonthlyPayment(priceWithFee)
```

This inflates the monthly payment shown on the mobile bar by ~13%. The **MobileQuoteDrawer** is correct — it uses `total` directly without re-applying HST. That's why the two prices don't match.

The same double-tax bug also affects the `financingUnavailable` check on line 446.

## Fix

**`src/components/quote-builder/UnifiedMobileBar.tsx`** — two changes:

1. **Monthly payment** (lines 432-441): Use `runningTotal` directly as the tax-included total. For preview motors (raw price, no tax), keep the `* 1.13` path. Restructure:
   - When `isPreview`: apply HST (`motorPrice * 1.13`) then add fee, then calculate payment
   - Otherwise: `runningTotal` is already tax-included → just add DEALERPLAN_FEE and calculate

2. **Financing unavailable check** (lines 444-448): Same fix — `runningTotal` already includes HST when not preview, so compare directly against `FINANCING_MINIMUM`.

Both paths must align with the drawer's logic: `total + DEALERPLAN_FEE` → `calculateMonthlyPayment(...)`.

