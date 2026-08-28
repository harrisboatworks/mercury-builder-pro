-- Correct the existing 9.9 EXLPT ProKicker record instead of creating a duplicate.
-- Product identity: Mercury model 1A10462LK, 25-inch shaft, remote control.
do $$
declare
  target_count integer;
  target_id uuid;
  target_media_id uuid;
  remote_media_count integer;
  remote_media_url text;
  remote_original_filename text;
  remote_title text;
begin
  select count(*)
    into target_count
  from public.motor_models
  where model_number = '1A10462LK'
     or mercury_model_no = '1A10462LK';

  if target_count <> 1 then
    raise exception 'Expected exactly one motor_models row for 1A10462LK, found %', target_count;
  end if;

  select id, hero_media_id
    into target_id, target_media_id
  from public.motor_models
  where model_number = '1A10462LK'
     or mercury_model_no = '1A10462LK';

  select count(*)
    into remote_media_count
  from public.motor_media mm
  join public.motor_models m on m.hero_media_id = mm.id
  where m.model_number = '1A10452LK'
    and mm.media_type = 'image';

  if remote_media_count <> 1 then
    raise exception 'Expected exactly one verified 9.9 ProKicker remote hero image, found %', remote_media_count;
  end if;

  select mm.media_url, mm.original_filename, mm.title
    into remote_media_url, remote_original_filename, remote_title
  from public.motor_media mm
  join public.motor_models m on m.hero_media_id = mm.id
  where m.model_number = '1A10452LK'
    and mm.media_type = 'image';

  update public.motor_models
  set
    model_display = '9.9 EXLPT Command Thrust ProKicker EFI FourStroke',
    display_name = 'Mercury 9.9 EXLPT ProKicker',
    shaft = 'Extra Long (25")',
    shaft_code = 'XL',
    shaft_inches = 25,
    start_type = 'Electric',
    control_type = 'Remote',
    hero_image_url = remote_media_url,
    description = 'A purpose-built remote-control kicker for precise trolling and dependable backup propulsion. This 25-inch model combines EFI, electric start with manual backup, power tilt, a Command Thrust gearcase and a high-thrust four-blade propeller.',
    specifications = jsonb_build_object(
      'cylinders', 2,
      'displacement', '209 cc',
      'boreStroke', '55 x 44 mm',
      'fuelSystem', 'EFI',
      'fullThrottleRPM', '5000-6000',
      'startingSystem', 'Electric start with manual backup',
      'startingType', 'Electric start with manual backup',
      'weight', '115',
      'gearRatio', '2.42:1',
      'alternatorOutput', '12 amp (145 watt)',
      'shaftLength', 'Extra Long (25")',
      'shaftLengths', jsonb_build_array('25"'),
      'controlType', 'Remote mechanical',
      'trimSystem', 'Power tilt',
      'gearcase', 'Command Thrust',
      'propeller', 'High-thrust four-blade'
    ),
    spec_json = jsonb_build_object(
      'keyTakeaways', jsonb_build_array(
        'Remote mechanical steering for helm-controlled kicker installations',
        '25-inch extra-long shaft',
        'EFI for reliable starting and efficient low-speed operation',
        'Electric start with manual backup',
        'Power tilt for easier stowing and deployment',
        'Command Thrust gearcase with a high-thrust four-blade propeller'
      )
    ),
    manual_overrides = coalesce(manual_overrides, '{}'::jsonb) || jsonb_build_object(
      'catalog_correction', jsonb_build_object(
        'model_number', '1A10462LK',
        'reason', 'Correct EXLPT remote-control configuration and discoverability',
        'corrected_at', now()
      )
    ),
    last_enriched = now(),
    media_last_updated = now(),
    updated_at = now()
  where id = target_id;

  if target_media_id is null then
    raise exception 'Expected a hero media row for 1A10462LK';
  end if;

  update public.motor_media
  set
    media_url = remote_media_url,
    original_filename = remote_original_filename,
    title = coalesce(remote_title, 'Mercury 9.9 ProKicker Remote Control'),
    alt_text = 'Mercury 9.9 EXLPT ProKicker remote-control outboard',
    updated_at = now()
  where id = target_media_id
    and motor_id = target_id;

  if not found then
    raise exception 'Expected one hero motor_media row for 1A10462LK';
  end if;
end
$$;
