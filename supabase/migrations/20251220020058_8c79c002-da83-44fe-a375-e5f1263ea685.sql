-- Fix motors with detail shot hero images (tiller handles, close-ups)
-- Replace with proper full motor images from same-HP siblings

-- Fix 15 MLH FourStroke (id: 43629888-7c4a-4a86-8f31-055575c7e8b6)
-- Using image from 15 MH FourStroke which has a proper full motor shot
UPDATE motor_models 
SET 
  hero_image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/54c38ffc-923e-4a88-b0ad-3338f8d0eeab/0.png',
  image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/54c38ffc-923e-4a88-b0ad-3338f8d0eeab/0.png',
  updated_at = now()
WHERE id = '43629888-7c4a-4a86-8f31-055575c7e8b6';

-- Fix 9.9ELPT Command Thrust ProKicker with tiller handle image (id: 8418d65a-61f3-4fb5-b041-a33e0f19b286)
-- Using image from 9.9ELH Command Thrust FourStroke
UPDATE motor_models 
SET 
  hero_image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/f90f27aa-ebfa-4aca-b283-0540fcd8a89d/0.jpg',
  image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/f90f27aa-ebfa-4aca-b283-0540fcd8a89d/0.jpg',
  updated_at = now()
WHERE id = '8418d65a-61f3-4fb5-b041-a33e0f19b286';

-- Fix 6MH FourStroke with tiller image (id: daf945bb-4f71-44a9-aee4-00a3010ed255)
-- Using image from 6MLH FourStroke
UPDATE motor_models 
SET 
  hero_image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/dd43b19f-a541-4b77-a882-140048fcb034/0.jpg',
  image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/dd43b19f-a541-4b77-a882-140048fcb034/0.jpg',
  updated_at = now()
WHERE id = 'daf945bb-4f71-44a9-aee4-00a3010ed255';

-- Fix 20E FourStroke with tiller image (id: 2e4f7dd9-30f4-49d6-9f63-ba41387f03c7)
-- Using image from 20 MLH FourStroke (clean full motor shot)
UPDATE motor_models 
SET 
  hero_image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/c365e813-4d47-4e92-9348-8ad65ff1a733/0.jpg',
  image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/c365e813-4d47-4e92-9348-8ad65ff1a733/0.jpg',
  updated_at = now()
WHERE id = '2e4f7dd9-30f4-49d6-9f63-ba41387f03c7';

-- Fix 25 EH and 25 ELHPT FourStroke with tiller images
-- Using image from a 25HP motor without tiller in URL
UPDATE motor_models 
SET 
  hero_image_url = (
    SELECT hero_image_url 
    FROM motor_models sibling 
    WHERE sibling.horsepower = 25 
    AND sibling.hero_image_url IS NOT NULL 
    AND sibling.hero_image_url NOT ILIKE '%tiller%'
    AND sibling.hero_image_url NOT ILIKE '%handle%'
    AND sibling.id NOT IN ('5edad4fe-594a-42c7-b9f6-023613a50889', '71d56079-1b47-44e9-8447-969ec6ef416b')
    LIMIT 1
  ),
  updated_at = now()
WHERE id IN ('5edad4fe-594a-42c7-b9f6-023613a50889', '71d56079-1b47-44e9-8447-969ec6ef416b');