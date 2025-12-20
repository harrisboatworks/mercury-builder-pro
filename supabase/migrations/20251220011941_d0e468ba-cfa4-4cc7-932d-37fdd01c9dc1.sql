-- Drop the existing check constraint
ALTER TABLE motor_media DROP CONSTRAINT motor_media_media_category_check;

-- Add the updated check constraint with new categories
ALTER TABLE motor_media ADD CONSTRAINT motor_media_media_category_check 
CHECK (media_category = ANY (ARRAY[
  'hero'::text, 
  'gallery'::text, 
  'specs'::text, 
  'specifications'::text,
  'manual'::text, 
  'brochure'::text, 
  'video'::text, 
  'general'::text,
  'warranty'::text,
  'installation'::text,
  'parts'::text,
  'service'::text,
  'sell-sheet'::text
]));

-- Now re-categorize PDFs based on filename keywords
UPDATE motor_media
SET 
  media_category = CASE
    WHEN LOWER(original_filename) LIKE '%manual%' OR LOWER(original_filename) LIKE '%guide%' THEN 'manual'
    WHEN LOWER(original_filename) LIKE '%brochure%' THEN 'brochure'
    WHEN LOWER(original_filename) LIKE '%spec%' THEN 'specifications'
    WHEN LOWER(original_filename) LIKE '%warranty%' THEN 'warranty'
    WHEN LOWER(original_filename) LIKE '%install%' THEN 'installation'
    WHEN LOWER(original_filename) LIKE '%part%' THEN 'parts'
    WHEN LOWER(original_filename) LIKE '%service%' OR LOWER(original_filename) LIKE '%maintenance%' THEN 'service'
    WHEN LOWER(original_filename) LIKE '%sell%' OR LOWER(original_filename) LIKE '%sales%' THEN 'sell-sheet'
    ELSE media_category
  END,
  updated_at = now()
WHERE 
  media_type = 'pdf' 
  AND is_active = true
  AND original_filename IS NOT NULL;