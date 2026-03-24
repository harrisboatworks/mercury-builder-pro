

# QR Code Should Link to Saved Quote, Not Financing App

## The Problem

Currently, QR codes on PDFs point to `/financing-application?...` for quotes over $5,000. This only makes sense if the customer wants to finance. If they're paying cash, the QR code is useless. The user wants **all QR codes** to point to the saved quote page (`/quote/saved/{id}`) so anyone who prints the PDF can scan it later and resume — whether cash or finance.

The sub-$5K path in `QuoteSummaryPage` already does this correctly. The two broken paths are:
1. **QuoteSummaryPage** (line 484-495): financing-eligible quotes point to `/financing-application`
2. **AdminQuoteDetail** (line 426-434): always points to `/financing-application`

## The Fix

### 1. `src/pages/quote/QuoteSummaryPage.tsx` — Always save quote and use saved-quote URL

Remove the `if (packageTotal >= FINANCING_MINIMUM)` branch for QR target URL. Always save the quote to `saved_quotes` and set QR to `/quote/saved/{id}` — the same logic currently used for sub-threshold quotes. The financing data still gets included in the PDF data object (monthly payment, term, rate) for display purposes; only the QR destination changes.

Lines ~482-516 become a single block: save quote, set `qrTargetUrl = /quote/saved/{id}`.

### 2. `src/pages/AdminQuoteDetail.tsx` — Use the quote's own ID for QR

The admin page already has the quote ID (`q.id`). The saved quote is already in the `saved_quotes` table (admin creates it there). Change lines 426-434 to simply:

```typescript
const qrTargetUrl = `${SITE_URL}/quote/saved/${q.id}`;
```

Remove the financing URL params construction for QR. The QR code generation (`QRCode.toDataURL`) stays the same — just a shorter, simpler URL.

### 3. PDF CTA text update — `ProfessionalQuotePDF.tsx`

The "Ready to Proceed?" box text currently says things about financing. Update the CTA copy to be universal: something like **"Scan to view your quote online"** or **"Scan to resume your quote"** so it works for both cash and financing customers.

## What Changes

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Always use `/quote/saved/{id}` for QR URL |
| `src/pages/AdminQuoteDetail.tsx` | Use `/quote/saved/{quoteId}` instead of financing params |
| `src/components/quote-pdf/ProfessionalQuotePDF.tsx` | Update CTA text to be universal (not financing-specific) |

