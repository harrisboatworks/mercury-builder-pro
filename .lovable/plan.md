

# Fix: Agent-Created Quotes Not Loading via Share URL

## Problem
The `agent-quote-api` creates `quote_data` with flat fields (`motorId`, `motorModel`, `motorHp`, `motorPrice`), but `SavedQuotePage.tsx` expects a nested `motor` object at `quoteData.motor` or `quoteData.selectedMotor`. Since neither key exists, no motor is restored into context, and the summary page shows nothing.

## Solution
Two changes needed — one in the API (to produce the right shape) and one in the loader (as a safety fallback).

### 1. Update `agent-quote-api/index.ts` — embed a `motor` object in `quote_data`

In the `createQuote` function, after looking up the motor from the database, add a properly shaped `motor` object into `quoteData`:

```js
quoteData.motor = {
  id: motor.id,
  model: motor.model_display || motor.model,
  hp: motor.horsepower,
  price: motorPrice,
  msrp: motor.msrp,
  salePrice: motor.sale_price || motor.base_price,
  modelKey: motor.model_key,
  motorType: motor.motor_type,
  year: motor.year,
  inStock: motor.in_stock,
};
```

Also set `quoteData.purchasePath = 'loose'` as a sensible default so the summary page knows how to render.

### 2. Update `SavedQuotePage.tsx` — add fallback motor reconstruction

If `quoteData.motor` is still missing (for quotes already created), reconstruct a minimal motor object from the flat fields:

```js
if (!motorData && quoteData.motorId) {
  motorData = {
    id: quoteData.motorId,
    model: quoteData.motorModel,
    hp: quoteData.motorHp,
    price: quoteData.motorPrice,
    msrp: quoteData.motorMsrp,
  };
}
```

This ensures both new and existing agent-created quotes load correctly.

### Files Changed
- `supabase/functions/agent-quote-api/index.ts` — add `motor` object + `purchasePath` to quote_data in `createQuote`
- `src/pages/quote/SavedQuotePage.tsx` — add fallback motor reconstruction from flat fields

