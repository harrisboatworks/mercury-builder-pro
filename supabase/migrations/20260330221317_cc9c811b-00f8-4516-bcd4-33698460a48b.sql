-- Insert 115 ELPT Pro XS Command Thrust if not already present
INSERT INTO motor_models (
  model, model_display, display_name, model_number,
  horsepower, family, motor_type, make, year, is_brochure,
  has_command_thrust, has_power_trim, rigging_code,
  msrp, dealer_price, model_key, availability
)
SELECT
  '115 ELPT Pro XS Command Thrust',
  '115 ELPT Pro XS Command Thrust',
  '115 ELPT Pro XS Command Thrust',
  '1117F531D', 115, 'Pro XS', 'Outboard', 'Mercury', 2025, true,
  true, true, 'ELPT', 20179, 17765, 'PXS_115_ELPT_CT', 'Brochure'
WHERE NOT EXISTS (SELECT 1 FROM motor_models WHERE model_number = '1117F531D');

-- Insert 115 EXLPT Pro XS Command Thrust if not already present
INSERT INTO motor_models (
  model, model_display, display_name, model_number,
  horsepower, family, motor_type, make, year, is_brochure,
  has_command_thrust, has_power_trim, rigging_code,
  msrp, dealer_price, model_key, availability
)
SELECT
  '115 EXLPT Pro XS Command Thrust',
  '115 EXLPT Pro XS Command Thrust',
  '115 EXLPT Pro XS Command Thrust',
  '1117F631D', 115, 'Pro XS', 'Outboard', 'Mercury', 2025, true,
  true, true, 'EXLPT', 20579, 18117, 'PXS_115_EXLPT_CT', 'Brochure'
WHERE NOT EXISTS (SELECT 1 FROM motor_models WHERE model_number = '1117F631D');