
# Fix: Admin Discount Not Showing on PDF

## Problem Identified

The `$500 Special Discount` you applied in the admin panel is being **included in the total savings calculation** (you can see the PDF shows "Total savings of $1,258.00" which is $508 + $250 + $500), but the **line item itself is not appearing** in the pricing breakdown.

## Root Cause

The issue is in `src/lib/react-pdf-generator.tsx`. When the PDF is generated, the data goes through a transformation step that **does not pass the `pricing` object** to the PDF template:

```text
QuoteSummaryPage.tsx          react-pdf-generator.tsx         ProfessionalQuotePDF.tsx
─────────────────────         ────────────────────────        ────────────────────────
pdfData.pricing = {           transformedData = {             Checks for:
  adminDiscount: 500,    ─►     msrp: "6,080.00",        ─►   quoteData.pricing?.adminDiscount
  ...                           dealerDiscount: "508.00",     
}                               // pricing object MISSING!     → Returns undefined, no render
                              }
```

The PDF template at line 622 checks `quoteData.pricing?.adminDiscount`, but since `pricing` is never included in `transformedData`, it's always undefined.

---

## Solution

Add the `pricing` object to the transformed data in `react-pdf-generator.tsx`:

| File | Change |
|------|--------|
| `src/lib/react-pdf-generator.tsx` | Pass `pricing` object in both `generateQuotePDF` and `generatePDFBlob` functions |

---

## Technical Implementation

### react-pdf-generator.tsx

Add the `pricing` object to the `transformedData` in both functions:

**In `generateQuotePDF` function (around line 133):**
```typescript
const transformedData = {
  quoteNumber: data.quoteNumber,
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  // ... existing fields ...
  selectedPromoOption: data.selectedPromoOption,
  selectedPromoValue: data.selectedPromoValue,
  // ADD THIS LINE:
  pricing: data.pricing,  // Pass full pricing object for admin discount rendering
};
```

**In `generatePDFBlob` function (around line 186):**
```typescript
const transformedData = {
  quoteNumber: data.quoteNumber,
  // ... existing fields ...
  selectedPromoOption: data.selectedPromoOption,
  selectedPromoValue: data.selectedPromoValue,
  // ADD THIS LINE:
  pricing: data.pricing,  // Pass full pricing object for admin discount rendering
};
```

---

## Expected Result

After this fix, when you download a PDF for a quote with a special discount:

| Item | Price |
|------|-------|
| MSRP - 15EXLHPT ProKicker FourStroke | ~~$6,080.00~~ |
| Dealer Discount | -$508.00 |
| **Special Discount** | **-$500.00** |
| Mercury GET 7 + $250 rebate Rebate | -$250.00 |
| Motor Price | $4,322.00 |
| ... | ... |

The "Special Discount" line will now appear in the PDF pricing breakdown, matching the Total Savings amount.

---

## Summary

This is a 1-file fix that adds the missing `pricing` object to the PDF data transformation, enabling the Special Discount line item to render correctly in generated PDFs.
