
# Fix Motor Info Not Carrying Over to Financing Application

## The Problem

When clicking "Apply for Financing" from a shared quote link, the motor information doesn't appear in the financing application form. The customer sees an empty motor field instead of their selected motor details.

## Root Cause

The `FinancingApplication.tsx` component has **inconsistent key names** when trying to read motor data from different sources:

| Data Source | Key Used in Source | Key Expected by FinancingApplication |
|-------------|-------------------|-------------------------------------|
| QuoteContext / localStorage | `motor` | ✅ `motor` (lines 279-293) |
| Database quote_state (via location.state) | `motor` | ❌ `selectedMotor` (lines 164-213) |

When a user views a shared quote via `SavedQuotePage.tsx` and clicks "Apply for Financing":
1. The quote data is saved with the key `motor`
2. `FinancingApplication.tsx` line 168-169 looks for `restoredQuoteState.selectedMotor?.msrp` which returns `undefined`
3. Line 207 falls back to `restoredQuoteState.selectedMotor?.model || 'Motor'` → displays just "Motor"

## Solution

Fix the key mismatch in `FinancingApplication.tsx` to accept **both** `motor` and `selectedMotor` keys, just like `SavedQuotePage.tsx` already does.

---

## Implementation

### File: `src/pages/FinancingApplication.tsx`

Update lines 164-213 to first resolve the motor data from either key:

```typescript
if (savedQuoteIdParam && restoredQuoteState) {
  console.log('Restoring full quote state from database:', restoredQuoteState);
  
  // Handle both 'motor' and 'selectedMotor' keys (consistent with SavedQuotePage.tsx)
  const motorData = restoredQuoteState.motor || restoredQuoteState.selectedMotor;
  
  // Calculate accurate total from saved state
  const motorMSRP = parseFloat(motorData?.msrp) || parseFloat(motorData?.basePrice) || 0;
  const motorDiscount = parseFloat(motorData?.dealer_discount) || 
                        (motorMSRP - (parseFloat(motorData?.salePrice) || parseFloat(motorData?.price) || motorMSRP));
  
  // ... rest of calculation logic uses motorData instead of restoredQuoteState.selectedMotor
  
  financingDispatch({
    type: 'SET_PURCHASE_DETAILS',
    payload: {
      motorModel: motorData?.model || 'Motor',  // Now correctly reads motor.model
      // ... rest unchanged
    }
  });
}
```

### Changes Summary

| Line | Current Code | Fixed Code |
|------|-------------|------------|
| 168 | `restoredQuoteState.selectedMotor?.msrp` | `motorData?.msrp \|\| motorData?.basePrice` |
| 169 | `restoredQuoteState.selectedMotor?.dealer_discount` | `motorData?.dealer_discount` |
| 207 | `restoredQuoteState.selectedMotor?.model \|\| 'Motor'` | `motorData?.model \|\| 'Motor'` |
| 218 | `restoredQuoteState.selectedMotor?.model` | `motorData?.model` |

---

## Additional Improvements

While fixing this, also address these related issues:

1. **MSRP Field Names**: The motor object uses `msrp` or `basePrice` depending on source. Handle both.

2. **Price Field Names**: Handle `salePrice`, `price`, or fallback to MSRP.

3. **Package Name Recovery**: Extract package name from `restoredQuoteState.selectedPackage?.label` when `financingAmount` wrapper is missing.

---

## Expected Result

After this fix:
- Shared quote → Summary → Apply for Financing will display the correct motor model (e.g., "Mercury 5HP MH 4-Stroke (Essential)")
- The price will be correctly calculated with all accessories, tax, and fees
- Promo details will carry over for accurate rate display
