-- Fix mercury model number extraction for brochure motors
-- The previous extraction didn't work, so we need to improve the regex pattern

-- Update mercury_model_no by extracting HP + rigging code from model field
UPDATE motor_models 
SET 
  mercury_model_no = (
    SELECT substring(
      upper(trim(model)) FROM 
      '^(\d+(?:\.\d+)?(?:MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO))'
    )
  ),
  updated_at = now()
WHERE is_brochure = true;

-- Set model_number based on extracted mercury_model_no
UPDATE motor_models 
SET 
  model_number = mercury_model_no,
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NOT NULL;

-- Set stock_number to be the same as mercury_model_no for inventory tracking
UPDATE motor_models 
SET 
  stock_number = mercury_model_no,
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NOT NULL;