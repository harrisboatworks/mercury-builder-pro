-- Populate missing mercury_model_no, model_number, and stock_number for brochure motors
-- Extract mercury model numbers from existing model names and populate related fields

-- Function to extract mercury model number from model name
CREATE OR REPLACE FUNCTION extract_mercury_model_no(model_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF model_name IS NULL OR trim(model_name) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Extract patterns like: 2.5MH, 8ELH, 15ELHPT, 25ELHPT, 40EXLPT, 90ELPT, etc.
  -- This regex captures HP + rigging code combinations
  RETURN (
    SELECT substring(
      upper(trim(model_name)) FROM 
      '(\d+(?:\.\d+)?(?:MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO))\b'
    )
  );
END;
$$;

-- Update all brochure motors with extracted mercury model numbers and related fields
UPDATE motor_models 
SET 
  mercury_model_no = extract_mercury_model_no(model),
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NULL;

-- Set model_number based on mercury_model_no (use mercury_model_no as the model number for brochure items)
UPDATE motor_models 
SET 
  model_number = mercury_model_no,
  updated_at = now()
WHERE is_brochure = true 
  AND model_number IS NULL 
  AND mercury_model_no IS NOT NULL;

-- Set stock_number to be the same as mercury_model_no for brochure items (for inventory tracking)
UPDATE motor_models 
SET 
  stock_number = mercury_model_no,
  updated_at = now()
WHERE is_brochure = true 
  AND stock_number IS NULL 
  AND mercury_model_no IS NOT NULL;

-- Clean up the temporary function (we don't need to keep it in the database)
DROP FUNCTION IF EXISTS extract_mercury_model_no(text);