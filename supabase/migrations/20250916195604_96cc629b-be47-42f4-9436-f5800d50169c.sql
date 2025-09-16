-- Update brochure motors to show as available for ordering
UPDATE motor_models 
SET availability = 'Order Now',
    updated_at = now()
WHERE is_brochure = true 
  AND availability = 'Brochure';