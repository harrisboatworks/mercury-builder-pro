-- Fix model numbers and stock numbers properly
-- 1. Clear stock numbers for brochure items (they're not in stock)
-- 2. Create proper Mercury model numbers based on standard Mercury naming conventions
-- 3. Only assign stock numbers to motors that are actually in stock

-- Clear stock numbers for all brochure items (they shouldn't have stock numbers if not in stock)
UPDATE motor_models 
SET 
  stock_number = NULL,
  updated_at = now()
WHERE is_brochure = true 
  AND in_stock = false;

-- Generate proper Mercury model numbers using standard Mercury format
-- Format: HP + Rigging Code + Family Suffix (e.g., 25ELHPT-FS, 90EXLPT-V4, etc.)
UPDATE motor_models 
SET 
  model_number = CASE
    -- FourStroke models
    WHEN model LIKE '%FourStroke%' THEN mercury_model_no || '-FS'
    -- ProXS models  
    WHEN model LIKE '%ProXS%' THEN mercury_model_no || '-PXS'
    -- SeaPro models
    WHEN model LIKE '%SeaPro%' THEN mercury_model_no || '-SP'
    -- Verado models
    WHEN model LIKE '%Verado%' THEN mercury_model_no || '-V'
    -- Default for other models
    ELSE mercury_model_no || '-OB'
  END,
  updated_at = now()
WHERE is_brochure = true 
  AND mercury_model_no IS NOT NULL;

-- Add year suffix to make model numbers completely unique (Mercury typically includes model year)
UPDATE motor_models 
SET 
  model_number = model_number || '-' || year::text,
  updated_at = now()
WHERE is_brochure = true 
  AND model_number IS NOT NULL 
  AND model_number NOT LIKE '%-20%';

-- Only assign stock numbers to motors that are actually in stock
-- For inventory motors, use a different format (INV- prefix + mercury_model_no + sequential number)
UPDATE motor_models 
SET 
  stock_number = 'INV-' || mercury_model_no || '-' || id::text,
  updated_at = now()
WHERE in_stock = true 
  AND mercury_model_no IS NOT NULL 
  AND stock_number IS NULL;