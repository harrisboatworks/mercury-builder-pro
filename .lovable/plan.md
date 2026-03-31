

# Fix Excess Space Below Purchase Path Buttons

## Problem
The `<main>` element in `QuoteLayout.tsx` has `min-h-screen`, forcing full viewport height even when content (two buttons) is short. This creates a large empty space below the buttons on mobile.

## Fix
In `src/components/quote-builder/QuoteLayout.tsx` line 65, remove `min-h-screen` from the `<main>` tag. The outer wrapper div already has `min-h-screen`, so the page background still fills the viewport.

```
// Before
<main className="min-h-screen relative">

// After
<main className="relative">
```

Also update the subtitle text while we're here — line 24 in `PurchasePath.tsx`: change "Pick up & go" to "Schedule Pickup".

## Files changed
| File | Change |
|------|--------|
| `src/components/quote-builder/QuoteLayout.tsx` | Remove `min-h-screen` from `<main>` |
| `src/components/quote-builder/PurchasePath.tsx` | Change "Pick up & go" → "Schedule Pickup" |

