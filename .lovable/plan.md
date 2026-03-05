

## Bug: Controls & Installation Missing from Admin-Downloaded PDFs

### Root Cause

The PDF named `Quote-Brian-Andrews.pdf` was downloaded from the **Admin Quote Detail** page (`AdminQuoteDetail.tsx`), not from the live Quote Summary page. Here's the chain of failure:

**1. AdminQuoteControls doesn't save the computed accessoryBreakdown**

When an admin clicks "Save Quote," the pricing calculation at line 84-85 only sums `selectedOptions` (motor add-ons like fuel tanks, covers) and `customItems`. It completely ignores:
- Controls cost ($1,200 for new controls, $125 for adapter)
- Installation labor ($450 for remote motors)
- Battery cost ($179.99 for electric start)
- Propeller allowance

The `quote_data` JSON blob stored in Supabase contains `boatInfo.controlsOption`, `purchasePath`, and `selectedOptions`, but NOT the full `accessoryBreakdown` that the summary page computes on-the-fly.

**2. AdminQuoteDetail rebuilds the PDF from incomplete data**

When downloading the PDF from the admin detail page (line 282):
```
let accessoryBreakdown = qd.accessoryBreakdown || qd.selectedOptions || [];
```
Since `accessoryBreakdown` was never saved, it falls back to `selectedOptions` — which only has motor options, not controls/installation/battery. The pricing totals then exclude these costs entirely.

**Why it works on the summary page**: The QuoteSummaryPage computes `accessoryBreakdown` fresh from live context state (`state.boatInfo?.controlsOption`, `state.purchasePath`, etc.), so controls and installation show up correctly there. But once saved and re-opened from admin, they vanish.

### Fix Plan

**New shared utility: `src/lib/build-accessory-breakdown.ts`**

Extract the accessory breakdown logic (currently duplicated/inline in QuoteSummaryPage lines 308-438) into a reusable function:

```typescript
export function buildAccessoryBreakdown(params: {
  selectedOptions: SelectedOption[];
  motor: any;
  boatInfo: any;
  purchasePath: 'loose' | 'installed' | null;
  installConfig: any;
  looseMotorBattery: any;
  selectedPackage: string;
  adminCustomItems: any[];
  completeWarrantyCost: number;
  premiumWarrantyCost: number;
  currentCoverageYears: number;
}): Array<{ name: string; price: number; description?: string }>
```

This consolidates the controls cost logic, installation labor, battery, propeller, warranty extensions, and admin custom items into one place.

**File 2: `src/components/admin/AdminQuoteControls.tsx`** (lines 78-112)

- Import and call `buildAccessoryBreakdown` to get the full breakdown
- Fix the pricing calculation to use the full accessory total (including controls, installation, etc.)
- Save the computed `accessoryBreakdown` array into the `enhancedQuoteData` so it persists in `quote_data`

**File 3: `src/pages/AdminQuoteDetail.tsx`** (lines 280-298)

- When `qd.accessoryBreakdown` is missing (legacy quotes), compute it from `qd.boatInfo`, `qd.purchasePath`, `qd.selectedOptions`, etc. using the same shared function
- This ensures even previously-saved quotes generate correct PDFs

**File 4: `src/pages/quote/QuoteSummaryPage.tsx`** (lines 308-438)

- Replace the inline `accessoryBreakdown` useMemo with a call to the shared `buildAccessoryBreakdown` function
- No behavior change, just deduplication

### Also Fixes the Financing Discrepancy

The original financing bug (Perplexity flagged $504/mo as wrong) stems from the same root cause: the saved quote's `total_cost` and `final_price` in `AdminQuoteControls` exclude controls and installation costs, so the financing calculation uses a lower base amount. Once the full accessory total is included, the saved pricing will be consistent.

### Scope

- 1 new file (shared utility)
- 3 files updated (AdminQuoteControls, AdminQuoteDetail, QuoteSummaryPage)
- No database changes needed — the fix is in how data is computed and stored in the `quote_data` JSON blob

