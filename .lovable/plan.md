

# Fix: Show 7-Year Warranty Promotion on Quote Summary

## Problem
The warranty promotion is correctly applied (7 years coverage), but there's zero visual indication of it on the summary page. The user sees no promo badge, no warranty banner — just "Coverage: 7 years total" buried in small text.

## Changes

### 1. Pass `promoWarrantyYears` to StickySummary
In `QuoteSummaryPage.tsx`, add the missing prop so the sidebar shows "Includes +4 yrs promo warranty":
```tsx
<StickySummary
  ...existing props...
  promoWarrantyYears={promoYears > 0 ? promoYears : undefined}
/>
```

### 2. Add warranty promo banner to PricingTable
Add a new prop `warrantyPromoYears` and render a visible badge in the pricing breakdown showing the 7-year warranty promotion, even when there's no dollar discount. This goes between the motor price and accessories sections:
```
┌─────────────────────────────────┐
│ 🛡 7-Year Factory-Backed       │
│   Warranty Included             │
│   3 yr standard + 4 yr bonus    │
│   Dealer Promotion              │
└─────────────────────────────────┘
```

### 3. Pass warranty promo data to PricingTable
From `QuoteSummaryPage.tsx`, pass the warranty promotion details:
```tsx
<PricingTable
  ...existing props...
  warrantyPromoYears={promoYears}
  totalCoverageYears={selectedPackageCoverageYears}
/>
```

## Files changed
| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Pass `promoWarrantyYears` to StickySummary and warranty data to PricingTable |
| `src/components/quote-builder/PricingTable.tsx` | Add warranty promo banner section |

## Result
- Sidebar shows "+4 yrs promo warranty" badge in green
- Pricing breakdown shows a warranty promotion banner with "7-Year Factory-Backed Warranty Included"
- No pricing math changes — purely visual

