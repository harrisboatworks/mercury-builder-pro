UPDATE motor_models 
SET 
  year = 2025,
  make = 'Mercury',
  motor_type = CASE 
    WHEN model ILIKE '%verado%' THEN 'Verado'
    WHEN model ILIKE '%fourstroke%' THEN 'FourStroke'
    WHEN model ILIKE '%pro xs%' THEN 'ProXS'
    ELSE 'Outboard'
  END
WHERE (year IS NULL OR year = 0) 
  OR (make IS NULL OR make = '');