

# Add QR Code to Admin PDF Download

## Current Issue

The PDF downloaded from the admin panel is **missing the QR code** because the `handleDownloadPDF` function doesn't generate one. The customer-facing version includes a scannable QR code that links to the financing application.

---

## Solution

Add QR code generation to `AdminQuoteDetail.tsx` using the same approach as `QuoteSummaryPage.tsx` - this will:

1. Generate a QR code data URL using the `qrcode` library
2. Use `SITE_URL` to ensure it points to `https://quote.harrisboatworks.ca`
3. Pass the QR code to the PDF generator

---

## What the QR Code Links To

The QR code will encode a link to the financing application with the quote ID:

```
https://quote.harrisboatworks.ca/financing-application/from-quote?quoteId={quote-uuid}
```

When customers scan this from a printed PDF, they'll be directed to your public site to complete their financing application - **not** a Lovable preview URL.

---

## Technical Changes

### File: `src/pages/AdminQuoteDetail.tsx`

**1. Add Import**
```typescript
import QRCode from 'qrcode';
```

**2. Update `handleDownloadPDF` Function**

Before building `pdfData`, generate the QR code:

```typescript
// Generate financing QR code using public SITE_URL
const financingUrl = `${SITE_URL}/financing-application/from-quote?quoteId=${q.id}`;
let financingQrCode = '';
try {
  financingQrCode = await QRCode.toDataURL(financingUrl, {
    width: 200,
    margin: 1,
    color: { dark: '#111827', light: '#ffffff' }
  });
} catch (error) {
  console.error('QR code generation failed:', error);
}
```

**3. Add to `pdfData` Object**

Include the QR code in the data passed to the generator:

```typescript
const pdfData = {
  // ... existing fields ...
  financingQrCode,  // Add this line
};
```

---

## Expected Result

After this fix, the admin-downloaded PDF will include:

| Section | Content |
|---------|---------|
| Financing Available | Monthly payment, term, APR rate |
| QR Code | Scannable code linking to financing application |
| QR URL | `https://quote.harrisboatworks.ca/financing-application/from-quote?quoteId=...` |

The QR code will match exactly what appears in customer-generated PDFs.

