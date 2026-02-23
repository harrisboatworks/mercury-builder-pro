
# Fix Washed-Out Text on Package Selection Page

## Problem
The Coverage Package page has multiple faded text elements visible in the screenshot:
- "Best Value" subtitle on the card is barely readable
- "$1,271" price and "From $43/mo" are light
- "Coverage: 7 years total" is faint
- Feature checklist text is too light
- Page subtitle "Select the level of protection..." on the dark header uses `text-stone-400` which washes out on mobile

## Root Cause
- `PackageCards.tsx` uses `text-muted-foreground` for subtitle, monthly payment, coverage, and feature list text
- `PackageSelectionPage.tsx` uses `text-stone-400` for header subtitle and other secondary text
- The `glass-card` background is semi-transparent (`rgba(255,255,255,0.75)`) which further reduces contrast

## Changes

### 1. `src/components/quote-builder/PackageCards.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 161 | `text-sm font-medium text-muted-foreground` (subtitle "Best Value") | `text-sm font-medium text-gray-600` |
| 171 | `text-sm text-muted-foreground` ("From $X/mo" line) | `text-sm text-gray-600` |
| 200 | `text-sm text-muted-foreground` ("Coverage: X years") | `text-sm text-gray-600` |
| 209 | `text-sm leading-relaxed text-muted-foreground` (features list) | `text-sm leading-relaxed text-gray-700` |
| 237 | `text-xs text-muted-foreground` ("Tap to select") | `text-xs text-gray-500` |

### 2. `src/pages/quote/PackageSelectionPage.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 382 | `text-stone-400 text-lg` (page subtitle) | `text-stone-300 text-lg` |
| 402 | `text-xs text-stone-400` (recommendation reason) | `text-xs text-stone-300` |
| 467 | `text-sm text-stone-400` ("Scroll down") | `text-sm text-stone-300` |
| 543 | `text-sm text-stone-400` ("Selected Package" label) | `text-sm text-stone-300` |
| 548 | `text-sm text-stone-400` ("Starting at") | `text-sm text-stone-300` |
| 552 | `text-xs text-stone-500` ("before tax") | `text-xs text-stone-400` |

## Impact
- Package cards will have crisp, readable text on white backgrounds in bright outdoor conditions
- Dark header section text bumped from stone-400 to stone-300 for better visibility
- No layout or design changes -- same premium look, just more legible on mobile
