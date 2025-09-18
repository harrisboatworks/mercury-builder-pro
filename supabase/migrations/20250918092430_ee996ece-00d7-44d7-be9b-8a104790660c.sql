-- Clean up invalid legacy motors with 1300xxxx model numbers
-- These motors all have incorrect data (2.5MH display but 300HP, wrong pricing)
-- and are corrupting the motor selection display

-- First, let's verify what we're deleting (for logging)
DO $$
DECLARE
  motor_count integer;
BEGIN
  SELECT COUNT(*) INTO motor_count
  FROM motor_models 
  WHERE model_number LIKE '1300%'
    AND model_display = '2.5MH FourStroke'
    AND horsepower = 300.0;
  
  RAISE NOTICE 'Found % invalid legacy motors to delete', motor_count;
END $$;

-- Delete the invalid legacy motors
DELETE FROM motor_models 
WHERE model_number LIKE '1300%'
  AND model_display = '2.5MH FourStroke'
  AND horsepower = 300.0
  AND dealer_price > 30000; -- Extra safety check for high pricing

-- Verify the official Mercury motors are correct
DO $$
DECLARE
  official_count integer;
  display_variety integer;
BEGIN
  SELECT COUNT(*) INTO official_count
  FROM motor_models 
  WHERE model_number LIKE '1F%' OR model_number LIKE '1A%' OR model_number LIKE '1B%';
  
  SELECT COUNT(DISTINCT model_display) INTO display_variety
  FROM motor_models 
  WHERE model_number LIKE '1F%' OR model_number LIKE '1A%' OR model_number LIKE '1B%'
    AND model_display IS NOT NULL
    AND model_display != '';
  
  RAISE NOTICE 'Official Mercury motors remaining: %', official_count;
  RAISE NOTICE 'Unique display names in catalog: %', display_variety;
END $$;