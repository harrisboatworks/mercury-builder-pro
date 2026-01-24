
# Fix Financing Application Price Discrepancy

## The Problem

The financing application shows **$6,595.36** but the summary/PDF show **$4,143.86** for the same quote. This is a difference of nearly $2,500!

### What's Missing

The financing application pricing logic is ignoring two key discounts:

| Discount Type | Stored In | Amount | Applied in Summary? | Applied in Financing App? |
|---------------|-----------|--------|---------------------|---------------------------|
| Admin Discount | `adminDiscount` | $700 | Yes | **No** |
| Cash Rebate | `selectedPromoValue` | $250 | Yes | **No** |
| **Total Missing** | | **$950** | | |

The remaining difference comes from the fact that tax is applied before subtracting these discounts, causing a cascading error.

---

## Root Cause

In `FinancingApplication.tsx` (lines 164-206), the pricing calculation:

```typescript
let packageTotal = motorMSRP - motorDiscount;
// ... adds accessories, installation, etc.
// ... subtracts trade-in
const withTax = (packageTotal - tradeInValue) * 1.13;
const totalWithFees = withTax + 299;
```

Is missing:
1. `restoredQuoteState.adminDiscount` (the $700 special admin discount)
2. `restoredQuoteState.selectedPromoValue` (the "$250 rebate" string that needs parsing)

---

## Solution

Add the missing deductions to match the summary page calculation:

### Changes to Make

```text
// After line 176: let packageTotal = motorMSRP - motorDiscount;

// Subtract admin discount (special pricing from admin)
const adminDiscount = parseFloat(restoredQuoteState.adminDiscount) || 0;
packageTotal -= adminDiscount;

// Subtract promo rebate if cash_rebate option selected
let promoRebate = 0;
if (restoredQuoteState.selectedPromoOption === 'cash_rebate' && 
    restoredQuoteState.selectedPromoValue) {
  // Parse "$250 rebate" -> 250
  const match = restoredQuoteState.selectedPromoValue.match(/\$?([\d,]+)/);
  if (match) {
    promoRebate = parseFloat(match[1].replace(',', '')) || 0;
  }
}
packageTotal -= promoRebate;
```

---

## Correct Calculation

With fixes applied, the math becomes:

```text
Motor MSRP:          $6,080
- Dealer Discount:     -$508  (motor.salePrice = $5,572)
= Motor Price:       $5,572
- Admin Discount:      -$700  [NEW]
- Promo Rebate:        -$250  [NEW]
= Net Motor:         $4,622
- Trade-in:          -$1,550
= Subtotal:          $3,072
+ Tax (13%):           +$399
= After Tax:         $3,471
+ Dealerplan Fee:      +$299
= Total:             $3,770  [Matches summary!]
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/FinancingApplication.tsx` | Add adminDiscount and promo rebate parsing to pricing calculation |

---

## Technical Implementation

Update lines 174-177 in `FinancingApplication.tsx` to include:

1. Parse and subtract `adminDiscount` from `restoredQuoteState`
2. Parse the rebate amount from `selectedPromoValue` string (e.g., "$250 rebate" → 250)
3. Subtract both values from `packageTotal` before calculating tax

This ensures the financing application displays the same price the customer saw on their quote summary and PDF.
