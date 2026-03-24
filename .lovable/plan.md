

# Add Smart Quote Expiry Date to PDF and Web Summary

## Current State

- **PDF**: Already shows "Valid Until: [30 days from now]" in the quote details and terms section. But it ignores the actual promotion end date — if the promo expires in 7 days, the PDF still says "valid for 30 days."
- **Web Summary**: No expiry date shown anywhere.

## The Fix

Use the **earlier of** 30 days from quote creation or the active promotion's end date as the quote expiry. Display it on both the PDF and the web summary.

### Logic

```text
quoteExpiry = min(quoteDate + 30 days, promoEndDate ?? Infinity)
```

If a promo ends March 31 and the quote is generated March 20, the expiry should be March 31 (not April 19).

## Changes

### 1. `src/components/quote-pdf/ProfessionalQuotePDF.tsx`

- Add optional `promoEndDate?: string` to `QuotePDFProps.quoteData`
- Change the `validUntil` calculation from hardcoded "+30 days" to `Math.min(now + 30 days, promoEndDate)` when a promo end date is provided
- The existing "Valid Until:" display and terms text will automatically use the smarter date

### 2. `src/pages/quote/QuoteSummaryPage.tsx`

- Calculate `quoteExpiryDate` using the same logic (min of 30 days, promo end date)
- Pass `promoEndDate` to the PDF component when generating
- Add a small expiry badge/note visible on the web summary — near the pricing section or sticky summary — showing "Quote valid until [date]" with a countdown if under 7 days
- Store the expiry date in `frozenPricing` so saved quotes show the original expiry, not a recalculated one

### 3. `src/components/quote-builder/StickySummary.tsx`

- Add optional `quoteValidUntil?: Date` prop
- Display a subtle line like "Pricing valid until April 19, 2026" or "Pricing expires in 5 days" below the total

### 4. `src/contexts/QuoteContext.tsx`

- Add `quoteExpiryDate?: string` to `FrozenPricing` interface so the expiry is locked with the snapshot

## Files

| File | Change |
|------|--------|
| `src/components/quote-pdf/ProfessionalQuotePDF.tsx` | Accept `promoEndDate`, compute smart expiry |
| `src/pages/quote/QuoteSummaryPage.tsx` | Calculate expiry, pass to PDF and StickySummary, store in frozen snapshot |
| `src/components/quote-builder/StickySummary.tsx` | Display expiry date with countdown when close |
| `src/contexts/QuoteContext.tsx` | Add `quoteExpiryDate` to `FrozenPricing` type |

