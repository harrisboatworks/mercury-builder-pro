

# Fix: Propeller Allowance on Admin PDF + QR Code Routing

## Issues Found

### 1. Propeller Allowance Showing on PDF Despite Same-HP Mercury Trade-In

**Root cause**: The `buildAccessoryBreakdown` in `AdminQuoteControls.handleSaveQuote` runs at save time and persists the result. If the admin saves before the trade-in is fully populated in context, or if there's a timing issue with state updates, the persisted breakdown includes the standard propeller allowance ($350) instead of the $0 "Use Existing" line.

The **share link** works correctly because `SavedQuotePage` restores `tradeInInfo` to context and the summary page's `useMemo` recalculates the breakdown live — correctly detecting the Mercury trade-in match.

The **PDF download** also uses the live `useMemo` breakdown, so if the PDF showed the prop allowance, it means the PDF was generated at a point when `state.tradeInInfo` wasn't yet reflecting in the memo, OR the HP comparison failed due to type mismatch (string vs number).

**Fix**: Add type-safe HP comparison in `build-accessory-breakdown.ts` using `Number()` coercion on both sides. Also ensure the admin save always refreshes the breakdown from current state at the moment of save.

### 2. QR Code Opening Finance App Instead of Saved Quote

**Root cause**: The code correctly saves to `saved_quotes` and points the QR to `/quote/saved/{id}`. The most likely explanation is a deployment timing issue — the production site may still have older code that routed QR codes to the financing application. The code in the repo is correct.

**Safeguard**: No code change needed for routing — it's already correct. But we should verify there's no fallback path that accidentally constructs a financing URL.

## Changes

### 1. `src/lib/build-accessory-breakdown.ts`
- Change the HP comparison from strict `===` to a `Number()`-coerced comparison to handle string/number mismatches:
  ```
  Number(tradeInInfo?.horsepower) === Number(hp)
  ```
- This prevents edge cases where form inputs store HP as a string

### 2. `src/components/admin/AdminQuoteControls.tsx`
- After saving, also update `frozenPricing` in context so the summary page reflects the saved state
- Ensure `tradeInInfo` is explicitly read from `state` at save time (already done, but add a console log for debugging)

### 3. Verify QR routing (no code change)
- The code already points QR to `/quote/saved/{id}` — this is correct per the professional PDF strategy
- The issue was likely a stale deployment; rebuilding/redeploying should fix it

| File | Change |
|------|--------|
| `src/lib/build-accessory-breakdown.ts` | Type-safe HP comparison with `Number()` coercion |
| `src/components/admin/AdminQuoteControls.tsx` | Minor: sync frozen pricing to context after save |

