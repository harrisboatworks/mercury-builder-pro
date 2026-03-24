

# Stale Quote Detection: Alert When Prices Have Changed

## What It Does

When a customer (or admin) opens a saved quote link, the system compares the **frozen pricing snapshot** against what the numbers **would be today** using live data. If anything meaningful has changed, a dialog appears explaining what's different and offering to regenerate the quote with current pricing.

## What Gets Compared

| Check | Frozen Value | Live Value | Trigger |
|-------|-------------|------------|---------|
| Motor MSRP | `frozenPricing.motorMSRP` | Current motor MSRP from state | Price changed by more than $1 |
| Promo savings | `frozenPricing.promoSavings` | Live `getTotalPromotionalSavings() + rebate` | Savings differ (promo expired or changed) |
| Promo expiry | Promotion `end_date` | Current date | Promotion has ended since quote was created |
| Total | `frozenPricing.total` | Recalculated total | Differs by more than $10 |

## User Experience

1. Customer scans QR or opens share link
2. Quote loads with frozen (accurate-to-PDF) pricing as it does now
3. A comparison runs silently in the background
4. If differences found, an `AlertDialog` appears:
   - Header: "This quote's pricing may have changed"
   - Lists what changed in plain language (e.g., "Motor price increased by $200", "The Get 7 promotion has ended")
   - **"View Original Quote"** button — dismisses dialog, keeps frozen pricing (what's on their PDF)
   - **"Update to Current Pricing"** button — clears `frozenPricing` from state, page recalculates with live data
5. If no differences, nothing happens — seamless experience

## Technical Changes

### 1. New component: `src/components/quote-builder/StaleQuoteAlert.tsx`

A self-contained component that:
- Accepts `frozenPricing`, current motor, and promo hook data as props
- Runs the comparison logic on mount
- Renders an `AlertDialog` if deltas are found
- "Update to Current Pricing" dispatches `SET_FROZEN_PRICING` with `undefined` to clear the snapshot

### 2. `src/pages/quote/QuoteSummaryPage.tsx`

- Import and render `<StaleQuoteAlert>` when `state.frozenPricing` exists
- Pass it the frozen values plus the live-calculated values (`motorMSRP`, `promoSavings`, `packageSpecificTotals.total`)
- On "update" callback, dispatch `{ type: 'SET_FROZEN_PRICING', payload: undefined }` to clear frozen state

### 3. `src/contexts/QuoteContext.tsx`

- No changes needed — `SET_FROZEN_PRICING` already accepts the payload and setting it to `undefined` clears it

## Files

| File | Change |
|------|--------|
| `src/components/quote-builder/StaleQuoteAlert.tsx` | New — comparison logic + AlertDialog UI |
| `src/pages/quote/QuoteSummaryPage.tsx` | Render StaleQuoteAlert when frozenPricing exists |

