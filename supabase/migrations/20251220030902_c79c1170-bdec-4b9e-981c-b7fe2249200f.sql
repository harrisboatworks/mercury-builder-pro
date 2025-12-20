-- Step 1: Clear hero_image_url for motors pointing to dropbox-curated (corrupt blank images)
UPDATE motor_models
SET hero_image_url = NULL, updated_at = now()
WHERE hero_image_url LIKE '%dropbox-curated%';

-- Step 2: Deactivate all motor_media entries pointing to dropbox-curated
UPDATE motor_media
SET is_active = false, updated_at = now()
WHERE media_url LIKE '%dropbox-curated%';

-- Step 3: Also clear the broken /mercury/.../0.xxx pattern images
UPDATE motor_models
SET hero_image_url = NULL, updated_at = now()
WHERE hero_image_url LIKE '%/mercury/%' 
  AND hero_image_url LIKE '%/0.%';