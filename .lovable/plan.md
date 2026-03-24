

# Auto-Detect Compatible Propeller from Trade-In

## The Idea

When a customer is trading in a Mercury motor of the same HP class as the new motor, their old propeller almost certainly fits. Instead of charging $350/$1,200 for a propeller allowance, automatically show a $0 line item: **"Your current propeller should be compatible — we'll confirm during water testing (additional charge applies if replacement needed)"**.

## How It Works Today

- `buildAccessoryBreakdown` checks `boatInfo?.hasCompatibleProp` — a manual checkbox the customer ticks in the Boat Info step
- If checked: $0 "Use of Customer Propeller" line item
- If not checked: full propeller allowance charge ($350 or $1,200)

## The Fix

### 1. `src/lib/build-accessory-breakdown.ts` — Add trade-in awareness

Add a `tradeInInfo` parameter to `BuildAccessoryBreakdownParams`:
```
tradeInInfo?: { brand?: string; horsepower?: number; hasTradeIn?: boolean };
```

In the propeller section (lines 149-163), add auto-detection logic: if `tradeInInfo.hasTradeIn` is true AND `tradeInInfo.brand` is "Mercury" AND `tradeInInfo.horsepower` matches the new motor's HP, treat it like `hasCompatibleProp` but with a more specific message:

```
name: "Propeller — Use Existing"
price: 0
description: "Your current Mercury propeller should be compatible — 
  we'll confirm during water testing (additional charge applies if needed)"
```

The manual `hasCompatibleProp` checkbox still takes priority if set.

### 2. `src/pages/quote/QuoteSummaryPage.tsx` — Pass trade-in info to breakdown builder

Where `buildAccessoryBreakdown` is called, add `tradeInInfo: state.tradeInInfo` to the params object.

### 3. `src/pages/quote/PackageSelectionPage.tsx` — Same pass-through

If this page also calls `buildAccessoryBreakdown`, pass `tradeInInfo` there too.

### 4. `src/hooks/useQuoteRunningTotal.ts` — Update running total

The running total also needs to skip the propeller charge when trade-in matches. Pass `tradeInInfo` through so the cost calculation stays consistent with the breakdown display.

## HP Matching Logic

Same HP class means the prop hub pattern matches. We'll do a simple check: `tradeInInfo.horsepower === hp` (exact match). This covers the common case — same-size repower. We won't try fuzzy matching across HP ranges since prop compatibility gets complicated there.

## What the Customer Sees

**Without trade-in or different brand/HP:**
> Propeller Allowance (Aluminum) — $350

**With Mercury trade-in, same HP:**
> Propeller — Use Existing — $0
> *Your current Mercury propeller should be compatible — we'll confirm during water testing (additional charge applies if needed)*

## Files

| File | Change |
|------|--------|
| `src/lib/build-accessory-breakdown.ts` | Add `tradeInInfo` param; auto-detect compatible prop |
| `src/pages/quote/QuoteSummaryPage.tsx` | Pass `tradeInInfo` to breakdown builder |
| `src/pages/quote/PackageSelectionPage.tsx` | Pass `tradeInInfo` to breakdown builder (if applicable) |
| `src/hooks/useQuoteRunningTotal.ts` | Account for trade-in prop match in cost calc |

