-- Fix 225 L ProXS missing image by copying from sibling 225 XL ProXS
UPDATE motor_models 
SET 
  hero_image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/4a768800-5e84-448c-b166-eb1230377717/0.jpg',
  image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/4a768800-5e84-448c-b166-eb1230377717/0.jpg',
  updated_at = now()
WHERE id = '37f35f6f-d8fe-4ab1-9df2-b5ac5f81fe09';

-- Also fix other ProXS motors that are missing images by copying from same-HP siblings
UPDATE motor_models m
SET 
  hero_image_url = (
    SELECT hero_image_url 
    FROM motor_models sibling 
    WHERE sibling.family = m.family 
    AND sibling.horsepower = m.horsepower 
    AND sibling.hero_image_url IS NOT NULL 
    LIMIT 1
  ),
  updated_at = now()
WHERE m.hero_image_url IS NULL 
AND m.family IS NOT NULL
AND EXISTS (
  SELECT 1 FROM motor_models sibling 
  WHERE sibling.family = m.family 
  AND sibling.horsepower = m.horsepower 
  AND sibling.hero_image_url IS NOT NULL
);