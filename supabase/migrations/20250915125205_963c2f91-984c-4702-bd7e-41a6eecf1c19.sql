-- Clean existing motor models with HTML tags
UPDATE motor_models 
SET model = REGEXP_REPLACE(
  REGEXP_REPLACE(
    REGEXP_REPLACE(model, '<[^>]*>', '', 'g'),
    '&[^;]+;', '', 'g'
  ),
  '\s+', ' ', 'g'
)
WHERE model LIKE '%<%' OR model LIKE '%&%';

-- Log the cleanup
SELECT 
  'Cleaned motor models' as action,
  COUNT(*) as affected_rows
FROM motor_models 
WHERE model LIKE '%<%' OR model LIKE '%&%';