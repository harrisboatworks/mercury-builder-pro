UPDATE motor_models
SET sale_price = NULL, updated_at = now()
WHERE sale_price IS NOT NULL
  AND dealer_price IS NOT NULL
  AND msrp IS NOT NULL
  AND sale_price = dealer_price
  AND dealer_price >= msrp;