

# Fix: Cinematic Price Wrong on iPhone + Washed-Out Summary

## Root Cause Analysis

### Wrong Price ($16,357 instead of $20,447)

The cinematic's price counter captures `finalPrice` (= `packageSpecificTotals.subtotal`) when the `'price'` stage begins (~3.5s into the animation). The problem:

1. `packageSpecificTotals` depends on `promoSavings`, which depends on `useActivePromotions` — an **async Supabase fetch**
2. On desktop, the promo cache is warm from prior browsing → promotions load instantly
3. On iPhone opening a **cold shared link**, no cache exists → async fetch creates a timing gap
4. The cinematic starts the price counter with whatever `finalPrice` is at that moment
5. The ref guard (`priceStartedRef.current`) **prevents the counter from restarting** when promotions load and `finalPrice` changes

The direction of the error (higher or lower) depends on what `getTotalPromotionalSavings` returns — it can include `discount_fixed_amount` and `discount_percentage` from active promotions, which changes the subtotal in either direction.

### Washed-Out Summary

The cinematic overlay uses multiple `motion.div` layers with opacity animations. On iOS Safari, `AnimatePresence` exit animations with opacity can leave rendering artifacts — semi-transparent ghost layers that persist after the component unmounts. The existing iOS safety in `PageTransition` doesn't cover the cinematic overlay.

## Proposed Fixes

### A. Cinematic price stability (`QuoteSummaryPage.tsx`)

**Gate the cinematic on promo loading.** `useActivePromotions` returns a `loading` state. Don't show the cinematic until `loading === false`:

```
// Line 751: change condition
isVisible={showCinematic && isMounted && !promoLoading}
```

This ensures `packageSpecificTotals.subtotal` is fully computed before the counter starts.

### B. Price counter final-value snap (`QuoteRevealCinematic.tsx`)

As a safety net, when the counter completes, snap `displayPrice` to the **current** `finalPrice` prop (not the value captured when counting started). Add a `useEffect` that syncs `displayPrice` to `finalPrice` after `priceComplete` is true:

```
useEffect(() => {
  if (priceComplete && displayPrice !== finalPrice) {
    setDisplayPrice(finalPrice);
  }
}, [priceComplete, finalPrice, displayPrice]);
```

### C. iOS washed-out fix (`QuoteRevealCinematic.tsx`)

Detect iOS and skip opacity-based exit animations on the overlay:

1. Add iOS detection (same helper already in `page-transition.tsx`)
2. When `isSkipping` or completing on iOS, **immediately call `onComplete`** instead of fading out over 500ms
3. On the root `motion.div`, set `exit={{ opacity: 0, transition: { duration: 0 } }}` on iOS to prevent lingering layers
4. Add `will-change: opacity` to the background layers to hint GPU compositing

### Summary of Changes

| File | Change |
|------|--------|
| `QuoteSummaryPage.tsx` | Destructure `loading` from `useActivePromotions`; gate cinematic on `!loading` |
| `QuoteRevealCinematic.tsx` | Add final-value snap effect; detect iOS and skip exit fade; add `will-change` hints |

