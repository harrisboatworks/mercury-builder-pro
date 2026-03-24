

# Fix Sticky Summary: Show Tax-Inclusive Total

## Problems

1. **Misleading price**: The sticky summary shows the pre-HST subtotal ($17,120) as the big number. Customers may think that's what they'll pay, then get surprised by 13% HST on top. Showing the tax-inclusive total is more honest.

2. **Floating card**: The sticky card sits in a `<div>` with no width constraint in the right column, so it can feel disconnected. Minor CSS tightening.

## Changes

### 1. `src/components/quote-builder/StickySummary.tsx` — Show total (incl. HST)

- Add a new prop `totalWithTax` (the HST-inclusive number)
- Display `totalWithTax` as the big headline price
- Below it, show the subtotal in smaller text: "Subtotal: $17,120 + HST"
- This way the customer sees the real out-the-door number up front

### 2. `src/pages/quote/QuoteSummaryPage.tsx` — Pass the tax-inclusive total

- Pass `totalWithTax={packageSpecificTotals.total}` to `StickySummary`
- `packageSpecificTotals.total` already includes HST (subtotal × 1.13)

### 3. Minor: tighten sticky card alignment

- Add `max-w-sm` or similar to the sticky aside so it doesn't stretch too wide on ultra-wide screens, keeping it visually anchored next to the pricing breakdown

## What the Customer Sees

**Before**: `$17,120` (misleading — doesn't include tax)

**After**: `$19,346` with a note "Before tax: $17,120" in smaller text underneath — no surprises

## Files

| File | Change |
|------|--------|
| `src/components/quote-builder/StickySummary.tsx` | Add `totalWithTax` prop, show as headline, demote subtotal |
| `src/pages/quote/QuoteSummaryPage.tsx` | Pass `totalWithTax` to StickySummary |

