-- Fix Mercury Model Numbers Migration - Safe Deduplication
-- Phase 1: Handle duplicates by keeping the most recent/complete record per model_display

-- First, create temporary function for mapping
CREATE OR REPLACE FUNCTION get_correct_mercury_model_number(display_name text)
RETURNS text AS $$
BEGIN
  CASE display_name
    WHEN '2.5 MH FourStroke' THEN RETURN '1F02201KK';
    WHEN '3.5 MH FourStroke' THEN RETURN '1F03201KK';
    WHEN '3.5 MLH FourStroke' THEN RETURN '1F03211KK';
    WHEN '4 MH FourStroke' THEN RETURN '1F04201KK';
    WHEN '8 ELH FourStroke' THEN RETURN '1A08311LK';
    WHEN '9.9 ELH FourStroke' THEN RETURN '1A10311LK';
    WHEN '15 ELH FourStroke' THEN RETURN '1A15311LK';
    WHEN '20 ELH FourStroke' THEN RETURN '1A20311LK';
    WHEN '25 ELH FourStroke' THEN RETURN '1A25311BK';
    WHEN '25 ELHPT FourStroke' THEN RETURN '1A25411BK';
    WHEN '40 ELPT FourStroke' THEN RETURN '1F40413GZ';
    WHEN '50 ELPT FourStroke' THEN RETURN '1F51413GZ';
    WHEN '60 ELPT FourStroke' THEN RETURN '1F60413GZ';
    WHEN '75 ELPT FourStroke' THEN RETURN '1F754132D';
    WHEN '90 ELPT FourStroke' THEN RETURN '1F904132D';
    WHEN '115 ELPT FourStroke' THEN RETURN '1115F132D';
    WHEN '150 L FourStroke' THEN RETURN '1150F13ED';
    WHEN '150 XL FourStroke' THEN RETURN '1150F23ED';
    WHEN '175 L FourStroke DTS' THEN RETURN '11750005A';
    WHEN '200 L FourStroke' THEN RETURN '12000001A';
    WHEN '200 XL FourStroke' THEN RETURN '12000009A';
    WHEN '225 L FourStroke' THEN RETURN '12250001A';
    WHEN '225 XL FourStroke' THEN RETURN '12250009A';
    WHEN '250 L FourStroke' THEN RETURN '12500001A';
    WHEN '250 XL FourStroke' THEN RETURN '12500009A';
    WHEN '300 L FourStroke' THEN RETURN '13000002A';
    WHEN '300 XL FourStroke' THEN RETURN '13000010A';
    -- ProXS Motors
    WHEN '115 ELPT Pro XS' THEN RETURN '1117F131D';
    WHEN '150 L Pro XS' THEN RETURN '1152F131D';
    WHEN '175 L Pro XS' THEN RETURN '11750001A';
    WHEN '200 L Pro XS' THEN RETURN '12000039A';
    WHEN '225 L Pro XS TorqueMaster' THEN RETURN '12250033A';
    WHEN '250 L Pro XS TorqueMaster' THEN RETURN '12500033A';
    WHEN '300 L Pro XS TorqueMaster' THEN RETURN '13000022A';
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 1: Remove duplicates by keeping only the most recent record per model_display for brochure items
WITH duplicates_to_remove AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY model_display, is_brochure 
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) as rn
  FROM motor_models 
  WHERE is_brochure = true 
    AND model_display IS NOT NULL
    AND get_correct_mercury_model_number(model_display) IS NOT NULL
)
DELETE FROM motor_models 
WHERE id IN (
  SELECT id FROM duplicates_to_remove WHERE rn > 1
);

-- Step 2: Update model numbers for remaining records
UPDATE motor_models 
SET 
  model_number = get_correct_mercury_model_number(model_display),
  updated_at = now()
WHERE 
  get_correct_mercury_model_number(model_display) IS NOT NULL
  AND (model_number != get_correct_mercury_model_number(model_display) OR model_number IS NULL);

-- Clean up
DROP FUNCTION get_correct_mercury_model_number(text);

-- Report results
SELECT 
  'Updated records' as action,
  COUNT(*) as count
FROM motor_models 
WHERE model_number ~ '^[0-9A-F]+[A-Z]$' AND length(model_number) BETWEEN 8 AND 10;