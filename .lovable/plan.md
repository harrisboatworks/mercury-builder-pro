
# Fix Admin Special Discount Display

## Problem Summary

You've added a $500 special discount in the admin panel, but it's not appearing on the Summary page or in the PDF. The investigation reveals that while `adminDiscount` is stored correctly in the state (via `QuoteContext.tsx`), the value is never used in the pricing calculations or displayed in the UI.

---

## Root Cause

The data flow is broken at multiple points:

```text
┌───────────────────┐     ┌────────────────────┐     ┌───────────────────┐
│   Admin Panel     │ ──► │  state.adminDiscount│ ──X │  calculateQuote   │
│   (saves $500)    │     │  (value exists)     │     │  Pricing()        │
└───────────────────┘     └────────────────────┘     └───────────────────┘
                                                            │
                                                            X (not included)
                                                            ▼
                          ┌────────────────────┐     ┌───────────────────┐
                          │   PricingTable     │ ◄─X─│  PricingBreakdown │
                          │   (no line item)   │     │  (missing field)  │
                          └────────────────────┘     └───────────────────┘
                                                            │
                                                            X (not passed)
                                                            ▼
                                                     ┌───────────────────┐
                                                     │   PDF Generator   │
                                                     │   (no line item)  │
                                                     └───────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/quote-utils.ts` | Add `adminDiscount` to interface and calculation |
| `src/components/quote-builder/PricingTable.tsx` | Add prop and display line item |
| `src/pages/quote/QuoteSummaryPage.tsx` | Pass `adminDiscount` to PricingTable and PDF data |
| `src/components/quote-pdf/ProfessionalQuotePDF.tsx` | Render admin discount as a line item |

---

## Technical Implementation

### 1. Update PricingBreakdown Interface

**File:** `src/lib/quote-utils.ts`

Add `adminDiscount` to the interface:

```typescript
export interface PricingBreakdown {
  msrp: number;
  discount: number;
  adminDiscount: number;    // NEW: Special discount from admin
  promoValue: number;
  subtotal: number;
  tax: number;
  total: number;
  savings: number;
}
```

### 2. Update calculateQuotePricing Function

**File:** `src/lib/quote-utils.ts`

Add the parameter and include it in calculations:

```typescript
export function calculateQuotePricing(data: {
  motorMSRP: number;
  motorDiscount: number;
  adminDiscount?: number;    // NEW
  accessoryTotal: number;
  warrantyPrice: number;
  promotionalSavings: number;
  tradeInValue: number;
  financingFee?: number;
  taxRate?: number;
}): PricingBreakdown {
  const {
    motorMSRP,
    motorDiscount,
    adminDiscount = 0,       // NEW
    accessoryTotal,
    warrantyPrice,
    promotionalSavings,
    tradeInValue,
    financingFee = 0,
    taxRate = 0.13
  } = data;

  const msrp = motorMSRP;
  const discount = motorDiscount;
  const promoValue = promotionalSavings;
  
  // Include admin discount in subtotal calculation
  const subtotal = (msrp - discount - adminDiscount) + accessoryTotal + warrantyPrice + financingFee - tradeInValue - promoValue;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const savings = discount + adminDiscount + promoValue + tradeInValue;
  
  return {
    msrp,
    discount,
    adminDiscount,           // NEW
    promoValue,
    subtotal,
    tax,
    total,
    savings
  };
}
```

### 3. Update PricingTable Component

**File:** `src/components/quote-builder/PricingTable.tsx`

Add the admin discount line item below dealer discount:

```tsx
// After the dealer discount line (~line 91)
{pricing.adminDiscount > 0 && (
  <LineItemRow
    label="Special Discount"
    amount={pricing.adminDiscount}
    isDiscount
    description="Applied by Harris Boat Works"
  />
)}
```

### 4. Update QuoteSummaryPage

**File:** `src/pages/quote/QuoteSummaryPage.tsx`

Pass `adminDiscount` in all calculation calls:

```typescript
// Line 254-263: Pass adminDiscount to calculateQuotePricing
const totals = calculateQuotePricing({
  motorMSRP,
  motorDiscount,
  adminDiscount: state.adminDiscount || 0,  // NEW
  accessoryTotal: baseAccessoryCost + selectedOptionsTotal,
  warrantyPrice,
  promotionalSavings: promoSavings,
  tradeInValue: state.tradeInInfo?.estimatedValue || 0,
  financingFee: DEALERPLAN_FEE,
  taxRate: 0.13
});

// Line 401-410: Same for packageSpecificTotals
const packageSpecificTotals = useMemo(() => {
  const accessoryTotal = accessoryBreakdown.reduce((sum, item) => sum + item.price, 0);
  return calculateQuotePricing({
    motorMSRP,
    motorDiscount,
    adminDiscount: state.adminDiscount || 0,  // NEW
    accessoryTotal,
    warrantyPrice: 0,
    promotionalSavings: promoSavings,
    tradeInValue: state.tradeInInfo?.estimatedValue || 0,
    taxRate: 0.13
  });
}, [motorMSRP, motorDiscount, accessoryBreakdown, promoSavings, state.tradeInInfo?.estimatedValue, state.adminDiscount]);

// Line 486-495: Include in PDF data
pricing: {
  msrp: motorMSRP,
  discount: motorDiscount,
  adminDiscount: state.adminDiscount || 0,  // NEW
  promoValue: promoSavings,
  motorSubtotal: motorMSRP - motorDiscount - (state.adminDiscount || 0) - promoSavings,
  subtotal: packageSpecificTotals.subtotal,
  hst: packageTax,
  totalCashPrice: packageTotal,
  savings: motorDiscount + (state.adminDiscount || 0) + promoSavings
}
```

### 5. Update PDF Template

**File:** `src/components/quote-pdf/ProfessionalQuotePDF.tsx`

Add the admin discount row after the dealer discount:

```tsx
{/* After Dealer Discount row (~line 608) */}
{quoteData.pricing?.adminDiscount > 0 && (
  <View style={styles.pricingRow}>
    <Text style={styles.pricingLabel}>Special Discount</Text>
    <Text style={[styles.pricingValue, styles.discountValue]}>
      -${quoteData.pricing.adminDiscount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
    </Text>
  </View>
)}
```

---

## Data Flow After Fix

```text
┌───────────────────┐     ┌────────────────────┐     ┌───────────────────┐
│   Admin Panel     │ ──► │  state.adminDiscount│ ──► │  calculateQuote   │
│   (saves $500)    │     │  (value: 500)       │     │  Pricing()        │
└───────────────────┘     └────────────────────┘     └───────────────────┘
                                                            │
                                                            ▼
                          ┌────────────────────┐     ┌───────────────────┐
                          │   PricingTable     │ ◄───│  PricingBreakdown │
                          │   "Special Discount│     │  adminDiscount:500│
                          │    −$500"          │     └───────────────────┘
                          └────────────────────┘            │
                                                            ▼
                                                     ┌───────────────────┐
                                                     │   PDF Generator   │
                                                     │   "Special        │
                                                     │    Discount -$500"│
                                                     └───────────────────┘
```

---

## Visual Result

After the fix, both the Summary page and PDF will show:

| Item | Price |
|------|-------|
| MSRP - Mercury Motor | ~~$7,632~~ |
| Dealer Discount | −$546 |
| **Special Discount** | **−$500** |
| Motor Price | $6,586 |
| ... | ... |
| **Total Savings** | **$1,046** |

---

## Summary

This is a 4-file fix that threads the `adminDiscount` value through the entire pricing pipeline - from state to calculations to display in both the web UI and PDF output. The discount will appear as a distinct "Special Discount" line item with green text, consistent with other discounts.
