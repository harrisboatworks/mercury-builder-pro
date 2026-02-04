
# Enable Term Override in Finance Calculator

## Overview

Add an optional `termMonths` parameter to the `calculatePaymentWithFrequency` function to allow the Finance Calculator page to use user-specified terms while maintaining smart defaults for all other callers.

---

## Changes Required

### 1. Update `calculatePaymentWithFrequency` Function

**File:** `src/lib/finance.ts`

Add optional `termMonthsOverride` parameter:

```typescript
export const calculatePaymentWithFrequency = (
  price: number, 
  frequency: PaymentFrequency = 'monthly',
  promoRate: number | null = null,
  termMonthsOverride: number | null = null  // NEW optional param
) => {
  // Use override if provided, otherwise smart default
  const termMonths = termMonthsOverride || getFinancingTerm(price);
  // ... rest unchanged
}
```

This maintains full backward compatibility - existing callers that don't pass the 4th argument get the same smart defaults.

---

### 2. Update Finance Calculator Page

**File:** `src/pages/FinanceCalculator.tsx`

**A. Auto-populate term on load:**

When motor data loads and `totalFinanced` is set, also set the term to the smart default:

```typescript
import { getFinancingTerm } from '@/lib/finance';

// Inside the motor loading effect:
setTerm(getFinancingTerm(Math.round(totalWithFees)));
```

**B. Pass term to calculation:**

Update the `paymentCalculation` memo to pass the user's term:

```typescript
const result = calculatePaymentWithFrequency(principal, frequency, apr, term);
```

**C. Add term to dependencies:**

```typescript
}, [totalFinanced, down, apr, frequency, term]);  // Add term
```

---

### 3. Drawer Remains Unchanged

The `FinanceCalculatorDrawer.tsx` doesn't have a term input and will continue using smart defaults (no changes needed).

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/finance.ts` | Add optional `termMonthsOverride` param to `calculatePaymentWithFrequency` |
| `src/pages/FinanceCalculator.tsx` | Import `getFinancingTerm`, auto-populate term, pass term to calculation |

---

## Math Verification

With a $15,000 principal, 7.99% APR, 60 months, monthly frequency:

| Metric | Value |
|--------|-------|
| Monthly rate | 0.0799 / 12 = 0.00666 |
| Payment | $15,000 × (0.00666 × 1.00666^60) / (1.00666^60 - 1) |
| Result | ~$304/month |
| Total payments | 60 monthly payments |

If user changes to 72 months:
- Payment drops to ~$262/month
- Total payments: 72

---

## Result

- Smart defaults auto-populate the term input based on price tier
- Users can freely adjust the term and see updated payments
- All other finance displays (cards, drawer, etc.) keep using smart defaults
- Payment count correctly reflects user's chosen term × frequency
