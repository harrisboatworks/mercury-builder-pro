-- Fix mercury model number extraction with unique model numbers for brochure motors
-- Handle duplicates by using row_number to make model_number unique

-- First, extract mercury_model_no from the model field
UPDATE motor_models 
SET 
  mercury_model_no = (
    SELECT substring(
      upper(trim(model)) FROM 
      '^(\d+(?:\.\d+)?(?:MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO))'
    )
  ),
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NULL;

-- Create unique model numbers by appending sequence for duplicates
WITH numbered_motors AS (
  SELECT 
    id,
    mercury_model_no,
    ROW_NUMBER() OVER (PARTITION BY mercury_model_no ORDER BY id) as rn
  FROM motor_models 
  WHERE is_brochure = true 
    AND mercury_model_no IS NOT NULL
    AND model_number IS NULL
)
UPDATE motor_models 
SET 
  model_number = CASE 
    WHEN numbered_motors.rn = 1 THEN numbered_motors.mercury_model_no
    ELSE numbered_motors.mercury_model_no || '-' || numbered_motors.rn::text
  END,
  updated_at = now()
FROM numbered_motors
WHERE motor_models.id = numbered_motors.id;

-- Set stock_number to be the mercury_model_no (without sequence suffix) for inventory tracking
UPDATE motor_models 
SET 
  stock_number = mercury_model_no,
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NOT NULL
  AND stock_number IS NULL;