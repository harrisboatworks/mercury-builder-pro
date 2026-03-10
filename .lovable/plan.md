

# Fix MobileQuoteDrawer Pricing to Match Summary Page

## Problem
The MobileQuoteDrawer calculates pricing independently and is missing two categories of line items that the Summary page includes:
1. **Admin custom items** (e.g., "SmartCraft Connect $399") — `state.adminCustomItems`
2. **Promo rebate credits** (e.g., "$300 Mercury GET 7 rebate") — `state.selectedPromoOption === 'cash_rebate'`
3. **Admin discount** — `state.adminDiscount`

This causes the drawer to show $6,905 while the summary shows $7,017.

## Fix — `src/components/quote-builder/MobileQuoteDrawer.tsx`

### Add missing line items to the `pricing` useMemo (after trade-in, before HST calc):

1. **Admin custom items** (~after line 117):
   - Loop through `state.adminCustomItems`, add each to subtotal and lineItems

2. **Admin discount** (after custom items):
   - If `state.adminDiscount > 0`, subtract from subtotal, add as credit line item

3. **Promo rebate** (after admin discount):
   - Import and use `useActivePromotions` hook's `getRebateForHP`
   - If `state.selectedPromoOption === 'cash_rebate'`, get rebate amount via `getRebateForHP(displayMotor.hp)`, subtract from subtotal, add as credit line item with label like "Mercury GET 7 Rebate"

### Hook changes:
- Destructure `getRebateForHP` from existing `useActivePromotions()` call (already imported, just need to add to destructure on line 30)
- Add `state.adminCustomItems`, `state.adminDiscount`, `state.selectedPromoOption` to useMemo deps

