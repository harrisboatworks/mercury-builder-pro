-- Clear broken hero_image_url values that point to corrupt /mercury/{id}/0.jpg files
-- These never load and cause broken image display instead of placeholder

UPDATE motor_models
SET 
  hero_image_url = NULL,
  updated_at = now()
WHERE hero_image_url LIKE '%/mercury/%/0.%';