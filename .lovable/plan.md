

# Cap Trade-In Value — No Credits

## Problem
A 2.5 HP motor (~$2,000) with a 150 HP trade-in (~$9,150) results in a **negative subtotal**, effectively giving the customer money. The agent API already caps this (`Math.min(tradeInValue, subtotal)`) but the main quote builder pricing engine does not.

## Fix

### 1. `src/hooks/useQuoteRunningTotal.ts` — Cap trade-in at subtotal

In `calculateRunningTotal`, after computing the subtotal up to the trade-in step (~line 104-108), cap the applied trade-in so the subtotal never goes below zero:

```typescript
if (opts.tradeInValue) {
  const cappedTradeIn = Math.min(opts.tradeInValue, subtotal);
  subtotal -= cappedTradeIn;
  lineItems.push({ label: 'Trade-In Credit', value: cappedTradeIn, isCredit: true });
  if (opts.tradeInValue > cappedTradeIn) {
    lineItems.push({ label: 'Trade-in exceeds motor cost (capped)', value: 0 });
  }
}
```

### 2. `src/components/quote-builder/TradeInValuation.tsx` — Warning when trade-in exceeds motor

If the user's selected motor price is available and the trade-in estimate exceeds it, show a warning banner:

> "Your trade-in value exceeds the cost of your selected motor. The credit will be capped at the motor price — no cash refunds on trade-ins."

This prevents confusion before they reach the summary.

### 3. `supabase/functions/create-payment/index.ts` — Already safe-ish but add explicit cap

The Stripe payment flow should also cap `tradeInCredit` to never exceed the line items total, preventing a negative charge.

## Files changed
| File | Change |
|------|--------|
| `src/hooks/useQuoteRunningTotal.ts` | Cap trade-in at pre-trade subtotal |
| `src/components/quote-builder/TradeInValuation.tsx` | Warning banner when estimate > motor price |
| `supabase/functions/create-payment/index.ts` | Explicit cap on tradeInCredit |

