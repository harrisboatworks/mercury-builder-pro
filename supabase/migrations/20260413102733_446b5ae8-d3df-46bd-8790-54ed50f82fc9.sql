
-- Fix motors where sale_price is null and base_price is dealer cost (>15% below MSRP)
-- and dealer_price >= msrp, causing the pricing hierarchy to fall through to cost
UPDATE motor_models
SET sale_price = dealer_price,
    updated_at = now()
WHERE sale_price IS NULL
  AND dealer_price IS NOT NULL
  AND msrp IS NOT NULL
  AND dealer_price >= msrp
  AND base_price IS NOT NULL
  AND base_price < msrp * 0.85;
