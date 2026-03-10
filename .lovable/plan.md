

# Diagnosis: What's Good and What's Not

## What IS working correctly

- **Summary page pricing**: `buildAccessoryBreakdown()` correctly adds installation labor ($450), propeller allowance ($1,200), and other accessories. `packageSpecificTotals` is the single source of truth for the page.
- **PDF from summary page**: Uses `packageSpecificTotals.subtotal` directly — the PDF you uploaded shows $20,447.00 which matches the summary.
- **Mobile bar**: Now uses `centralTotal` from `useQuoteRunningTotal` (after the fix we deployed). No more summary-page override.
- **Cinematic intro**: Ref-based guards and 15-second safety timeout are deployed.
- **Cross-validation**: DEV-mode drift check between `calculateRunningTotal` and `packageSpecificTotals` is active.

## What is NOT fixed yet — the agent API pricing gap

**File: `supabase/functions/agent-quote-api/index.ts`**

The `calcPricing` function (line 106-142) only sums `motorPrice + customItemsTotal + warrantyCost`. It does **not** include:

- **Installation Labor**: $450 (for `purchasePath === 'installed'`, non-tiller motors)
- **Propeller Allowance**: $350 (25-115HP) or $1,200 (150HP+)
- **Controls & Rigging**: $1,200 (when no existing controls) or $125 (adapter)

This means:
1. The agent's SMS to the customer quotes the **wrong (lower) total**
2. The `final_price` stored in `customer_quotes` and `saved_quotes` is incorrect
3. When the customer opens the shared link, `SavedQuotePage` restores `purchasePath: "installed"` into context, and the summary page's `buildAccessoryBreakdown()` adds the missing items — showing a **higher** price than what was quoted

The `selectedPackage` is also stored as `{ tier: "good" }` but the frontend expects `{ id: string, label: string, priceBeforeTax: number }`, so the package label won't display correctly on restore.

## Proposed fix

### In `supabase/functions/agent-quote-api/index.ts`:

**A. Add accessory costs to `calcPricing`** — add a new parameter `accessoryCost` that includes installation labor, propeller allowance, and controls cost. Calculate these before calling `calcPricing` using the same logic as `buildAccessoryBreakdown`:

```text
calcPricing call site:
  accessoryCost = 0
  if purchasePath === 'installed' && !isTiller:
    accessoryCost += 450  (installation labor)
  if hp >= 150:
    accessoryCost += 1200  (SS propeller)
  elif hp >= 25:
    accessoryCost += 350   (aluminum propeller)

  subtotal = motorPrice + customItemsTotal + warrantyCost + accessoryCost
```

**B. Fix `selectedPackage` structure** (line 819):

Change from `{ tier: body.package || "good" }` to:
```
{
  id: body.package || "good",
  label: { good: "Essential • Best Value", better: "Complete • Most Popular", best: "Premium • Maximum Protection" }[body.package || "good"],
  priceBeforeTax: pricing.adjustedSubtotal
}
```

**C. Persist `accessoryBreakdown` in `quoteData`** — build an array of accessory line items and store it in the quote data blob. The summary page can then use the stored breakdown instead of recomputing (though currently it recomputes from context — this is a safety net).

### Summary

| Item | Status |
|------|--------|
| Summary page pricing | Good |
| PDF from summary | Good |
| Mobile bar | Good (fixed) |
| Cinematic counter | Good (fixed) |
| Agent SMS price | **Broken** — missing ~$1,650 in accessories |
| Agent stored `final_price` | **Broken** — same root cause |
| Agent `selectedPackage` format | **Broken** — wrong shape |

One edge function update fixes all three remaining issues.

