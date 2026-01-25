

# Trade-In Display Improvement for Cinematic Intro

## Overview

When a trade-in is applied, the cinematic intro currently shows the combined total as "Total Savings" - which bundles dealer discounts, promotional savings, AND trade-in value into one number. This can be confusing because a trade-in isn't really a "savings" - it's value you're contributing.

The fix dynamically updates the label to "Savings + Trade-In" when a trade-in is present, making it immediately clear what the number represents.

---

## File Changes

| File | Change |
|------|--------|
| `src/components/quote-builder/QuoteRevealCinematic.tsx` | Add optional `tradeInValue` prop, update label conditionally |
| `src/pages/quote/QuoteSummaryPage.tsx` | Pass `tradeInValue` prop to cinematic component |

---

## Technical Implementation

### 1. QuoteRevealCinematic.tsx

**Add new prop to interface (line 12-26):**
```typescript
interface QuoteRevealCinematicProps {
  isVisible: boolean;
  onComplete: () => void;
  motorName: string;
  finalPrice: number;
  msrp?: number;
  savings: number;
  coverageYears: number;
  imageUrl?: string;
  selectedPromoOption?: 'no_payments' | 'special_financing' | 'cash_rebate' | null;
  selectedPromoValue?: string;
  monthlyPayment?: number;
  tradeInValue?: number;  // NEW: Pass trade-in separately for label
}
```

**Destructure new prop (around line 104):**
```typescript
export function QuoteRevealCinematic({
  isVisible,
  onComplete,
  motorName,
  finalPrice,
  msrp,
  savings,
  coverageYears,
  imageUrl,
  selectedPromoOption,
  selectedPromoValue,
  monthlyPayment: passedMonthlyPayment,
  tradeInValue  // NEW
}: QuoteRevealCinematicProps) {
```

**Update the label display (around line 544-545):**
```tsx
<Sparkles className="w-3 h-3" />
{tradeInValue && tradeInValue > 0 
  ? 'Savings + Trade-In' 
  : 'Total Savings'}
```

### 2. QuoteSummaryPage.tsx

**Pass trade-in value to cinematic (line 656):**
```tsx
<QuoteRevealCinematic
  isVisible={showCinematic && isMounted}
  onComplete={handleCinematicComplete}
  motorName={motorName}
  finalPrice={packageSpecificTotals.subtotal}
  msrp={motorMSRP}
  savings={totals.savings}
  tradeInValue={state.tradeInInfo?.estimatedValue}  // NEW
  coverageYears={selectedPackageCoverageYears}
  imageUrl={imageUrl}
  selectedPromoOption={state.selectedPromoOption}
  selectedPromoValue={getPromoDisplayValue(state.selectedPromoOption, hp)}
  monthlyPayment={monthlyPayment}
/>
```

---

## Visual Result

| Scenario | Label Displayed |
|----------|----------------|
| No trade-in | **Total Savings** |
| With trade-in | **Savings + Trade-In** |

The actual dollar amount remains the same combined value - only the label changes to be more transparent about what's included.

---

## Summary

This is a minimal 2-file change that improves clarity for customers with trade-ins without altering the visual design or animation of the cinematic reveal.

