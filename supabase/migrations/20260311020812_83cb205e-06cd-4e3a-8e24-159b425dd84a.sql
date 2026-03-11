-- Insert MSRP_TRADE_PERCENTAGES config row
INSERT INTO trade_valuation_config (key, value, description)
VALUES (
  'MSRP_TRADE_PERCENTAGES',
  '{"1-3": {"excellent": 0.55, "good": 0.50, "fair": 0.40, "poor": 0.25}, "4-7": {"excellent": 0.44, "good": 0.40, "fair": 0.32, "poor": 0.20}, "8-12": {"excellent": 0.29, "good": 0.26, "fair": 0.21, "poor": 0.13}, "13-17": {"excellent": 0.19, "good": 0.17, "fair": 0.14, "poor": 0.09}, "18-20": {"excellent": 0.13, "good": 0.12, "fair": 0.10, "poor": 0.06}}'::jsonb,
  'MSRP-based trade-in percentages by age bracket and condition. Mercury motors use these percentages of current MSRP instead of fixed bracket values. Age brackets are motor age in years.'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;