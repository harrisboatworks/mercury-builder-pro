

# Fix Anonymous Quote Visibility + Enhance Download Notifications

## Current State

1. **Anonymous quotes ARE being saved** — every visitor who reaches the summary page gets a "soft lead" record in `saved_quotes` with `email: 'anonymous@soft-lead.local'`. PDF downloads also create a `saved_quotes` record with `email: 'pdf-download@placeholder.com'`.

2. **Admin SMS IS firing on download** (lines 658-672 of QuoteSummaryPage) — it sends motor model, HP, total price, trade-in info, and promo selection. But it does NOT include a link to view the quote.

3. **Admin Quotes page only queries `customer_quotes`** — it never touches `saved_quotes`, so anonymous quotes, soft leads, and PDF-download records are completely invisible to you.

## Problems to Fix

- **Admin Quotes page is blind to `saved_quotes`** — the 90HP with 60HP trade-in guy's config is sitting in `saved_quotes` but you can't see it.
- **SMS notification has no link** — you get a text saying someone downloaded, but can't view their actual quote configuration.
- **No way to search/filter anonymous quotes** — even once visible, need to find them by motor, HP, date, etc.

## Plan

### 1. Unify Admin Quotes to show both tables

**File: `src/pages/AdminQuotes.tsx`**

- Add a second fetch from `saved_quotes` on load
- Normalize saved_quotes rows to match the QuoteRow shape:
  - `quote_state.motor.model` → motor info display
  - `quote_state.customerName` → customer_name (or "Anonymous")
  - `email` → customer_email
  - `deposit_status` → badge indicator
  - `is_soft_lead` → visual tag
- Merge both arrays, sort by `created_at` desc
- Add source badges: "Lead" (customer_quotes), "Saved Quote" (saved_quotes), "Anonymous" (soft leads/pdf downloads)
- Add a text search input filtering by name, email, motor model across both
- Clicking a `saved_quotes` row navigates to `/admin/quotes/{id}` — the detail page already resolves both tables via `get-shared-quote`

### 2. Include quote link in the SMS notification

**File: `src/pages/quote/QuoteSummaryPage.tsx`**

In `handleDownloadPDF`, the saved quote ID (`savedForQr?.id`) is already available before the SMS fires. Update the SMS message to append the resume link:

```
📄 Quote Downloaded!
Anonymous visitor
90HP FourStroke
Total: $12,500 | Trade-in: 2018 Yamaha 60HP
View: https://mercuryrepower.ca/quote/saved/{id}
```

This gives you a tappable link in the text message to see their exact configuration instantly.

### 3. Add filter for quote source type

**File: `src/pages/AdminQuotes.tsx`**

Add a dropdown filter alongside existing lead status/source filters:
- All Quotes
- Customer Leads (customer_quotes only)
- Saved Quotes (saved_quotes, non-soft-lead)
- Anonymous / PDF Downloads (soft leads + pdf-download emails)
- Deposits (deposit_status = 'paid')

## Files Changed

| File | Change |
|------|--------|
| `src/pages/AdminQuotes.tsx` | Fetch both tables, merge, search bar, source badges, filters |
| `src/pages/quote/QuoteSummaryPage.tsx` | Add saved quote link to SMS message |

## Result

- Every quote config (named or anonymous) visible in admin
- SMS on download includes a direct link to view the full quote
- Searchable and filterable by source type

