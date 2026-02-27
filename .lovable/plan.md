

## Issues Found

### 1. Battery option not on PDF
The battery **is** included in `accessoryBreakdown` (line 371-377 of QuoteSummaryPage.tsx) when `state.looseMotorBattery?.wantsBattery` is true. The PDF renders it in the "Accessories & Setup" section. If it's missing from your PDF, the battery choice likely wasn't set in the quote context when you generated it — possibly a state restoration issue from the saved quote flow.

### 2. Customer Notes not shown on PDF
The `customerNotes` field exists in the QuoteContext and is saved to the database in `quote_data`, but it is **never passed to the PDF data object** (lines 469-522 of QuoteSummaryPage.tsx) and the **PDF component has no rendering section for notes** at all. This is the gap.

### 3. No custom line items feature
There's currently no way to manually add ad-hoc items (like "Battery box — $0.00") from admin controls. The accessory breakdown is entirely derived from the motor options system.

## Plan

### A. Show customer notes on PDF (2 files)

**`src/components/quote-pdf/ProfessionalQuotePDF.tsx`**:
- Add `customerNotes?: string` to the `QuotePDFProps` interface
- Render a "Notes" section below the pricing table (before Terms) when `customerNotes` is present

**`src/lib/react-pdf-generator.tsx`**:
- Add `customerNotes` to `ReactPdfQuoteData` interface
- Pass `customerNotes` through in both `generateQuotePDF` and `generatePDFBlob` transform blocks

**`src/pages/quote/QuoteSummaryPage.tsx`**:
- Pass `customerNotes: state.customerNotes` into the `pdfData` object

### B. Add admin custom line items (3 files)

**`src/contexts/QuoteContext.tsx`**:
- Add `adminCustomItems: Array<{ name: string; price: number }>` to state
- Handle it in `SET_ADMIN_QUOTE_DATA` and `RESTORE_QUOTE` actions

**`src/components/admin/AdminQuoteControls.tsx`**:
- Add UI section for custom line items: text input for description, number input for price, add/remove buttons
- Dispatch custom items to context

**`src/pages/quote/QuoteSummaryPage.tsx`**:
- Include `state.adminCustomItems` in the `accessoryBreakdown` builder so they appear in the pricing table and PDF

### C. Ensure battery choice restores from saved quotes

**`src/pages/quote/SavedQuotePage.tsx`**:
- Verify `looseMotorBattery` is restored from `quote_data` during the RESTORE_QUOTE dispatch (it's already in `enhancedQuoteData` when saved — need to confirm it's being restored)

