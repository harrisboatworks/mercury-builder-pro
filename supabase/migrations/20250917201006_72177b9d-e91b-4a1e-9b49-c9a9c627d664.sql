-- Fix motor display names: Remove unnecessary decimals and add proper spacing

-- Create a function to format horsepower properly (remove .0 for whole numbers)
CREATE OR REPLACE FUNCTION format_horsepower(hp numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN hp = trunc(hp) THEN trunc(hp)::text
    ELSE hp::text
  END;
$$;

-- Fix the model field to use proper HP formatting (without unnecessary .0)
-- Fix 2.5-6 HP motors to use MH
UPDATE motor_models 
SET model = CONCAT(format_horsepower(horsepower), 'MH FourStroke'),
    model_display = CONCAT(format_horsepower(horsepower), ' MH FourStroke')
WHERE is_brochure = true 
  AND horsepower BETWEEN 2.5 AND 6.0
  AND (model LIKE '%FourStroke' OR model LIKE '%MH FourStroke');

-- Fix 8-9.9 HP motors to use ELH
UPDATE motor_models 
SET model = CONCAT(format_horsepower(horsepower), 'ELH FourStroke'),
    model_display = CONCAT(format_horsepower(horsepower), ' ELH FourStroke')
WHERE is_brochure = true 
  AND horsepower BETWEEN 8.0 AND 9.9
  AND (model LIKE '%FourStroke' OR model LIKE '%ELH FourStroke');

-- Fix 15-25 HP motors to use ELHPT
UPDATE motor_models 
SET model = CONCAT(format_horsepower(horsepower), 'ELHPT FourStroke'),
    model_display = CONCAT(format_horsepower(horsepower), ' ELHPT FourStroke')
WHERE is_brochure = true 
  AND horsepower BETWEEN 15.0 AND 25.0
  AND (model LIKE '%FourStroke' OR model LIKE '%ELHPT FourStroke');

-- Fix 30-50 HP motors to use ELPT
UPDATE motor_models 
SET model = CONCAT(format_horsepower(horsepower), 'ELPT FourStroke'),
    model_display = CONCAT(format_horsepower(horsepower), ' ELPT FourStroke')
WHERE is_brochure = true 
  AND horsepower BETWEEN 30.0 AND 50.0
  AND (model LIKE '%FourStroke' OR model LIKE '%ELPT FourStroke');

-- Fix 60+ HP motors to use EXLPT
UPDATE motor_models 
SET model = CONCAT(format_horsepower(horsepower), 'EXLPT FourStroke'),
    model_display = CONCAT(format_horsepower(horsepower), ' EXLPT FourStroke')
WHERE is_brochure = true 
  AND horsepower >= 60.0
  AND (model LIKE '%FourStroke' OR model LIKE '%EXLPT FourStroke');

-- Fix ProXS motors
UPDATE motor_models 
SET model = CONCAT(format_horsepower(horsepower), 'EXLPT ProXS'),
    model_display = CONCAT(format_horsepower(horsepower), ' EXLPT ProXS')
WHERE is_brochure = true 
  AND horsepower >= 115.0
  AND (model LIKE '%ProXS' OR model LIKE '%EXLPT ProXS');

-- Fix Verado motors
UPDATE motor_models 
SET model = CONCAT(format_horsepower(horsepower), 'XXL Verado'),
    model_display = CONCAT(format_horsepower(horsepower), ' XXL Verado')
WHERE is_brochure = true 
  AND horsepower >= 200.0
  AND (model LIKE '%Verado' OR model LIKE '%XXL Verado');

-- Fix SeaPro motors
UPDATE motor_models 
SET model = CONCAT(format_horsepower(horsepower), 'EXLPT SeaPro'),
    model_display = CONCAT(format_horsepower(horsepower), ' EXLPT SeaPro')
WHERE is_brochure = true 
  AND (model LIKE '%SeaPro' OR model LIKE '%EXLPT SeaPro');