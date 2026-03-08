
-- Activate the non-CT FourStroke 115 hero images (motor_id 3bbc5527)
UPDATE motor_media SET is_active = true 
WHERE motor_id = '3bbc5527-8c6c-4688-b87e-91c68278d952' 
AND is_active = false;

-- Create motor_media records for 115 ELPT FourStroke
INSERT INTO motor_media (motor_id, media_type, media_url, media_category, is_active, display_order, title)
VALUES 
  ('eee34e36-54e0-4563-b276-aa5c4f751798', 'image', 
   'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/dropbox-curated/3bbc5527-8c6c-4688-b87e-91c68278d952/115/1766191182616-115hp_4S_RP%203-4(1)-1579428360129.jpg',
   'hero', true, 0, '115hp FourStroke Hero'),
  ('eee34e36-54e0-4563-b276-aa5c4f751798', 'image',
   'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/dropbox-curated/3bbc5527-8c6c-4688-b87e-91c68278d952/115/1766191183495-115hp_4S_Rear(1)-1579428419978.jpg',
   'gallery', true, 1, '115hp FourStroke Rear');

-- Create motor_media records for 115 EXLPT FourStroke
INSERT INTO motor_media (motor_id, media_type, media_url, media_category, is_active, display_order, title)
VALUES 
  ('fc97c532-e0ae-4a5f-b5b9-e0b95471c483', 'image',
   'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/dropbox-curated/3bbc5527-8c6c-4688-b87e-91c68278d952/115/1766191182616-115hp_4S_RP%203-4(1)-1579428360129.jpg',
   'hero', true, 0, '115hp FourStroke Hero'),
  ('fc97c532-e0ae-4a5f-b5b9-e0b95471c483', 'image',
   'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/dropbox-curated/3bbc5527-8c6c-4688-b87e-91c68278d952/115/1766191183495-115hp_4S_Rear(1)-1579428419978.jpg',
   'gallery', true, 1, '115hp FourStroke Rear');

-- Set hero_media_id on both models
UPDATE motor_models 
SET hero_media_id = (
  SELECT id FROM motor_media 
  WHERE motor_id = 'eee34e36-54e0-4563-b276-aa5c4f751798' 
  AND media_category = 'hero' AND is_active = true 
  LIMIT 1
)
WHERE id = 'eee34e36-54e0-4563-b276-aa5c4f751798';

UPDATE motor_models 
SET hero_media_id = (
  SELECT id FROM motor_media 
  WHERE motor_id = 'fc97c532-e0ae-4a5f-b5b9-e0b95471c483' 
  AND media_category = 'hero' AND is_active = true 
  LIMIT 1
)
WHERE id = 'fc97c532-e0ae-4a5f-b5b9-e0b95471c483';
