
# Fix Finance Rate Discrepancy Between Intro Screen and PDF

## The Problem

The intro screen shows **$76/mo** while the PDF shows **$113/mo** for the same quote. This is confusing to customers and looks inconsistent.

### Root Cause Analysis

| Factor | Intro Screen (Wrong) | PDF/Summary (Correct) |
|--------|---------------------|----------------------|
| Base Amount | $3,772 (pre-tax subtotal) | $4,561 (with HST + $299 fee) |
| Interest Rate | 7.99% (hardcoded) | 8.99% (dynamic from promo) |
| Loan Term | 60 months (hardcoded) | 48 months (price-based) |
| **Monthly Payment** | **$76** | **$113** |

The intro animation calculates the monthly payment internally using outdated defaults, while the rest of the page uses the proper financing calculation.

---

## Solution

Pass the **pre-calculated monthly payment** from `QuoteSummaryPage` to the cinematic component instead of letting it calculate its own (incorrect) value.

This ensures the intro screen displays the **same $113/mo** that appears in:
- The summary table
- The PDF document
- The financing application

---

## Implementation

### 1. Update `QuoteRevealCinematic` Props

Add a new optional prop `monthlyPayment` to accept the pre-calculated value:

```typescript
interface QuoteRevealCinematicProps {
  // ... existing props ...
  monthlyPayment?: number; // NEW: Pre-calculated monthly payment
}
```

### 2. Use Passed Value When Available

Inside the component, prefer the passed value over internal calculation:

```typescript
// Use pre-calculated monthly payment if provided, otherwise calculate
const calculatedMonthly = calculateMonthly(finalPrice);
const displayedMonthlyPayment = monthlyPayment || calculatedMonthly.amount;
```

### 3. Pass Monthly Payment from Summary Page

Update `QuoteSummaryPage.tsx` to pass the already-calculated value:

```typescript
<QuoteRevealCinematic
  // ... existing props ...
  monthlyPayment={monthlyPayment}  // Add this line
/>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/QuoteRevealCinematic.tsx` | Add `monthlyPayment` prop and use it for display |
| `src/pages/quote/QuoteSummaryPage.tsx` | Pass the calculated `monthlyPayment` to cinematic |

---

## Expected Result

After this fix:

- **Intro Screen**: Shows **$113/mo** (matches PDF and summary)
- **Summary Table**: Shows **$113/mo** 
- **PDF Document**: Shows **$113/mo**

All three locations will display consistent financing information, calculated with:
- Full financed amount (subtotal + 13% HST + $299 Dealerplan fee)
- Current promotional or price-tier rate
- Appropriate loan term based on purchase amount
