

# Add Tohatsu as a Trade-In Brand with 30% Penalty

## Changes

### 1. Add Tohatsu to brand dropdown
**File: `src/components/quote-builder/TradeInValuation.tsx`**
- Add `'Tohatsu'` to the `brandOptions` array (after Suzuki)

### 2. Add 30% penalty for Tohatsu trade-ins
**File: `src/lib/trade-valuation.ts`**
- Add `TOHATSU: 0.7` to `TRADEIN_BRAND_PENALTIES` (30% less than Mercury)
- Add a config-aware block in `getBrandPenaltyFactor` for `BRAND_PENALTY_TOHATSU`, matching the existing pattern for Johnson/Evinrude/OMC

### 3. Update tests
**File: `src/lib/trade-valuation.test.ts`**
- Add a test case confirming `getBrandPenaltyFactor('Tohatsu')` returns `0.7`

### Result
A Tohatsu motor valued at $5,000 as Mercury would come back at $3,500. The penalty is also overridable via the `trade_valuation_config` table if you want to adjust it later without a code change.

