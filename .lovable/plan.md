
# Fix: Scroll to Top on Quote Builder Navigation

## Problem

When navigating between steps in the quote builder (e.g., clicking "Continue" on Trade-In to go to Promo Selection), users see the new page at their current scroll position (often near the bottom) before it slowly scrolls up. This creates a poor user experience where users feel "lost" on the page and have to wait for the scroll animation.

## Root Cause

The global `ScrollToTop` component uses:
- A **100ms delay** before scrolling
- **Smooth scroll behavior** for quote routes

This causes the new page content to render first (at the user's previous scroll position), then animate up - which feels jarring and disorienting.

## Solution

Change the scroll behavior for quote builder routes from `smooth` to `instant` so the page immediately appears at the top when navigating between steps.

---

## File Changes

### 1. Update ScrollToTop Component

**File**: `src/components/ui/ScrollToTop.tsx`

**Change**: Use `instant` scroll behavior for quote routes instead of `smooth`, and reduce the delay.

| Before | After |
|--------|-------|
| 100ms delay | 50ms delay (faster response) |
| `behavior: 'smooth'` for quote routes | `behavior: 'instant'` for quote routes |

**Lines 73-81**:
```typescript
// Before
const timer = setTimeout(() => {
  window.scrollTo({
    top: 0,
    behavior: isQuoteRoute ? 'smooth' : 'auto'
  });
  ...
}, 100);

// After  
const timer = setTimeout(() => {
  window.scrollTo({
    top: 0,
    behavior: 'instant'  // Always instant for immediate feedback
  });
  ...
}, 50);  // Reduced delay for faster scroll
```

---

## Why This Works

1. **Instant scroll** ensures users always see the new page from the top immediately
2. **Reduced delay** (50ms) still allows React to commit the new route before scrolling, but feels more responsive
3. **Consistent with QuoteSummaryPage** which already uses `window.scrollTo({ top: 0, behavior: 'instant' })` on mount

## Pages That Will Benefit

All quote builder step transitions:
- Motor Selection → Options → Purchase Path
- Purchase Path → Boat Info / Trade-In
- Trade-In → Installation / Promo Selection
- Promo Selection → Package Selection
- Package Selection → Summary
- Summary → Schedule

---

## Expected Result

| Before | After |
|--------|-------|
| Page renders at scroll position, then slowly animates up | Page immediately appears at top |
| User sees bottom of new page first | User always sees top of new page |
| Disorienting experience | Clean, predictable navigation |
