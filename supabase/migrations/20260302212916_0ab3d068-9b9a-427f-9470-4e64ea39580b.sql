
-- Insert missing 115 ELPT FourStroke
INSERT INTO public.motor_models (model, model_display, model_number, horsepower, motor_type, make, year, family, msrp, dealer_price, in_stock, availability)
VALUES 
  ('115ELPT FourStroke', '115ELPT FourStroke', '1115F132D', 115, 'Outboard', 'Mercury', 2025, 'FourStroke', 19220, 16913, false, NULL),
  ('115EXLPT FourStroke', '115EXLPT FourStroke', '1115F232D', 115, 'Outboard', 'Mercury', 2025, 'FourStroke', 19625, 17270, false, NULL);

-- Exclude the 15 EHPT FourStroke
UPDATE public.motor_models SET availability = 'Exclude' WHERE id = 'e7eef4eb-d89c-424e-8a2c-1089511c0538';
