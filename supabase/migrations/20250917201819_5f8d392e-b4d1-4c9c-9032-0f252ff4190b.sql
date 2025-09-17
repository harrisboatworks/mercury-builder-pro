-- Fix mercury model number extraction - the previous regex didn't work correctly
-- Let's use a simpler, more direct approach

-- Update mercury_model_no by extracting from model field using a corrected pattern
UPDATE motor_models 
SET 
  mercury_model_no = (
    SELECT substring(
      upper(trim(model)) FROM 
      '(\d+(?:\.\d+)?MH|\d+(?:\.\d+)?MLH|\d+(?:\.\d+)?ELH|\d+(?:\.\d+)?ELPT|\d+(?:\.\d+)?ELHPT|\d+(?:\.\d+)?EXLPT|\d+(?:\.\d+)?EH|\d+(?:\.\d+)?XL|\d+(?:\.\d+)?XXL|\d+(?:\.\d+)?CT|\d+(?:\.\d+)?DTS|\d+(?:\.\d+)?L|\d+(?:\.\d+)?CL|\d+(?:\.\d+)?M|\d+(?:\.\d+)?JPO)'
    )
  ),
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NULL
  AND model IS NOT NULL;

-- Set model_number and stock_number based on the extracted mercury_model_no
UPDATE motor_models 
SET 
  model_number = mercury_model_no,
  stock_number = mercury_model_no,
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NOT NULL
  AND (model_number IS NULL OR stock_number IS NULL);