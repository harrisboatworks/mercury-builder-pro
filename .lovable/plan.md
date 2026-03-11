

# MSRP-Linked Trade-In Valuations (Keeping Current HP Floors)

## Summary

Transition Mercury trade-in valuations from hardcoded bracket dollar amounts to dynamic percentages of current MSRP (`motor_models.msrp`). Non-Mercury brands and missing-MSRP cases fall back to existing brackets. **HP-class floors stay as-is** (under 25HP: $200, 25-75HP: $1,000, 90-150HP: $1,500, 200HP+: $2,500).

## Research Alignment

The research recommends anchoring to current Mercury MSRP with these wholesale age ranges:

| Age | Wholesale % of MSRP |
|-----|---------------------|
| 1-3 years | 48-55% |
| 4-7 years | 33-45% |
| 8-12 years | 22-30% |
| 13-17 years | 14-20% |
| 18-20+ years | 8-14% |

Condition multipliers (relative to Good baseline): Excellent x1.10, Good x1.00, Fair x0.80, Poor x0.50.

## Changes

### 1. Database: Insert `MSRP_TRADE_PERCENTAGES` config row

Add to `trade_valuation_config` with condition-specific percentages per age bracket. These use Good as the baseline (matching research), then apply condition multipliers:

```json
{
  "1-3":   { "excellent": 0.55, "good": 0.50, "fair": 0.40, "poor": 0.25 },
  "4-7":   { "excellent": 0.44, "good": 0.40, "fair": 0.32, "poor": 0.20 },
  "8-12":  { "excellent": 0.29, "good": 0.26, "fair": 0.21, "poor": 0.13 },
  "13-17": { "excellent": 0.19, "good": 0.17, "fair": 0.14, "poor": 0.09 },
  "18-20": { "excellent": 0.13, "good": 0.12, "fair": 0.10, "poor": 0.06 }
}
```

### 2. `supabase/functions/agent-quote-api/index.ts`

**In `runTradeEstimate`**: Add MSRP-based path before the bracket lookup. When brand is "Mercury":
- Accept a new optional `msrpLookup` parameter (map of HP to MSRP from `motor_models`)
- Determine age bracket (1-3, 4-7, 8-12, 13-17, 18-20)
- If `MSRP_TRADE_PERCENTAGES` config exists and MSRP found for closest HP: `baseValue = msrp × pct[ageBracket][condition]`
- Then apply existing adjustments (2-stroke, hours, brand penalty, floors) on top
- If either lookup fails, fall through to existing bracket logic

**In `estimateTradeIn` and `create_quote`/`update_quote` trade-in blocks**: Query `motor_models` for Mercury motors to build HP-to-MSRP map, pass to `runTradeEstimate`.

### 3. `src/lib/trade-valuation.ts`

Add the same MSRP-based path for the client-side function:
- Accept optional `referenceMsrps` in `EstimateTradeValueOptions` (Record of HP to MSRP)
- For Mercury brand, compute from MSRP percentages before bracket fallback
- All existing adjustments (2-stroke, hours, brand penalty, HP floors) layered on top

### 4. `src/hooks/useTradeValuationData.ts`

Add a query for Mercury `motor_models` to fetch `horsepower` and `msrp` fields. Include in the returned `TradeValuationData` as `referenceMsrps`.

### 5. `AGENT_API_INSTRUCTIONS.md`

Document that Mercury trade-ins are now MSRP-anchored and auto-adjust when prices update.

## What Does NOT Change

- HP-class floors remain: $200 / $1,000 / $1,500 / $2,500
- Non-Mercury brands use existing bracket table
- 2-stroke penalty (17.5%), hours adjustments, brand penalties all stay
- Bracket table remains as fallback
- Admin/agent override still takes priority

## Files Modified

| File | Change |
|------|--------|
| `trade_valuation_config` (DB) | Insert `MSRP_TRADE_PERCENTAGES` config row |
| `supabase/functions/agent-quote-api/index.ts` | Add MSRP path in `runTradeEstimate`, query motor MSRPs |
| `src/lib/trade-valuation.ts` | Add MSRP-based valuation path for Mercury |
| `src/hooks/useTradeValuationData.ts` | Fetch Mercury motor MSRPs |
| `AGENT_API_INSTRUCTIONS.md` | Document MSRP-anchored valuations |

