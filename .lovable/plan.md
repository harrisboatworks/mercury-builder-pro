

# Add PDF Download, Share Link & Promo Display to Admin Quote Detail

## Overview

Enhance the `AdminQuoteDetail.tsx` page to include:
1. **PDF Download Button** - Generate and download the quote PDF directly from the detail view
2. **Share Link Section** - Copy the public quote link to share with customers  
3. **Promo Information Display** - Show which promotion was applied and when it expires

---

## Current State

The `AdminQuoteDetail.tsx` page currently shows:
- Customer info, trade-in details, financial summary
- Admin controls (discount, notes)
- "Edit Full Quote" button

**Missing features:**
- No way to download PDF from this screen
- No share link to copy
- No promotion details displayed

---

## Implementation Plan

### 1. Add New "Sharing & Actions" Card

Create a new card below the existing grid that contains:
- **Download PDF** button
- **Copy Share Link** with the public URL
- Loading states for PDF generation

```text
┌──────────────────────────────────────────────────────────────┐
│  📄 Sharing & Actions                                         │
├──────────────────────────────────────────────────────────────┤
│  [Download PDF]              [Copy Link]                      │
│                                                              │
│  https://quote.harrisboatworks.ca/quote/saved/{id}           │
└──────────────────────────────────────────────────────────────┘
```

### 2. Add "Applied Promotion" Card

Display the promotion details extracted from `quote_data`:
- Promotion type (Rebate, Financing, or No Payments)
- Promotion value (e.g., "$500 Rebate" or "2.99% APR")
- Expiration date from database

```text
┌──────────────────────────────────────────────────────────────┐
│  🎁 Applied Promotion                                         │
├──────────────────────────────────────────────────────────────┤
│  Mercury GET 7 + Choose One                                   │
│  Selection: Factory Rebate - $500                             │
│  Warranty: 7 Years (3 Standard + 4 Bonus)                     │
│  Offer Expires: March 31, 2026                                │
└──────────────────────────────────────────────────────────────┘
```

### 3. PDF Generation Logic

Reuse the existing `generateQuotePDF` function from `src/lib/react-pdf-generator.tsx`:

1. Extract motor data, pricing, and promo details from `quote_data`
2. Build the PDF data object (same structure as QuoteSummaryPage)
3. Generate blob URL and trigger download
4. Handle loading and error states

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminQuoteDetail.tsx` | Add PDF download, share link, and promo display sections |

### New Imports Required

```typescript
import { Download, Link, Copy, Check, Gift, Calendar } from 'lucide-react';
import { generateQuotePDF, downloadPDF } from '@/lib/react-pdf-generator';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { SITE_URL } from '@/lib/site';
```

### New State Variables

```typescript
const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
const [linkCopied, setLinkCopied] = useState(false);
```

### PDF Download Handler

The handler will:
1. Set loading state
2. Extract data from `q.quote_data`
3. Build PDF data object with motor, pricing, promo info
4. Call `generateQuotePDF()` and `downloadPDF()`
5. Show success/error toast

### Share Link Handler

Copy the shareable URL to clipboard:
```typescript
const shareUrl = `${SITE_URL}/quote/saved/${q.id}`;
await navigator.clipboard.writeText(shareUrl);
```

### Promo Display Logic

Extract from `q.quote_data`:
- `selectedPromoOption`: 'no_payments' | 'special_financing' | 'cash_rebate'
- `selectedPromoValue`: Display string (e.g., "$500")

Use `useActivePromotions()` hook to get:
- `end_date` for expiration display
- `warranty_extra_years` for warranty total

### Helper Function for Promo Label

```typescript
const getPromoLabel = (option: string | null): string => {
  switch (option) {
    case 'no_payments': return '6 Months Deferred Payments';
    case 'special_financing': return 'Special Financing Rate';
    case 'cash_rebate': return 'Factory Rebate';
    default: return 'Standard Warranty';
  }
};
```

---

## UI Layout (Updated Grid)

```text
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  Customer                   │  │  Trade-In                   │
│  Name: Tony Bowen           │  │  Year: 2022                 │
│  Email: tony@example.com    │  │  Brand: Mercury             │
│  Phone: 705-868-3194        │  │  HP: 9.9                    │
│  Date: 1/23/2026            │  │  Value: $1,550              │
└─────────────────────────────┘  └─────────────────────────────┘

┌─────────────────────────────┐  ┌─────────────────────────────┐
│  Financial Summary          │  │  Admin Controls             │
│  Base price: $5,572         │  │  Special Discount: $700     │
│  Admin discount: -$700      │  │  Internal Notes: None       │
│  Final price: $4,144        │  │  Customer Notes: ...        │
└─────────────────────────────┘  └─────────────────────────────┘

┌─────────────────────────────┐  ┌─────────────────────────────┐
│  🎁 Applied Promotion       │  │  📄 Share & Download        │
│  Mercury GET 7 + Choose One │  │  [📥 Download PDF]          │
│  ✓ Factory Rebate: $500     │  │  [🔗 Copy Link]             │
│  ✓ 7-Year Warranty          │  │                             │
│  ⏰ Expires: Mar 31, 2026   │  │  Link: quote.harris.../123  │
└─────────────────────────────┘  └─────────────────────────────┘
```

---

## Expected Result

After implementation:
1. Admin opens quote detail page
2. Sees promotion details with expiration date
3. Can click "Download PDF" to generate and download the quote
4. Can click "Copy Link" to get the shareable customer URL
5. All data matches what was saved in the quote

