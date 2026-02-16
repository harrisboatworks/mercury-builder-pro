
INSERT INTO motor_option_rules (option_id, rule_name, assignment_type, conditions, priority, description)
VALUES
  -- Tow N Stow (40-60HP FourStroke)
  ('f3aafa28-5347-4b0d-b5bc-95bdb930d152', 'Tow N Stow 40-60HP FourStroke', 'available',
   '{"hp_min": 40, "hp_max": 60, "motor_family": "FourStroke"}'::jsonb, 10,
   'Tow N Stow Cover for 40-60HP FourStroke motors'),

  -- Tow N Stow (75-115HP FourStroke)
  ('da0d92ec-b239-491d-a146-74d28ba6cb4c', 'Tow N Stow 75-115HP FourStroke', 'available',
   '{"hp_min": 75, "hp_max": 115, "motor_family": "FourStroke"}'::jsonb, 10,
   'Tow N Stow Cover for 75-115HP FourStroke motors'),

  -- Tow N Stow (150HP FourStroke)
  ('e080848a-2f2a-4412-8248-2c99fdf7cf6b', 'Tow N Stow 150HP FourStroke', 'available',
   '{"hp_min": 140, "hp_max": 160, "motor_family": "FourStroke"}'::jsonb, 10,
   'Tow N Stow Cover for 150HP FourStroke motors'),

  -- Tow N Stow (175-225HP FourStroke)
  ('a33840a7-f74d-41d9-9d8f-a32497271994', 'Tow N Stow 175-225HP FourStroke', 'available',
   '{"hp_min": 175, "hp_max": 225, "motor_family": "FourStroke"}'::jsonb, 10,
   'Tow N Stow Cover for 175-225HP FourStroke motors'),

  -- Tow N Stow (200-300HP FourStroke)
  ('735af3cf-d214-4266-91bb-922b0f7bd2a0', 'Tow N Stow 200-300HP FourStroke', 'available',
   '{"hp_min": 200, "hp_max": 300, "motor_family": "FourStroke"}'::jsonb, 10,
   'Tow N Stow Cover for 200-300HP FourStroke motors'),

  -- Tow N Stow (200-300HP Pro XS)
  ('d0e1c2e7-3e8a-4ed1-a4ef-037bf382f4cb', 'Tow N Stow 200-300HP Pro XS', 'available',
   '{"hp_min": 200, "hp_max": 300, "motor_family": "ProXS"}'::jsonb, 10,
   'Tow N Stow Cover for 200-300HP Pro XS motors'),

  -- Tow N Stow (225-400HP Verado) — no family filter since Verado not stored as separate family
  ('2d0aad7d-8454-4459-9312-59d493691c79', 'Tow N Stow 225-400HP Verado', 'available',
   '{"hp_min": 225, "hp_max": 400}'::jsonb, 10,
   'Tow N Stow Cover for 225-400HP Verado motors'),

  -- Vented Cover (300HP L6 Verado) — no family filter
  ('c2b2891e-403c-47b6-aabc-3af43ababefc', 'Vented Cover 300HP L6 Verado', 'available',
   '{"hp_min": 300, "hp_max": 300}'::jsonb, 10,
   'Vented Running Cover for 300HP L6 Verado FourStroke');
