

# Fix: Revert Bad sale_price Data on 19 Motors

## What happened
The migration I ran (`20260413102733`) set `sale_price = dealer_price` on 19 motors where `dealer_price >= msrp`. For the motors where `dealer_price == msrp` (all 19 of them), this means `sale_price` now equals `msrp`, which:

1. **Prevents future discounts from working** — the frontend picks up `sale_price` first (line 476), so even if `dealer_price` later drops below `msrp`, the stale `sale_price = msrp` would be used instead
2. **Is incorrect data** — `sale_price` should represent an intentional retail sale price, not a copy of `dealer_price` when there's no actual discount

## What the site looked like before
These 19 motors (9.9hp through 250hp where dealer_price == msrp) showed **no struck-through MSRP** before the migration too — they genuinely have no markup discount. The 40 ELPT at $10,830 never showed a crossed-out price. So the visual display hasn't changed, but the data is now dirty.

## The fix

### 1. Database migration — revert sale_price to NULL
```sql
UPDATE motor_models
SET sale_price = NULL, updated_at = now()
WHERE sale_price IS NOT NULL
  AND dealer_price IS NOT NULL
  AND msrp IS NOT NULL
  AND sale_price = dealer_price
  AND dealer_price >= msrp;
```
This reverses exactly what the previous migration did — sets `sale_price` back to NULL on those 19 motors.

### 2. No code changes needed
The frontend and agent API pricing hierarchies are already correct. The problem was purely a data issue from the migration.

## Result
- Motors where `dealer_price < msrp` (like the 50 ELPT) continue showing the discount correctly
- Motors where `dealer_price == msrp` (like the 40 ELPT) show no discount — which is correct, there is no discount to show
- `sale_price` is clean and available for future admin-set promotions

| Change | Detail |
|--------|--------|
| Migration | Revert `sale_price` to NULL on 19 motors where it was incorrectly set to `dealer_price = msrp` |

