

## Why the customer name is missing on shared quotes

The customer name, email, and phone are saved as **top-level columns** on `customer_quotes` (not inside the `quote_data` JSON blob). When the shared quote loads:

1. The edge function `get-shared-quote` returns `customer_name` (truncated to first name only for privacy)
2. `SavedQuotePage` never passes this name into the QuoteContext
3. The quote summary page and PDF generator read from QuoteContext, which has empty customer fields

### Two fixes needed

**1. Include customer info in `quote_data` when admin saves** (`AdminQuoteControls.tsx`, ~line 97)
- Add `customerName`, `customerEmail`, `customerPhone` to `enhancedQuoteData` so they're stored inside the JSON blob and available when restoring

**2. Restore customer info when loading shared quote** (`SavedQuotePage.tsx`, ~line 99)
- After restoring admin fields, also pass `customerName`/`customerEmail`/`customerPhone` from `quoteData` (or from the edge function response `customer_name`) into the `SET_ADMIN_QUOTE_DATA` dispatch
- For the edge function response: return the **full** `customer_name` (not just first name) since the data is already inside `quote_data` anyway, and the summary page needs it for the PDF

This means existing saved quotes (before this fix) will use the first-name-only fallback from the edge function column, but new quotes will have the full name embedded in `quote_data`.

### Files to change
- `src/components/admin/AdminQuoteControls.tsx` -- add customer fields to `enhancedQuoteData`
- `src/pages/quote/SavedQuotePage.tsx` -- restore customer name/email/phone to context from `quote_data` or edge function response

