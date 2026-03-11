

# Update Edge Function: Add Engine Type, Hours & HP-Floor Logic to Agent API

## Problem

The `AGENT_API_INSTRUCTIONS.md` documents `engine_type` and `engine_hours` fields, but the **edge function (`agent-quote-api/index.ts`) ignores them entirely**. The `runTradeEstimate` function and all three call sites (estimate_trade_in, create_quote, update_quote) don't pass or apply these values. The API also still uses the global `MIN_TRADE_VALUE` floor instead of the new HP-class floors.

## Changes

### `supabase/functions/agent-quote-api/index.ts`

**1. Update `runTradeEstimate` signature and logic** (lines 254-348)

Add `engineType` and `engineHours` parameters. After computing the base low/high range and before applying brand penalty:

- **2-stroke/OptiMax haircut**: If engine type is `'2-stroke'` or `'optimax'`, multiply range by `config.TWO_STROKE_PENALTY?.factor ?? 0.825`. Add factor note.
- **Hours adjustment**: Apply bonus/penalty from `config.HOURS_ADJUSTMENT` (same logic as client-side `trade-valuation.ts`).
- **HP-class floors**: Replace global `minValue` with HP-aware floor from `config.HP_CLASS_FLOORS` (under_25: $200, 25_75: $1000, 90_150: $1500, 200_plus: $2500).

**2. Update `estimateTradeIn` action** (lines 450-488)

- Extract `engine_type` and `engine_hours` from `body`
- Pass them to `runTradeEstimate`
- Include them in the response object

**3. Update `create_quote` trade-in block** (lines 760-797)

- Extract `ti.engine_type` and `ti.engine_hours`
- Pass to `runTradeEstimate`
- Store in `tradeInData` for persistence

**4. Update `update_quote` trade-in block** (lines 1105-1140)

- Same as create_quote: extract and pass `engine_type`/`engine_hours`

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/agent-quote-api/index.ts` | Add engine_type/engine_hours support + HP-class floors to runTradeEstimate and all 3 call sites |

