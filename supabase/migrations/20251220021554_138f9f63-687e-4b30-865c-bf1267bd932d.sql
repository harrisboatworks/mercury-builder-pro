-- Fix the 150 L FourStroke hero_image_url (copy from sibling 150 XL FourStroke)
UPDATE motor_models 
SET 
  hero_image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/e76006ac-288b-42ef-89a3-8c31773a78ab/0.jpg',
  updated_at = now()
WHERE id = 'c11dc4c8-2da8-43fb-b201-f708e8fcb7b8';

-- Re-categorize the displacement chart as 'gallery' instead of hero (valid category per constraint)
UPDATE motor_media
SET media_category = 'gallery'
WHERE motor_id = 'c11dc4c8-2da8-43fb-b201-f708e8fcb7b8'
  AND (original_filename ILIKE '%displacement%' OR media_url ILIKE '%displacement%');