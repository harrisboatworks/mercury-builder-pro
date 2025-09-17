-- Handle duplicate motors by creating unique stock numbers and model numbers
-- First extract mercury_model_no, then create unique identifiers

-- Extract mercury_model_no from model field (this should work this time with simpler approach)
UPDATE motor_models 
SET 
  mercury_model_no = CASE
    WHEN model ~ '\d+(\.\d+)?MH' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?MH)')
    WHEN model ~ '\d+(\.\d+)?MLH' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?MLH)')
    WHEN model ~ '\d+(\.\d+)?ELH' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?ELH)')
    WHEN model ~ '\d+(\.\d+)?ELPT' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?ELPT)')
    WHEN model ~ '\d+(\.\d+)?ELHPT' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?ELHPT)')
    WHEN model ~ '\d+(\.\d+)?EXLPT' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?EXLPT)')
    WHEN model ~ '\d+(\.\d+)?EH' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?EH)')
    WHEN model ~ '\d+(\.\d+)?XL' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?XL)')
    WHEN model ~ '\d+(\.\d+)?XXL' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?XXL)')
    WHEN model ~ '\d+(\.\d+)?CT' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?CT)')
    WHEN model ~ '\d+(\.\d+)?DTS' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?DTS)')
    WHEN model ~ '\d+(\.\d+)?L' THEN substring(upper(model) FROM '(\d+(?:\.\d+)?L)')
    ELSE NULL
  END,
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NULL
  AND model IS NOT NULL;

-- Create unique model_number using mercury_model_no + sequential number for duplicates
-- Use row_number to create unique identifiers
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
    WHEN nm.rn = 1 THEN nm.mercury_model_no
    ELSE nm.mercury_model_no || '-' || nm.rn
  END,
  updated_at = now()
FROM numbered_motors nm
WHERE motor_models.id = nm.id;

-- Create unique stock_number using the same pattern as model_number
UPDATE motor_models 
SET 
  stock_number = model_number,
  updated_at = now()
WHERE is_brochure = true 
  AND stock_number IS NULL
  AND model_number IS NOT NULL;