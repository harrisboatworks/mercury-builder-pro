-- Generate proper display names for motors that don't have them
-- Using the pattern: {horsepower}{rigging_code} {family}
-- This matches the format of the official Mercury display names

-- Update motors without display names to have computed display names
UPDATE motor_models 
SET 
  model_display = format_motor_display_name(
    CONCAT(
      CASE 
        WHEN horsepower = TRUNC(horsepower) THEN TRUNC(horsepower)::text
        ELSE horsepower::text
      END,
      COALESCE(rigging_code, ''),
      ' ',
      COALESCE(family, 'FourStroke')
    )
  ),
  updated_at = now()
WHERE is_brochure = true
  AND (model_display IS NULL OR model_display = '')
  AND horsepower IS NOT NULL
  AND rigging_code IS NOT NULL
  AND family IS NOT NULL;

-- Log the results
DO $$
DECLARE
  updated_count integer;
  remaining_without_display integer;
  total_with_display integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  SELECT COUNT(*) INTO remaining_without_display
  FROM motor_models 
  WHERE is_brochure = true
    AND (model_display IS NULL OR model_display = '');
    
  SELECT COUNT(*) INTO total_with_display
  FROM motor_models 
  WHERE is_brochure = true
    AND model_display IS NOT NULL 
    AND model_display != '';
  
  RAISE NOTICE 'Generated display names for % motors', updated_count;
  RAISE NOTICE 'Remaining motors without display names: %', remaining_without_display;
  RAISE NOTICE 'Total motors with proper display names: %', total_with_display;
END $$;