-- Clean up incorrectly scraped images from motor_models
-- Reset images to empty array for all motors that have alberni_scraped images
UPDATE motor_models
SET 
  images = '[]'::jsonb,
  image_url = NULL,
  hero_image_url = NULL,
  updated_at = now()
WHERE images::text LIKE '%alberni_scraped%' 
   OR images::text LIKE '%motor-images/mercury%';