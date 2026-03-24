

# Fix Cinematic Not Showing + Verify Pricing on Saved Quote

## Problem 1: Cinematic Intro Never Shows for Shared Admin Quotes

**Root cause**: `QuoteSummaryPage.tsx` line 174 blocks the cinematic whenever `state.isAdminQuote` is true. Since `SavedQuotePage` sets `isAdminQuote: true` for all admin-created quotes, no customer who opens a shared quote link ever sees the cinematic.

**Fix**: Change the guard to check whether the **current viewer** is an admin, not whether the quote was admin-created.

### `src/pages/quote/QuoteSummaryPage.tsx` (line ~174)

Change:
```typescript
if (state.isAdminQuote) return;
```
To:
```typescript
if (isAdmin) return;
```

This way:
- Admin viewing their own quotes: no cinematic (correct — they don't need the show)
- Customer opening a shared admin-created quote: cinematic plays (desired behavior)

## Problem 2: Verify Pricing Accuracy

I'll visit the live saved quote link in the browser to cross-check the numbers displayed on the summary page against the PDF. The code logic for pricing (`QuoteSummaryPage` lines 384-396, 515-557) chains correctly:
- `motorSubtotal = MSRP - discount - adminDiscount - promoSavings`
- `subtotal = motorSubtotal + accessories`
- `total = subtotal + (subtotal × 0.13)`

I'll confirm the actual rendered values match during implementation.

## Files

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Change cinematic guard from `state.isAdminQuote` to `isAdmin` |

