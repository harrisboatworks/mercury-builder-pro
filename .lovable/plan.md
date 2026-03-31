
# Integrate HBW Motor Valuation API + Report Link

## Overview
Replace the local `estimateTradeValue()` with a direct fetch to `https://hbw-valuation-hbw.vercel.app/api/motor-valuation`. Map `wholesale` → `estimatedValue`. Add a "View Full Valuation Report" button that links to the HBW tool with URL params + `auto=true`. Keep local math as silent fallback. Customer name comes from `QuoteContext.customerName` (option B).

## Architecture
```
TradeInValuation "Get My Estimate" click
  → fetch("https://hbw-valuation-hbw.vercel.app/api/motor-valuation", POST body)
  → Success: use wholesale as estimatedValue, show richer results + report link
  → Failure: fall back to local estimateTradeValue() silently
  → estimatedValue feeds into quote pipeline unchanged
```

## Changes

### 1. `src/lib/trade-valuation.ts` — Add `fetchHBWValuation()`
New async function that POSTs to the HBW API and returns a `TradeValueEstimate`-compatible result plus extra fields (hstSavings, listing value). No API key header.

### 2. `src/components/quote-builder/TradeInValuation.tsx` — Use HBW API + add report link
- Accept optional `customerName` prop (from QuoteContext)
- In `handleGetEstimate`: try `fetchHBWValuation()` first, fall back to local `estimateTradeValue()` on error
- After estimate shows: add HST savings callout, private sale comparison, and "View Full Valuation Report →" button
- Report link format: `https://hbw-valuation-hbw.vercel.app/?brand=X&year=X&hp=X&condition=X&stroke=X&name=X&auto=true`
- Map stroke: `4-stroke` (default), `2-stroke`, or engine type from form

### 3. `src/pages/quote/TradeInPage.tsx` — Pass customerName prop
- Pass `state.customerName` to `<TradeInValuation customerName={state.customerName} />`

## What stays the same
- `TradeInInfo` interface — `estimatedValue` field unchanged
- All downstream: pricing summary, PDF quote, saved quotes — untouched
- Form fields and flow — identical

## Files changed
| File | Change |
|------|--------|
| `src/lib/trade-valuation.ts` | Add `fetchHBWValuation()` + `HBWValuationResponse` type |
| `src/components/quote-builder/TradeInValuation.tsx` | Call HBW API with fallback; add report link + richer result UI |
| `src/pages/quote/TradeInPage.tsx` | Pass `customerName` prop |
