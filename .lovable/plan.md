
# Fix: Options Page Sticky Footer Hidden by CSS Kill Switch

## Problem
The Options page's own Back/Continue footer bar is invisible on desktop, leaving users stranded with no way to continue the quote flow.

## Root Cause
In `src/styles/premium-motor.css` (line 36-41), there's a broad CSS "kill switch":

```css
.fixed.bottom-0.z-50 {
  display: none !important;
}
```

This was originally added to hide old gamification/celebration bars, but it matches ANY element with classes `fixed`, `bottom-0`, and `z-50` -- including the Options page's own sticky footer, the Motor Selection sticky bar, and potentially other legitimate fixed bars throughout the quote flow.

## Solution

**File: `src/styles/premium-motor.css`**

Remove `.fixed.bottom-0.z-50` from the kill switch rule (line 38). The other selectors in that block (`.fixed.pointer-events-none.z-30` and `.fixed.top-4.right-4.z-40`) can stay since they target specific gamification/celebration elements.

The GlobalStickyQuoteBar interference is already handled by the JavaScript fix we applied earlier (hiding it on all `/quote/` pages), so this CSS kill switch is no longer needed and is actively harmful.

### Before
```css
.fixed.pointer-events-none.z-30,
.fixed.bottom-0.z-50,
.fixed.top-4.right-4.z-40 {
  display: none !important;
}
```

### After
```css
.fixed.pointer-events-none.z-30,
.fixed.top-4.right-4.z-40 {
  display: none !important;
}
```

This is a one-line CSS deletion that will restore the Options page footer (and any other legitimate fixed bottom bars) across the entire app.
