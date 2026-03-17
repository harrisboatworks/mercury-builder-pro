

# Fix: 4 Mobile Issues (iOS Sticky Bar, Faded Pages, Package Step, Pricing Mismatch)

## Issue 1: iOS Sticky Bar Floats During Scroll

**Root cause**: iOS rubber-band scrolling reveals content behind the fixed bar. The bar itself stays fixed, but the overscroll bounce shows a gap underneath.

**Fix in `src/components/quote-builder/UnifiedMobileBar.tsx`**:
- Add `overscroll-behavior: none` on the body when the bar is mounted (prevents rubber-band bounce on iOS)
- Add a pseudo-element or extended background below the bar to cover the gap: increase `paddingBottom` and add a solid background extension that covers the safe-area + overscroll region
- Alternatively, add a `::after` div below the bar with matching white background that extends well past the bottom

**Changes**: In the outer `div` (line 1080-1084), add a child div that acts as an overscroll shield:
```tsx
<div className="fixed bottom-0 left-0 right-0 z-[80] bg-white border-t border-gray-200 shadow-..."
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
  {/* existing content */}
  {/* Overscroll shield */}
  <div className="absolute left-0 right-0 top-full h-[100px] bg-white" />
</div>
```
Also add `overscroll-behavior-y: none` via a `useEffect` that sets it on `document.documentElement` while the bar is mounted.

## Issue 2: Faded/Washed-Out Pages on iOS

**Root cause**: `PageTransition` detects iOS via `navigator.userAgent` but iOS Chrome uses different UA strings. The `isIOS` check may fail, causing opacity-based entry animations that can stall or leave pages at partial opacity.

**Fix in `src/components/ui/page-transition.tsx`**:
- Broaden iOS detection to also check for `CriOS` (Chrome on iOS) and `FxiOS` (Firefox on iOS)
- Or simpler: check `navigator.maxTouchPoints > 1 && 'ontouchend' in document` as an iOS-specific heuristic
- Ensure the `safeVariants` path (no opacity animation) activates for all iOS browsers

```tsx
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
  /CriOS|FxiOS/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
```

## Issue 3: Package Selection Step Still Appearing

The user was on an older published version. The stepper and navigation changes from the previous session should handle this. No code changes needed, but we should verify `QuoteProgressStepper.tsx` properly excludes the package step (it was edited in a prior session).

## Issue 4: Pricing Mismatch Between Drawer and Summary

**Root cause**: Two different pricing engines:
- **MobileQuoteDrawer** uses `useQuoteRunningTotal` which starts from `motor.price` (sale price) and doesn't know about `getTotalPromotionalSavings` (discount_fixed_amount/percentage from the promotions table)
- **QuoteSummaryPage** uses `calculateQuotePricing` which starts from MSRP, subtracts the MSRP-to-sale discount, AND subtracts `getTotalPromotionalSavings` + rebate separately
- Package-specific costs (warranty extensions, propeller allowances) are only added by the summary page via `buildAccessoryBreakdown`, not by the running total hook

**Fix**: The drawer should use the same pricing as the summary when the user is on the summary page. For mid-flow pages, the running total is acceptable as an estimate. The key fix is to ensure the mid-flow `useQuoteRunningTotal` at least accounts for promotional discount amounts.

**Changes in `src/hooks/useQuoteRunningTotal.ts`**:
- Add `promotionalSavings` parameter to `calculateRunningTotal` opts
- Wire it from `useActivePromotions().getTotalPromotionalSavings` in the hook
- Subtract promotional savings (discount_fixed_amount + discount_percentage) from the subtotal, similar to how cash_rebate is already handled

**Changes in `src/components/quote-builder/MobileQuoteDrawer.tsx`**:
- On the summary page, consider using `calculateQuotePricing` directly (same as `QuoteSummaryPage`) instead of `useQuoteRunningTotal` to guarantee parity. This is a more involved change but ensures exact match.

**Simpler approach**: Add promotional savings deduction to `calculateRunningTotal` so all consumers (drawer, mobile bar, global bar) automatically benefit:

```typescript
// In calculateRunningTotal opts:
promotionalSavings?: number;

// In the function body, after all additions:
if (opts.promotionalSavings && opts.promotionalSavings > 0) {
  subtotal -= opts.promotionalSavings;
  lineItems.push({ label: 'Promotional Savings', value: opts.promotionalSavings, isCredit: true });
}
```

Then in the hook, call `getTotalPromotionalSavings(motorPrice)` and pass it as the new parameter.

---

**Files to edit**: 4 files
1. `src/components/quote-builder/UnifiedMobileBar.tsx` — overscroll shield
2. `src/components/ui/page-transition.tsx` — broader iOS detection
3. `src/hooks/useQuoteRunningTotal.ts` — add promotional savings
4. `src/components/quote-builder/MobileQuoteDrawer.tsx` — minor cleanup if needed

