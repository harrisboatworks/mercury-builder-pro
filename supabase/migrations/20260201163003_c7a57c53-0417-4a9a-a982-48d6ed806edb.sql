-- Update SmartCraft Connect Mobile with scraped image
UPDATE motor_options 
SET image_url = 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/accessories/smartcraft-connect-mobile.png'
WHERE part_number = '8M0173128';

-- Update Motor Covers with better placeholder images (boat covers)
UPDATE motor_options 
SET image_url = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
WHERE part_number IN ('ATT-10541', 'MRC-VS-75115', 'MRC-VS-150', 'MRC-VS-V6', 'MRC-VS-V8');

-- Update Maintenance Kits with tools/service image
UPDATE motor_options 
SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
WHERE category = 'maintenance' AND image_url IS NULL;