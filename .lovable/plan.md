

# Fix PDF Layout & Sync Quote Summary Page

## Issues Identified

1. **"Dealer + promo savings"** — needs title case: "Dealer + Promo Savings"
2. **CTA box splits across page break** — the "Ready to Proceed?" box and terms spill onto an empty page 2
3. **Unicode circled numbers** (①②③④) render as garbage characters in the PDF
4. **Quote Summary page (PricingTable.tsx)** is missing the "Tax Savings from Trade-In" line that was added to the PDF, and its savings badge doesn't use the "Dealer + Promo Savings" label when a trade-in is present

## Plan

### 1. `src/components/quote-pdf/ProfessionalQuotePDF.tsx`

**Capitalization fix (line 759)**
- Change `Dealer + promo savings` → `Dealer + Promo Savings`

**CTA box — prevent page break & fix encoding (lines 980-1004)**
- Add `break: 'avoid'` (or wrap CTA + terms in a single `<View wrap={false}>`) so react-pdf keeps it on one page
- Replace unicode `\u2460`–`\u2463` with plain text bullets: `1.`, `2.`, `3.`, `4.`

### 2. `src/components/quote-builder/PricingTable.tsx`

**Add "Tax Savings from Trade-In" row (after trade value, before subtotal)**
- When `tradeInValue > 0`, show a new `LineItemRow` labeled "Tax Savings from Trade-In" with amount `Math.round(tradeInValue * 0.13 * 100) / 100`, styled as a green highlight (not a discount deduction — it's informational, matching the PDF's "You save $X" format)
- Add description: "HST not charged on trade-in portion"

**Update savings badge text (line 212)**
- When `tradeInValue > 0`: show "Dealer + Promo Savings of $X vs MSRP"
- Otherwise keep "Total savings of $X vs MSRP"

