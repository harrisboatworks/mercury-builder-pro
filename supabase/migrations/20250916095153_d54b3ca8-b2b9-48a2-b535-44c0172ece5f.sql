-- Clean out bogus brochure rows with fake model numbers (one-time cleanup)
-- Delete rows where model_number is just text labels (all caps + hyphens, no digits)

-- Preview what will be deleted
WITH to_delete AS (
  SELECT id, model_number, model_key, mercury_model_no
  FROM motor_models
  WHERE is_brochure = true
    AND model_number ~ '^[A-Z-]+$'
  ORDER BY created_at DESC
)
SELECT 
  'Will delete ' || count(*) || ' bogus brochure rows' as summary,
  array_agg(model_number) as sample_model_numbers
FROM to_delete;

-- Delete the bogus rows
DELETE FROM motor_models
WHERE is_brochure = true
  AND model_number ~ '^[A-Z-]+$';