

# Add Start Type Field to Trade-In Form

## What This Does

Adds a "Start Type" dropdown (Manual / Electric) to the trade-in form. When "Electric" is selected, the valuation anchor shifts from the median selling price to the **maximum** (top model) for that HP class, producing a higher and more accurate trade value. When "Manual" is selected or left blank, it stays on the conservative median anchor.

## How It Works

For a 15HP example:
- **Manual/Unspecified** (median anchor): ~$4,100 → Good condition ~$1,640
- **Electric** (max anchor): ~$4,500+ → Good condition ~$1,800

The system already collects all model prices per HP class in `useTradeValuationData`. Right now it only exports the median. We'll also export the max so the valuation function can pick the right anchor based on start type.

## Changes

### 1. `src/lib/trade-valuation.ts` — Add `startType` to TradeInInfo interface
Add `startType?: 'manual' | 'electric'` to the `TradeInInfo` interface (after `engineType`).

### 2. `src/hooks/useTradeValuationData.ts` — Export both median and max per HP class
Alongside `referenceMsrps` (median), add `referenceMsrpsMax: Record<number, number>` containing the highest selling price per HP class. Update the `TradeValuationData` interface and return value.

### 3. `src/lib/trade-valuation.ts` — Use max anchor for electric-start trades
In `tryMsrpBasedEstimate`, accept an optional `referenceMsrpsMax` parameter. When `startType === 'electric'`, use the max anchor instead of median. Update `estimateTradeValue` to pass through the new data.

### 4. `src/components/quote-builder/TradeInValuation.tsx` — Add Start Type dropdown
Add a Select field between the existing "Engine Type" and "Year" fields:
- Label: "Start Type"
- Options: "Manual (Pull Start)" / "Electric Start"
- Not required — defaults to unspecified (uses median anchor)
- Pass `referenceMsrpsMax` through to `estimateTradeValue`

### 5. `src/pages/quote/TradeInPage.tsx` — No changes needed
The `tradeInInfo` state already spreads all fields through to the valuation component.

## Files

| File | Change |
|------|--------|
| `src/lib/trade-valuation.ts` | Add `startType` to interface; use max anchor when electric |
| `src/hooks/useTradeValuationData.ts` | Export `referenceMsrpsMax` (highest price per HP) |
| `src/components/quote-builder/TradeInValuation.tsx` | Add Start Type dropdown; pass max MSRPs to estimator |

