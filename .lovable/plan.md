

# Merge QR Code with CTA — One QR for Both Cash & Financing

## Insight

The QR code currently points to the financing application URL and only appears when financing is eligible. But it could just as easily point to the **saved quote page**, which already lets customers choose their path — financing, deposit, or contact. This eliminates the separate "Ready to Proceed?" CTA box and makes the QR useful for **all** buyers, not just financing-eligible ones.

## Current State

- **QR code**: Only generated when `packageTotal >= FINANCING_MINIMUM`, points to `/financing-application?...`
- **CTA box**: Separate "Ready to Proceed?" section with 4 numbered steps, only shown when no deposit has been placed
- **Result**: Two separate sections doing overlapping jobs; cash buyers under $5K get the CTA but no QR; the CTA box causes page-break issues

## Plan

### 1. Generate a universal QR code (`QuoteSummaryPage.tsx` + `AdminQuoteDetail.tsx`)

- **Always** generate a QR code (not just when financing-eligible)
- Point it to the **saved quote URL**: `${SITE_URL}/quote/{quoteId}` (or the share URL if one exists)
- Fall back to the financing URL if no saved quote ID is available
- Pass it as a new field `quoteQrCode` alongside existing `financingQrCode` (keep `financingQrCode` for backward compat, or just repurpose it)

### 2. Merge CTA + QR into one compact section (`ProfessionalQuotePDF.tsx`)

Replace the current separate "Financing Available" QR area and "Ready to Proceed?" CTA box with a **single unified section** below the pricing table:

```text
┌─────────────────────────────────────────────────────┐
│  Ready to Proceed?                        ┌──────┐  │
│                                           │  QR  │  │
│  1. Scan QR to reserve online             │ CODE │  │
│  2. Call or text: (905) 342-2153          └──────┘  │
│  3. Reply to this email                             │
│                                                     │
│  [if financing eligible:]                           │
│  From $XXX/mo over XX months at X.XX% APR           │
└─────────────────────────────────────────────────────┘
```

- QR sits on the right, CTA text on the left — similar to how the financing box already works
- If financing is eligible, include the monthly payment line inside this same box
- Remove the old standalone CTA box
- Keep `wrap={false}` to prevent page breaks
- This saves vertical space and eliminates the page-break issue entirely

### 3. Files to modify

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Generate QR pointing to saved quote URL; always generate it regardless of financing threshold |
| `src/pages/AdminQuoteDetail.tsx` | Same QR URL change |
| `src/components/quote-pdf/ProfessionalQuotePDF.tsx` | Merge financing box + CTA into one unified section; accept `quoteQrCode`; remove standalone CTA box |
| `src/lib/react-pdf-generator.tsx` | Pass through the new QR field in the data interface |

