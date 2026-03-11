

# Financing App Payment Calculation Audit

## Math Verification

I verified the payment calculations against the screenshot (Amount to Finance: $14,729, 7 years at 7.99% = $229/mo). The math is correct — both `calculateMonthly` and `calculatePaymentWithFrequency` use equivalent amortization formulas and produce accurate results.

## Bug Found: Trade-In Double Subtraction

There is a significant bug across **three code paths** where the trade-in value gets subtracted twice — once when computing `motorPrice`/`totalWithFees`, and again inside the financing form.

### How it happens

The financing form (`PurchaseDetailsStep.tsx` line 48) always computes:
```
amountToFinance = motorPrice - downPayment - tradeInValue
```

But in multiple pre-fill paths, `motorPrice` is set to a value that **already has trade-in deducted**:

**Path A — Quote Summary → Apply for Financing** (`QuoteSummaryPage.tsx` line 491-517):
- `packageSpecificTotals.subtotal` already subtracts trade-in (via `calculateQuotePricing` with `tradeInValue` param)
- `totalWithFees = subtotal * 1.13 + 299` — trade-in already removed
- Then `tradeInValue` is also passed separately → form subtracts it again

**Path B — Saved quote restoration** (`FinancingApplication.tsx` line 164-251):
- Line 221: `withTax = (packageTotal - tradeInValue) * 1.13` — trade-in subtracted
- Then line 238: `tradeInValue: tradeInValue` — passed to form → subtracted again

**Path C — Quote context pre-fill** (`FinancingApplication.tsx` line 307-348):
- `totalWithFees` from `financingAmount` already has trade-in deducted (set by Path A)
- `tradeInValue` is also passed → subtracted again in form

### Impact

With a $20,447 subtotal and $8,675 trade-in, the financing form would show ~$4,926 instead of the correct ~$14,729. This would often drop below the $5,000 financing minimum, potentially blocking applications entirely.

The screenshot shows correct numbers because the user likely entered values manually or came through a path without pre-filled trade-in.

## Fix

**Strategy**: `totalWithFees` (the "Total Purchase Price" field in the financing form) should represent the full amount **before** trade-in credit, so the form can properly handle the single subtraction.

### File changes

| File | Change |
|------|--------|
| `QuoteSummaryPage.tsx` | Compute `totalWithFees` from pre-trade-in subtotal: `(subtotal + tradeInValue) * 1.13 + 299` |
| `FinancingApplication.tsx` (Path B, ~line 221) | Remove trade-in subtraction from `withTax` calculation: use `packageTotal * 1.13` instead of `(packageTotal - tradeInValue) * 1.13` |
| `FinancingApplication.tsx` (Path C, ~line 340) | No change needed — it reads `totalWithFees` from Path A, so fixing Path A fixes this |

The form's own `amountToFinance = motorPrice - downPayment - tradeInValue` then becomes the single correct subtraction point.

