-- Insert Motor Covers into motor_options
INSERT INTO motor_options (name, description, short_description, category, base_price, msrp, part_number, is_taxable, display_order, features, is_active)
VALUES
  ('Attwood Motor Cover (40-60HP)', 'Heavy-duty motor cover designed for 40-60HP outboard motors. Provides excellent protection from sun, rain, and debris during storage or trailering.', 'Protects motor during storage and transport', 'accessory', 89.99, 99.99, 'ATT-10541', true, 100, '["UV-resistant material", "Water-repellent coating", "Custom fit for 40-60HP", "Easy install with draw cord", "Marine-grade quality"]', true),
  ('Vented Splash Cover (75-115HP)', 'Mercury genuine vented splash cover for 75-115HP FourStroke outboards. Vented design allows engine cooling while protecting from spray.', 'Vented protection for running motor', 'accessory', 119.99, 139.99, 'MRC-VS-75115', true, 101, '["Vented for engine cooling", "Reduces spray when running", "Custom Mercury fit", "Quick snap installation", "Marine-grade fabric"]', true),
  ('Vented Splash Cover (150HP)', 'Mercury genuine vented splash cover for 150HP FourStroke outboards. Allows running with cover on for spray protection.', 'Vented protection for running motor', 'accessory', 129.99, 149.99, 'MRC-VS-150', true, 102, '["Vented for engine cooling", "Reduces spray when running", "Custom Mercury fit", "Quick snap installation", "Marine-grade fabric"]', true),
  ('Vented Splash Cover (175-225HP V6)', 'Mercury genuine vented splash cover for V6 FourStroke outboards (175-225HP). Premium protection with vented design.', 'Vented protection for V6 motors', 'accessory', 149.99, 179.99, 'MRC-VS-V6', true, 103, '["Vented for engine cooling", "V6 FourStroke fit", "Reduces spray when running", "Premium Mercury quality", "Quick snap installation"]', true),
  ('Vented Splash Cover (250-300HP V8)', 'Mercury genuine vented splash cover for V8 FourStroke outboards (250-300HP). Maximum protection for high-horsepower motors.', 'Vented protection for V8 motors', 'accessory', 169.99, 199.99, 'MRC-VS-V8', true, 104, '["Vented for engine cooling", "V8 FourStroke fit", "Reduces spray when running", "Premium Mercury quality", "Quick snap installation"]', true)
ON CONFLICT (part_number) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  base_price = EXCLUDED.base_price,
  msrp = EXCLUDED.msrp,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order;

-- Insert HP-based rules for motor covers
INSERT INTO motor_option_rules (rule_name, description, option_id, assignment_type, conditions, is_active, priority)
SELECT 
  'Motor Cover - 40-60HP',
  'Show 40-60HP motor covers for motors in that HP range',
  id,
  'available',
  '{"hp_min": 40, "hp_max": 60}',
  true,
  50
FROM motor_options WHERE part_number = 'ATT-10541';

INSERT INTO motor_option_rules (rule_name, description, option_id, assignment_type, conditions, is_active, priority)
SELECT 
  'Vented Splash Cover - 75-115HP',
  'Show 75-115HP vented splash covers for motors in that HP range',
  id,
  'available',
  '{"hp_min": 75, "hp_max": 115}',
  true,
  50
FROM motor_options WHERE part_number = 'MRC-VS-75115';

INSERT INTO motor_option_rules (rule_name, description, option_id, assignment_type, conditions, is_active, priority)
SELECT 
  'Vented Splash Cover - 150HP',
  'Show 150HP vented splash covers for 150HP motors',
  id,
  'available',
  '{"hp_min": 150, "hp_max": 150}',
  true,
  50
FROM motor_options WHERE part_number = 'MRC-VS-150';

INSERT INTO motor_option_rules (rule_name, description, option_id, assignment_type, conditions, is_active, priority)
SELECT 
  'Vented Splash Cover - V6',
  'Show V6 vented splash covers for 175-225HP motors',
  id,
  'available',
  '{"hp_min": 175, "hp_max": 225}',
  true,
  50
FROM motor_options WHERE part_number = 'MRC-VS-V6';

INSERT INTO motor_option_rules (rule_name, description, option_id, assignment_type, conditions, is_active, priority)
SELECT 
  'Vented Splash Cover - V8',
  'Show V8 vented splash covers for 250-300HP motors',
  id,
  'available',
  '{"hp_min": 250, "hp_max": 300}',
  true,
  50
FROM motor_options WHERE part_number = 'MRC-VS-V8';