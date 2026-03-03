

## The Problem (Simply Put)

Right now, when a customer clicks "Reserve" on the quote summary page, the system generates the PDF **immediately** — before collecting their name, email, or phone. So the "Customer Information" section on your beautiful PDF shows "Customer" or is blank. Then after Stripe checkout, we've been trying to hack in the real info by drawing over the PDF with pdf-lib, which is fragile and ugly.

## The Simple Fix

**Collect customer info BEFORE generating the PDF.** When the customer clicks "Reserve", show a quick dialog asking for their name, email, and phone. Then generate the PDF with that real info already baked in, upload it, and redirect to Stripe. No stamping. No hacking. The PDF is perfect from the start.

## What Changes

### 1. New Deposit Info Dialog (`src/components/quote-builder/DepositInfoDialog.tsx`)
- A clean modal that appears when the customer clicks "Reserve"
- Three fields: Name, Email, Phone (all required)
- Pre-fills from auth user data if logged in
- On submit, passes the info back and proceeds to payment

### 2. Update `QuoteSummaryPage.tsx`
- Instead of `handleReserveDeposit` going straight to PDF generation + Stripe, it first opens the dialog
- After dialog submit, uses the **real customer info** for:
  - PDF generation (lines 627-631 — `customerName`, `customerEmail`, `customerPhone`)
  - The `customerInfo` sent to `create-payment` (lines 696-700)

### 3. Remove pdf-lib Stamping from `send-deposit-confirmation-email`
- Remove the `stampDepositOnQuotePdf` function that tries to overwrite customer info on the PDF
- Keep the deposit confirmation banner stamping (amount paid, balance due) — that part still makes sense since it's payment info added after the fact
- Or simplify to just attach the original PDF as-is since it already has the correct customer info

## Result
- Customer clicks Reserve → enters their info → PDF generates with their real name/email/phone in the Customer Information section → uploads to storage → redirects to Stripe
- The PDF looks exactly like the one they can download, but with their actual details filled in
- No coordinate guessing, no white-out rectangles, no fragile stamping

