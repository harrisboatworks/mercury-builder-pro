-- Re-activate the curated hero row for 115 EXLPT ProXS (1117F231D)
UPDATE motor_media
SET is_active = true, updated_at = now()
WHERE id = '6d6e577e-a835-4a08-9080-d9cb0abaeafd';

-- Promote it to motor_models for 115 EXLPT ProXS
UPDATE motor_models mm
SET hero_image_url = med.media_url,
    hero_media_id = med.id,
    media_last_updated = now()
FROM motor_media med
WHERE mm.model_number = '1117F231D'
  AND med.id = '6d6e577e-a835-4a08-9080-d9cb0abaeafd'
  AND med.motor_id = mm.id
  AND mm.hero_image_url IS NULL
  AND mm.image_url IS NULL;