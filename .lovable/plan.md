

# Prevent Saving Quotes Without Motor Selected

## Problem
Users can trigger save actions (email quote, save quote button, admin save) even when no motor is selected, resulting in incomplete/useless saved quotes.

## Changes

### 1. `src/components/quote-builder/SaveQuoteDialog.tsx`
Add a motor check at the top of `handleSave` — if `quoteData` has no motor, show a toast error and return early.

### 2. `src/components/quote-builder/QuoteDisplay.tsx`
Add a guard in `handleSaveQuote` — if `quoteData.motor` is null/undefined, show a toast and return.

### 3. `src/components/admin/AdminQuoteControls.tsx`
Add a guard in `handleSaveQuote` — if `state.motor` is null, show a toast "Please select a motor before saving" and return.

### 4. `src/pages/quote/QuoteSummaryPage.tsx`
- Disable the "Email Me This Quote" and "Save My Quote" buttons when `!state.motor`, showing a tooltip/message "Select a motor first"
- Guard the silent soft-lead save (already has `!state.motor` check — confirmed OK)
- Guard the PDF download `handleDownloadPDF` with the same motor check

Each guard shows: **"Please select a motor before saving your quote."**

## Files

| File | Change |
|------|--------|
| `src/components/quote-builder/SaveQuoteDialog.tsx` | Early return in `handleSave` if no motor in quoteData |
| `src/components/quote-builder/QuoteDisplay.tsx` | Guard `handleSaveQuote` |
| `src/components/admin/AdminQuoteControls.tsx` | Guard `handleSaveQuote` with `state.motor` check |
| `src/pages/quote/QuoteSummaryPage.tsx` | Disable save/email buttons and guard PDF download when no motor |

