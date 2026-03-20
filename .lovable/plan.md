

# Apply Brand Penalties for All Non-Mercury/Non-Yamaha Trade-Ins

Keep all brands selectable in the dropdown, but apply heavy penalties to everything except Mercury and Yamaha since you can't service them and customers don't want them.

## Changes

### `src/lib/trade-valuation.ts`
- Ensure all non-Mercury, non-Yamaha brands get a significant penalty factor:
  - Johnson/Evinrude/OMC: keep at 0.5 (50% penalty) — already set
  - Tohatsu: keep at 0.7 (30% penalty) — just added
  - Honda/Suzuki/Mariner/Force/Other: currently get **no penalty** (factor 1.0) — update these to apply penalties since they're unserviceable brands you don't want
- Suggested factors:
  - Honda/Suzuki: 0.7 (30% less — decent motors but not your brand)
  - Mariner/Force/Other: 0.5 (50% less — discontinued/unknown brands)
- Update `getBrandPenaltyFactor` to return the appropriate factor for each brand, with config overrides available via `trade_valuation_config` table

### `src/lib/trade-valuation.test.ts`
- Add test cases for Honda, Suzuki, Mariner, Force, and Other brand penalties

### No UI changes needed
The brand dropdown stays the same with all options available.

### Result
- Mercury: full value (1.0)
- Yamaha: 8% less (0.92) — already set
- Honda/Suzuki/Tohatsu: 30% less (0.7)
- Johnson/Evinrude/OMC/Mariner/Force/Other: 50% less (0.5)

All penalties remain adjustable via the `trade_valuation_config` database table without code changes.

