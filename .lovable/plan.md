

# Frozen Pricing Doesn't Fully Freeze — Subtotal and Total Still Recalculated

## The Problem

When a saved quote loads with `frozenPricing`, the system correctly freezes three values:
- `motorMSRP`
- `motorDiscount`  
- `promoSavings`

But then it **recalculates** the subtotal and total from scratch via `calculateQuotePricing()` (line ~391). The frozen `subtotal`, `hst`, and `total` fields that were stored in the snapshot are **never actually used for display**.

This means two things can still cause drift between the PDF and the shared link:

1. **Warranty extension costs** — fetched live from the database via `calculateWarrantyExtensionCost()`. If warranty pricing rows change in the DB, `buildAccessoryBreakdown` produces different accessory totals, and the recalculated subtotal diverges from the PDF.

2. **Any code change** to `buildAccessoryBreakdown` (e.g., adding a new auto-included item, changing propeller allowance logic) would change the accessory total on reload while the PDF printed the old number.

## The Fix

When `state.frozenPricing` exists **and** contains `subtotal` and `total`, use those values directly for display instead of recalculating. The recalculated values should only be used for the stale-quote comparison (which already works correctly).

### `src/pages/quote/QuoteSummaryPage.tsx`

**Change 1** — After `packageSpecificTotals` is calculated (~line 403), override with frozen values when available:

```typescript
// If frozen pricing exists with full totals, use them directly
// to guarantee PDF ↔ web parity regardless of DB/code changes
const displayPricing = useMemo(() => {
  if (state.frozenPricing?.subtotal != null && state.frozenPricing?.total != null) {
    return {
      ...packageSpecificTotals,
      subtotal: state.frozenPricing.subtotal,
      tax: state.frozenPricing.hst ?? state.frozenPricing.subtotal * 0.13,
      total: state.frozenPricing.total,
      savings: state.frozenPricing.savings ?? packageSpecificTotals.savings,
    };
  }
  return packageSpecificTotals;
}, [packageSpecificTotals, state.frozenPricing]);
```

**Change 2** — Replace all downstream references to `packageSpecificTotals` (PricingTable, StickySummary, cinematic, financing calc, PDF download, deposit) with `displayPricing`, except for the stale-quote comparison block which should keep using `packageSpecificTotals` (since that's the live recalculated value).

References to update:
- `<PricingTable pricing={...}>` (~line 987)
- `<StickySummary>` total prop
- `<QuoteRevealCinematic>` finalPrice/savings props (~line 930)
- `amountToFinance` calculation (~line 493)
- `handleDownloadPDF` tax/total calculations (~lines 502-503)
- `handleDepositSubmit` tax/total calculations (~line 690-691)
- `handleApplyForFinancing` references (~lines 646-656)

No other files need changes — the frozen snapshot is already saved and restored correctly.

## What This Guarantees

- PDF prints `$19,346.50` → QR link shows `$19,346.50` — exact match, always
- If warranty DB prices change later, the stale-quote alert fires but the displayed price stays locked to the PDF
- New quotes (no frozen pricing) continue to work exactly as before

## Files

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Create `displayPricing` from frozen snapshot; replace `packageSpecificTotals` references with `displayPricing` for all display/CTA paths |

