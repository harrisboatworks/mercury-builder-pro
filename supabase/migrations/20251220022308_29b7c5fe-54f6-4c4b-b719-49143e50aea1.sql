
-- Update hero_image_url for brochure motors that have valid images in motor_media
-- but currently have broken /mercury/{id}/0.jpg URLs
UPDATE motor_models mm
SET 
  hero_image_url = (
    SELECT media_url 
    FROM motor_media 
    WHERE motor_id = mm.id 
      AND is_active = true 
      AND media_type = 'image'
      AND media_url NOT LIKE '%/mercury/%/0.jpg'
    ORDER BY 
      CASE 
        WHEN media_url LIKE '%uploads/%' THEN 1
        WHEN media_url LIKE '%dropbox-curated/%' THEN 2
        ELSE 3
      END,
      display_order
    LIMIT 1
  ),
  updated_at = now()
WHERE is_brochure = true
  AND hero_image_url LIKE '%/mercury/%/0.jpg'
  AND EXISTS (
    SELECT 1 FROM motor_media 
    WHERE motor_id = mm.id 
      AND is_active = true 
      AND media_type = 'image'
      AND media_url NOT LIKE '%/mercury/%/0.jpg'
  );
