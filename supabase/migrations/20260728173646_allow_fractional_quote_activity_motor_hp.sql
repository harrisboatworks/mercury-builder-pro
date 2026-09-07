-- Mercury portable outboards include fractional horsepower models (for example 2.5 HP).
-- Preserve those values in quote analytics instead of rejecting the activity event.
ALTER TABLE public.quote_activity_events
  ALTER COLUMN motor_hp TYPE NUMERIC
  USING motor_hp::NUMERIC;
