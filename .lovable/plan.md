

# Fixes for Agent Quote Pricing, Cinematic Glitch, and Washed-Out Summary

## Issues Found

### 1. Wrong Motor Price — Agent API ignores `dealer_price`
The motor "150 ELPT ProXS" has these DB values:
- `msrp` = $27,395
- `dealer_price` = $24,107 ← the actual selling price
- `base_price` = $18,300 (dealer cost)
- `sale_price` = NULL

The **frontend** correctly resolves the selling price by checking `dealer_price` when `sale_price` is null (line 433-436 of MotorSelectionPage.tsx). The **agent API** skips `dealer_price` entirely:
```
motorPrice = motor.sale_price || motor.base_price || motor.msrp || 0  →  $18,300 (wrong)
```
Fix: update the agent API to match the frontend's pricing resolution:
```
motorPrice = motor.sale_price || 
  (motor.dealer_price < motor.msrp ? motor.dealer_price : null) || 
  motor.base_price || motor.msrp || 0
```
Also store `dealer_price` in the quoteData motor object so the frontend can render it correctly when restoring saved quotes.

### 2. Cinematic Animation Keeps Resetting on iPhone
`handleCinematicComplete` in QuoteSummaryPage (line 91) is defined inline without `useCallback`. Every re-render creates a new function reference. The QuoteRevealCinematic's main useEffect (line 250) has `onComplete` in its dependency array, so every parent re-render restarts the entire animation timeline.

Fix: wrap `handleCinematicComplete` in `useCallback` with stable dependencies.

### 3. Washed-Out Summary Page
After the cinematic completes, the summary page may appear washed out if the cinematic overlay's opacity transition doesn't fully unmount. The cinematic uses `AnimatePresence` but the `isVisible` check (line 279) returns `null` — the parent controls visibility via `showCinematic` state. If the cinematic's fade-out and the summary's fade-in overlap incorrectly, it creates a washed-out appearance. Need to verify the page-transition and cinematic z-index cleanup. May also be related to the animation reset bug flooding the DOM with overlapping cinematic layers.

## Changes

### `supabase/functions/agent-quote-api/index.ts`
- **Line ~452**: Update `motorPrice` resolution to include `dealer_price` (matching frontend logic)
- **Line ~618-631**: Store `dealer_price` in the motor object within quoteData
- **Line ~265**: Ensure `list_motors` also selects `dealer_price`
- **Line ~288**: Include `dealer_price` in list_motors response
- Redeploy edge function

### `src/pages/quote/QuoteSummaryPage.tsx`
- **Line ~91**: Wrap `handleCinematicComplete` in `useCallback` to prevent reference changes
- This single fix should resolve both the animation reset glitch AND the washed-out appearance (caused by multiple cinematic layers stacking)

### `src/components/quote-builder/QuoteRevealCinematic.tsx`
- **Line ~250**: Remove `onComplete` from the main useEffect dependency array and use a ref instead, as a defensive measure against future reference instability

