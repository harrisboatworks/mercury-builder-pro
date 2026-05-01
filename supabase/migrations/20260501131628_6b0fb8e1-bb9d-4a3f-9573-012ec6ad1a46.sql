-- Asset-gap hero backfill for 3 in-stock motors with no curated image.
-- Images committed to public/asset-gap-heroes/ in the repo and served from
-- the production site. Reversible: previous hero_image_url was NULL for all 3;
-- previous hero_media_id values are recorded in the runbook.

DO $$
DECLARE
  v_50_motor_id   UUID := '44987d46-af33-45b2-85a2-651b8556b1bd';
  v_60_motor_id   UUID := '5744e979-5c77-4550-a955-d9e83ecdb26c';
  v_60ct_motor_id UUID := '8f7b62e5-e3d4-41d5-8489-9aa50c476d46';
  v_50_url    TEXT := 'https://mercuryrepower.ca/asset-gap-heroes/50-elpt-fourstroke.jpg';
  v_60_url    TEXT := 'https://mercuryrepower.ca/asset-gap-heroes/60-elpt-fourstroke.jpg';
  v_60ct_url  TEXT := 'https://mercuryrepower.ca/asset-gap-heroes/60-elpt-ct-fourstroke.jpg';
  v_50_media_id   UUID;
  v_60_media_id   UUID;
  v_60ct_media_id UUID;
BEGIN
  -- Insert active curated hero rows
  INSERT INTO public.motor_media (
    motor_id, media_type, media_category, media_url, original_filename,
    mime_type, alt_text, title, assignment_type, is_active, display_order
  ) VALUES (
    v_50_motor_id, 'image', 'hero', v_50_url,
    '2020-Mercury-Marine-50ELPT-FourStroke.jpg', 'image/jpeg',
    'Mercury 50 ELPT FourStroke outboard, port 3/4 view',
    'Mercury 50 ELPT FourStroke', 'individual', TRUE, 0
  ) RETURNING id INTO v_50_media_id;

  INSERT INTO public.motor_media (
    motor_id, media_type, media_category, media_url, original_filename,
    mime_type, alt_text, title, assignment_type, is_active, display_order
  ) VALUES (
    v_60_motor_id, 'image', 'hero', v_60_url,
    '60_elpt.jpg', 'image/jpeg',
    'Mercury 60 ELPT FourStroke outboard, port 3/4 view',
    'Mercury 60 ELPT FourStroke', 'individual', TRUE, 0
  ) RETURNING id INTO v_60_media_id;

  INSERT INTO public.motor_media (
    motor_id, media_type, media_category, media_url, original_filename,
    mime_type, alt_text, title, assignment_type, is_active, display_order
  ) VALUES (
    v_60ct_motor_id, 'image', 'hero', v_60ct_url,
    '60_elpt_ct.jpg', 'image/jpeg',
    'Mercury 60 ELPT Command Thrust FourStroke outboard, port 3/4 view',
    'Mercury 60 ELPT Command Thrust FourStroke', 'individual', TRUE, 0
  ) RETURNING id INTO v_60ct_media_id;

  -- Promote: only motors whose model_number matches AND have no hero_image_url yet
  UPDATE public.motor_models
     SET hero_image_url    = v_50_url,
         hero_media_id     = v_50_media_id,
         media_last_updated = now()
   WHERE id = v_50_motor_id
     AND model_number = '1F51413GZ'
     AND hero_image_url IS NULL;

  UPDATE public.motor_models
     SET hero_image_url    = v_60_url,
         hero_media_id     = v_60_media_id,
         media_last_updated = now()
   WHERE id = v_60_motor_id
     AND model_number = '1F60413GZ'
     AND hero_image_url IS NULL;

  UPDATE public.motor_models
     SET hero_image_url    = v_60ct_url,
         hero_media_id     = v_60ct_media_id,
         media_last_updated = now()
   WHERE id = v_60ct_motor_id
     AND model_number = '1F60453GZ'
     AND hero_image_url IS NULL;
END $$;