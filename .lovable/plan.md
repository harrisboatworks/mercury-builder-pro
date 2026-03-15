

# Fit PDF Quote on One Page

## Problem
The PDF currently spills onto page 2 when a quote includes trade-in, accessories, and the CTA+QR box. The left column is too tall — it contains product info, motor code breakdown, a long pricing table, savings text, promo urgency, and the CTA box.

## Strategy: Tighten spacing + reduce redundancy

The PDF uses LETTER size (612×792pt) with 12pt padding = ~768pt usable height. The content just barely overflows. A combination of small reductions will reclaim the ~40-60pt needed.

### Changes (all in `ProfessionalQuotePDF.tsx`)

| Area | Current | Proposed | Savings (est.) |
|------|---------|----------|----------------|
| Page padding | 12pt | 10pt | ~4pt |
| Header `marginBottom` | 10pt | 6pt | ~4pt |
| Product bullet points | 3 lines of generic text | Remove — motor code box already describes the motor | ~30pt |
| Motor code box `marginBottom` | 8pt | 4pt | ~4pt |
| Pricing table internal `paddingVertical` on rows | 3pt | 2pt | ~10-15pt across all rows |
| `sectionTitle` font size | 14pt | 12pt, `marginBottom` 6→4 | ~4pt |
| Savings text + promo urgency `marginTop` | 8pt gap before CTA | reduce to 4pt | ~4pt |
| CTA box padding | 10pt | 8pt | ~4pt |
| Right column: savingsCalloutBox padding/margins | Various generous | Reduce `marginBottom` 8→4, padding 8→6 | ~8pt |
| Right column: coverage "What's Included" | 5 bullet items | Trim to 3 key items | ~12pt |
| Terms section `marginTop`/`marginBottom` | 4/20pt | 2/4pt | ~18pt |
| Footer absolute bottom | 12pt | 10pt | ~2pt |

**Total estimated savings: ~100pt** — comfortably fits one page even with trade-in + accessories + CTA + QR.

### Additional: Remove the 3 generic product bullet points
Lines 592-594 ("Quiet, low-vibration...", "Excellent fuel economy...", "Factory-backed service...") are marketing filler that takes ~30pt. The motor code breakdown box immediately below already provides product-specific info. Remove these bullets.

### Keep `wrap={false}` on CTA
The CTA box already has `wrap={false}`. With the space savings above, it won't need to wrap to page 2.

### Files
- `src/components/quote-pdf/ProfessionalQuotePDF.tsx` — all changes in this single file

