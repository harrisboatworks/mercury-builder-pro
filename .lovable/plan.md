

# Fix Trade-In Valuation Accuracy + Data Tracking

## Problem 1: MSRP Reference Inflating Small Motor Valuations

The `useTradeValuationData.ts` hook selects the **highest** MSRP for each HP class from `motor_models`. For smaller motors (15-25hp), this picks premium remote/electric-start models instead of base tillers, inflating the MSRP anchor by 30-50%. A 2020 Mercury 25hp in "excellent" condition at 44% of an $8,800 MSRP = ~$3,870 — way too high.

**Fix in `src/hooks/useTradeValuationData.ts`**: Change from `max(msrp)` to **median MSRP** per HP class. Sort all MSRPs for a given HP, take the middle value. This gives a more realistic anchor without penalizing legitimate higher-end models.

## Problem 2: Trade-In Details Not Saved to Customer Quotes

When a deposit is submitted, `customer_quotes.quote_data` only stores payment metadata — the full trade-in config (brand, HP, year, condition, estimated value) is missing. You can see it on the PDF because the PDF is generated client-side from QuoteContext, but the database record doesn't have it.

**Fix in `src/hooks/useQuoteActivityTracker.ts`**: Enrich the `trade_in_entered` event data to include all fields: `brand`, `year`, `horsepower`, `condition`, `engineType`, `engineHours`, `estimatedValue`, and the `prePenaltyValue`. Currently it only sends `tradeInValue` (which logs as 0) and `brand` (which logs as empty string) because it reads from `state.tradeInInfo` before the estimate is populated.

**Fix timing**: The effect fires when `state.hasTradein` flips to true, but at that point the estimate hasn't been calculated yet. Change the dependency to also watch `state.tradeInInfo?.estimatedValue` and only fire when it has a non-zero value.

## Problem 3: Quote Data Not Persisted on Deposit

**Fix in the deposit/payment flow**: Before redirecting to Stripe, serialize the full QuoteContext state (including trade-in details) into the `quote_data` JSONB column on the `customer_quotes` record. This way you can see exactly what was configured even without the PDF.

This requires updating the `create-payment` edge function or the client-side code that calls it to include the full quote snapshot.

---

## Files to modify

| File | Change |
|------|--------|
| `src/hooks/useTradeValuationData.ts` | Use median MSRP per HP instead of max |
| `src/hooks/useQuoteActivityTracker.ts` | Include all trade-in fields in event data; fix timing to wait for estimate |
| `src/components/quote-builder/StickySummary.tsx` or payment handler | Include full quote state in `quote_data` when creating deposit record |

## No database changes needed
All fixes are client-side logic changes. The `customer_quotes.quote_data` JSONB column already exists and accepts any structure.

