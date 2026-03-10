

# Centralize QuoteSummaryPage Pricing — Analysis & Plan

## Key Finding

The QuoteSummaryPage's pricing system is **architecturally different** from the running-total bars. It cannot simply swap in `useQuoteRunningTotal` without significant risk:

1. **Package-aware pricing**: The summary page uses `buildAccessoryBreakdown()` which returns a different accessory set depending on the selected package (good/better/best). The running-total hook computes accessories inline and has no concept of packages.

2. **Rich breakdown shape**: `PricingTable` requires `{ msrp, discount, adminDiscount, promoValue, subtotal, tax, total, savings }` — a richer structure than what `calculateRunningTotal` returns (`{ subtotal, hst, total, lineItems }`).

3. **PDF and deposit flows** depend on `packageSpecificTotals` fields like `subtotal`, `tax`, and `savings` in many places (lines 341, 350, 416, 469, 512, 727, 854, 879, 903).

Forcing `calculateRunningTotal` into this page would either require expanding it to handle packages and the PricingBreakdown shape (making it no longer a simple running-total utility), or would lose the detailed breakdown the summary page needs.

## Safe Approach

Instead of replacing the summary page's pricing, **add a dev-mode consistency check** that verifies the summary page total matches `calculateRunningTotal`, catching any future drift without risking the display logic.

### Changes

**1. `src/pages/quote/QuoteSummaryPage.tsx`** — Add a `useEffect` after `packageSpecificTotals` that calls `calculateRunningTotal` and logs a warning in development if the totals diverge by more than $1 (rounding tolerance). This acts as a guardrail without changing any rendering or data flow.

```
// After line 338, add:
if (process.env.NODE_ENV === 'development') {
  // Cross-check against centralized calculator
  useEffect(() => {
    const check = calculateRunningTotal(motor, { ...opts });
    if (Math.abs(check.total - packageSpecificTotals.total) > 1) {
      console.warn('PRICING DRIFT DETECTED', { hook: check.total, page: packageSpecificTotals.total });
    }
  }, [packageSpecificTotals.total]);
}
```

**2. `src/hooks/useQuoteRunningTotal.ts`** — Export the `calculateRunningTotal` function (already exported) so the summary page can call it directly without the hook wrapper.

### Why not a full replacement

- The `PricingTable`, `StickySummary`, PDF generator, deposit flow, and cinematic reveal all consume `packageSpecificTotals` fields that don't exist on the running-total shape
- `buildAccessoryBreakdown` produces package-tier-specific line items (warranty upgrades, premium props) that the running-total hook doesn't know about
- Refactoring both systems into one would touch 10+ files and risk breaking PDF generation and Stripe deposit flows

### Result

- Zero risk to existing pricing display, PDF, or payments
- Console warning catches any future divergence immediately
- Single import, ~10 lines added to QuoteSummaryPage

