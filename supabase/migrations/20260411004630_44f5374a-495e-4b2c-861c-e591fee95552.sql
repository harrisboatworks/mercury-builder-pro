UPDATE promotions 
SET start_date = '2026-04-11', end_date = '2026-12-31'
WHERE id = '75980f2c-4a06-451f-9d6a-c680a9baca31';

-- Also deactivate the old Mercury Get 7 promo since it's replaced
UPDATE promotions 
SET is_active = false 
WHERE id = '120925ab-9074-43bf-948f-cf91bcbe2d10';