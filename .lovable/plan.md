
# Remove Perplexity Live Lookup - Database Only

## Overview

Remove the Perplexity-powered live market lookup feature and revert to using only the curated trade valuation database. Random listing prices from Kijiji/Boat Trader are unreliable for dealer trade-in values.

---

## Changes Required

### 1. Revert TradeInValuation Component

**File:** `src/components/quote-builder/TradeInValuation.tsx`

Remove:
- `liveMarketValue` state
- `isLoadingLiveValue` state  
- `handleLiveMarketLookup` function
- "Get Live Market Value" button
- Live market results card with sources
- All Supabase function invocation code

Keep:
- Database-powered `estimatedValue` from `useTradeValuationData` hook
- Current condition-based valuation logic
- Fallback to hardcoded values when database unavailable

### 2. Delete Edge Function

**File:** `supabase/functions/trade-value-lookup/index.ts`

Delete the entire function - it's no longer needed.

### 3. Update Config

**File:** `supabase/config.toml`

Remove the `trade-value-lookup` function entry.

---

## Result

The trade-in valuation will use only:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | Supabase `trade_valuation_brackets` | Curated dealer values by brand/year/HP |
| 2 | Hardcoded fallback | Built-in values if database unavailable |

No external API calls, no random listing prices.

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/quote-builder/TradeInValuation.tsx` | Remove live lookup code |
| `supabase/functions/trade-value-lookup/index.ts` | Delete |
| `supabase/config.toml` | Remove function entry |
