

# Fix: Show Customer Name on Quote PDF

## Problem

When downloading a PDF from the Quote Summary page, the customer name always shows as "Valued Customer" instead of the actual customer's name. This is because `QuoteSummaryPage.tsx` hardcodes the value at line 471:

```
customerName: 'Valued Customer',
customerEmail: '',
customerPhone: '',
```

The customer name, email, and phone are available in the QuoteContext (`state.customerName`, `state.customerEmail`, `state.customerPhone`) but aren't being used.

## Fix

### File: `src/pages/quote/QuoteSummaryPage.tsx`

Update lines 471-473 to pull from the context state, falling back to the generic defaults if empty:

```
customerName: state.customerName || 'Valued Customer',
customerEmail: state.customerEmail || '',
customerPhone: state.customerPhone || '',
```

This is a 3-line change. When an admin creates a quote with a customer name (like "Kurt Graichen"), the PDF will now display that name instead of "Valued Customer".

