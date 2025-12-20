-- Clear corrupt image_url values with the /mercury/.../0.xxx pattern
-- This allows motors to show placeholder instead of blank white images
UPDATE motor_models
SET image_url = NULL, updated_at = now()
WHERE image_url LIKE '%/mercury/%' 
  AND image_url LIKE '%/0.%';