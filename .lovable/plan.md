

# Fix Price Mismatch Between PDF and Shared/QR Link

## The Problem (Simple)

When you generate a PDF, the prices are calculated and printed — locked in stone. But when the customer scans the QR code or opens the share link, the system **recalculates** everything from scratch using whatever promotions are active *at that moment*. If a promo changed, expired, or the calculation differs even slightly, the customer sees a different number than what's on the paper you handed them.

## The Fix

Snapshot the exact calculated prices at PDF-generation time and admin-save time. When the quote is reopened, use the snapshot instead of recalculating.

## Technical Changes

### 1. `src/contexts/QuoteContext.tsx` — Add `frozenPricing` to state

- Add `frozenPricing?: FrozenPricing` to `QuoteState` (optional field)
- Add `SET_FROZEN_PRICING` action
- Interface includes: `motorMSRP`, `motorDiscount`, `adminDiscount`, `promoSavings`, `subtotal`, `hst`, `total`, `savings`, `accessoryBreakdown`

### 2. `src/pages/quote/QuoteSummaryPage.tsx` — Freeze pricing into QR save + use it on load

**Save side** (~line 488): When inserting into `saved_quotes` for the QR code, include a `frozenPricing` object built from the already-calculated values (`packageSpecificTotals`, `motorMSRP`, `motorDiscount`, `promoSavings`, etc.)

**Display side** (~lines 319-396): If `state.frozenPricing` exists, use its values directly instead of calling `getTotalPromotionalSavings()` and `getRebateForHP()`:
```
const promoSavings = state.frozenPricing?.promoSavings ?? (basePromoSavings + rebateAmount);
const motorMSRP = state.frozenPricing?.motorMSRP ?? (quoteData.motor?.msrp || ...);
```

### 3. `src/pages/quote/SavedQuotePage.tsx` — Restore frozen pricing

When loading a saved quote that has `quoteData.frozenPricing`, dispatch `SET_FROZEN_PRICING` so the summary page uses the snapshot.

### 4. `src/components/admin/AdminQuoteControls.tsx` — Freeze on admin save

When saving to `customer_quotes`, include `frozenPricing` in the `quote_data` JSON blob using the same calculated values already available in that function.

## Files

| File | Change |
|------|--------|
| `src/contexts/QuoteContext.tsx` | Add `frozenPricing` field + `SET_FROZEN_PRICING` action |
| `src/pages/quote/QuoteSummaryPage.tsx` | Save frozen snapshot with QR; use snapshot when available |
| `src/pages/quote/SavedQuotePage.tsx` | Restore `frozenPricing` from saved quote data |
| `src/components/admin/AdminQuoteControls.tsx` | Include frozen pricing in admin quote save |

