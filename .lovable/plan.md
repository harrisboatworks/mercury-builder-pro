
# Enforce $5,000 Minimum for Financing Display

## The Problem

Financing should only be offered for purchases of $5,000 or more. Currently, several components display monthly payment estimates regardless of the total amount, which could mislead customers with smaller purchases.

**Components showing financing without threshold check:**
- `FinancingCallout` - Shows "From $X/month" for any amount
- `PricingTable` - Displays the financing section unconditionally
- `GlobalStickyQuoteBar` - Shows monthly payment in the sticky bar
- `StickyQuoteBar` - Displays monthly if passed to it
- `UnifiedMobileBar` - Mobile equivalent

---

## Solution

Add a centralized financing minimum constant and enforce it everywhere financing is displayed.

### 1. Add constant to finance.ts

**File:** `src/lib/finance.ts`

```typescript
/**
 * Minimum amount eligible for financing
 */
export const FINANCING_MINIMUM = 5000;
```

This creates a single source of truth, replacing the scattered `SPECIAL_FINANCING_MIN_AMOUNT` constants.

### 2. Update FinancingCallout to hide when below minimum

**File:** `src/components/quote-builder/FinancingCallout.tsx`

```typescript
import { FINANCING_MINIMUM } from '@/lib/finance';

export function FinancingCallout({ totalPrice, onApplyForFinancing }) {
  // Don't show financing for purchases under $5,000
  if (totalPrice < FINANCING_MINIMUM) {
    return null;
  }
  
  // ... rest of component
}
```

### 3. Update PricingTable to conditionally show financing section

**File:** `src/components/quote-builder/PricingTable.tsx`

```typescript
import { FINANCING_MINIMUM } from '@/lib/finance';

// In the component, wrap the financing section:
{pricing.total >= FINANCING_MINIMUM && (
  <div className="mt-6 mb-4 pt-6 border-t border-gray-200 space-y-2">
    <div className="text-sm text-gray-600 font-normal">
      Flexible financing available
    </div>
    <FinancingCallout totalPrice={pricing.total} ... />
    ...
  </div>
)}
```

### 4. Update GlobalStickyQuoteBar

**File:** `src/components/quote/GlobalStickyQuoteBar.tsx`

```typescript
import { FINANCING_MINIMUM } from '@/lib/finance';

const monthlyPayment = useMemo(() => {
  // Don't calculate for amounts below minimum
  if (!runningTotal || runningTotal < FINANCING_MINIMUM) return null;
  
  // ... rest of calculation
}, [runningTotal, promo]);
```

### 5. Update UnifiedMobileBar

**File:** `src/components/quote-builder/UnifiedMobileBar.tsx`

```typescript
import { FINANCING_MINIMUM } from '@/lib/finance';

const monthlyPayment = useMemo(() => {
  // Don't show financing for purchases under $5,000
  if (!runningTotal || runningTotal < FINANCING_MINIMUM) return 0;
  
  // ... rest of calculation
}, [runningTotal, promo]);
```

### 6. Clean up duplicate constants

Remove the scattered `SPECIAL_FINANCING_MIN_AMOUNT = 5000` from:
- `src/components/financing/PurchaseDetailsStep.tsx` (line 17)
- `src/pages/quote/PromoSelectionPage.tsx` (line 32)

Replace with import from `@/lib/finance`.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/finance.ts` | Add `FINANCING_MINIMUM = 5000` constant |
| `src/components/quote-builder/FinancingCallout.tsx` | Return null if below minimum |
| `src/components/quote-builder/PricingTable.tsx` | Conditionally render financing section |
| `src/components/quote/GlobalStickyQuoteBar.tsx` | Return null for monthly if below minimum |
| `src/components/quote-builder/UnifiedMobileBar.tsx` | Return 0 for monthly if below minimum |
| `src/components/financing/PurchaseDetailsStep.tsx` | Import constant from finance.ts |
| `src/pages/quote/PromoSelectionPage.tsx` | Import constant from finance.ts |

---

## Result

| Before | After |
|--------|-------|
| Shows "From $X/mo" for a $2,000 motor | No financing displayed |
| Inconsistent thresholds across files | Single source of truth in finance.ts |
| Could mislead customers on small purchases | Clear that financing requires $5,000+ |
