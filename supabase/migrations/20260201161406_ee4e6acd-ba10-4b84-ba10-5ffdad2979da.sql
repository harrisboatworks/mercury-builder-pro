-- Insert HP-based rules for motor option assignments
INSERT INTO public.motor_option_rules (rule_name, option_id, assignment_type, conditions, priority, is_active, description) 

SELECT 
  'SmartCraft Connect Mobile - All EFI Motors',
  mo.id,
  'recommended',
  '{"hp_min": 8}'::jsonb,
  100,
  true,
  'Recommend SmartCraft Connect Mobile for all EFI motors 8HP+'
FROM public.motor_options mo WHERE mo.part_number = '8M0173128'

UNION ALL

-- 100-Hour Service Kits
SELECT 
  '100-Hour Kit Under 25HP',
  mo.id,
  'available',
  '{"hp_min": 8, "hp_max": 24}'::jsonb,
  50,
  true,
  '100-Hour Service Kit for motors under 25HP'
FROM public.motor_options mo WHERE mo.part_number = '8M0151469'

UNION ALL

SELECT 
  '100-Hour Kit 40-60HP',
  mo.id,
  'available',
  '{"hp_min": 40, "hp_max": 60}'::jsonb,
  50,
  true,
  '100-Hour Service Kit for 40-60HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0232733'

UNION ALL

SELECT 
  '100-Hour Kit 75-115HP',
  mo.id,
  'available',
  '{"hp_min": 75, "hp_max": 115}'::jsonb,
  50,
  true,
  '100-Hour Service Kit for 75-115HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0097854'

UNION ALL

SELECT 
  '100-Hour Kit 150HP',
  mo.id,
  'available',
  '{"hp_min": 140, "hp_max": 160}'::jsonb,
  50,
  true,
  '100-Hour Service Kit for 150HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0094232'

UNION ALL

SELECT 
  '100-Hour Kit 175-300HP',
  mo.id,
  'available',
  '{"hp_min": 175, "hp_max": 300}'::jsonb,
  50,
  true,
  '100-Hour Service Kit for 175-300HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0149929'

UNION ALL

-- 300-Hour Service Kits
SELECT 
  '300-Hour Kit 40-60HP',
  mo.id,
  'available',
  '{"hp_min": 40, "hp_max": 60}'::jsonb,
  40,
  true,
  '300-Hour Service Kit for 40-60HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0090559'

UNION ALL

SELECT 
  '300-Hour Kit 75-115HP',
  mo.id,
  'available',
  '{"hp_min": 75, "hp_max": 115}'::jsonb,
  40,
  true,
  '300-Hour Service Kit for 75-115HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0097855'

UNION ALL

SELECT 
  '300-Hour Kit 150HP',
  mo.id,
  'available',
  '{"hp_min": 140, "hp_max": 160}'::jsonb,
  40,
  true,
  '300-Hour Service Kit for 150HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0094233'

UNION ALL

SELECT 
  '300-Hour Kit 175-225HP',
  mo.id,
  'available',
  '{"hp_min": 175, "hp_max": 225}'::jsonb,
  40,
  true,
  '300-Hour Service Kit for 175-225HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0149930'

UNION ALL

SELECT 
  '300-Hour Kit 250-300HP',
  mo.id,
  'available',
  '{"hp_min": 250, "hp_max": 300}'::jsonb,
  40,
  true,
  '300-Hour Service Kit for 250-300HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0149931'

UNION ALL

-- Oil Change Kits
SELECT 
  'Oil Change Kit 40-60HP',
  mo.id,
  'available',
  '{"hp_min": 40, "hp_max": 60}'::jsonb,
  30,
  true,
  'Oil Change Kit for 40-60HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0081916'

UNION ALL

SELECT 
  'Oil Change Kit 75-115HP',
  mo.id,
  'available',
  '{"hp_min": 75, "hp_max": 115}'::jsonb,
  30,
  true,
  'Oil Change Kit for 75-115HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0107510'

UNION ALL

SELECT 
  'Oil Change Kit 150HP',
  mo.id,
  'available',
  '{"hp_min": 140, "hp_max": 160}'::jsonb,
  30,
  true,
  'Oil Change Kit for 150HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0188357'

UNION ALL

SELECT 
  'Oil Change Kit 175-225HP',
  mo.id,
  'available',
  '{"hp_min": 175, "hp_max": 225}'::jsonb,
  30,
  true,
  'Oil Change Kit for 175-225HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0187621'

UNION ALL

SELECT 
  'Oil Change Kit 250-300HP',
  mo.id,
  'available',
  '{"hp_min": 250, "hp_max": 300}'::jsonb,
  30,
  true,
  'Oil Change Kit for 250-300HP motors'
FROM public.motor_options mo WHERE mo.part_number = '8M0187622'

ON CONFLICT DO NOTHING;