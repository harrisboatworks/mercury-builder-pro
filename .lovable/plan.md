
# Fix Financing Button Visibility and Amount Calculation

## Issues Identified

From the screenshots and code analysis:

### Issue 1: "Apply for Financing" Button Shows for Sub-$5,000 Totals
The quote summary shows a $728 total, but the "Apply for Financing" button is still visible. The button appears in **3 locations** on QuoteSummaryPage:
- **Main action area** (line 791-799) - No `FINANCING_MINIMUM` check
- **PricingTable prop** (line 720) - Already has internal check ✓
- **StickySummary prop** (line 823) - No check, renders unconditionally if prop exists

### Issue 2: Incorrect Financing Amount Calculation
The financing application shows $4,021 as "Total Purchase Price" when the quote total is only $728.

**Root cause**: The `handleApplyForFinancing` function incorrectly re-adds trade-in and promo values to the subtotal before calculating the financing amount:

```tsx
// Line 548 - BUG: This reverses the trade-in and promo deductions
const packageSubtotalBeforeTradeIn = packageSpecificTotals.subtotal + tradeInValue + promoValue;
```

The `packageSpecificTotals.subtotal` already has trade-in and promo **subtracted** (via `calculateQuotePricing`). Re-adding them creates an inflated pre-discount amount, which is then taxed and has fees added.

**What the user expects**: The financing amount should match the displayed total ($728), not an inflated $4,021.

---

## Solution

### 1. Conditionally Show "Apply for Financing" Buttons

**File: `src/pages/quote/QuoteSummaryPage.tsx`**

Add a `FINANCING_MINIMUM` check before rendering the financing button in two places:

**Lines 791-799** (main button):
```tsx
{packageSpecificTotals.total >= FINANCING_MINIMUM && (
  <Button 
    onClick={handleApplyForFinancing}
    variant="default"
    className="w-full"
    size="lg"
  >
    <CreditCard className="w-4 h-4 mr-2" />
    Apply for Financing
  </Button>
)}
```

**Lines 823** (StickySummary prop):
```tsx
onApplyForFinancing={packageSpecificTotals.total >= FINANCING_MINIMUM ? handleApplyForFinancing : undefined}
```

Import `FINANCING_MINIMUM` from `@/lib/finance`:
```tsx
import { ..., FINANCING_MINIMUM } from '@/lib/finance';
```

### 2. Fix Financing Amount Calculation

**File: `src/pages/quote/QuoteSummaryPage.tsx`**

Fix `handleApplyForFinancing` to use the correct total:

```tsx
const handleApplyForFinancing = () => {
  const tradeInValue = state.tradeInInfo?.estimatedValue || 0;
  
  // Use the actual package subtotal (already net of discounts, trade-in, promos)
  // Add tax and financing fee for the total amount to finance
  const subtotalWithTax = packageSpecificTotals.subtotal * 1.13;
  const totalWithFees = subtotalWithTax + DEALERPLAN_FEE;
  
  const packageName = selectedPackageLabel.split('•')[0].trim();
  
  const financingData = {
    ...state,
    financingAmount: {
      packageSubtotal: packageSpecificTotals.subtotal,
      hst: packageSpecificTotals.subtotal * 0.13,
      financingFee: DEALERPLAN_FEE,
      totalWithFees: totalWithFees,
      motorModel: quoteData.motor?.model || motorName,
      packageName: packageName,
      tradeInValue: tradeInValue,
      // Include promo details for financing application
      promoOption: state.selectedPromoOption,
      promoRate: state.selectedPromoRate,
      promoTerm: state.selectedPromoTerm,
      promoValue: state.selectedPromoValue,
    }
  };
  
  localStorage.setItem('quote_state', JSON.stringify(financingData));
  navigate('/financing/apply');
};
```

**Key change**: Remove the incorrect re-addition of trade-in and promo values. The `packageSpecificTotals.subtotal` is the correct net subtotal.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/quote/QuoteSummaryPage.tsx` | 1. Import `FINANCING_MINIMUM`<br>2. Wrap main financing button in conditional<br>3. Conditionally pass `onApplyForFinancing` to StickySummary<br>4. Fix `handleApplyForFinancing` calculation |

---

## Result

| Before | After |
|--------|-------|
| Financing button shows for $728 quote | Button hidden when total < $5,000 |
| Financing app shows $4,021 for a $728 quote | Financing amount matches displayed total |
| Confusing UX where trade-in is "applied twice" | Clean, consistent pricing throughout |

---

## Technical Note on Trade-In Handling

The current architecture treats trade-in value two ways:
1. **Quote Summary**: Subtracts trade-in from subtotal before calculating total
2. **Financing Application**: Re-adds trade-in back, then lets user enter it again as a form field

The fix aligns these by using the net subtotal (after trade-in) as the base financing amount. The financing form's "Trade-In Value" field will show the already-applied value, making the "Amount to Finance" calculation correct.
