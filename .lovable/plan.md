

# Fix: Exclude Trade-In from "Total Savings"

## Problem
`pricing.savings` currently includes trade-in value: `discount + adminDiscount + promoValue + tradeInValue`. The user wants savings to only reflect discounts off MSRP (discount + admin discount + promo), not trade-in credit. Trade-in is a separate credit, not a "saving."

The current promo placement in the motor pricing section of PricingTable.tsx is correct and stays as-is.

## Change

### `src/lib/quote-utils.ts` (line 143)

In `calculateQuotePricing`, change savings calculation from:
```ts
const savings = discount + adminDiscount + promoValue + tradeInValue;
```
to:
```ts
const savings = discount + adminDiscount + promoValue;
```

**One line change.** This propagates everywhere savings is displayed:
- PricingTable green badge ("Total savings of $X vs MSRP")
- MobileSummaryBar ("Save $X" badge, "Total Savings" row)
- StickySummary ("You save $X")
- PDF ("YOU SAVE $X", "Total savings of $X vs MSRP")
- Cinematic intro

Also update the same pattern in `computeTotals` (line 95) for consistency — change `savings = discount + promotionalSavings + tradeInValue` to `savings = discount + promotionalSavings`.

