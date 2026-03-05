

## Diagnosis: Accessories Missing from PDF

### What the data shows

I queried the database and confirmed Brian's saved quote (`988ad48c`) has ALL the right data:
- `boatInfo.controlsOption = "none"` → should add Controls ($1,200)
- `purchasePath = "installed"` → should add Professional Installation ($450)
- `motor.hp = 150` → should add Propeller Allowance Stainless Steel ($1,200)

Yet the PDF shows $0 in accessories. The subtotal is just Motor Price ($23,457) minus Trade ($2,050) = $21,407.

### The code is correct in the editor

I traced every step:
1. `buildAccessoryBreakdown()` correctly handles all three items
2. `QuoteSummaryPage` line 309-323 calls it with the right state values
3. `pdfData.accessoryBreakdown` passes it to the PDF generator (line 399)
4. `react-pdf-generator.tsx` line 131 passes it through to the PDF component
5. `ProfessionalQuotePDF.tsx` line 666-689 renders the "Accessories & Setup" section when items exist

**The published site is running older code that predates the `buildAccessoryBreakdown` utility.** Even though you clicked Publish, the deployment may not have completed, or a cached version is being served.

### Plan: Add defensive logging + force a verifiable change

**File 1: `src/pages/quote/QuoteSummaryPage.tsx`** — Add a console.log right before PDF generation that prints the `accessoryBreakdown` array so we can verify via console logs whether the breakdown is populated:

```typescript
// Before line 399
console.log('[PDF] accessoryBreakdown items:', accessoryBreakdown.length, accessoryBreakdown);
```

**File 2: `src/components/quote-pdf/ProfessionalQuotePDF.tsx`** — Add a fallback: if `accessoryBreakdown` is empty but the motor is ≥40HP and not a tiller, show a "Controls & setup costs calculated at time of order" note in the pricing section so it's visually obvious when the breakdown is missing vs intentionally empty.

**File 3: `src/pages/AdminQuoteDetail.tsx`** — Same logging before PDF generation to confirm the recomputation works.

### Verification step

After implementing, you publish again and I can check the console logs from the preview to verify the breakdown contains the expected 3 items. Then regenerate the PDF and we confirm it's correct.

### Expected result on Brian's quote

| Item | Price |
|------|-------|
| MSRP | $27,395.00 |
| Your Discount | -$3,288.00 |
| Rebate | -$650.00 |
| Motor Price | $23,457.00 |
| **Controls & Rigging Package** | **$1,200.00** |
| **Professional Installation** | **$450.00** |
| **Propeller Allowance (Stainless Steel)** | **$1,200.00** |
| Estimated Trade Value | -$2,050.00 |
| Subtotal | $24,257.00 |
| HST (13%) | $3,153.41 |
| **Total Price** | **$27,410.41** |

