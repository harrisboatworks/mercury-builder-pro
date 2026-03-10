

# Audit: Add Admin Custom Items & Promo Rebates to All Independent Pricing Calculations

## Findings

Two components calculate pricing independently and are **missing** admin custom items, admin discount, and promo rebates:

| Component | Missing Items | Notes |
|-----------|--------------|-------|
| `GlobalStickyQuoteBar` (desktop sticky bar) | adminCustomItems, adminDiscount, cash_rebate | Calculates `runningTotal` lines 49-100 |
| `UnifiedMobileBar` (mobile bottom bar) | adminCustomItems, adminDiscount, cash_rebate | Calculates `runningTotal` lines 390-452 |

`MobileQuoteDrawer` was already fixed in the previous change.

## Changes

### 1. `src/components/quote/GlobalStickyQuoteBar.tsx`
In the `runningTotal` useMemo (after trade-in subtraction, before HST):
- Add `state.adminCustomItems` — sum and add to total
- Subtract `state.adminDiscount` if > 0
- If `state.selectedPromoOption === 'cash_rebate'`, get rebate via `getRebateForHP(state.motor.hp)` and subtract
- Add all three to the useMemo dependency array

Already imports `useActivePromotions` — just need to destructure `getRebateForHP` from it (currently only uses `getRebateForHP` and `getSpecialFinancingRates` in display logic, line 17).

### 2. `src/components/quote-builder/UnifiedMobileBar.tsx`
In the `runningTotal` useMemo (inside the `!isPreview` block, after trade-in):
- Add `state.adminCustomItems` — sum and add to total
- Subtract `state.adminDiscount` if > 0
- If `state.selectedPromoOption === 'cash_rebate'`, get rebate via `getRebateForHP` and subtract
- Add to dependency array
- Need to import/destructure `getRebateForHP` from `useActivePromotions` (check if hook is already used in this component)

