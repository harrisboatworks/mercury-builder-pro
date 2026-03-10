

# Add Unit Tests for `calculateRunningTotal`

## Plan

Create `src/hooks/useQuoteRunningTotal.test.ts` with tests covering every line item branch:

1. **Null/zero motor** → returns zeros
2. **Motor only** → subtotal = motor price, HST = 13%, total = subtotal + HST
3. **Selected options** → adds each option price
4. **Controls: `none`** → +$1,200; **`adapter`** → +$125
5. **Installation labor** → +$450 for non-tiller on `installed` path
6. **Tiller motor skips labor** → no $450 when model contains `TLR`
7. **Installation config (mounting hardware)** → adds `installationCost`
8. **Fuel tank** → adds `tankCost`
9. **Battery** → adds `batteryCost` when `wantsBattery`
10. **Warranty** → adds `warrantyPrice`, label includes extra years
11. **Trade-in credit** → subtracts value, `isCredit: true`
12. **Admin custom items** → sums all item prices
13. **Admin discount** → subtracts, `isCredit: true`
14. **Cash rebate** → subtracts rebate from `getRebateForHP` when `selectedPromoOption === 'cash_rebate'`
15. **Kitchen sink** → all options combined, verify final arithmetic

Single new file, no changes to existing code.

