
-- Task 1: Update MSRP and base_price for 15 existing records
UPDATE public.motor_options SET msrp = 95.12, base_price = 95.12, updated_at = now() WHERE part_number = '8M0151469';
UPDATE public.motor_options SET msrp = 74.71, base_price = 74.71, updated_at = now() WHERE part_number = '8M0232733';
UPDATE public.motor_options SET msrp = 53.15, base_price = 53.15, updated_at = now() WHERE part_number = '8M0097854';
UPDATE public.motor_options SET msrp = 64.22, base_price = 64.22, updated_at = now() WHERE part_number = '8M0094232';
UPDATE public.motor_options SET msrp = 128.17, base_price = 128.17, updated_at = now() WHERE part_number = '8M0149929';
UPDATE public.motor_options SET msrp = 331.73, base_price = 331.73, updated_at = now() WHERE part_number = '8M0090559';
UPDATE public.motor_options SET msrp = 463.22, base_price = 463.22, updated_at = now() WHERE part_number = '8M0097855';
UPDATE public.motor_options SET msrp = 527.95, base_price = 527.95, updated_at = now() WHERE part_number = '8M0094233';
UPDATE public.motor_options SET msrp = 507.61, base_price = 507.61, updated_at = now() WHERE part_number = '8M0149930';
UPDATE public.motor_options SET msrp = 569.07, base_price = 569.07, updated_at = now() WHERE part_number = '8M0149931';
UPDATE public.motor_options SET msrp = 89.78, base_price = 89.78, updated_at = now() WHERE part_number = '8M0081916';
UPDATE public.motor_options SET msrp = 132.53, base_price = 132.53, updated_at = now() WHERE part_number = '8M0107510';
UPDATE public.motor_options SET msrp = 141.09, base_price = 141.09, updated_at = now() WHERE part_number = '8M0188357';
UPDATE public.motor_options SET msrp = 165.49, base_price = 165.49, updated_at = now() WHERE part_number = '8M0187621';
UPDATE public.motor_options SET msrp = 326.81, base_price = 326.81, updated_at = now() WHERE part_number = '8M0173128';

-- Task 2: Insert 7 new Tow N Stow cover records
INSERT INTO public.motor_options (name, part_number, category, msrp, base_price, is_active, is_taxable, image_url)
VALUES
  ('Tow N Stow Cover (40-60HP FourStroke)', '8M0221490', 'accessory', 303.37, 303.37, true, true, '/images/options/8M0221490.jpeg'),
  ('Tow N Stow Cover (75-115HP FourStroke)', '8M0221491', 'accessory', 324.35, 324.35, true, true, '/images/options/8M0221491.jpeg'),
  ('Tow N Stow Cover (150HP FourStroke)', '8M0221492', 'accessory', 350.06, 350.06, true, true, '/images/options/8M0221492.jpeg'),
  ('Tow N Stow Cover (225-400HP Verado)', '8M0221494', 'accessory', 443.05, 443.05, true, true, '/images/options/8M0221494.jpeg'),
  ('Tow N Stow Cover (175-225HP FourStroke)', '8M0221495', 'accessory', 490.88, 490.88, true, true, '/images/options/8M0221495.jpeg'),
  ('Tow N Stow Cover (200-300HP FourStroke)', '8M0221496', 'accessory', 510.83, 510.83, true, true, '/images/options/8M0221496.webp'),
  ('Tow N Stow Cover (200-300HP Pro XS)', '8M0221499', 'accessory', 529.56, 529.56, true, true, '/images/options/8M0221499.jpeg');

-- Task 4: Delete 5 inactive legacy records
DELETE FROM public.motor_options WHERE part_number IN ('ATT-10541', '8M0104228', '8M0104229', '8M0104231', '8M0104232');
