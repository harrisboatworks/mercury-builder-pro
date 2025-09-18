-- Final cleanup: Fix all remaining motors with incorrect "2.5MH FourStroke" display
-- that are not actually 2.5 HP motors

-- Generate proper display names for motors with incorrect "2.5MH FourStroke" but not 2.5 HP
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
  AND model_display = '2.5MH FourStroke'
  AND horsepower != 2.5
  AND horsepower IS NOT NULL
  AND rigging_code IS NOT NULL
  AND family IS NOT NULL;

-- For motors without complete rigging data, just clear the incorrect display name
UPDATE motor_models 
SET 
  model_display = NULL,
  updated_at = now()
WHERE is_brochure = true
  AND model_display = '2.5MH FourStroke'
  AND horsepower != 2.5;

-- Final verification
DO $$
DECLARE
  fixed_count integer;
  remaining_incorrect integer;
  unique_displays integer;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  SELECT COUNT(*) INTO remaining_incorrect
  FROM motor_models 
  WHERE is_brochure = true
    AND model_display = '2.5MH FourStroke'
    AND horsepower != 2.5;
    
  SELECT COUNT(DISTINCT model_display) INTO unique_displays
  FROM motor_models 
  WHERE is_brochure = true
    AND model_display IS NOT NULL 
    AND model_display != '';
  
  RAISE NOTICE 'Fixed % additional motors with incorrect display names', fixed_count;
  RAISE NOTICE 'Remaining motors with incorrect "2.5MH FourStroke": %', remaining_incorrect;
  RAISE NOTICE 'Total unique display names available: %', unique_displays;
END $$;