-- Insert 50 ELPT CT if not already present
INSERT INTO motor_models (
  model, model_display, display_name, model_number,
  horsepower, family, motor_type, make, year, is_brochure,
  has_command_thrust, has_power_trim, rigging_code,
  msrp, dealer_price, model_key, availability
)
SELECT
  '50 ELPT Command Thrust FourStroke',
  '50 ELPT Command Thrust FourStroke',
  '50 ELPT Command Thrust FourStroke',
  '1F51453GZ', 50, 'FourStroke', 'Outboard', 'Mercury', 2025, true,
  true, true, 'ELPT', 12645, 11127, 'FS_50_ELPT_CT', 'Brochure'
WHERE NOT EXISTS (SELECT 1 FROM motor_models WHERE model_number = '1F51453GZ');

-- Insert 90 ELPT CT if not already present
INSERT INTO motor_models (
  model, model_display, display_name, model_number,
  horsepower, family, motor_type, make, year, is_brochure,
  has_command_thrust, has_power_trim, rigging_code,
  msrp, dealer_price, model_key, availability
)
SELECT
  '90 ELPT Command Thrust FourStroke',
  '90 ELPT Command Thrust FourStroke',
  '90 ELPT Command Thrust FourStroke',
  '1F904532D', 90, 'FourStroke', 'Outboard', 'Mercury', 2025, true,
  true, true, 'ELPT', 17355, 15274, 'FS_90_ELPT_CT', 'Brochure'
WHERE NOT EXISTS (SELECT 1 FROM motor_models WHERE model_number = '1F904532D');

-- Fix the 40 CT model field
UPDATE motor_models
SET model = '40 ELPT Command Thrust FourStroke',
    model_display = '40 ELPT Command Thrust FourStroke',
    display_name = '40 ELPT Command Thrust FourStroke'
WHERE model_number = '1F41453GZ' AND model = 'Outboard';