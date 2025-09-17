-- Fix model numbers and stock numbers with proper uniqueness handling
-- First clear stock numbers for brochure items, then create unique model numbers

-- Clear stock numbers for all brochure items (they're not in stock)
UPDATE motor_models 
SET 
  stock_number = NULL,
  updated_at = now()
WHERE is_brochure = true 
  AND in_stock = false;

-- Create unique Mercury model numbers with sequential numbering for duplicates
WITH numbered_models AS (
  SELECT 
    id,
    mercury_model_no,
    model,
    year,
    ROW_NUMBER() OVER (
      PARTITION BY 
        mercury_model_no,
        CASE
          WHEN model LIKE '%FourStroke%' THEN 'FS'
          WHEN model LIKE '%ProXS%' THEN 'PXS'  
          WHEN model LIKE '%SeaPro%' THEN 'SP'
          WHEN model LIKE '%Verado%' THEN 'V'
          ELSE 'OB'
        END,
        year
      ORDER BY id
    ) as rn
  FROM motor_models 
  WHERE is_brochure = true 
    AND mercury_model_no IS NOT NULL
)
UPDATE motor_models 
SET 
  model_number = CASE
    WHEN nm.rn = 1 THEN
      nm.mercury_model_no || '-' || 
      CASE
        WHEN nm.model LIKE '%FourStroke%' THEN 'FS'
        WHEN nm.model LIKE '%ProXS%' THEN 'PXS'  
        WHEN nm.model LIKE '%SeaPro%' THEN 'SP'
        WHEN nm.model LIKE '%Verado%' THEN 'V'
        ELSE 'OB'
      END || '-' || nm.year::text
    ELSE
      nm.mercury_model_no || '-' || 
      CASE
        WHEN nm.model LIKE '%FourStroke%' THEN 'FS'
        WHEN nm.model LIKE '%ProXS%' THEN 'PXS'  
        WHEN nm.model LIKE '%SeaPro%' THEN 'SP'
        WHEN nm.model LIKE '%Verado%' THEN 'V'
        ELSE 'OB'
      END || '-' || nm.year::text || '-' || nm.rn::text
  END,
  updated_at = now()
FROM numbered_models nm
WHERE motor_models.id = nm.id;

-- Only assign stock numbers to motors that are actually in stock
UPDATE motor_models 
SET 
  stock_number = 'STK-' || SUBSTRING(id::text FROM 1 FOR 8),
  updated_at = now()
WHERE in_stock = true 
  AND stock_number IS NULL;