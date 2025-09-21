-- Fix existing Command Thrust and ProKicker model display names based on official pricing CSV
-- These motors already have the correct Mercury model numbers but wrong display names

UPDATE motor_models SET
  model_display = '3.5 MH Command Thrust FourStroke',
  updated_at = now()
WHERE model_number = '1C03561MK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '5 MH Command Thrust FourStroke',
  updated_at = now()
WHERE model_number = '1C05061MK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '6 MH Command Thrust FourStroke',
  updated_at = now()
WHERE model_number = '1C06061MK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '9.9 EXLPT Command Thrust ProKicker EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A10462LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '15 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A15362LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '20 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A20362LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '25 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A25362LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '30 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A30362LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '40 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A40362LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '50 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A50362LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '60 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A60432LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '75 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A75432LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '90 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A90432LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '115 EXLPT Command Thrust EFI FourStroke',
  updated_at = now()
WHERE model_number = '1B115432LK' AND is_brochure = true;

UPDATE motor_models SET
  model_display = '3.5 MH ProKicker FourStroke',  
  updated_at = now()
WHERE model_number = '1C03531JK' AND is_brochure = true;

-- Insert missing Command Thrust and ProKicker models that don't exist in database
INSERT INTO motor_models (
  model_number,
  model_key,
  mercury_model_no,
  model,
  model_display,
  dealer_price,
  msrp,
  horsepower,
  motor_type,
  year,
  is_brochure,
  family,
  rigging_code,
  has_command_thrust,
  created_at,
  updated_at
) 
SELECT * FROM (VALUES 
  ('1C04061MK', 'FOURSTROKE-4HP-MH-CT', '1C04061MK', 'Outboard', '4 MH Command Thrust FourStroke', 2799, 2799, 4, 'Outboard', 2025, true, 'FourStroke', 'MH', true, now(), now()),
  ('1C05031JK', 'FOURSTROKE-5HP-MH-PK', '1C05031JK', 'Outboard', '5 MH ProKicker FourStroke', 3199, 3199, 5, 'Outboard', 2025, true, 'FourStroke', 'MH', false, now(), now()),
  ('1C06031JK', 'FOURSTROKE-6HP-MH-PK', '1C06031JK', 'Outboard', '6 MH ProKicker FourStroke', 3499, 3499, 6, 'Outboard', 2025, true, 'FourStroke', 'MH', false, now(), now()),
  ('1A15302JK', 'FOURSTROKE-15HP-EXLPT-PK', '1A15302JK', 'Outboard', '15 EXLPT ProKicker EFI FourStroke', 6299, 6299, 15, 'Outboard', 2025, true, 'FourStroke', 'EXLPT', false, now(), now()),
  ('1A20302JK', 'FOURSTROKE-20HP-EXLPT-PK', '1A20302JK', 'Outboard', '20 EXLPT ProKicker EFI FourStroke', 7199, 7199, 20, 'Outboard', 2025, true, 'FourStroke', 'EXLPT', false, now(), now()),
  ('1A25322JK', 'FOURSTROKE-25HP-EXLPT-PK', '1A25322JK', 'Outboard', '25 EXLPT ProKicker EFI FourStroke', 8299, 8299, 25, 'Outboard', 2025, true, 'FourStroke', 'EXLPT', false, now(), now())
) AS new_motors(model_number, model_key, mercury_model_no, model, model_display, dealer_price, msrp, horsepower, motor_type, year, is_brochure, family, rigging_code, has_command_thrust, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM motor_models WHERE motor_models.model_number = new_motors.model_number
);