

# Fix: Eliminate All GlobalStickyQuoteBar Navigation Conflicts

## Problem
After Options, the quote jumps straight to Promo Selection, skipping Purchase Path, Boat Info, Trade-In, and Installation. The previous fix (hiding the bar on `/quote/options` and `/quote/purchase-path`) was not sufficient.

## Root Cause
The `GlobalStickyQuoteBar` has a dangerous catch-all on line 189:
```
else navigate('/quote/promo-selection');
```
This means ANY page not explicitly handled in `handlePrimary` gets redirected to promo when Continue is clicked. Additionally, `/quote/installation` and `/quote/fuel-tank` are NOT in the `hideOnPages` array, creating similar issues for other flows.

Since every quote page already has its own navigation logic (page-specific Continue buttons, card click handlers, etc.), the `GlobalStickyQuoteBar` should NOT appear on ANY `/quote/*` page. It should only show on non-quote pages (like the homepage, `/motors`, etc.) as a "resume quote" prompt.

## Solution

**File: `src/components/quote-builder/GlobalStickyQuoteBar.tsx`**

Two changes:

1. **Replace the entire `hideOnPages` list with a single prefix check**: Hide the bar on ALL `/quote/` pages, since every quote step has its own navigation. This eliminates the need to maintain a list and prevents future omissions.

2. **Remove the catch-all `else navigate('/quote/promo-selection')`**: Replace it with a safe no-op or navigate to the next logical step. This prevents any remaining edge case from silently skipping steps.

### Technical Details

Change the `shouldShowBar` logic (around line 46):
```typescript
// Before:
const shouldShowBar = !isMobile && state.motor && !hideOnPages.some(path => location.pathname.startsWith(path));

// After:
const shouldShowBar = !isMobile && state.motor 
  && !location.pathname.startsWith('/quote/')  // Hide on ALL quote pages
  && !hideOnPages.some(path => location.pathname.startsWith(path));
```

And change the catch-all in `handlePrimary` (line 189):
```typescript
// Before:
else navigate('/quote/promo-selection');

// After: (no-op - don't navigate to an arbitrary page)
else { /* no-op: unknown page, do nothing */ }
```

This is a minimal, safe change that prevents ALL quote pages from being affected by the global bar, while keeping the bar functional on non-quote pages like the homepage.
