

# Centralize Quote Pricing Calculation

## Problem
The same ~30-line pricing calculation is copy-pasted across 3 components (GlobalStickyQuoteBar, UnifiedMobileBar, MobileQuoteDrawer). Every time a new line item type is added, all 3 must be updated — which has already caused bugs.

## Approach
Extract a single pure function `calculateRunningTotal(state, getRebateForHP)` into a new file, and a companion React hook `useQuoteRunningTotal()` that wires it to the QuoteContext. All 3 components replace their inline `useMemo` with a call to this hook.

## New file: `src/hooks/useQuoteRunningTotal.ts`

Export a **pure function** `calculateRunningTotal` that takes the quote state fields and a `getRebateForHP` callback, returns `{ subtotal, hst, total, lineItems }`. This is the single source of truth for the pre-tax and post-tax running total.

Also export a **hook** `useQuoteRunningTotal()` that:
- Calls `useQuote()` for state
- Calls `useActivePromotions()` for `getRebateForHP`
- Wraps `calculateRunningTotal` in a `useMemo`
- Returns `{ subtotal, hst, total, lineItems, financingUnavailable }`

The pure function includes all current line items:
- Motor price
- Selected options
- Controls (none=$1200, adapter=$125)
- Installation labor ($450 for remote motors on installed path)
- Installation config costs
- Fuel tank config
- Battery cost
- Warranty price
- Trade-in credit (subtract)
- Admin custom items
- Admin discount (subtract)
- Cash rebate (subtract, via `getRebateForHP`)
- HST at 13%

## Component changes

### `GlobalStickyQuoteBar.tsx`
- Replace the `runningTotal` useMemo (lines 49-117) with `const { total } = useQuoteRunningTotal()`
- Keep the monthly payment calculation that uses `total`

### `UnifiedMobileBar.tsx`
- Replace the `runningTotal` useMemo (lines 390-470) with the hook
- Keep the special `isPreview` and `selectedPackage.priceBeforeTax` overrides as conditional logic before falling back to the hook

### `MobileQuoteDrawer.tsx`
- Replace the `pricing` useMemo (lines 43-161) with the hook
- The hook returns `lineItems` so the drawer can still render its breakdown rows

## Safety
- Pure function with no side effects — easy to unit test
- Components keep their own display/navigation logic unchanged
- Only the arithmetic moves; UI rendering stays in each component
- The hook returns the same shape of data each component already uses

