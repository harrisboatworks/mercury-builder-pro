-- Reduce all trade valuation bracket values by ~25-30% to match updated fallback values
-- excellent: * 0.75, good: * 0.70, fair: * 0.70, poor: * 0.70
UPDATE trade_valuation_brackets SET 
  excellent = ROUND(excellent * 0.75),
  good = ROUND(good * 0.70),
  fair = ROUND(fair * 0.70),
  poor = ROUND(poor * 0.70);