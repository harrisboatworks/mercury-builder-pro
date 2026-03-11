INSERT INTO trade_valuation_config (key, value, description) VALUES
('HP_CLASS_FLOORS', '{"under_25": 200, "25_75": 1000, "90_150": 1500, "200_plus": 2500}', 'Minimum trade values by HP class'),
('TWO_STROKE_PENALTY', '{"factor": 0.825}', '17.5% haircut for 2-stroke/OptiMax engines'),
('HOURS_ADJUSTMENT', '{"low_max_hours": 100, "low_bonus": 0.075, "high_min_hours": 500, "high_penalty_moderate": 0.10, "high_threshold": 1000, "high_penalty_severe": 0.175}', 'Hours-based value adjustments')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;