
-- Step 1: Deactivate 5 existing generic covers
UPDATE motor_options SET is_active = false WHERE id IN (
  '657f5896-2bba-4818-a8f3-30b9f81ca311',
  'ccf3842a-173f-4279-8c06-164bd81f110d',
  '4b445c6f-a51b-4021-b382-e07d4c107cb3',
  '33660105-0d87-4e6c-83a3-0f110c7bcc82',
  '699fb03a-49aa-46d9-a7aa-9d14348aba81'
);

-- Deactivate their rules too
UPDATE motor_option_rules SET is_active = false WHERE option_id IN (
  '657f5896-2bba-4818-a8f3-30b9f81ca311',
  'ccf3842a-173f-4279-8c06-164bd81f110d',
  '4b445c6f-a51b-4021-b382-e07d4c107cb3',
  '33660105-0d87-4e6c-83a3-0f110c7bcc82',
  '699fb03a-49aa-46d9-a7aa-9d14348aba81'
);

-- Step 2: Insert 15 new model-specific vented covers
INSERT INTO motor_options (name, description, short_description, category, base_price, msrp, part_number, is_active, is_taxable, display_order) VALUES
  ('Mercury Vented Running Cover - 40HP FourStroke', 'Mercury OEM vented running/splash cover for 40HP FourStroke outboard motors. Allows engine to run while covered.', 'Vented cover for 40HP FourStroke', 'accessory', 292.84, 292.84, '8M0228502', true, true, 10),
  ('Mercury Vented Running Cover - 90HP FourStroke', 'Mercury OEM vented running/splash cover for 90HP FourStroke outboard motors. Allows engine to run while covered.', 'Vented cover for 90HP FourStroke', 'accessory', 312.54, 312.54, '8M0228507', true, true, 11),
  ('Mercury Vented Running Cover - 115HP FourStroke', 'Mercury OEM vented running/splash cover for 115HP FourStroke outboard motors. Allows engine to run while covered.', 'Vented cover for 115HP FourStroke', 'accessory', 312.54, 312.54, '8M0228509', true, true, 12),
  ('Mercury Vented Running Cover - 115HP Pro XS', 'Mercury OEM vented running/splash cover for 115HP Pro XS outboard motors. Allows engine to run while covered.', 'Vented cover for 115HP Pro XS', 'accessory', 365.57, 365.57, '8M0228530', true, true, 13),
  ('Mercury Vented Running Cover - 150HP Pro XS', 'Mercury OEM vented running/splash cover for 150HP Pro XS outboard motors. Allows engine to run while covered.', 'Vented cover for 150HP Pro XS', 'accessory', 401.62, 401.62, '8M0228531', true, true, 14),
  ('Mercury Vented Running Cover - 175HP Pro XS', 'Mercury OEM vented running/splash cover for 175HP Pro XS outboard motors. Allows engine to run while covered.', 'Vented cover for 175HP Pro XS', 'accessory', 461.09, 461.09, '8M0228532', true, true, 15),
  ('Mercury Vented Running Cover - 200HP V6 FourStroke', 'Mercury OEM vented running/splash cover for 200HP V6 FourStroke outboard motors. Allows engine to run while covered.', 'Vented cover for 200HP V6 FourStroke', 'accessory', 335.20, 335.20, '8M0228511', true, true, 16),
  ('Mercury Vented Running Cover - 200HP Pro XS', 'Mercury OEM vented running/splash cover for 200HP Pro XS outboard motors. Allows engine to run while covered.', 'Vented cover for 200HP Pro XS', 'accessory', 456.82, 456.82, '8M0228533', true, true, 17),
  ('Mercury Vented Running Cover - 225HP V6 FourStroke', 'Mercury OEM vented running/splash cover for 225HP V6 FourStroke outboard motors. Allows engine to run while covered.', 'Vented cover for 225HP V6 FourStroke', 'accessory', 338.55, 338.55, '8M0228512', true, true, 18),
  ('Mercury Vented Running Cover - 225HP Pro XS', 'Mercury OEM vented running/splash cover for 225HP Pro XS outboard motors. Allows engine to run while covered.', 'Vented cover for 225HP Pro XS', 'accessory', 461.41, 461.41, '8M0228534', true, true, 19),
  ('Mercury Vented Running Cover - 250HP FourStroke', 'Mercury OEM vented running/splash cover for 250HP FourStroke outboard motors. Allows engine to run while covered.', 'Vented cover for 250HP FourStroke', 'accessory', 401.42, 401.42, '8M0228521', true, true, 20),
  ('Mercury Vented Running Cover - 250HP Pro XS', 'Mercury OEM vented running/splash cover for 250HP Pro XS outboard motors. Allows engine to run while covered.', 'Vented cover for 250HP Pro XS', 'accessory', 489.35, 489.35, '8M0228535', true, true, 21),
  ('Mercury Vented Running Cover - 300HP L6 Verado FourStroke', 'Mercury OEM vented running/splash cover for 300HP L6 Verado FourStroke outboard motors. Allows engine to run while covered.', 'Vented cover for 300HP L6 Verado', 'accessory', 386.42, 386.42, '8M0228517', true, true, 22),
  ('Mercury Vented Running Cover - 300HP Pro XS', 'Mercury OEM vented running/splash cover for 300HP Pro XS outboard motors. Allows engine to run while covered.', 'Vented cover for 300HP Pro XS', 'accessory', 494.27, 494.27, '8M0228536', true, true, 23),
  ('Mercury Vented Running Cover - 300HP V8 FourStroke', 'Mercury OEM vented running/splash cover for 300HP V8 FourStroke outboard motors. Allows engine to run while covered.', 'Vented cover for 300HP V8 FourStroke', 'accessory', 401.42, 401.42, '8M0228522', true, true, 24);

-- Step 3: Insert rules for 14 covers (all except 8M0228517 L6 Verado which has no distinguishable rule)
-- 40HP FourStroke
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 40HP FourStroke', 'available', '{"hp_min": 40, "hp_max": 40, "motor_family": "FourStroke"}'::jsonb, 'Mercury vented cover for 40HP FourStroke motors', 10
FROM motor_options WHERE part_number = '8M0228502';

-- 90HP FourStroke
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 90HP FourStroke', 'available', '{"hp_min": 90, "hp_max": 90, "motor_family": "FourStroke"}'::jsonb, 'Mercury vented cover for 90HP FourStroke motors', 10
FROM motor_options WHERE part_number = '8M0228507';

-- 115HP FourStroke
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 115HP FourStroke', 'available', '{"hp_min": 115, "hp_max": 115, "motor_family": "FourStroke"}'::jsonb, 'Mercury vented cover for 115HP FourStroke motors', 10
FROM motor_options WHERE part_number = '8M0228509';

-- 115HP Pro XS
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 115HP Pro XS', 'available', '{"hp_min": 115, "hp_max": 115, "motor_family": "ProXS"}'::jsonb, 'Mercury vented cover for 115HP Pro XS motors', 10
FROM motor_options WHERE part_number = '8M0228530';

-- 150HP Pro XS
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 150HP Pro XS', 'available', '{"hp_min": 150, "hp_max": 150, "motor_family": "ProXS"}'::jsonb, 'Mercury vented cover for 150HP Pro XS motors', 10
FROM motor_options WHERE part_number = '8M0228531';

-- 175HP Pro XS
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 175HP Pro XS', 'available', '{"hp_min": 175, "hp_max": 175, "motor_family": "ProXS"}'::jsonb, 'Mercury vented cover for 175HP Pro XS motors', 10
FROM motor_options WHERE part_number = '8M0228532';

-- 200HP V6 FourStroke
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 200HP FourStroke', 'available', '{"hp_min": 200, "hp_max": 200, "motor_family": "FourStroke"}'::jsonb, 'Mercury vented cover for 200HP V6 FourStroke motors', 10
FROM motor_options WHERE part_number = '8M0228511';

-- 200HP Pro XS
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 200HP Pro XS', 'available', '{"hp_min": 200, "hp_max": 200, "motor_family": "ProXS"}'::jsonb, 'Mercury vented cover for 200HP Pro XS motors', 10
FROM motor_options WHERE part_number = '8M0228533';

-- 225HP V6 FourStroke
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 225HP FourStroke', 'available', '{"hp_min": 225, "hp_max": 225, "motor_family": "FourStroke"}'::jsonb, 'Mercury vented cover for 225HP V6 FourStroke motors', 10
FROM motor_options WHERE part_number = '8M0228512';

-- 225HP Pro XS
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 225HP Pro XS', 'available', '{"hp_min": 225, "hp_max": 225, "motor_family": "ProXS"}'::jsonb, 'Mercury vented cover for 225HP Pro XS motors', 10
FROM motor_options WHERE part_number = '8M0228534';

-- 250HP FourStroke
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 250HP FourStroke', 'available', '{"hp_min": 250, "hp_max": 250, "motor_family": "FourStroke"}'::jsonb, 'Mercury vented cover for 250HP FourStroke motors', 10
FROM motor_options WHERE part_number = '8M0228521';

-- 250HP Pro XS
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 250HP Pro XS', 'available', '{"hp_min": 250, "hp_max": 250, "motor_family": "ProXS"}'::jsonb, 'Mercury vented cover for 250HP Pro XS motors', 10
FROM motor_options WHERE part_number = '8M0228535';

-- 300HP V8 FourStroke (assigned to all 300HP FourStroke motors)
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 300HP FourStroke V8', 'available', '{"hp_min": 300, "hp_max": 300, "motor_family": "FourStroke"}'::jsonb, 'Mercury vented cover for 300HP V8 FourStroke motors', 10
FROM motor_options WHERE part_number = '8M0228522';

-- 300HP Pro XS
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, description, priority)
SELECT id, 'Vented Cover 300HP Pro XS', 'available', '{"hp_min": 300, "hp_max": 300, "motor_family": "ProXS"}'::jsonb, 'Mercury vented cover for 300HP Pro XS motors', 10
FROM motor_options WHERE part_number = '8M0228536';
