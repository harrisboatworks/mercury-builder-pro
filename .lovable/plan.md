

# Add Engine Type, Hours Adjustment, and HP-Class Floors to Trade-In Valuation

## Overview

Three enhancements to the trade-in valuation system: engine type selector with 2-stroke haircut, engine hours input with adjustment, and HP-class minimum floor values stored in Supabase.

## Changes

### 1. Database: Add HP-class floor config to `trade_valuation_config`

Insert new config rows into the existing `trade_valuation_config` table:

| key | value | description |
|-----|-------|-------------|
| `HP_CLASS_FLOORS` | `{"under_25": 200, "25_75": 1000, "90_150": 1500, "200_plus": 2500}` | Minimum trade values by HP class |
| `TWO_STROKE_PENALTY` | `{"factor": 0.825}` | 17.5% haircut for 2-stroke/OptiMax engines (midpoint of 15-20%) |
| `HOURS_ADJUSTMENT` | `{"low_max_hours": 100, "low_bonus": 0.075, "high_min_hours": 500, "high_penalty_moderate": 0.10, "high_threshold": 1000, "high_penalty_severe": 0.175}` | Hours-based adjustments |

### 2. `TradeInInfo` interface (`trade-valuation.ts`)

Add two new optional fields:
- `engineType?: '4-stroke' | '2-stroke' | 'optimax'`
- `engineHours?: number`

### 3. `TradeValuationConfig` interface (`trade-valuation.ts`)

Add new config keys:
- `HP_CLASS_FLOORS?: Record<string, number>`
- `TWO_STROKE_PENALTY?: { factor: number }`
- `HOURS_ADJUSTMENT?: { low_max_hours: number; low_bonus: number; high_min_hours: number; high_penalty_moderate: number; high_threshold: number; high_penalty_severe: number }`

### 4. `estimateTradeValue` function (`trade-valuation.ts`)

After computing the base `preLow`/`preHigh` range and before `applyBrandPenaltyToRange`:

1. **2-stroke haircut**: If `engineType` is `'2-stroke'` or `'optimax'`, multiply the range by the TWO_STROKE_PENALTY factor (default 0.825). Add factor note.

2. **Hours adjustment**: 
   - If `engineHours` <= `low_max_hours` (100): multiply by `1 + low_bonus` (1.075)
   - If `engineHours` >= `high_threshold` (1000): multiply by `1 - high_penalty_severe` (0.825)
   - If `engineHours` >= `high_min_hours` (500): multiply by `1 - high_penalty_moderate` (0.90)
   - Add descriptive factor note.

3. **HP-class floors**: Replace the single `minValue` with an HP-aware floor before passing to `applyBrandPenaltyToRange`. Logic:
   - HP < 25 → $200
   - HP 25-75 → $1,000
   - HP 90-150 → $1,500
   - HP 200+ → $2,500
   - Fallback to existing `MIN_TRADE_VALUE`

### 5. `TradeInValuation.tsx` UI

Add two new form fields in the grid:

- **Engine Type** (Select): Options "4-Stroke", "2-Stroke", "OptiMax". Placed after Brand. Not required but influences estimate.
- **Engine Hours** (Input number): Optional field with placeholder "e.g., 250". Placed after Model.

Wire both to `onTradeInChange` and pass through to `estimateTradeValue`.

### 6. `TradeInPage.tsx`

Update the default `TradeInInfo` initial state to include `engineType: undefined` and `engineHours: undefined`.

### Files Modified

| File | Change |
|------|--------|
| `trade_valuation_config` (Supabase) | Insert 3 new config rows |
| `src/lib/trade-valuation.ts` | Add fields to interfaces, implement 2-stroke/hours/HP-floor logic |
| `src/components/quote-builder/TradeInValuation.tsx` | Add engine type selector and hours input |
| `src/pages/quote/TradeInPage.tsx` | Add new fields to initial state |

