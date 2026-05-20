
-- Fix display names on existing DTS records
UPDATE public.motor_models
SET model_display = '200 EXLPT ProXS DTS',
    updated_at = now()
WHERE model_number = '12000040A';

UPDATE public.motor_models
SET model_display = '250 ELPT ProXS DTS',
    updated_at = now()
WHERE model_number = '12500094A';

-- Insert 200 ELPT Pro XS DTS (TorqueMaster) - model 12000035A
INSERT INTO public.motor_models (
  make, model, year, motor_type, family, horsepower,
  model_number, mercury_model_no, model_display, model_key, rigging_code,
  msrp, dealer_price, msrp_source,
  is_brochure, in_stock, availability,
  hero_image_url, images,
  description, features, specifications, has_power_trim, has_command_thrust
)
SELECT
  'Mercury', 'Outboard', 2026, 'Outboard', 'ProXS', 200,
  '12000035A', '12000035A', '200 ELPT ProXS DTS', 'PXS_200_L_DTS_TM', 'L',
  34080, 29992, 'mercury_official',
  true, true, 'Brochure',
  hero_image_url, images,
  description, features, specifications, has_power_trim, has_command_thrust
FROM public.motor_models WHERE model_number = '12000039A'
ON CONFLICT DO NOTHING;

-- Insert 250 EXLPT Pro XS DTS - model 12500096A
INSERT INTO public.motor_models (
  make, model, year, motor_type, family, horsepower,
  model_number, mercury_model_no, model_display, model_key, rigging_code,
  msrp, dealer_price, msrp_source,
  is_brochure, in_stock, availability,
  hero_image_url, images,
  description, features, specifications, has_power_trim, has_command_thrust
)
SELECT
  'Mercury', 'Outboard', 2026, 'Outboard', 'ProXS', 250,
  '12500096A', '12500096A', '250 EXLPT ProXS DTS', 'PXS_250_XL_DTS', 'XL',
  42465, 37367, 'mercury_official',
  true, true, 'Brochure',
  hero_image_url, images,
  description, features, specifications, has_power_trim, has_command_thrust
FROM public.motor_models WHERE model_number = '12500094A'
ON CONFLICT DO NOTHING;

-- Ensure the two existing DTS records are visible/in-stock too
UPDATE public.motor_models
SET in_stock = true, is_brochure = true, updated_at = now()
WHERE model_number IN ('12000040A','12500094A');
