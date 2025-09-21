-- Add validation to prevent auto-generated model numbers
-- Create a function to validate official Mercury model numbers
CREATE OR REPLACE FUNCTION validate_mercury_model_number(model_number text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN model_number IS NULL THEN false
    WHEN model_number ~ '^1[A-C][0-9A-Z]+[A-Z]K$' THEN true  -- Official Mercury format
    ELSE false
  END;
$$;

-- Add a check constraint to ensure only official model numbers
-- But first let's see if there are any non-conforming model numbers
SELECT COUNT(*) as non_conforming_count
FROM motor_models 
WHERE model_number IS NOT NULL 
  AND NOT validate_mercury_model_number(model_number);