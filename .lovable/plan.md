

## Verification Results

All three changes are structurally correct and the data flows end-to-end. Here is what I verified:

### A. Customer Notes on PDF — Correct
- `customerNotes` added to PDF props interface (line 436)
- Rendered as a styled "Notes" box before Terms section (lines 879-885)
- Passed through `ReactPdfQuoteData` interface (line 62) and both `generateQuotePDF` (line 135) and `generatePDFBlob` (line 187)
- Passed from QuoteSummaryPage into pdfData (line 533)

### B. Admin Custom Line Items — Correct with one gap
- State field `adminCustomItems` added to QuoteContext (line 82), initial state (empty array), `SET_ADMIN_QUOTE_DATA` reducer (line 277), and `RESTORE_QUOTE` reducer (line 299)
- Admin UI for add/edit/remove items in AdminQuoteControls (lines 325-393)
- Items included in `accessoryBreakdown` in QuoteSummaryPage (lines 414-423), which flows into the pricing table AND the PDF
- Items saved in `enhancedQuoteData` when admin saves the quote (line 102)

**Gap found:** The admin save function's `finalPrice` calculation (line 84-93) only sums `state.selectedOptions` — it does NOT include `customItems` prices. This means the `final_price` column in the database won't reflect custom line items, though the PDF and pricing table will be correct (they compute from `accessoryBreakdown` which does include them).

**Fix needed in `src/components/admin/AdminQuoteControls.tsx` (line 84):**
```typescript
const accessoryTotal = (state.selectedOptions?.reduce((sum, opt) => sum + (opt.price || 0), 0) || 0)
  + (customItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0);
```

### C. Battery + Notes Restore from Saved Quotes — Correct
- `looseMotorBattery` is dispatched via `SET_LOOSE_MOTOR_BATTERY` at line 76-78 of SavedQuotePage
- `adminCustomItems` restored via `SET_ADMIN_QUOTE_DATA` at line 97-107 of SavedQuotePage
- `looseMotorBattery` is explicitly saved in `enhancedQuoteData` at line 107 of AdminQuoteControls

### Summary
One fix needed: include custom item prices in the admin save's `finalPrice` calculation so the database record matches the PDF total.

