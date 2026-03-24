

# Create New Quote for Existing Customer

## Current State

- Admin can **edit** an existing quote (restores full state and navigates to summary)
- Admin can create a **blank** new quote from `/admin/quote/new`
- There's no way to start a fresh quote pre-filled with a customer's name/email/phone from their existing quote detail page

## The Fix

### 1. `src/pages/AdminQuoteDetail.tsx` — Add "New Quote for This Customer" button

Next to the existing "Edit Quote" button, add a new button. On click:
- Clear localStorage `quoteBuilder`
- Dispatch `RESET_TO_ADMIN_MODE` (same as the existing new quote flow)
- Dispatch `SET_ADMIN_QUOTE_DATA` with just the customer info (name, email, phone) from the current quote — no motor, options, or pricing carried over
- Navigate to `/quote/motor-selection`

This gives the admin a clean quote builder pre-filled with the customer's contact details.

### 2. `src/pages/AdminQuotes.tsx` — Add per-row "New Quote" action (optional enhancement)

Add a small "+" icon button on each row that does the same: starts a new quote pre-filled with that customer's name/email. This is secondary — the detail page button is the primary entry point.

## Files

| File | Change |
|------|--------|
| `src/pages/AdminQuoteDetail.tsx` | Add "New Quote for Customer" button with pre-filled customer info |
| `src/pages/AdminQuotes.tsx` | Optional: per-row quick-action to create new quote for that customer |

