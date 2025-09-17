-- Update brochure motors to include proper rigging codes in model names
-- This will change "25 FourStroke" to "25ELH FourStroke" etc.

-- Update 2.5-6 HP motors to use MH (Manual start, tiller Handle)
UPDATE motor_models 
SET model = CONCAT(horsepower::text, 'MH FourStroke')
WHERE is_brochure = true 
  AND horsepower BETWEEN 2.5 AND 6.0
  AND model LIKE '% FourStroke'
  AND model NOT LIKE '%MH %';

-- Update 8-9.9 HP motors to use ELH (Electric start, Long shaft, tiller Handle)  
UPDATE motor_models 
SET model = CONCAT(horsepower::text, 'ELH FourStroke')
WHERE is_brochure = true 
  AND horsepower BETWEEN 8.0 AND 9.9
  AND model LIKE '% FourStroke'
  AND model NOT LIKE '%ELH %';

-- Update 15-25 HP motors to use ELHPT (Electric start, Long shaft, tiller Handle, Power Trim)
UPDATE motor_models 
SET model = CONCAT(horsepower::text, 'ELHPT FourStroke')
WHERE is_brochure = true 
  AND horsepower BETWEEN 15.0 AND 25.0
  AND model LIKE '% FourStroke'
  AND model NOT LIKE '%ELHPT %';

-- Update 30-50 HP motors to use ELPT (Electric start, Long shaft, Power Trim)
UPDATE motor_models 
SET model = CONCAT(horsepower::text, 'ELPT FourStroke')
WHERE is_brochure = true 
  AND horsepower BETWEEN 30.0 AND 50.0
  AND model LIKE '% FourStroke'
  AND model NOT LIKE '%ELPT %';

-- Update 60+ HP motors to use EXLPT (Electric start, eXtra Long shaft, Power Trim)
UPDATE motor_models 
SET model = CONCAT(horsepower::text, 'EXLPT FourStroke')
WHERE is_brochure = true 
  AND horsepower >= 60.0
  AND model LIKE '% FourStroke'
  AND model NOT LIKE '%EXLPT %';

-- Handle ProXS motors (high performance)
UPDATE motor_models 
SET model = CONCAT(horsepower::text, 'EXLPT ProXS')
WHERE is_brochure = true 
  AND horsepower >= 115.0
  AND model LIKE '% ProXS'
  AND model NOT LIKE '%EXLPT %';

-- Handle Verado motors (supercharged)
UPDATE motor_models 
SET model = CONCAT(horsepower::text, 'XXL Verado')
WHERE is_brochure = true 
  AND horsepower >= 200.0
  AND model LIKE '% Verado'
  AND model NOT LIKE '%XXL %';

-- Handle SeaPro motors (commercial grade)
UPDATE motor_models 
SET model = CONCAT(horsepower::text, 'EXLPT SeaPro')
WHERE is_brochure = true 
  AND model LIKE '% SeaPro'
  AND model NOT LIKE '%EXLPT %';