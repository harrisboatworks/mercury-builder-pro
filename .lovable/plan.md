

## Understanding Your Vision

You're right, and it's not naive at all. The PDF quote is the central artifact of the customer relationship. It's what they print, forward to their spouse, bring to the marina, and compare against competitors. Right now there are several problems that undermine that experience:

1. **Two separate quote systems**: `saved_quotes` table (from "Save Quote" dialog) and `customer_quotes` table (from deposits/leads) don't talk to each other. A customer who saves a quote and later puts a deposit down has two disconnected records.

2. **The deposit PDF is garbage**: After Stripe payment, the edge function generates an ugly pdf-lib "invoice" instead of updating the beautiful React PDF with deposit info.

3. **"My Quotes" page is thin**: It shows basic cards from `saved_quotes` with rough price estimates. No deposit status, no PDF storage link, no "your deposit is confirmed" state. No way to re-download the exact PDF they were emailed.

4. **The PDF doesn't evolve**: Once generated, the quote PDF is static. It should be the living document — showing deposit status when paid, showing "Active" vs "Expired", being the same PDF everywhere (email, account page, download button).

## The Plan

### 1. Add Deposit Section to `ProfessionalQuotePDF` (React PDF component)

Add an optional `depositInfo` prop to `ProfessionalQuotePDF`:
```
depositInfo?: {
  amount: number;
  referenceNumber: string;
  paymentDate: string;
  paymentId?: string;
  balanceDue: number;
}
```

When present, render a professional green "DEPOSIT CONFIRMED" section between the pricing table and terms — matching the existing design language (navy/green/white). Shows amount paid, reference number, date, and balance due in a styled box. This uses the same React PDF renderer, so it looks perfect.

### 2. Generate Deposit-Confirmed PDF on the Frontend Before Stripe

In `QuoteSummaryPage.tsx`, when the customer submits their info in the deposit dialog:
- Generate **two** PDFs:
  - The clean quote PDF (already done) → `deposit-quotes/HBW-XXXX.pdf`
  - A deposit-confirmed version with `depositInfo` populated → `deposit-quotes/HBW-XXXX-deposit.pdf`
- Upload both to Supabase storage
- Pass the deposit PDF path to `create-payment` → Stripe metadata

The deposit amount, reference number, and balance due are all known at this point. The only thing we don't have is the Stripe payment ID, which we can add as a small text annotation later (or skip — the reference number is sufficient).

### 3. Gut the Edge Function Stamping

In `send-deposit-confirmation-email/index.ts`:
- **Delete** `stampDepositOnQuotePdf()` (~80 lines of pdf-lib coordinate math)
- **Delete** `generateFallbackInvoicePdf()` (~120 lines of the ugly standalone invoice)
- The function simply downloads the pre-generated deposit PDF from storage and attaches it to the email as-is
- Optionally stamp just the Stripe payment ID (one line of text) if available

### 4. Store PDF Path on `saved_quotes` Record

When a quote is saved (via SaveQuoteDialog) or a deposit is made, store the PDF storage path on the `saved_quotes` record. Add a `quote_pdf_path` column to `saved_quotes` so the My Quotes page can offer direct PDF downloads of the exact document.

Migration:
```sql
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS quote_pdf_path text;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS deposit_status text DEFAULT NULL;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT NULL;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz DEFAULT NULL;
```

### 5. Upgrade "My Quotes" Page (`MyQuotesPage.tsx`)

Transform from a bare list into a proper customer file:
- Show deposit status badge: "Deposit Paid - $500" in green, or "Quote Only" in gray
- Show the actual total from `quote_state` pricing data (not the rough estimate currently used)
- **Download PDF** button that pulls the stored PDF from Supabase storage (the exact one they were emailed), or regenerates on-the-fly using the React PDF component with data from `quote_state`
- **Resume Quote** button to restore and continue configuring
- Show quote number, motor name, date saved, expiry status
- If deposit was paid, show payment date and balance due

### 6. Link Deposit Records to Saved Quotes

When the Stripe webhook fires after a successful deposit:
- Find the matching `saved_quotes` record (by email + motor match, or by a `saved_quote_id` passed through Stripe metadata)
- Update it with `deposit_status: 'paid'`, `deposit_amount`, `deposit_paid_at`
- This way the customer's "My Quotes" page immediately reflects their deposit

Pass `savedQuoteId` through the Stripe metadata chain: `QuoteSummaryPage` → `create-payment` → Stripe session metadata → webhook → update `saved_quotes`.

## Files Changed

1. `src/components/quote/professional-quote-pdf.tsx` — add `depositInfo` prop + styled deposit section
2. `src/pages/quote/QuoteSummaryPage.tsx` — generate deposit-confirmed PDF variant, save to `saved_quotes` if user logged in, pass `savedQuoteId` to payment
3. `supabase/functions/send-deposit-confirmation-email/index.ts` — delete ~200 lines of pdf-lib stamping/fallback, just download and attach
4. `supabase/functions/stripe-webhook/index.ts` — update `saved_quotes` with deposit status
5. `supabase/functions/create-payment/index.ts` — pass `savedQuoteId` through metadata
6. `src/pages/account/MyQuotesPage.tsx` — full upgrade with deposit status, PDF downloads, proper pricing
7. Database migration — add `quote_pdf_path`, `deposit_status`, `deposit_amount`, `deposit_paid_at` to `saved_quotes`

