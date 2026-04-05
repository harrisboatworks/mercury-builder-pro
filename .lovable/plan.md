

# Enforce Promo Expiry in Agent Quote API

## What's changing
The agent API currently applies expired promotions (rebates, bonus warranty years) because it only checks `is_active = true` without verifying `end_date`. Adding a single date filter to two queries fixes this.

## Changes in `supabase/functions/agent-quote-api/index.ts`

### 1. `listPromotions()` — line 482
Add `.or('end_date.is.null,end_date.gte.' + new Date().toISOString())` after the `.eq("is_active", true)` line.

### 2. `createQuote()` — line 828
Same date filter added after `.eq("is_active", true)`.

### 3. Add "no promo" warning — after line 832
When `activePromo` is null after the filtered query, push a warning:
```
if (!activePromo) {
  promoWarnings.push("No active promotions currently available. Standard 3-year warranty applies.");
}
```

### Why `updateQuote()` doesn't need changes
It reuses the stored `quoteData.rebateAmount` and `quoteData.warrantyConfig` from the original quote — it doesn't re-fetch promotions. Existing quotes keep their original promo terms, which is correct behavior.

### What happens automatically
- `promoWarrantyYears` becomes 0 when no promo is found → warranty reverts to 3 years
- Rebate stays $0 → no discount applied
- When a new promo is added with `is_active = true` and a future `end_date`, everything reactivates with zero code changes

## File changed
| File | Change |
|------|--------|
| `supabase/functions/agent-quote-api/index.ts` | Add `end_date` filter to `listPromotions()` and `createQuote()` queries; add "no promo" warning |

