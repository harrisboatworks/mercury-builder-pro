

# Fix Package Pricing and PDF Financing Threshold

## Overview

Two bugs need fixing:
1. **$191 warranty charge** appearing for Complete package when Get 7 promo already covers 7 years
2. **Financing info** appearing in PDF for quotes under $5,000

---

## Bug Analysis

### Bug 1: Incorrect Warranty Extension Charge

**Root Cause**: Race condition between promotions loading and warranty cost calculation

The Summary page calls `getTotalWarrantyBonusYears()` to determine current coverage years. If the promotions haven't loaded yet:
- `promoYears = 0` (should be 4 with Get 7)
- `currentCoverageYears = 3` (should be 7)
- `calculateWarrantyExtensionCost(HP, 3, 7)` returns $191
- The accessory breakdown captures this stale value

Even though the useEffect has `currentCoverageYears` as a dependency and re-runs when promos load, the `accessoryBreakdown` useMemo might capture the old `completeWarrantyCost` state before the async calculation completes.

**Fix**: Add a guard to skip warranty extension cost if current coverage already meets or exceeds target:

```tsx
// QuoteSummaryPage.tsx, lines 390-397
if (selectedPackage === 'better' && completeWarrantyCost > 0 && currentCoverageYears < COMPLETE_TARGET_YEARS) {
  // Only add if we actually need to extend
}
```

Additionally, ensure the `loading` state from `useActivePromotions` is checked before rendering the PDF.

### Bug 2: Financing on Sub-$5000 Quotes

**Root Cause**: `handleDownloadPDF` passes financing data unconditionally

The PDF receives `monthlyPayment`, `financingTerm`, `financingRate`, and `financingQrCode` regardless of the total price. The template then displays "Financing Available" even for small motors.

**Fix**: Conditionally pass financing fields only when `packageTotal >= FINANCING_MINIMUM`:

```tsx
// QuoteSummaryPage.tsx, around line 506-509
...(packageTotal >= FINANCING_MINIMUM ? {
  monthlyPayment,
  financingTerm: termMonths,
  financingRate,
  financingQrCode: qrCodeDataUrl,
} : {}),
```

---

## Changes

### File: `src/pages/quote/QuoteSummaryPage.tsx`

**Change 1**: Add guard to warranty breakdown (lines 390-397)

```tsx
// Before
if (selectedPackage === 'better' && completeWarrantyCost > 0) {

// After - also check we actually need extension
if (selectedPackage === 'better' && completeWarrantyCost > 0 && currentCoverageYears < COMPLETE_TARGET_YEARS) {
```

**Change 2**: Same for Premium package (lines 398-404)

```tsx
// Before  
} else if (selectedPackage === 'best' && premiumWarrantyCost > 0) {

// After
} else if (selectedPackage === 'best' && premiumWarrantyCost > 0 && currentCoverageYears < PREMIUM_TARGET_YEARS) {
```

**Change 3**: Conditionally pass financing to PDF (lines 506-509)

```tsx
// Before
monthlyPayment,
financingTerm: termMonths,
financingRate,
financingQrCode: qrCodeDataUrl,

// After - only include if total meets minimum
...(packageTotal >= FINANCING_MINIMUM ? {
  monthlyPayment,
  financingTerm: termMonths,
  financingRate,
  financingQrCode: qrCodeDataUrl,
} : {}),
```

---

## Technical Notes

- The warranty guard is a belt-and-suspenders fix that prevents the breakdown from including invalid line items even if a race condition occurs
- The financing conditional uses the same `FINANCING_MINIMUM` constant already imported
- No changes needed to the PDF template itself - it already conditionally renders based on presence of `monthlyPayment`
- The footer terms we updated earlier are separate from the MSRP pricing section still showing "Installation and PDI included" - that appears to be in a different location in the PDF that wasn't covered in the previous update

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/quote/QuoteSummaryPage.tsx` | 1. Guard warranty breakdown conditions<br>2. Conditionally pass financing to PDF |

---

## Expected Results

After these fixes:
- Complete package for Get 7 quotes shows `$0.00` warranty extension (or no warranty line at all)
- Quotes under $5,000 omit the "Financing Available" section and QR code from PDF
- No impact on quotes over $5,000 or non-promo quotes

