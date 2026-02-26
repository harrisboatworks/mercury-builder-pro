
-- Auto-set hero_media_id for motors that have motor_media records but no hero linked
UPDATE motor_models mm
SET hero_media_id = sub.first_media_id,
    updated_at = now()
FROM (
  SELECT DISTINCT ON (motor_id) motor_id, id AS first_media_id
  FROM motor_media
  WHERE is_active = true
    AND media_type = 'image'
  ORDER BY motor_id, display_order ASC, created_at ASC
) sub
WHERE mm.id = sub.motor_id
  AND mm.hero_media_id IS NULL;
