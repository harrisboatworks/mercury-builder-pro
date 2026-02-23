
# Fix: Options Page Skipping Steps via Global Sticky Bar

## Problem
When on the `/quote/options` page, the desktop `GlobalStickyQuoteBar` is visible and its "Continue" button hits a catch-all that navigates directly to `/quote/promo-selection`, skipping purchase path, boat info, trade-in, and installation.

The Options page already has its own fixed bottom bar with proper validation (e.g., battery choice required), so the global bar shouldn't appear there at all.

## Root Cause
In `src/components/quote/GlobalStickyQuoteBar.tsx`:
- `/quote/options` is missing from the `hideOnPages` array (line 19-41)
- `handlePrimary` (line 170-188) has no case for `/quote/options`, so it falls through to the catch-all: `else navigate('/quote/promo-selection')`

## Fix

**File: `src/components/quote/GlobalStickyQuoteBar.tsx`**

Add `/quote/options` and `/quote/purchase-path` to the `hideOnPages` array. Both pages have their own navigation controls, and showing a second "Continue" bar creates confusion and incorrect navigation.

```
const hideOnPages = [
  '/quote/motor-selection',
  '/quote/options',           // <-- ADD: has its own sticky footer
  '/quote/purchase-path',     // <-- ADD: has its own navigation
  '/quote/summary',
  '/quote/trade-in',
  '/quote/boat-info',
  '/quote/promo-selection',
  '/quote/package-selection',
  ...
];
```

This is a one-line fix (adding two entries to an array). No other files need changes.
