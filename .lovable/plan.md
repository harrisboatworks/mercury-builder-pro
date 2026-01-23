
# Fix PDF Quote Overflowing to Two Pages

## Problem

The PDF quote is rendering on two pages instead of one. The footer and terms section are pushed to page 2, which looks unprofessional and wastes paper.

## Root Cause

The `termsSection` has a `marginBottom: 80` which creates excessive spacing before the absolutely-positioned footer. When combined with content like trade-in values, accessories, and financing details, this pushes the total height beyond a single page.

---

## Solution

Reduce the spacing in the PDF layout to fit everything on one page:

| Element | Current Value | New Value | Reason |
|---------|---------------|-----------|--------|
| `termsSection.marginBottom` | 80 | **40** | Excessive padding pushing content down |
| `termsSection.marginTop` | 8 | **4** | Tighten spacing |
| `pricingTableContainer.marginBottom` | 8 | **4** | Reduce spacing after pricing |
| `summaryBox.marginBottom` | 8 | **6** | Slightly tighter |
| `savingsCalloutBox.padding` | 10 | **8** | Slightly more compact |
| `heroBox.marginBottom` (unused but still defined) | 18 | **12** | Compact |

---

## Technical Changes

**File: `src/components/quote-pdf/ProfessionalQuotePDF.tsx`**

Adjust the following styles in the `StyleSheet.create` block:

```typescript
// Line 375-381: Reduce terms section spacing
termsSection: {
  marginTop: 4,       // was 8
  marginBottom: 40,   // was 80 - THIS IS THE MAIN ISSUE
  paddingTop: 8,
  borderTop: `1 solid ${colors.border}`,
},

// Line 128-132: Tighten pricing table container
pricingTableContainer: {
  border: `1 solid ${colors.border}`,
  padding: 8,
  marginBottom: 4,   // was 8
},

// Line 229-235: Tighten summary box
summaryBox: {
  padding: 8,
  border: `1 solid ${colors.border}`,
  backgroundColor: 'transparent',
  marginBottom: 6,   // was 8
},

// Line 245-252: Tighten savings callout
savingsCalloutBox: {
  border: `2 solid ${colors.border}`,
  padding: 8,        // was 10
  backgroundColor: 'transparent',
  marginBottom: 8,
  textAlign: 'center',
},
```

---

## Files to Modify

1. **`src/components/quote-pdf/ProfessionalQuotePDF.tsx`** — Adjust 4 style values to reduce vertical spacing

---

## Expected Result

The PDF will fit on a single page with:
- Terms section directly above the footer
- Footer properly positioned at the bottom
- All content comfortably fitting without overflow

No visual changes other than slightly tighter spacing throughout.
