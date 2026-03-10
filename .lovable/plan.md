

# Fix Plan: Cinematic Counter Reset + Mobile Bar Price Jumping + Washed-Out Pages

## Three issues to fix in order:

### 1. Cinematic price counter resets mid-count
**File: `src/components/quote-builder/QuoteRevealCinematic.tsx`**

The counter effect (line 273) depends on `stage` and `priceComplete` in its dependency array. When the timeline advances stage from `'price'` → `'savings'`, the effect re-runs. If `priceComplete` state hasn't committed yet (React batching), the `if (priceComplete) return` guard fails and the counter restarts from 0.

**Fix:**
- Add `priceStartedRef = useRef(false)` and `priceCompleteRef = useRef(false)` 
- In the counter effect, guard with `if (priceStartedRef.current) return` instead of relying on `priceComplete` state
- Set `priceStartedRef.current = true` when counting begins, `priceCompleteRef.current = true` when done
- Remove `stage` from the dependency array — the effect only needs to fire once when stage first hits `'price'`
- Reset both refs in the `!isVisible` cleanup block (line 220-229)
- Add a 15-second safety timeout to force-call `onCompleteRef.current()` as a fallback

### 2. Mobile bar price jumps on every interaction  
**File: `src/components/quote-builder/UnifiedMobileBar.tsx`**

Lines 394-411: Three different pricing paths produce different totals:
- Summary page → `state.selectedPackage?.priceBeforeTax` (includes package warranty cost)
- Preview motor → raw motor price only
- Everything else → `centralTotal` from `useQuoteRunningTotal`

**Fix:**
- Remove the summary-page override (lines 396-398). The `centralTotal` from `useQuoteRunningTotal` already includes warranty pricing and should be the single source of truth
- Keep the preview override (lines 401-404) — showing just the motor price during preview is correct UX

### 3. Washed-out pages on iPhone Safari
**File: `src/pages/quote/PackageSelectionPage.tsx`** (line 344)

The sticky header uses `bg-stone-950/95 backdrop-blur-md` which causes rendering artifacts on mobile Safari.

**Fix:**
- Change to `bg-stone-950 lg:bg-stone-950/95 lg:backdrop-blur-md` — solid background on mobile, blur effect only on desktop

`PromoSelectionPage.tsx` backdrop-blur usage is on interior cards (warranty badge, financing selector), not the header — these are less problematic but can also get the same mobile-safe treatment if needed.

## Summary

| File | Change |
|------|--------|
| `QuoteRevealCinematic.tsx` | Add ref-based guards to prevent counter restart; add 15s safety timeout |
| `UnifiedMobileBar.tsx` | Remove summary-page price override (lines 396-398) |
| `PackageSelectionPage.tsx` | Solid background on mobile header, blur only on desktop |

