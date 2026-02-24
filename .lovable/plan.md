

# Fix: Shared Quote Links Blocked by RLS

## Problem

The quote `47e0b7b8-...` exists in `customer_quotes`, but the RLS (Row Level Security) policies block access for anyone who isn't the quote owner or an admin. Shared links like `/quote/saved/:quoteId` fail with "Quote not found" because the anonymous browser can't SELECT the row.

## Solution

Create a Supabase Edge Function to fetch shared quotes using the service role (bypasses RLS). This avoids weakening RLS policies while still enabling shared links. The edge function will return only the `quote_data` and non-sensitive fields needed to restore the quote -- not PII like email/phone.

## Technical Changes

### 1. New Edge Function: `supabase/functions/get-shared-quote/index.ts`

- Accepts `{ quoteId: string }` in the request body
- Uses the service role client to fetch the quote from `customer_quotes`
- Returns only safe fields: `id`, `quote_data`, `customer_name` (first name only), `is_admin_quote`, `admin_discount`, `admin_notes`, `customer_notes`
- Does NOT return `customer_email`, `customer_phone`, or `user_id`

### 2. Update `src/pages/quote/SavedQuotePage.tsx`

- Replace the direct Supabase query (blocked by RLS) with a call to the new edge function:
  ```
  const { data } = await supabase.functions.invoke('get-shared-quote', {
    body: { quoteId }
  });
  ```
- The rest of the quote restoration logic remains the same

This is a two-file change. The shared link will work for anyone with the URL, while keeping PII protected behind RLS.
